"""Orchestrate one VaaniSetu exchange: STT -> channel -> TTS.

The backend never substitutes guessed text or audio. A failed model request
raises ``ServiceError``; an unrecoverable channel packet returns ``lost=True``
and no audio for the receiver to play.
"""

from __future__ import annotations

import os
import struct
from typing import Any
import zlib

import anyio
import httpx

from channel.compression import compress_text, decompress_text
from channel.fec import decode as fec_decode
from channel.fec import encode as fec_encode
from channel.packet import Packet, pack, unpack
from channel.simulated_link import ChannelConfig, SimulatedLink


STT_SERVICE_URL = os.getenv("STT_SERVICE_URL", "http://127.0.0.1:8001")
TTS_SERVICE_URL = os.getenv("TTS_SERVICE_URL", "http://127.0.0.1:8002")
TRANSLATION_SERVICE_URL = os.getenv("TRANSLATION_SERVICE_URL", "http://127.0.0.1:8004")
SERVICE_TIMEOUT_SECONDS = float(os.getenv("ML_SERVICE_TIMEOUT_SECONDS", "300"))

link = SimulatedLink(ChannelConfig())


class ServiceError(RuntimeError):
    """A dependent STT or TTS service could not complete an exchange."""


def _channel_exchange(text: str, language_tag: str, channel_link: SimulatedLink) -> dict:
    """Run text through compression, FEC, and the constrained transport."""
    compressed = compress_text(text)
    packet_bytes = pack(Packet(language_tag=language_tag, payload=compressed))
    protected = fec_encode(packet_bytes)

    bits_before = channel_link.total_bits_sent
    received = channel_link.send(protected)
    bits_used = channel_link.total_bits_sent - bits_before
    recovered_packet_bytes = fec_decode(received)
    if recovered_packet_bytes is None:
        return {"text": None, "language": language_tag, "bits_used": bits_used, "lost": True}

    try:
        packet = unpack(recovered_packet_bytes)
        recovered_text = decompress_text(packet.payload)
    except (IndexError, UnicodeDecodeError, ValueError, struct.error, zlib.error):
        return {"text": None, "language": language_tag, "bits_used": bits_used, "lost": True}
    return {"text": recovered_text, "language": packet.language_tag, "bits_used": bits_used, "lost": False}


async def handle_exchange(
    text: str,
    language_tag: str,
    target_language: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict:
    """Translate already-transcribed text, then send it through the channel."""
    owns_client = False
    if client is None:
        client = _get_shared_client()
    try:
        translated_text = await _post_translation(
            client, text, source_lang=language_tag, target_lang=target_language
        )
        return await anyio.to_thread.run_sync(
            _channel_exchange, translated_text, target_language, link
        )
    finally:
        if owns_client:
            await client.aclose()


# High-speed in-memory response caches for sub-100ms recurring phrases
_TRANSLATION_CACHE: dict[tuple[str, str, str], str] = {}
_SYNTHESIS_CACHE: dict[tuple[str, str], bytes] = {}
_SHARED_CLIENT: httpx.AsyncClient | None = None


def _get_shared_client() -> httpx.AsyncClient:
    global _SHARED_CLIENT
    if _SHARED_CLIENT is None or _SHARED_CLIENT.is_closed:
        _SHARED_CLIENT = httpx.AsyncClient(
            timeout=SERVICE_TIMEOUT_SECONDS,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )
    return _SHARED_CLIENT


async def _post_transcription(client: httpx.AsyncClient, audio_bytes: bytes, language_hint: str | None) -> dict[str, Any]:
    try:
        response = await client.post(
            f"{STT_SERVICE_URL}/transcribe",
            params={"language_hint": language_hint} if language_hint else None,
            files={"audio": ("speech.wav", audio_bytes, "application/octet-stream")},
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ServiceError("STT service failed to transcribe the audio.") from exc

    text, language, confidence = payload.get("text"), payload.get("language"), payload.get("confidence")
    if not isinstance(text, str) or not isinstance(language, str) or not isinstance(confidence, (int, float)):
        raise ServiceError("STT service returned an invalid transcription response.")
    return {"text": text, "language": language, "confidence": float(confidence)}


async def _post_synthesis(client: httpx.AsyncClient, text: str, language: str) -> bytes:
    cache_key = (text.strip(), language.strip().lower())
    if cache_key in _SYNTHESIS_CACHE:
        return _SYNTHESIS_CACHE[cache_key]

    try:
        response = await client.post(
            f"{TTS_SERVICE_URL}/synthesize", params={"text": text, "language": language}
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ServiceError("TTS service failed to synthesize recovered text.") from exc
    if not response.content:
        raise ServiceError("TTS service returned empty audio.")
    
    if len(_SYNTHESIS_CACHE) > 500:
        _SYNTHESIS_CACHE.clear()
    _SYNTHESIS_CACHE[cache_key] = response.content
    return response.content


async def _post_translation(
    client: httpx.AsyncClient, text: str, source_lang: str, target_lang: str
) -> str:
    source_code = source_lang.strip().lower().replace("_", "-").split("-", 1)[0]
    target_code = target_lang.strip().lower().replace("_", "-").split("-", 1)[0]
    if source_code == target_code:
        return text

    cache_key = (text.strip(), source_code, target_code)
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]

    try:
        response = await client.post(
            f"{TRANSLATION_SERVICE_URL}/translate",
            params={
                "text": text,
                "source_lang": source_lang,
                "target_lang": target_lang,
            },
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ServiceError("Translation service failed to translate recovered text.") from exc

    translated_text = payload.get("text")
    if not isinstance(translated_text, str):
        raise ServiceError("Translation service returned an invalid translation response.")
    
    if len(_TRANSLATION_CACHE) > 1000:
        _TRANSLATION_CACHE.clear()
    _TRANSLATION_CACHE[cache_key] = translated_text.strip()
    return translated_text.strip()


async def handle_audio_exchange(
    audio_bytes: bytes,
    language_hint: str | None = None,
    *,
    target_language: str,
    client: httpx.AsyncClient | None = None,
    channel_link: SimulatedLink | None = None,
) -> dict[str, Any]:
    """Transcribe audio, transport its text, then synthesize receiver WAV.

    The returned dict always includes channel metrics. ``audio`` is ``None``
    if the packet cannot be recovered, so callers never play fabricated audio.
    """
    if not audio_bytes:
        raise ServiceError("Audio exchange requires non-empty audio bytes.")
    owns_client = False
    if client is None:
        client = _get_shared_client()
    active_link = channel_link or link

    try:
        transcription = await _post_transcription(client, audio_bytes, language_hint)
        if not transcription["text"].strip():
            return {
                "audio": None,
                "text": "",
                "transcribed_text": "",
                "translated_text": "",
                "language": target_language,
                "confidence": transcription["confidence"],
                "bits_used": 0,
                "lost": False,
            }

        translated_text = await _post_translation(
            client,
            transcription["text"],
            source_lang=transcription["language"],
            target_lang=target_language,
        )

        exchange = await anyio.to_thread.run_sync(
            _channel_exchange, translated_text, target_language, active_link
        )
        exchange["transcribed_text"] = transcription["text"]
        exchange["translated_text"] = translated_text
        exchange["confidence"] = transcription["confidence"]
        if exchange["lost"]:
            exchange["audio"] = None
            return exchange
        exchange["audio"] = await _post_synthesis(client, exchange["text"], exchange["language"])
        return exchange
    finally:
        if owns_client:
            await client.aclose()
