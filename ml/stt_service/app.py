"""STT microservice. Run with: ``uvicorn ml.stt_service.app:app --port 8001``."""

from __future__ import annotations

import anyio
from fastapi import FastAPI, File, HTTPException, Query, UploadFile

from .model import STTError, SpeechToText


app = FastAPI(title="VaaniSetu STT service")
stt_model = SpeechToText()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "stt", "model": stt_model.model_name}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(..., description="WAV, FLAC, or OGG audio"),
    language_hint: str | None = Query(default=None),
):
    """Transcribe one complete audio chunk without exposing text to end users."""
    audio_bytes = await audio.read()
    try:
        result = await anyio.to_thread.run_sync(
            stt_model.transcribe, audio_bytes, language_hint
        )
    except STTError as exc:
        detail = str(exc)
        status_code = 422 if detail.startswith(("Audio", "Unable", "Unsupported")) else 503
        raise HTTPException(status_code=status_code, detail=detail) from exc
    return {
        "text": result.text,
        "language": result.language_tag,
        "confidence": result.confidence,
    }
