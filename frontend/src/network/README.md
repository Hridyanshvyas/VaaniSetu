# `frontend/src/network/` — Real-Time Networking & Protocol Subsystem

This module handles communication between the mobile client and the VaaniSetu backend orchestrator, including HTTP session pairing, health discovery, and bidirectional WebSocket audio/metadata streaming.

---

## 📁 Files

### 1. `websocketClient.ts`
Implements the `VaaniSetuSocket` client class for full-duplex communication over WebSockets.

- **Connection URL**:
  ```
  ws://<backend_host>/ws/<call_id>/<user_id>?language=<native_language>
  ```
  (Or `wss://` when connecting over secure cloud HTTPS/WSS).

- **Data Channels**:
  - **Uplink (Client → Server)**: Transmits recorded audio chunks as binary `ArrayBuffer` payloads when the user releases Push-to-Talk.
  - **Downlink (Server → Client)**:
    - **Binary Frames (`ArrayBuffer`)**: Synthesized 16 kHz WAV audio ready for immediate playback by `audio/player.ts`.
    - **JSON Signaling Frames**:
      - `paired`: Notification of peer presence (`paired: true / false`).
      - `exchange`: Real-time metadata for the exchange (bits transmitted, channel loss status, transcribed text, translated text, speech confidence).
      - `fatal_error`: Signals invalid rooms or registration errors requiring app re-registration.

- **Key Callbacks (`Handlers`)**:
  - `onConnection(connected: boolean)`: Real-time socket connectivity state.
  - `onPaired(paired: boolean)`: Indicates whether the peer participant is online and ready in the room.
  - `onExchange(metadata: ExchangeMetadata)`: Provides bits-used statistics for the live UI counter.
  - `onAudio(audio: ArrayBuffer)`: Hands synthesized speech to the audio player.
  - `onError(message: string)`: Surface non-fatal warnings to the user interface.

- **Resilience**:
  - Auto-reconnection logic with exponential backoff on unexpected drops.
  - Differentiates between intentional disconnects (`manuallyClosed`) and network interruptions.
  - Intercepts fatal close codes (e.g. `4404`) to prevent infinite reconnect loops when registration has expired.

---

### 2. `sessionClient.ts`
Provides REST API interactions with the backend:

- **Session Registration**:
  Calls `POST /sessions/register` with:
  ```json
  {
    "user_id": "user-abc",
    "call_id": "room-101",
    "native_language": "hi"
  }
  ```
  Registers the caller into the call room and negotiates language pairing before the WebSocket opens.

- **Health Discovery**:
  Interacts with `GET /health` to verify server reachability, latency, and active room counts before initiating calls.
