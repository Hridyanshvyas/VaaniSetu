# Build plan

Build in this order. Do not start step N+1 before step N has a passing test (where one is specified).

1. **`channel/` round-trip** — compression (`compression.py`) + FEC (`fec.py`) + packet format (`packet.py`). Test: encode text → deliberately corrupt bytes → decode → verify correct recovery or graceful failure. See `tests/test_channel_roundtrip.py`.
2. **`channel/simulated_link.py`** — wrap the round-trip in a rate-limited, lossy transport. Test: measure actual throughput against the configured bits-per-second cap. See `tests/test_bitrate_budget.py`.
3. **`ml/stt_service/`** — standalone: given an audio file/stream, return text + a language tag + a confidence score. Test with sample Hindi/Tamil/Telugu audio clips.
4. **`ml/tts_service/`** — standalone: given text + language, return synthesized audio. Test the output is intelligible.
5. **`backend/`** — wire `ml/stt_service` → `channel/` → `ml/tts_service` into one pipeline, runnable end-to-end on one machine via loopback (same process is both sender and receiver).
6. **`frontend/`** — mic-in/speaker-out UI, WebSocket client to `backend/`, still looping back to itself on one device.
7. **Two-device demo** — run `frontend/` on two physical phones against the same `backend/`, confirm a real sender→receiver→sender exchange works with `simulated_link.py` actually constraining the bitrate. Confirm the live bitrate/latency counter in the UI is accurate.
8. **(Stretch, only after 7 is solid)** — swap `simulated_link.py` for a real transport (SDR via GNU Radio, or LoRa) behind the same interface.

## MVP definition of done

- Two phones exchange a live spoken conversation in at least one Indian language, ideally 2-3
- The link between them is demonstrably bandwidth-capped (e.g. 300-1200 bps), not full-speed in disguise
- The app shows, live, the actual bits used per exchange
- STT → TTS round-trip is intelligible
- Bit errors degrade gracefully (flagged low-confidence words), not silently wrong output

## Explicitly out of scope for the hackathon prototype

- Training STT/TTS from scratch (use pretrained AI4Bharat/Whisper/Coqui models only)
- Production auth, encryption, multi-user scaling
- All Indian languages (2-3 done well is the target)
- Sub-500ms real-time latency (a few seconds end-to-end is an acceptable, stated trade-off)
