"""
Text compression for the VaaniSetu channel layer.

The sender's STT output (plain text) is compressed here before FEC is
applied and the packet is handed to the simulated/real low-bitrate link.

Starting point: zlib (DEFLATE) gives a solid, dependency-free baseline
and is already far smaller than sending raw text or audio. Swap in a
custom arithmetic/entropy coder tuned for the target language later if
the size budget needs to shrink further — keep the same function
signatures so nothing else has to change.
"""

import zlib


def compress_text(text: str) -> bytes:
    """Compress a UTF-8 string down to bytes for transmission."""
    raw = text.encode("utf-8")
    return zlib.compress(raw, level=9)


def decompress_text(data: bytes) -> str:
    """Reverse of compress_text. Raises zlib.error on corrupted input —
    callers should catch this and treat it as a lost/unrecoverable packet
    (FEC in fec.py should catch most corruption before it gets here)."""
    raw = zlib.decompress(data)
    return raw.decode("utf-8")


# TODO(channel-lead): benchmark zlib against a small language-model-based
# arithmetic coder on real STT output for Hindi/Tamil/Telugu sentences,
# and record the bits-per-sentence improvement in docs/.
