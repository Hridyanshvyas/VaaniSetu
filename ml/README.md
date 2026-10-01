# `ml/` — Machine Learning Microservices Subsystem

The `ml/` directory houses three standalone AI inference microservices supporting multi-lingual speech transcription, neural translation across Indic languages, and expressive speech synthesis.

---

## 🏛️ Microservice Architecture

```
                    ┌─────────────────────────┐
Audio (16kHz WAV) ─►│   stt_service (:8001)   │──► Transcribed Text
                    │ AI4Bharat IndicConformer│
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
Transcribed Text ──►│translation_service(:8004│──► Translated Text
                    │  AI4Bharat IndicTrans2  │
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
Translated Text  ──►│   tts_service (:8002)   │──► Synthesized Audio (WAV)
                    │ Fast Neural TTS / Parler│
                    └─────────────────────────┘
```

---

## 1. Speech-to-Text (`ml/stt_service/`) — Port 8001

Converts inbound user speech into text. Checkpoints are cached individually and loaded lazily upon first use.

- **Checkpoints**:
  - **Hindi (`hi`)**: `ai4bharat/indicwav2vec-hindi`
  - **Tamil (`ta`)**: `ai4bharat/indicconformer_stt_ta_hybrid_ctc_rnnt_large`
  - **Telugu (`te`)**: `ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large`
  - **English (`en`)**: `facebook/wav2vec2-base-960h` (or Whisper fallback)
- **Audio Preprocessing**:
  - Enforces 16,000 Hz single-channel mono PCM format.
  - RMS silence gate (`MIN_RMS = 0.003`) prevents transcribing empty ambient room noise.
- **Endpoints**:
  - `GET /health`: Service health and active model identifier.
  - `POST /transcribe`: Takes an uploaded audio file and optional `language_hint` query parameter; returns `{"text": "...", "language": "...", "confidence": 0.95}`.

---

## 2. Neural Translation (`ml/translation_service/`) — Port 8004

Provides high-accuracy translation across Indian languages and English using **AI4Bharat IndicTrans2**.

- **Models**:
  - Indic-to-Indic: `ai4bharat/indictrans2-indic-indic-1B`
  - English-to-Indic: `ai4bharat/indictrans2-en-indic-1B`
  - Indic-to-English: `ai4bharat/indictrans2-indic-en-1B`
- **Supported Language Mappings**:
  - Hindi (`hi`) → `hin_Deva`
  - Tamil (`ta`) → `tam_Taml`
  - Telugu (`te`) → `tel_Telu`
  - English (`en`) → `eng_Latn`
- **Performance Optimizations**:
  - `TRANSLATION_NUM_BEAMS=1`: Greedy search decoding enabled for real-time latency (<400ms).
- **Endpoints**:
  - `GET /health`: Service health.
  - `POST /translate`: Takes `{"text": "...", "source_language": "hi", "target_language": "ta"}` and returns `{"text": "...", "source_language": "hi", "target_language": "ta"}`.

---

## 3. Text-to-Speech (`ml/tts_service/`) — Port 8002

Generates natural spoken voice in the receiver's native language.

- **Synthesis Modes**:
  - **Fast Neural Mode (`FAST_TTS=true`)**: Sub-second (<800ms) neural voice synthesis converting directly to 16 kHz mono PCM WAV.
  - **Local Offline Fallback**: AI4Bharat Indic Parler-TTS for purely air-gapped environments.
- **Voices**:
  - Hindi: `hi-IN-SwaraNeural` ("Divya")
  - Tamil: `ta-IN-PallaviNeural` ("Jaya")
  - Telugu: `te-IN-ShrutiNeural` ("Prakash")
  - English: `en-IN-NeerjaNeural` ("Mary")
- **Endpoints**:
  - `GET /health`: Service health.
  - `POST /synthesize`: Takes `{"text": "...", "language": "hi"}` and returns raw `audio/wav` binary content.

---

## ⚙️ Environment Flags

| Variable | Recommended | Description |
|---|---|---|
| `FAST_TTS` | `true` | Enables sub-second neural voice synthesis. |
| `HF_LOCAL_FILES_ONLY` | `true` | Runs entirely offline using local cached models. |
| `TRANSLATION_NUM_BEAMS` | `1` | Fast greedy beam search for real-time translation. |
| `OMP_NUM_THREADS` | `8` | Parallel CPU inference worker threads. |

---

## 🧪 Testing the ML Services

Run the unit tests for all ML services:

```bash
python -m pytest tests/test_stt_service.py tests/test_translation_service.py tests/test_tts_service.py -v
```
