# AGENTS.md

Instructions for AI coding agents (Codex, etc.) working in this repo. Read this fully before writing any code.

## Project

**VaaniSetu** ("वाणी सेतु" — a bridge for voice). Smart India Hackathon 2026, PS ID SIH26173, Category: Software, Theme: Miscellaneous.

Lets two people have a natural spoken conversation over a radio/network link too weak for a normal voice call. Speech → text (STT) → compress + error-correct → transmit over a low-bitrate link → decode → text → speech (TTS). The receiver only ever hears a voice; text never surfaces to the user. Must support multiple Indian languages.

```
Sender speaks → STT → compress + error-correct → LOW-BITRATE LINK →
decode + error-correct → TTS → Receiver hears natural voice
```

Why this works: text for a spoken sentence is ~10-50x smaller than even compressed audio for the same sentence. Don't compress audio harder — replace it with text, and only synthesize audio at the very last step.

Full context: `README.md` and `docs/BUILD_PLAN.md`. Read both before starting.

## Build order — do not skip ahead

Follow `docs/BUILD_PLAN.md` exactly. Summary:

1. `channel/` round-trip (compression + FEC + packet format) — **already implemented and tested**, see Status below
2. `channel/simulated_link.py` bandwidth cap — **already implemented and tested**
3. `ml/stt_service/` standalone (currently a stub — implement next)
4. `ml/tts_service/` standalone (currently a stub)
5. `backend/` wiring STT → channel → TTS into one pipeline (partially wired — channel layer is connected in `orchestrator.py`, STT/TTS calls are still TODO)
6. `frontend/` mic-in/speaker-out UI, one device, looped back to itself
7. Two-device demo — two phones, one backend, simulated channel actually constraining bitrate
8. (Stretch, only after 7) real radio hardware (SDR/LoRa) behind the same `SimulatedLink` interface

Do not start a step before the previous one has a passing test where one is specified.

## Current status (check before assuming something needs building from scratch)

- ✅ `channel/compression.py`, `channel/fec.py`, `channel/packet.py`, `channel/simulated_link.py` — implemented, working
- ✅ `tests/test_channel_roundtrip.py` — 3 tests, all passing (`pytest tests/ -v`)
- ✅ `backend/orchestrator.py` — channel layer wired end-to-end; STT/TTS calls are stubbed with `TODO(backend-lead)` markers
- 🚧 `backend/main.py` — FastAPI app exists with only a `/health` endpoint; WebSocket session handling not built
- 🚧 `ml/stt_service/`, `ml/tts_service/` — FastAPI app shells + model wrapper classes exist; both raise `NotImplementedError` until a real model is loaded
- 🚧 `frontend/` — `package.json` only; React Native project itself not yet scaffolded, module folders (`src/screens`, `src/audio`, `src/network`) contain spec READMEs, not code

Every stub file has a `TODO(role-lead)` comment stating exactly what to implement — read the file you're about to edit fully before writing code, the contract is usually already specified in its docstring.

## Repo map

| Path | Purpose |
|---|---|
| `channel/` | Text compression, FEC, packet format, simulated low-bitrate link — the project's core differentiator |
| `backend/` | FastAPI + WebSocket orchestration server |
| `ml/stt_service/` | Speech-to-Text microservice (AI4Bharat IndicWav2Vec, Whisper fallback) |
| `ml/tts_service/` | Text-to-Speech microservice (AI4Bharat Indic-TTS, Coqui VITS fallback) |
| `frontend/` | React Native mobile app, runs on both sender and receiver phones |
| `tests/` | Round-trip and bitrate-budget tests |
| `docs/BUILD_PLAN.md` | Full build sequence + MVP definition of done |

## Setup & commands

```bash
# Python services (channel/, backend/, ml/*)
pip install -r channel/requirements.txt -r backend/requirements.txt --break-system-packages
# each ml service has its own heavier requirements.txt (torch, transformers, etc.) —
# install per-service, not all at once, unless you're running the full stack

# Run tests
python3 -m pytest tests/ -v

# Run backend locally
uvicorn backend.main:app --reload --port 8000

# Full stack (once Dockerfiles exist per service — see docker-compose.yml TODO)
docker compose up --build
```

## Constraints — do not violate these

- Use **pretrained** AI4Bharat / Whisper / Coqui models. Do not attempt to train STT/TTS from scratch — out of scope for this hackathon timeline.
- The low-bitrate link is **software-simulated** (`channel/simulated_link.py`) by default. Do not add real SDR/LoRa hardware code unless explicitly asked — that's step 8, stretch-only, and must sit behind the existing `SimulatedLink` interface (same `send()` contract) so nothing else in the pipeline changes.
- Target 2-3 Indian languages done well (start with Hindi), not broad coverage.
- A few seconds of end-to-end latency is an accepted, stated trade-off. Do not over-engineer for sub-second latency at the cost of the build schedule.
- No production auth/encryption/multi-user scaling work — out of scope.
- When a bit-error/packet-loss scenario can't be recovered, the correct behavior is to return `None`/flag it — never silently fabricate or guess text. See `channel/fec.py::decode` and `tests/test_channel_roundtrip.py::test_noisy_channel_either_recovers_or_fails_gracefully` for the expected contract.

## Testing expectations

- Any change to `channel/*` must keep `tests/test_channel_roundtrip.py` passing.
- New functionality in `ml/*` or `backend/*` should get at least one test proving the standalone contract (e.g. STT: given a sample audio file, returns non-empty text + confidence score) before being wired into the full pipeline.
- The bitrate claim (`test_bitrate_counter_tracks_actual_bits`) is a headline demo metric — if you touch the packet format or FEC overhead, re-check this test still holds a realistic bits-per-sentence number, not just that it passes.

## MVP definition of done

See `docs/BUILD_PLAN.md` for the full list. Non-negotiable for a demo-ready prototype:
- Two phones exchange live spoken conversation in at least one Indian language
- The channel is demonstrably bandwidth-capped (not full-speed in disguise)
- The app shows the actual bits used per exchange, live
- Bit errors degrade gracefully (flagged), never silently wrong output
