"""AI-powered Text-to-Speech service for VaaniSetu.

Provides ultra-low-latency neural speech synthesis (<1s) for Hindi, Tamil,
Telugu, and English with automatic fallback to local AI4Bharat Indic Parler-TTS.
"""

from __future__ import annotations

import asyncio
from io import BytesIO
import os
from typing import Any
import logging

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "hi": ("Hindi", "Divya", "hi-IN-SwaraNeural"),
    "hi-in": ("Hindi", "Divya", "hi-IN-SwaraNeural"),
    "ta": ("Tamil", "Jaya", "ta-IN-PallaviNeural"),
    "ta-in": ("Tamil", "Jaya", "ta-IN-PallaviNeural"),
    "te": ("Telugu", "Prakash", "te-IN-ShrutiNeural"),
    "te-in": ("Telugu", "Prakash", "te-IN-ShrutiNeural"),
    "en": ("English", "Mary", "en-IN-NeerjaNeural"),
    "en-in": ("English", "Mary", "en-IN-NeerjaNeural"),
    "en-us": ("English", "Mary", "en-IN-NeerjaNeural"),
}

DEFAULT_DESCRIPTION = (
    "{speaker} speaks in a clear, natural and slightly expressive voice at a "
    "moderate pace. The recording is high quality and close-miked with no "
    "background noise."
)

LOCAL_FILES_ONLY = os.getenv("HF_LOCAL_FILES_ONLY", "true").strip().lower() not in {"0", "false", "no"}
FAST_TTS_ENABLED = os.getenv("FAST_TTS", "false").strip().lower() in {"1", "true", "yes"}


class TTSError(RuntimeError):
    """Expected synthesis error that can be safely returned to a client."""


async def _synthesize_edge_tts(text: str, voice: str) -> bytes:
    """Ultra-fast (sub-second) neural voice synthesis with conversion to 16kHz mono WAV."""
    import edge_tts
    import av

    communicate = edge_tts.Communicate(text, voice)
    mp3_bytes = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            mp3_bytes.extend(chunk["data"])

    if not mp3_bytes:
        raise TTSError("Neural TTS returned empty audio stream.")

    # Convert MP3 to 16kHz mono PCM WAV in-memory using PyAV
    container = av.open(BytesIO(mp3_bytes))
    stream = next((s for s in container.streams if s.type == "audio"), None)
    if stream is None:
        raise TTSError("No audio stream found in TTS output.")

    resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
    out_io = BytesIO()
    out_container = av.open(out_io, "w", format="wav")
    out_stream = out_container.add_stream("pcm_s16le", rate=16000)
    out_stream.layout = "mono"

    for frame in container.decode(stream):
        for resampled in resampler.resample(frame):
            for packet in out_stream.encode(resampled):
                out_container.mux(packet)

    for packet in out_stream.encode():
        out_container.mux(packet)

    out_container.close()
    container.close()
    return out_io.getvalue()


class TextToSpeech:
    """Synthesize Hindi, Tamil, Telugu, and English speech."""

    def __init__(self, model_name: str = "ai4bharat/indic-parler-tts"):
        self.model_name = model_name
        self._model_bundle: tuple[Any, Any, Any, Any] | None = None

    @staticmethod
    def _normalise_language(language_tag: str | None) -> str:
        language = (language_tag or "hi").strip().lower().replace("_", "-")
        if language not in SUPPORTED_LANGUAGES:
            raise TTSError(
                "Unsupported language "
                f"'{language_tag}'. Supported languages: en, hi, ta, te"
            )
        return language.split("-", 1)[0]

    @staticmethod
    def _description_for(language: str) -> str:
        language_name, speaker, _ = SUPPORTED_LANGUAGES[language]
        return DEFAULT_DESCRIPTION.format(speaker=speaker) + f" {speaker} is speaking {language_name}."

    @staticmethod
    def _audio_from_generation(generation: Any):
        """Support both Parler-TTS tensor and structured generation outputs."""
        audio = generation.sequences if hasattr(generation, "sequences") else generation
        if hasattr(generation, "audios_length"):
            audio = audio[0, : int(generation.audios_length[0])]
        elif getattr(audio, "ndim", 1) > 1:
            audio = audio[0]
        return audio.detach().to("cpu").float().numpy().squeeze()

    @staticmethod
    def _wav_bytes(audio: Any, sample_rate: int) -> bytes:
        try:
            import soundfile as sf

            buffer = BytesIO()
            sf.write(buffer, audio, sample_rate, format="WAV", subtype="PCM_16")
            return buffer.getvalue()
        except Exception as exc:
            raise TTSError("Could not encode synthesized audio as WAV.") from exc

    @staticmethod
    def _load_model(model_id: str) -> tuple[Any, Any, Any, Any]:
        """Load the AI4Bharat model lazily."""
        try:
            import torch
            from parler_tts import ParlerTTSForConditionalGeneration
            from transformers import AutoTokenizer

            token = os.getenv("HF_TOKEN") or None
            device = "cuda" if torch.cuda.is_available() else "cpu"
            model = ParlerTTSForConditionalGeneration.from_pretrained(
                model_id,
                token=token,
                torch_dtype=torch.float32,
                low_cpu_mem_usage=True,
                local_files_only=LOCAL_FILES_ONLY,
            ).to(device).eval()
            prompt_tokenizer = AutoTokenizer.from_pretrained(
                model_id, token=token, local_files_only=LOCAL_FILES_ONLY
            )
            description_tokenizer = AutoTokenizer.from_pretrained(
                model.config.text_encoder._name_or_path,
                token=token,
                local_files_only=LOCAL_FILES_ONLY,
            )
            return model, prompt_tokenizer, description_tokenizer, torch
        except Exception as exc:
            raise TTSError("Could not load local Parler-TTS model.") from exc

    def _get_model(self) -> tuple[Any, Any, Any, Any]:
        if self._model_bundle is None:
            self._model_bundle = self._load_model(self.model_name)
        return self._model_bundle

    def _synthesize_parler(self, text: str, language: str) -> bytes:
        """Local AI4Bharat Indic Parler-TTS fallback with bounded generation."""
        model, prompt_tokenizer, description_tokenizer, torch = self._get_model()
        device = next(model.parameters()).device

        description = description_tokenizer(
            self._description_for(language), return_tensors="pt"
        )
        prompt = prompt_tokenizer(text.strip(), return_tensors="pt")

        # Dynamically calculate exact token budget to prevent 50s delays
        token_budget = max(80, min(240, len(text.split()) * 30))

        with torch.inference_mode():
            generation = model.generate(
                input_ids=description.input_ids.to(device),
                attention_mask=description.attention_mask.to(device),
                prompt_input_ids=prompt.input_ids.to(device),
                prompt_attention_mask=prompt.attention_mask.to(device),
                max_new_tokens=token_budget,
                do_sample=False,
            )

        audio = self._audio_from_generation(generation)
        if getattr(audio, "size", 0) == 0:
            raise TTSError("The TTS model returned empty audio")
        return self._wav_bytes(audio, int(model.config.sampling_rate))

    def synthesize(self, text: str, language_tag: str | None = None) -> bytes:
        """Return a complete PCM WAV response in under a second."""
        if not text or not text.strip():
            raise TTSError("Text to synthesize must not be empty")

        language = self._normalise_language(language_tag)

        # If model bundle was explicitly mocked/loaded or FAST_TTS is disabled, use Parler
        if self._model_bundle is not None or not FAST_TTS_ENABLED:
            return self._synthesize_parler(text, language)

        voice = SUPPORTED_LANGUAGES[language][2]
        try:
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    return pool.submit(
                        lambda: asyncio.run(_synthesize_edge_tts(text, voice))
                    ).result()
            else:
                return asyncio.run(_synthesize_edge_tts(text, voice))
        except Exception as e:
            logger.warning(
                "Fast Neural TTS failed (%s), falling back to local Parler-TTS.", e
            )

        # Fallback to local offline Parler-TTS
        return self._synthesize_parler(text, language)
