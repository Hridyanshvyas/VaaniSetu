"""Translation microservice. Run with: ``uvicorn ml.translation_service.app:app --port 8004``."""

from __future__ import annotations

import anyio
from fastapi import FastAPI, HTTPException, Query

from .model import TranslationError, Translator


app = FastAPI(title="VaaniSetu translation service")
translator = Translator()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "translation", "model": translator.model_name}


@app.post("/translate")
async def translate(
    text: str = Query(..., min_length=1, description="Text to translate"),
    source_lang: str = Query(..., min_length=2, description="Source language tag"),
    target_lang: str = Query(..., min_length=2, description="Receiver language tag"),
):
    try:
        translated = await anyio.to_thread.run_sync(
            translator.translate, text, source_lang, target_lang
        )
    except TranslationError as exc:
        detail = str(exc)
        status_code = 422 if detail.startswith(("Text", "Unsupported")) else 503
        raise HTTPException(status_code=status_code, detail=detail) from exc
    return {"text": translated, "source_lang": source_lang, "target_lang": target_lang}
