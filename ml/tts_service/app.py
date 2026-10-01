"""TTS microservice. Run with: ``uvicorn ml.tts_service.app:app --port 8002``."""

from __future__ import annotations

import anyio
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response

from .model import TTSError, TextToSpeech


app = FastAPI(title="VaaniSetu TTS service")
tts_model = TextToSpeech()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "tts", "model": tts_model.model_name}


@app.post("/synthesize", response_class=Response)
async def synthesize(
    text: str = Query(..., min_length=1, description="Text to turn into speech"),
    language: str | None = Query(default=None, description="BCP-47-like language tag"),
):
    """Synthesize one complete utterance as a WAV stream for the receiver."""
    try:
        audio_bytes = await anyio.to_thread.run_sync(tts_model.synthesize, text, language)
    except TTSError as exc:
        detail = str(exc)
        status_code = 422 if detail.startswith(("Text", "Unsupported")) else 503
        raise HTTPException(status_code=status_code, detail=detail) from exc
    return Response(content=audio_bytes, media_type="audio/wav")
