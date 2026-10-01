import anyio

from backend import main
from backend.orchestrator import ServiceError
from backend.session import Call, User, call_store, user_store


class _WebSocket:
    def __init__(self, incoming=None):
        self.incoming = list(incoming or [])
        self.accepted = False
        self.sent_json = []
        self.sent_bytes = []

    async def accept(self):
        self.accepted = True

    async def receive_bytes(self):
        if self.incoming:
            return self.incoming.pop(0)
        raise main.WebSocketDisconnect()

    async def send_json(self, payload):
        self.sent_json.append(payload)

    async def send_bytes(self, payload):
        self.sent_bytes.append(payload)

    async def close(self, _code):
        return None


async def _run_relay_test(monkeypatch):
    sender_socket = _WebSocket([b"sender-audio"])
    receiver_socket = _WebSocket()
    user_store.update(
        {
            "sender": User("sender", "hi"),
            "receiver": User("receiver", "ta", receiver_socket),
        }
    )
    call_store["call-1"] = Call("call-1", {"sender", "receiver"})
    received_arguments = {}

    async def fake_exchange(audio, language_hint, *, target_language):
        received_arguments.update(
            audio=audio,
            language_hint=language_hint,
            target_language=target_language,
        )
        return {
            "audio": b"RIFFreceiver-audio",
            "bits_used": 123,
            "lost": False,
            "language": "ta",
            "confidence": 0.9,
        }

    monkeypatch.setattr(main, "handle_audio_exchange", fake_exchange)
    try:
        await main.call_websocket(sender_socket, "call-1", "sender")
    finally:
        user_store.clear()
        call_store.clear()

    assert received_arguments == {
        "audio": b"sender-audio",
        "language_hint": "hi",
        "target_language": "ta",
    }
    # The receiver gets a "status" notification when the sender connects, then
    # the exchange metadata, then a "status" notification when the sender
    # disconnects (websocket is cleared in the finally block).
    assert {"type": "exchange", "bits_used": 123, "lost": False, "language": "ta", "confidence": 0.9} in receiver_socket.sent_json
    assert receiver_socket.sent_bytes == [b"RIFFreceiver-audio"]


async def _run_service_error_test(monkeypatch):
    sender_socket = _WebSocket([b"sender-audio"])
    receiver_socket = _WebSocket()
    user_store.update(
        {
            "sender": User("sender", "hi"),
            "receiver": User("receiver", "ta", receiver_socket),
        }
    )
    call_store["call-1"] = Call("call-1", {"sender", "receiver"})

    async def failing_exchange(*_args, **_kwargs):
        raise ServiceError("Translation service failed to translate recovered text.")

    monkeypatch.setattr(main, "handle_audio_exchange", failing_exchange)
    try:
        await main.call_websocket(sender_socket, "call-1", "sender")
    finally:
        user_store.clear()
        call_store.clear()

    # The first message to the sender is the initial "status" pairing notification,
    # followed by the "error" from the service failure.
    assert {"type": "error", "message": "Translation service failed to translate recovered text."} in sender_socket.sent_json
    assert receiver_socket.sent_bytes == []


def test_websocket_relays_audio_in_receiver_native_language(monkeypatch):
    anyio.run(_run_relay_test, monkeypatch)


def test_websocket_reports_service_errors_without_crashing(monkeypatch):
    anyio.run(_run_service_error_test, monkeypatch)
