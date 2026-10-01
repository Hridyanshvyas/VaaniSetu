"""Offline speech-to-text wrapper for the VaaniSetu pipeline.

Models are loaded only on the first request.  This keeps the FastAPI service
start-up fast and, importantly, lets its health endpoint work before the
operator has supplied access to AI4Bharat's gated Hugging Face models.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
import os
from pathlib import Path
import tempfile
from typing import Any


# Hindi and English use Transformers Wav2Vec2 checkpoints. Tamil and Telugu
# use AI4Bharat IndicConformer NeMo checkpoints, whose file format and
# inference API differ from Wav2Vec2.
SUPPORTED_LANGUAGES = {
    "hi": "ai4bharat/indicwav2vec-hindi",
    "hi-in": "ai4bharat/indicwav2vec-hindi",
    "ta": "ai4bharat/indicconformer_stt_ta_hybrid_ctc_rnnt_large",
    "ta-in": "ai4bharat/indicconformer_stt_ta_hybrid_ctc_rnnt_large",
    "te": "ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large",
    "te-in": "ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large",
    # Public CTC checkpoint; it uses the same Transformers interface as the
    # language-specific IndicWav2Vec checkpoints.
    "en": "facebook/wav2vec2-base-960h",
    "en-in": "facebook/wav2vec2-base-960h",
    "en-us": "facebook/wav2vec2-base-960h",
}
TARGET_SAMPLE_RATE = 16_000
MIN_RMS = 0.003
# Inference must work without an Internet connection. Set
# HF_LOCAL_FILES_ONLY=false only when deliberately downloading/updating models.
LOCAL_FILES_ONLY = os.getenv("HF_LOCAL_FILES_ONLY", "true").strip().lower() not in {"0", "false", "no"}
INDIC_CONFORMER_LANGUAGES = frozenset({"ta", "te"})


class STTError(RuntimeError):
    """Expected service error that can be safely returned to a client."""


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language_tag: str
    confidence: float  # 0.0-1.0


class SpeechToText:
    """Transcribe Indian-language audio with pretrained AI4Bharat models.

    Supports Hindi, Tamil, Telugu, and Indian English. Model checkpoints are
    cached individually, so unused languages consume no model memory.
    """

    def __init__(self, model_name: str = "ai4bharat/indicwav2vec-hindi"):
        self.model_name = model_name
        self._loaded_models: dict[str, tuple[Any, Any, Any]] = {}
        self._loaded_conformer_models: dict[str, Any] = {}

    @staticmethod
    def _normalise_language(language_hint: str | None) -> str:
        language = (language_hint or "hi").strip().lower().replace("_", "-")
        if language not in SUPPORTED_LANGUAGES:
            raise STTError(
                "Unsupported language "
                f"'{language_hint}'. Supported languages: en, hi, ta, te"
            )
        return language.split("-", 1)[0]

    @staticmethod
    def _decode_audio(audio_bytes: bytes):
        if not audio_bytes:
            raise STTError("Audio upload is empty")

        import numpy as np

        # 1. Try soundfile (fast for WAV, FLAC, OGG)
        try:
            import soundfile as sf

            samples, sample_rate = sf.read(BytesIO(audio_bytes), dtype="float32", always_2d=True)
            if sample_rate > 0 and len(samples) > 0:
                mono = samples.mean(axis=1)
                if sample_rate != TARGET_SAMPLE_RATE:
                    output_length = max(1, round(len(mono) * TARGET_SAMPLE_RATE / sample_rate))
                    old_positions = np.arange(len(mono), dtype=np.float32)
                    new_positions = np.linspace(0, len(mono) - 1, output_length, dtype=np.float32)
                    mono = np.interp(new_positions, old_positions, mono).astype(np.float32)
                return mono
        except Exception:
            pass

        # 2. Try PyAV (decodes AAC, M4A, MP4, MP3, AMR, Opus, and resamples directly to 16kHz)
        try:
            import av

            container = av.open(BytesIO(audio_bytes))
            stream = next((s for s in container.streams if s.type == "audio"), None)
            if stream is not None:
                resampler = av.AudioResampler(format="fltp", layout="mono", rate=TARGET_SAMPLE_RATE)
                frames = []
                for frame in container.decode(stream):
                    for resampled in resampler.resample(frame):
                        frames.append(resampled.to_ndarray())
                container.close()
                if frames:
                    return np.concatenate(frames, axis=1).squeeze().astype(np.float32)
        except Exception:
            pass

        # 3. Fallback: torchaudio temp file
        try:
            import torchaudio

            with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                path = Path(temp_file.name)
            try:
                waveform, sample_rate = torchaudio.load(str(path))
            finally:
                path.unlink(missing_ok=True)
            samples = waveform.transpose(0, 1).detach().to("cpu").numpy().astype(np.float32)
            if sample_rate > 0 and len(samples) > 0:
                mono = samples.mean(axis=1)
                if sample_rate != TARGET_SAMPLE_RATE:
                    output_length = max(1, round(len(mono) * TARGET_SAMPLE_RATE / sample_rate))
                    old_positions = np.arange(len(mono), dtype=np.float32)
                    new_positions = np.linspace(0, len(mono) - 1, output_length, dtype=np.float32)
                    mono = np.interp(new_positions, old_positions, mono).astype(np.float32)
                return mono
        except Exception:
            pass

        raise STTError("Unable to decode audio. Upload a WAV, FLAC, OGG, or Android AAC/MP4 recording.")

    @staticmethod
    def _load_model(model_id: str) -> tuple[Any, Any, Any]:
        """Load processor, model, and torch lazily to avoid import-time GPU work."""
        try:
            import torch
            from transformers import AutoModelForCTC, Wav2Vec2Processor

            token = os.getenv("HF_TOKEN") or None
            # The repository's AutoProcessor metadata selects
            # Wav2Vec2ProcessorWithLM, which adds a pyctcdecode dependency.
            # IndicWav2Vec-Hindi is documented for greedy CTC decoding and
            # does not ship a language model, so use the base processor.
            processor = Wav2Vec2Processor.from_pretrained(
                model_id, token=token, local_files_only=LOCAL_FILES_ONLY
            )
            model = AutoModelForCTC.from_pretrained(
                model_id, token=token, local_files_only=LOCAL_FILES_ONLY
            )
            device = "cuda" if torch.cuda.is_available() else "cpu"
            return processor, model.to(device).eval(), torch
        except Exception as exc:
            raise STTError(
                "Could not load the AI4Bharat model. Check Hugging Face access, "
                "HF_TOKEN, and the installed STT dependencies before retrying."
            ) from exc

    @staticmethod
    def _indic_conformer_model_path(language: str) -> Path:
        """Return the complete local ``.nemo`` checkpoint for ``language``."""
        model_id = SUPPORTED_LANGUAGES[language]
        cache_root = Path(os.getenv("HF_HUB_CACHE", Path.home() / ".cache" / "huggingface" / "hub"))
        cache_dir = cache_root / f"models--{model_id.replace('/', '--')}" / "snapshots"
        matches = list(cache_dir.glob("**/*.nemo"))
        if len(matches) != 1:
            raise STTError(
                f"The offline {language} IndicConformer checkpoint is missing. "
                "Download it with the Hugging Face CLI before starting the STT service."
            )
        return matches[0]

    @classmethod
    def _load_indic_conformer(cls, language: str) -> Any:
        """Load a locally cached Tamil or Telugu AI4Bharat NeMo checkpoint."""
        try:
            import torch
            import nemo.collections.asr as nemo_asr

            model = nemo_asr.models.ASRModel.restore_from(str(cls._indic_conformer_model_path(language)))
            device = "cuda" if torch.cuda.is_available() else "cpu"
            # NeMo mutates in place and returns None from freeze().
            model.freeze()
            return model.to(device)
        except STTError:
            raise
        except Exception as exc:
            raise STTError(
                f"Could not load the offline {language} IndicConformer model. "
                "Check that NeMo ASR dependencies are installed."
            ) from exc

    def _get_model(self, language: str) -> tuple[Any, Any, Any]:
        if language not in self._loaded_models:
            model_id = self.model_name if language == "hi" else SUPPORTED_LANGUAGES[language]
            self._loaded_models[language] = self._load_model(model_id)
        return self._loaded_models[language]

    def _get_indic_conformer(self, language: str) -> Any:
        if language not in self._loaded_conformer_models:
            self._loaded_conformer_models[language] = self._load_indic_conformer(language)
        return self._loaded_conformer_models[language]

    @staticmethod
    def _conformer_transcription(model: Any, audio: Any, language: str) -> str:
        """Run CTC decoding over a temporary 16 kHz mono PCM WAV file."""
        try:
            import soundfile as sf

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                path = temp_file.name
            try:
                sf.write(path, audio, TARGET_SAMPLE_RATE, format="WAV", subtype="PCM_16")
                model.cur_decoder = "ctc"
                result = model.transcribe(
                    [path],
                    batch_size=1,
                    num_workers=0,
                    verbose=False,
                    logprobs=False,
                    language_id=language,
                )
            finally:
                Path(path).unlink(missing_ok=True)
        except Exception as exc:
            raise STTError(f"{language} IndicConformer transcription failed.") from exc
        # AI4Bharat's hybrid CTC/RNNT model returns a pair: CTC results and
        # RNNT results.  We explicitly selected CTC above, so use its first
        # collection.  Plain CTC models return the list directly.
        if isinstance(result, tuple):
            result = result[0]
        if not result or not isinstance(result[0], str):
            raise STTError(f"{language} IndicConformer returned an invalid transcription.")
        return result[0].strip()

    def transcribe(self, audio_bytes: bytes, language_hint: str | None = None) -> TranscriptionResult:
        """Return text, BCP-47-like language tag, and conservative CTC confidence."""
        language = self._normalise_language(language_hint)
        audio = self._decode_audio(audio_bytes)

        import numpy as np

        rms = float(np.sqrt(np.mean(np.square(audio))))
        if rms < MIN_RMS:
            return TranscriptionResult(text="", language_tag=language, confidence=0.0)

        if language in INDIC_CONFORMER_LANGUAGES:
            text = self._conformer_transcription(self._get_indic_conformer(language), audio, language)
            return TranscriptionResult(text=text, language_tag=language, confidence=0.0)

        processor, model, torch = self._get_model(language)
        device = next(model.parameters()).device
        inputs = processor(audio, sampling_rate=TARGET_SAMPLE_RATE, return_tensors="pt")
        with torch.inference_mode():
            logits = model(inputs.input_values.to(device)).logits[0]

        probabilities = torch.softmax(logits, dim=-1)
        prediction_ids = torch.argmax(probabilities, dim=-1)
        text = processor.batch_decode(prediction_ids.unsqueeze(0))[0].strip()
        confidence = float(torch.mean(torch.max(probabilities, dim=-1).values).item())

        # A non-silent clip that decodes to no words is explicitly uncertain.
        if not text:
            confidence = 0.0
        return TranscriptionResult(
            text=text,
            language_tag=language,
            confidence=round(max(0.0, min(1.0, confidence)), 4),
        )
