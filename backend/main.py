"""FastAPI entrypoint for VaaniSetu. Run with: ``uvicorn backend.main:app --reload``."""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from .orchestrator import ServiceError, handle_audio_exchange, link
from .session import Call, User, call_store, other_participant, user_store

app = FastAPI(title="VaaniSetu backend")

# Enable CORS for all origins so mobile apps and web tools can connect freely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PIPELINE_LANGUAGES = frozenset({"en", "hi", "ta", "te"})


class SessionRegistration(BaseModel):
    """The minimal pairing information needed by the mobile client."""

    user_id: str = Field(min_length=1, max_length=64)
    call_id: str = Field(min_length=1, max_length=64)
    native_language: str = Field(min_length=2, max_length=16)

    @field_validator("native_language")
    @classmethod
    def validate_pipeline_language(cls, value: str) -> str:
        language = value.strip().lower().replace("_", "-").split("-", 1)[0]
        if language not in PIPELINE_LANGUAGES:
            supported = ", ".join(sorted(PIPELINE_LANGUAGES))
            raise ValueError(f"Unsupported language. Supported languages: {supported}")
        return language


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "VaaniSetu backend",
        "active_calls": len(call_store),
        "active_users": len(user_store),
    }


@app.post("/sessions/register")
async def register_session(registration: SessionRegistration):
    """Register or update one caller in an in-memory call room."""
    call = call_store.setdefault(registration.call_id, Call(registration.call_id))
    is_solo = registration.call_id.startswith("solo")

    if not is_solo and registration.user_id not in call.participant_ids:
        # Prune any stale participants whose websocket is not connected
        stale_ids = [
            uid for uid in list(call.participant_ids)
            if uid not in user_store or user_store[uid].websocket is None
        ]
        for uid in stale_ids:
            call.participant_ids.discard(uid)
            user_store.pop(uid, None)

        # If room still has 2 live participants, evict oldest so new demo connection never fails
        if len(call.participant_ids) >= 2:
            oldest = next(iter(call.participant_ids))
            call.participant_ids.discard(oldest)
            user_store.pop(oldest, None)

    if registration.user_id in user_store:
        user_store[registration.user_id].native_language = registration.native_language
    else:
        user_store[registration.user_id] = User(
            user_id=registration.user_id,
            native_language=registration.native_language,
        )
    call.participant_ids.add(registration.user_id)

    # Reset bit counter on fresh start
    if is_solo or len(call.participant_ids) == 2:
        link.reset_bit_counter()

    return {
        "user_id": registration.user_id,
        "call_id": registration.call_id,
        "native_language": registration.native_language,
        "paired": is_solo or len(call.participant_ids) == 2,
    }


@app.delete("/sessions/{call_id}")
async def end_call(call_id: str):
    """Tear down a demo call so phones can start fresh without restarting the backend."""
    call = call_store.pop(call_id, None)
    if call is None:
        raise HTTPException(status_code=404, detail="Call not found.")
    for uid in list(call.participant_ids):
        user_store.pop(uid, None)
    link.reset_bit_counter()
    return {"ended": call_id}


@app.websocket("/ws/{call_id}/{user_id}")
async def call_websocket(
    websocket: WebSocket,
    call_id: str,
    user_id: str,
    language: str = "hi",
):
    """Relay sender audio across the low-bitrate AI channel to receiver (or echo in solo mode)."""
    await websocket.accept()

    # Normalize language tag
    lang_clean = language.strip().lower().replace("_", "-").split("-", 1)[0]
    if lang_clean not in PIPELINE_LANGUAGES:
        lang_clean = "hi"

    call = call_store.setdefault(call_id, Call(call_id))
    sender = user_store.get(user_id)
    if sender is None:
        sender = User(user_id=user_id, native_language=lang_clean)
        user_store[user_id] = sender
    elif language and lang_clean in PIPELINE_LANGUAGES:
        sender.native_language = lang_clean

    call.participant_ids.add(user_id)
    sender.websocket = websocket
    is_solo = call_id.startswith("solo")

    # If non-solo room exceeds 2 participants, prune disconnected ones
    if not is_solo and len(call.participant_ids) > 2:
        stale_ids = [
            uid for uid in list(call.participant_ids)
            if uid != user_id and (uid not in user_store or user_store[uid].websocket is None)
        ]
        for uid in stale_ids:
            call.participant_ids.discard(uid)
            user_store.pop(uid, None)

    # Notify this user of the initial pairing state
    receiver_id = other_participant(call, user_id)
    receiver = user_store.get(receiver_id) if receiver_id else None
    peer_connected = receiver is not None and receiver.websocket is not None
    await websocket.send_json({
        "type": "status",
        "paired": is_solo or peer_connected,
    })

    # Notify the peer (if in 2-device call) that this user just arrived
    if not is_solo and peer_connected and receiver and receiver.websocket is not None:
        try:
            await receiver.websocket.send_json({"type": "status", "paired": True})
        except Exception:
            pass

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()

            if is_solo:
                # Solo / Echo test mode: process and loopback to caller
                target_lang = sender.native_language
                try:
                    exchange = await handle_audio_exchange(
                        audio_bytes,
                        language_hint=sender.native_language,
                        target_language=target_lang,
                    )
                except ServiceError as exc:
                    await websocket.send_json({"type": "error", "message": str(exc)})
                    continue

                metadata = {
                    "type": "exchange",
                    "bits_used": exchange["bits_used"],
                    "lost": exchange["lost"],
                    "language": exchange["language"],
                    "confidence": exchange["confidence"],
                }
                if "transcribed_text" in exchange:
                    metadata["transcribed_text"] = exchange["transcribed_text"]
                if "translated_text" in exchange:
                    metadata["translated_text"] = exchange["translated_text"]
                await websocket.send_json(metadata)

                if not exchange["lost"] and exchange["audio"] is not None:
                    await websocket.send_bytes(exchange["audio"])
                continue

            # Standard 2-device call
            receiver_id = other_participant(call, user_id)
            receiver = user_store.get(receiver_id) if receiver_id else None
            if receiver is None or receiver.websocket is None:
                await websocket.send_json({
                    "type": "error",
                    "message": "The other call participant is not connected yet.",
                })
                continue

            try:
                exchange = await handle_audio_exchange(
                    audio_bytes,
                    language_hint=sender.native_language,
                    target_language=receiver.native_language,
                )
            except ServiceError as exc:
                await websocket.send_json({"type": "error", "message": str(exc)})
                continue

            metadata = {
                "type": "exchange",
                "bits_used": exchange["bits_used"],
                "lost": exchange["lost"],
                "language": exchange["language"],
                "confidence": exchange["confidence"],
            }
            if "transcribed_text" in exchange:
                metadata["transcribed_text"] = exchange["transcribed_text"]
            if "translated_text" in exchange:
                metadata["translated_text"] = exchange["translated_text"]

            # Notify sender of metrics and transcript
            try:
                await websocket.send_json(metadata)
            except Exception:
                pass

            if exchange["lost"] or exchange["audio"] is None:
                # Notify receiver of dropped packet
                try:
                    if receiver.websocket is not None:
                        await receiver.websocket.send_json({**metadata, "audio_lost": True})
                except Exception:
                    pass
                continue

            # Relay transcript and audio bytes to receiver
            try:
                if receiver.websocket is not None:
                    await receiver.websocket.send_json(metadata)
                    await receiver.websocket.send_bytes(exchange["audio"])
            except Exception:
                pass

    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if sender.websocket is websocket:
            sender.websocket = None
            if not is_solo:
                receiver_id = other_participant(call, user_id)
                peer = user_store.get(receiver_id) if receiver_id else None
                if peer is not None and peer.websocket is not None:
                    try:
                        await peer.websocket.send_json({"type": "status", "paired": False})
                    except Exception:
                        pass
