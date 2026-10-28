# VaaniSetu (वाणी सेतु)

> **AI-Powered Voice Bridge for Ultra-Low-Bitrate & Weak Radio/Network Links**  
> *Smart India Hackathon 2026 — Problem Statement ID: SIH26173 — Category: Software — Theme: Miscellaneous*

---

## 📌 Executive Summary

In disaster relief zones, tactical edge communications, remote border outposts, and maritime operations, conventional voice networks (cellular 4G/5G, VoIP, satellite telephony) frequently fail. Standard compressed digital voice codecs demand **12,000 to 64,000 bits per second (bps)**. When radio links degrade to HF/VHF or LoRa speeds (300 bps to 2,400 bps), normal voice communication is physically impossible.

**VaaniSetu** ("वाणी सेतु" — *A Bridge for Voice*) solves this fundamental limitation not by compressing audio harder, but by **replacing audio with compressed, error-corrected text representations during transmission**, and reconstructing natural spoken voice at the receiver's end:

```
Sender speaks (Audio) 
      ↓
[ STT: Speech-to-Text ] 
      ↓
[ Machine Translation ] (IndicTrans2 across Indic languages)
      ↓
[ Compression & Reed-Solomon FEC Encoding ]
      ↓
═══ LOW-BITRATE LINK (300 – 2400 bps / Radio / Satellite) ═══
      ↓
[ FEC Error Recovery & Decompression ]
      ↓
[ TTS: Text-to-Speech ] 
      ↓
Receiver hears natural voice (Audio)
```

**The user experience remains 100% voice-in, voice-out.** The sender speaks naturally into their phone, and the receiver hears natural voice from their speaker in real time. Text never surfaces as a substitute for voice — it operates strictly as an ultra-compact transmission carrier.

---

## 📊 Bandwidth Comparison & Bit Budget

| Parameter | Standard VoIP (G.711 / AMR-WB) | Low-Bitrate Codec (Opus / MELP) | **VaaniSetu Voice Bridge** |
|---|---|---|---|
| **Data Rate Needed** | 23,800 – 64,000 bps | 2,400 – 6,000 bps | **60 – 300 bps** |
| **Data per 5s Sentence** | 120,000 – 320,000 bits | 12,000 – 30,000 bits | **300 – 800 bits** |
| **Bandwidth Savings** | Baseline (0%) | ~80% – 90% | **97.5% – 99.1% (40x – 100x reduction)** |
| **Works over 300 bps Radio?** | ❌ Impossible | ❌ Drops packets / unusable | ✅ **Flawless transmission** |
| **Cross-Language Translation?** | ❌ No | ❌ No | ✅ **Native Indic translation** |

---

## 🌐 Supported Languages & Cross-Lingual Translation

VaaniSetu natively supports bidirectional spoken communication across major Indian languages and English:

- **Hindi (`hi`)** — Devanagari script / Divya / Swara voice
- **Tamil (`ta`)** — Tamil script / Jaya / Pallavi voice
- **Telugu (`te`)** — Telugu script / Prakash / Shruti voice
- **Indian English (`en`)** — Latin script / Mary / Neerja voice

### Cross-Language Voice Calling
If Person A speaks **Hindi** and Person B has their app set to **Tamil**, VaaniSetu automatically:
1. Transcribes Hindi speech to text via **AI4Bharat IndicConformer / IndicWav2Vec**.
2. Translates Hindi text to Tamil text via **AI4Bharat IndicTrans2**.
3. Packs, compresses, and FEC-encodes the Tamil text packet over the low-bitrate link.
4. Synthesizes fluent Tamil speech at the receiver via neural TTS.
5. Person B hears natural Tamil audio spoken to them!

---

---

## 🔄 Dual Operational Workflows

VaaniSetu operates in two distinct modes depending on infrastructure availability:

### Workflow 1: ⚡ 100% On-Device Offline Engine (Zero Server, Zero Internet)
Designed for extreme disaster zones where no laptop or server exists. The phone runs the complete pipeline locally:

```
[ Sender Speaks ] 
       ↓ 
[ 1. Android On-Device STT ] (Native Android SpeechRecognizer)
       ↓ (Devanagari text)
[ 2. Offline Indic Translator ] (Local tactical lexicon & emergency phrase engine)
       ↓ (Tamil / Telugu / English text)
[ 3. Zlib Compression ] (Level 9 deflate in TypeScript/pako)
       ↓
[ 4. Binary Wire Packet Framing ] ([1B lang_len][lang_tag][4B payload_len][payload])
       ↓
[ 5. Reed-Solomon FEC (RS-10) ] (GF(2^8) Berlekamp-Massey + Chien Search in TypeScript)
       ↓
[ 6. Simulated Radio Link ] (1200 bps throttle, 0.1% BER bit noise, 80ms latency)
       ↓
[ 7. RS-10 Error Recovery ] (Recovers up to 5 corrupted bytes in real-time)
       ↓
[ 8. Zlib Decompression & Unframing ]
       ↓
[ 9. Android Native TTS ] (Local TextToSpeech engine speaks fluently in target language)
       ↓
[ Receiver Hears Natural Voice ]
```

* Features a **Tactical Emergency Phrases Quick Bar** for one-tap mission-critical messages (`🚨 Medical Emergency`, `🌊 Flood Alert`, `🚁 Rescue Squad`).

---

### Workflow 2: 📡 Server-Assisted / Two-Device Mode (Hotspot, LAN, or Cloud)
Designed for team field deployments with a local host or cloud server:

```
Phone A (Sender) ──── Push-to-Talk Audio (WAV) ────► FastAPI Orchestrator (:8000)
                                                               │
┌──────────────────────────────────────────────────────────────┘
▼
1. Speech-to-Text (:8001)        — AI4Bharat IndicConformer / Whisper
2. Machine Translation (:8004)   — AI4Bharat IndicTrans2 1B (Hindi ↔ Tamil/Telugu/English)
3. Channel Encoding              — Zlib compression + Reed-Solomon FEC
4. Low-Bitrate Link Simulation   — 300 - 2400 bps throttled carrier with bit error rate
5. Channel Decoding & Recovery   — RS parity recovery + decompression
6. Text-to-Speech (:8002)        — Indic Parler-TTS / Edge Neural TTS
▲
└──────────────────────────────────────────────────────────────┐
                                                               │
Phone B (Receiver) ◄──── Synthesized Audio (WAV) ──────────────┘
```

* **No Router Needed**: Phone A turns on a Mobile Hotspot → Phone B connects to it → zero internet needed.

---

## 🏗️ Architecture & Repository Layout

VaaniSetu is built as a modular, decoupled microservice stack with an offline-capable cross-platform mobile frontend:

```
VaaniSetu/
├── .github/workflows/        # CI/CD pipeline
│   └── ci.yml                # Automated GitHub Actions running 22 pytest + 7 Jest tests
│
├── backend/                  # FastAPI & WebSocket session orchestration server (:8000)
│   ├── main.py               # REST API (/health, /sessions/register) & WebSocket handler
│   ├── orchestrator.py       # End-to-end pipeline wiring STT -> Translation -> Channel -> TTS
│   ├── session.py            # Real-time room pairing, caller state & language negotiation
│   └── requirements.txt      # Backend dependencies
│
├── channel/                  # Core Differentiator: Text compression, FEC & link simulation
│   ├── compression.py        # Optimized Zlib/Deflate text compression
│   ├── fec.py                # Reed-Solomon Forward Error Correction (RS parity symbols)
│   ├── packet.py             # Binary wire packet framing (language header, length, payload)
│   ├── simulated_link.py     # Software-simulated radio link (configurable bps, BER & latency)
│   └── requirements.txt      # reedsolo, etc.
│
├── ml/                       # Standalone ML microservices
│   ├── stt_service/          # Speech-to-Text inference server (:8001)
│   │   ├── app.py            # FastAPI /transcribe endpoint
│   │   └── model.py          # AI4Bharat IndicConformer / IndicWav2Vec / Whisper wrapper
│   ├── translation_service/  # Neural Machine Translation server (:8004)
│   │   ├── app.py            # FastAPI /translate endpoint
│   │   └── model.py          # AI4Bharat IndicTrans2 1B translation engine
│   └── tts_service/          # Text-to-Speech synthesis server (:8002)
│       ├── app.py            # FastAPI /synthesize endpoint (returns 16kHz mono WAV)
│       └── model.py          # Ultra-fast neural voice synthesis + Indic Parler-TTS fallback
│
├── frontend/                 # React Native mobile application for Android
│   ├── src/
│   │   ├── offline/          # ⚡ On-Device Offline Engine
│   │   │   ├── offlineChannel.ts     # Pure TypeScript GF(2^8) Reed-Solomon, Zlib & SimulatedLink
│   │   │   ├── offlineTranslator.ts  # On-device Indic translation & emergency lexicon
│   │   │   ├── offlineSpeech.ts      # Native bridge for Android STT & TTS
│   │   │   └── offlinePipeline.ts    # Complete standalone offline exchange orchestrator
│   │   ├── audio/            # Audio capture (recorder.ts) and playback (player.ts)
│   │   ├── network/          # WebSocket client (websocketClient.ts) & session manager
│   │   ├── screens/          # CallScreen (PTT, tactical phrases, live metrics) & OnboardingScreen
│   │   ├── components/       # PipelineVisualizer, MetricsCard, LanguageSelector, CompactConnection
│   │   └── config.ts         # Server presets (⚡ Offline Engine, Hotspot, Wi-Fi LAN, Cloud)
│   ├── android/              # Native Android build & Kotlin modules
│   │   └── app/src/main/java/.../
│   │       ├── OfflineSpeechModule.kt   # Native Android SpeechRecognizer & TextToSpeech module
│   │       └── OfflineSpeechPackage.kt  # React Native package registration
│   ├── __tests__/            # Jest unit tests for offline channel & RS-FEC
│   └── package.json          # React Native dependencies
│
├── tests/                    # Comprehensive Python test suite (22 tests)
│   ├── test_channel_roundtrip.py       # Bit budget, compression & RS error correction
│   ├── test_stt_service.py             # STT contract, language checkpoints & normalization
│   ├── test_translation_service.py     # Translation pairs & IndicTrans2 models
│   ├── test_tts_service.py             # Speech synthesis & audio WAV verification
│   ├── test_backend_orchestrator.py    # Pipeline orchestration & audio exchange
│   ├── test_backend_session.py         # Room pairing, language normalization & eviction
│   └── test_backend_websocket.py       # Full-duplex WebSocket streaming & error handling
│
├── deploy/                   # Cloud & container deployment assets
│   ├── DEPLOY.md             # Production deployment guide (Render cloud, Docker, supervisord)
│   └── supervisord.conf      # Multi-process supervisor configuration
│
├── Dockerfile                # Multi-stage production container image
├── docker-compose.yml        # Multi-service stack orchestration
├── start_backend.py          # All-in-one local launcher for all 4 microservices
├── run_vaanisetu.bat         # One-click Windows batch runner
└── VaaniSetu-final.apk       # Standalone compiled Android APK for demo phones
```

---

## 🚀 Quick Start Guide

### Option 1: One-Click Local Launcher (Windows / Linux)

Run all 4 microservices simultaneously with automatic local IP detection:

```bash
# Using the Python launcher:
python start_backend.py

# Or on Windows using the batch script:
run_vaanisetu.bat
```

The launcher will display your active IP addresses (e.g. `192.168.137.1:8000` or `172.16.x.x:8000`) to connect your mobile devices.

### Option 2: Running with Docker Compose

Bring up the complete containerized stack:

```bash
docker compose up --build
```

### Option 3: Manual Service Execution

You can run each service individually in separate terminals:

```bash
# Terminal 1: Backend Orchestrator
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Speech-to-Text (STT)
uvicorn ml.stt_service.app:app --host 127.0.0.1 --port 8001

# Terminal 3: Text-to-Speech (TTS)
uvicorn ml.tts_service.app:app --host 127.0.0.1 --port 8002

# Terminal 4: Translation Service
uvicorn ml.translation_service.app:app --host 127.0.0.1 --port 8004
```

---

## 📱 Mobile App Setup & Connection

The mobile app runs on physical Android phones, tablets, or emulators.

### Connecting to the Backend
1. **Windows Mobile Hotspot (Recommended for live demos)**:
   - Turn on Windows Mobile Hotspot on the host laptop.
   - Connect both Android phones to the hotspot.
   - In the app, select the **Hotspot preset** (`192.168.137.1:8000`) or enter the IP.
2. **Wi-Fi Local Network**:
   - Ensure the laptop and phones are connected to the same Wi-Fi router.
   - Enter your laptop's Wi-Fi IP (e.g., `192.168.1.X:8000`).
3. **Android Emulator**:
   - Use the **Emulator preset** (`10.0.2.2:8000`).
4. **Cloud Deployment**:
   - Connect directly to `https://vaanisetu.onrender.com`.

### Testing Modes
- **Solo Demo Mode**: Click **"Solo Demo"** to instantly test loopback voice on a single device. You speak, the pipeline processes and translates, and speaks back to you.
- **Two-Device Call Mode**: Enter the same **Room / Call ID** on both phones (e.g. `room-101`), pick your respective native languages, and tap **"Join Call"**. Press and hold the **Push-to-Talk (PTT)** button to transmit.

### Installing the APK
A pre-built signed release APK is provided at the root of the repository:
```bash
adb install VaaniSetu-final.apk
```

---

## 🧪 Running the Test Suite

The repository includes **29 automated tests** covering both the Python microservice backend and the React Native offline channel layer:

### 1. Python Backend & Channel Tests (22 Tests)
```bash
# Run backend pytest suite
python -m pytest tests/ -v
```

All 22 Python tests pass:
- `test_clean_channel_recovers_exactly` — Verifies compression/decompression & RS FEC round-trip.
- `test_noisy_channel_either_recovers_or_fails_gracefully` — Verifies Reed-Solomon correction under bit noise and graceful failure when corruption exceeds parity limit.
- `test_bitrate_counter_tracks_actual_bits` — Confirms real bit budget (<800 bits per sentence).
- `test_transcribe_returns_standalone_contract` — STT validation.
- `test_translate_returns_target_language_text` — Multilingual translation validation.
- `test_synthesize_returns_wav_bytes_for_hindi` — Speech synthesis validation.
- `test_websocket_relays_audio_in_receiver_native_language` — End-to-end WebSocket round-trip.

### 2. Frontend Offline Channel Tests (7 Tests)
```bash
# Run Jest suite in frontend directory
cd frontend
npm test
```

All 7 Jest tests pass:
- UTF-8 encoding/decoding for Devanagari, Tamil, Telugu Unicode characters.
- Lossless Zlib compression and decompression matching wire format.
- Binary wire packet packing & unpacking.
- TypeScript Reed-Solomon GF(2^8) error correction under bit corruption.
- Graceful failure when corruption exceeds RS-10 parity limit (>5 byte corruptions).
- Multi-lingual tactical phrase dictionary lookups.
- End-to-end offline pipeline round-trip tracking actual bit budget.

### 3. Continuous Integration
All 29 tests run automatically on every pull request and push to `main` via [GitHub Actions CI](.github/workflows/ci.yml).

---

## 🛡️ Reliability & Graceful Degradation Contract

In mission-critical radio environments, **hallucinating or guessing corrupt speech is dangerous**. 
VaaniSetu strictly enforces:
- **No Guessing**: If channel corruption exceeds Reed-Solomon parity recovery limits, `fec.decode()` returns `None`, flagging `lost: True`.
- **Visual Alerting**: The receiver's UI explicitly indicates a lost or dropped packet rather than generating incorrect audio.
- **Atomic Exchanges**: Audio is processed and transmitted with explicit checksums and sequence IDs.

---

## 📄 License & Attribution

Developed for **Smart India Hackathon 2026** (PS ID: SIH26173).  
Leverages open research checkpoints from **AI4Bharat** (IIT Madras), **Transformers**, and **Edge Neural TTS**.
