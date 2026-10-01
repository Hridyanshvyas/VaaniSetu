# ── VaaniSetu – single-container production image ──────────────────────────
#
# Runs all four services (backend :8000, STT :8001, TTS :8002,
# translation :8004) inside one container so the cloud host only needs to
# expose a single port.  A tiny supervisord process manages the four uvicorn
# workers.  The HuggingFace model cache is expected to be mounted (or baked in
# via a separate build stage) at /root/.cache/huggingface.
#
# Build:
#   docker build -t vaanisetu .
#
# Run locally (models already cached on host):
#   docker run -p 8000:8000 \
#     -v %USERPROFILE%\.cache\huggingface:/root/.cache/huggingface \
#     -e HF_LOCAL_FILES_ONLY=true \
#     vaanisetu
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# ── system deps ──────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ffmpeg \
    libsndfile1 \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python deps (install heaviest first so Docker cache is useful) ───────────
# Channel + backend (lightweight)
COPY channel/requirements.txt      /tmp/req-channel.txt
COPY backend/requirements.txt      /tmp/req-backend.txt
RUN pip install --no-cache-dir -r /tmp/req-channel.txt -r /tmp/req-backend.txt

# STT (torch + torchaudio + NeMo)
COPY ml/stt_service/requirements.txt /tmp/req-stt.txt
RUN pip install --no-cache-dir -r /tmp/req-stt.txt

# TTS (parler-tts from git + accelerate)
COPY ml/tts_service/requirements.txt /tmp/req-tts.txt
RUN pip install --no-cache-dir -r /tmp/req-tts.txt

# Translation (IndicTransToolkit)
COPY ml/translation_service/requirements.txt /tmp/req-trans.txt
RUN pip install --no-cache-dir -r /tmp/req-trans.txt

# ── application source ───────────────────────────────────────────────────────
COPY channel/       /app/channel/
COPY backend/       /app/backend/
COPY ml/            /app/ml/

# ── supervisord config ───────────────────────────────────────────────────────
COPY deploy/supervisord.conf /etc/supervisor/conf.d/vaanisetu.conf

# ── environment ──────────────────────────────────────────────────────────────
ENV PYTHONPATH=/app
ENV HF_LOCAL_FILES_ONLY=true
# Services talk to each other on localhost inside the container
ENV STT_SERVICE_URL=http://127.0.0.1:8001
ENV TTS_SERVICE_URL=http://127.0.0.1:8002
ENV TRANSLATION_SERVICE_URL=http://127.0.0.1:8004

EXPOSE 8000

# supervisord starts all four uvicorn processes
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/vaanisetu.conf"]
