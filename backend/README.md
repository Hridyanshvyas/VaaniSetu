# `backend/` — Orchestration & Real-Time Session Server

The backend server is built with **FastAPI** and asynchronous WebSockets. It orchestrates the entire VaaniSetu pipeline: ingesting recorded audio from the sender, coordinating machine learning microservices, passing compressed packets through the constrained channel, and streaming synthesized speech and metrics down to the receiver.

---

## 🏗️ Core Responsibilities

1. **Session & Room Management (`session.py`)**:
   - Manages active calls (`Call`) and connected participants (`User`).
   - Supports 2-party duplex call rooms and single-party `solo-...` loopback rooms for instant testing.
   - Automatically cleans up stale connections and handles participant disconnections.

2. **End-to-End Orchestrator (`orchestrator.py`)**:
   - **Speech-to-Text**: Forwards incoming audio bytes to `ml/stt_service` (`:8001`).
   - **Language Check & Translation**: If sender language != receiver language, calls `ml/translation_service` (`:8004`) to translate text into the receiver's native language.
   - **Channel Encapsulation**: Compresses translated text (`channel/compression.py`), wraps it in a binary packet (`channel/packet.py`), and applies Reed-Solomon Forward Error Correction (`channel/fec.py`).
   - **Simulated Link Transmission**: Sends the protected packet through `SimulatedLink` (`channel/simulated_link.py`), simulating real-world radio bit rate limits, bit flips, and latency.
   - **Receiver Channel Recovery**: Decodes FEC, unpacks the payload, and decompresses text. If corruption is unrecoverable, flags `lost: True` without hallucinating fake text.
   - **Speech Synthesis**: Sends recovered text to `ml/tts_service` (`:8002`) to generate 16 kHz mono WAV speech.
   - **Downlink Streaming**: Transmits binary audio to the receiver along with live transmission metadata (`bits_used`, confidence, latency).

---

## 📡 API Endpoints

### 1. Health Probing
- **`GET /health`**
  - Returns backend service status, active call count, and connected user count.
  - Response:
    ```json
    {
      "status": "ok",
      "service": "VaaniSetu backend",
      "active_calls": 1,
      "active_users": 2
    }
    ```

### 2. Session Registration
- **`POST /sessions/register`**
  - Registers a user into a call room with their native language preference.
  - Request body:
    ```json
    {
      "user_id": "phone-1",
      "call_id": "room-sih",
      "native_language": "hi"
    }
    ```

### 3. Real-Time Full-Duplex WebSocket
- **`WS /ws/{call_id}/{user_id}?language={lang}`**
  - Establishes a persistent bidirectional connection.
  - **Inbound Data**: Raw binary audio chunk (`ArrayBuffer`) when user finishes speaking.
  - **Outbound Data**:
    - **Binary Frame**: Synthesized audio WAV bytes for the peer's speaker.
    - **JSON Frames**:
      - `{"type": "paired", "paired": true}`: Peer availability state.
      - `{"type": "exchange", "bits_used": 424, "lost": false, "transcribed_text": "...", "translated_text": "..."}`: Real-time bit budget metrics.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `STT_SERVICE_URL` | `http://127.0.0.1:8001` | Address of the Speech-to-Text microservice. |
| `TTS_SERVICE_URL` | `http://127.0.0.1:8002` | Address of the Text-to-Speech microservice. |
| `TRANSLATION_SERVICE_URL` | `http://127.0.0.1:8004` | Address of the Translation microservice. |
| `ML_SERVICE_TIMEOUT_SECONDS` | `120` | Timeout threshold for heavy model inference. |
| `CHANNEL_BPS` | `12000` | Simulated channel bitrate cap in bits per second. |
| `CHANNEL_BER` | `0.001` | Simulated channel Bit Error Rate (probability of bit flip). |
| `CHANNEL_LATENCY` | `0.01` | Base radio propagation latency in seconds. |

---

## 🚀 Running & Testing

```bash
# Start backend server locally
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Run backend unit & integration tests
python -m pytest tests/test_backend_*.py -v
```
