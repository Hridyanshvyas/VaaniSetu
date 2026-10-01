"""
Forward error correction (FEC) for the VaaniSetu channel layer.

Wraps compressed text bytes with Reed-Solomon error-correction bytes so
the packet can survive bit errors on a noisy, low-bitrate link.

Requires: pip install reedsolo

If reedsolo is not installed, this module still imports (so the rest of
the pipeline can be built/tested) but encode/decode will raise a clear
ImportError when actually called.
"""

from typing import Optional

try:
    from reedsolo import RSCodec, ReedSolomonError
except ImportError:  # pragma: no cover
    RSCodec = None
    ReedSolomonError = Exception

# Number of error-correction symbols to add. Higher = more resilient to
# corruption but larger packets. 10 is a reasonable starting point for a
# noisy low-bitrate link; tune against the simulated_link error rate.
DEFAULT_ECC_SYMBOLS = 10


def encode(data: bytes, ecc_symbols: int = DEFAULT_ECC_SYMBOLS) -> bytes:
    """Add Reed-Solomon error-correction bytes to `data`."""
    if RSCodec is None:
        raise ImportError("reedsolo is required: pip install reedsolo")
    codec = RSCodec(ecc_symbols)
    return bytes(codec.encode(data))


def decode(data: bytes, ecc_symbols: int = DEFAULT_ECC_SYMBOLS) -> Optional[bytes]:
    """Correct and strip error-correction bytes, returning the original
    payload. Returns None if the packet was too corrupted to recover —
    callers should treat that as a dropped exchange (e.g. ask the sender
    to repeat, or flag to the receiver that a word was lost)."""
    if RSCodec is None:
        raise ImportError("reedsolo is required: pip install reedsolo")
    codec = RSCodec(ecc_symbols)
    try:
        decoded, _, _ = codec.decode(data)
        return bytes(decoded)
    except ReedSolomonError:
        return None


# TODO(channel-lead): tune DEFAULT_ECC_SYMBOLS against the actual error
# rate configured in simulated_link.py, and record the trade-off between
# packet size and recovery rate in docs/.
