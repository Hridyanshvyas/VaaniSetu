"""AI4Bharat IndicTrans2 Indic-to-Indic translation wrapper."""

from __future__ import annotations

import os
import logging
from typing import Any


LANGUAGE_CODES = {
    "en": "eng_Latn",
    "en-us": "eng_Latn",
    "en-in": "eng_Latn",
    "hi": "hin_Deva",
    "hi-in": "hin_Deva",
    "ta": "tam_Taml",
    "ta-in": "tam_Taml",
    "te": "tel_Telu",
    "te-in": "tel_Telu",
}

logger = logging.getLogger(__name__)

INDIC_INDIC_MODEL = "ai4bharat/indictrans2-indic-indic-1B"
EN_INDIC_MODEL = "ai4bharat/indictrans2-en-indic-1B"
INDIC_EN_MODEL = "ai4bharat/indictrans2-indic-en-1B"
LOCAL_FILES_ONLY = os.getenv("HF_LOCAL_FILES_ONLY", "true").strip().lower() not in {"0", "false", "no"}


class TranslationError(RuntimeError):
    """Expected translation error that can be safely returned to a caller."""


class Translator:
    """Translate English, Hindi, Tamil, and Telugu with IndicTrans2.

    Model loading is deferred until the first translation, so ``/health`` can
    respond before the checkpoint has downloaded. Extend ``LANGUAGE_CODES``
    only after testing the additional language pair with representative audio
    transcripts.
    """

    def __init__(self, model_name: str = INDIC_INDIC_MODEL):
        self.model_name = model_name
        self._model_bundles: dict[str, tuple[Any, Any, Any, Any]] = {}

    @staticmethod
    def _normalise_language(language: str, parameter_name: str) -> tuple[str, str]:
        normalised = language.strip().lower().replace("_", "-")
        code = LANGUAGE_CODES.get(normalised)
        if code is None:
            supported = ", ".join(sorted({"en", "hi", "ta", "te"}))
            raise TranslationError(
                f"Unsupported {parameter_name} '{language}'. Supported languages: {supported}"
            )
        return normalised.split("-", 1)[0], code

    @staticmethod
    def _load_model(model_id: str) -> tuple[Any, Any, Any, Any]:
        try:
            import torch
            from IndicTransToolkit import IndicProcessor
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            token = os.getenv("HF_TOKEN") or None
            device = "cuda" if torch.cuda.is_available() else "cpu"
            tokenizer = AutoTokenizer.from_pretrained(
                model_id, token=token, trust_remote_code=True, local_files_only=LOCAL_FILES_ONLY
            )
            model = AutoModelForSeq2SeqLM.from_pretrained(
                model_id, token=token, trust_remote_code=True, local_files_only=LOCAL_FILES_ONLY
            ).to(device).eval()
            return model, tokenizer, IndicProcessor(inference=True), torch
        except Exception as exc:
            logger.exception("Failed to load IndicTrans2 model '%s'", model_id)
            raise TranslationError(
                "Could not load AI4Bharat IndicTrans2. Check Hugging Face access, "
                "HF_TOKEN, and the translation service dependencies before retrying."
            ) from exc

    def _get_model(self, model_id: str) -> tuple[Any, Any, Any, Any]:
        if model_id not in self._model_bundles:
            self._model_bundles[model_id] = self._load_model(model_id)
        return self._model_bundles[model_id]

    @staticmethod
    def _model_for(source_code: str, target_code: str) -> str:
        if source_code == "eng_Latn":
            return EN_INDIC_MODEL
        if target_code == "eng_Latn":
            return INDIC_EN_MODEL
        return INDIC_INDIC_MODEL

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate a complete utterance and return text in ``target_lang``."""
        if not text or not text.strip():
            raise TranslationError("Text to translate must not be empty")

        _, source_code = self._normalise_language(source_lang, "source language")
        _, target_code = self._normalise_language(target_lang, "target language")
        if source_code == target_code:
            return text.strip()

        model, tokenizer, processor, torch = self._get_model(
            self._model_for(source_code, target_code)
        )
        device = next(model.parameters()).device
        batch = processor.preprocess_batch(
            [text.strip()], src_lang=source_code, tgt_lang=target_code
        )
        inputs = tokenizer(
            batch, padding="longest", truncation=True, max_length=128, return_tensors="pt"
        ).to(device)
        num_beams = int(os.getenv("TRANSLATION_NUM_BEAMS", "5"))
        with torch.inference_mode():
            generated = model.generate(**inputs, num_beams=num_beams, max_new_tokens=64)
        decoded = tokenizer.batch_decode(
            generated, skip_special_tokens=True, clean_up_tokenization_spaces=True
        )
        translated = processor.postprocess_batch(decoded, lang=target_code)
        if not translated or not translated[0].strip():
            raise TranslationError("IndicTrans2 returned an empty translation")
        return translated[0].strip()
