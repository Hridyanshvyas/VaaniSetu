import anyio

from backend.orchestrator import handle_audio_exchange
from channel.simulated_link import ChannelConfig, SimulatedLink


class _Response:
    def __init__(self, payload=None, content=b""):
        self._payload = payload
        self.content = content

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class _Client:
    def __init__(self):
        self.calls = []

    async def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        if url.endswith("/transcribe"):
            return _Response({"text": "नमस्ते", "language": "hi", "confidence": 0.91})
        if url.endswith("/translate"):
            return _Response({"text": "வணக்கம்"})
        if url.endswith("/synthesize"):
            return _Response(content=b"RIFFtestWAVE")
        raise AssertionError(f"unexpected URL: {url}")


async def _run_audio_exchange_test():
    client = _Client()
    clean_link = SimulatedLink(ChannelConfig(bits_per_second=1_000_000, bit_error_rate=0.0, base_latency_seconds=0))

    result = await handle_audio_exchange(
        b"wav-bytes", "hi", target_language="ta", client=client, channel_link=clean_link
    )

    assert result["text"] == "வணக்கம்"
    assert result["language"] == "ta"
    assert result["confidence"] == 0.91
    assert result["audio"] == b"RIFFtestWAVE"
    assert result["lost"] is False
    assert result["bits_used"] > 0
    assert [url.rsplit("/", 1)[-1] for url, _ in client.calls] == ["transcribe", "translate", "synthesize"]
    assert client.calls[1][1]["params"] == {
        "text": "नमस्ते",
        "source_lang": "hi",
        "target_lang": "ta",
    }
    assert client.calls[2][1]["params"] == {"text": "வணக்கம்", "language": "ta"}


def test_audio_exchange_calls_stt_channel_and_tts():
    anyio.run(_run_audio_exchange_test)


async def _run_same_language_exchange_test():
    client = _Client()
    clean_link = SimulatedLink(
        ChannelConfig(bits_per_second=1_000_000, bit_error_rate=0.0, base_latency_seconds=0)
    )

    result = await handle_audio_exchange(
        b"wav-bytes", "hi", target_language="hi", client=client, channel_link=clean_link
    )

    assert result["text"] == "नमस्ते"
    assert [url.rsplit("/", 1)[-1] for url, _ in client.calls] == ["transcribe", "synthesize"]


def test_same_language_exchange_skips_optional_translation_service():
    anyio.run(_run_same_language_exchange_test)
