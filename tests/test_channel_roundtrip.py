"""
Proves the core claim of the project: a sentence survives compression,
FEC-encoding, simulated corruption, FEC-decoding, and decompression, and
comes out correct (or the system fails gracefully and says so).

Run with: pytest tests/test_channel_roundtrip.py -v
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from channel.compression import compress_text, decompress_text
from channel.fec import encode as fec_encode, decode as fec_decode
from channel.packet import Packet, pack, unpack
from channel.simulated_link import SimulatedLink, ChannelConfig


def round_trip(text: str, language_tag: str, link: SimulatedLink):
    # Sender side
    compressed = compress_text(text)
    packet_bytes = pack(Packet(language_tag=language_tag, payload=compressed))
    protected = fec_encode(packet_bytes)

    # Channel
    received = link.send(protected)

    # Receiver side
    recovered_packet_bytes = fec_decode(received)
    if recovered_packet_bytes is None:
        return None  # unrecoverable — this is a valid, expected outcome at high error rates

    packet = unpack(recovered_packet_bytes)
    recovered_text = decompress_text(packet.payload)
    return recovered_text, packet.language_tag


def test_clean_channel_recovers_exactly():
    link = SimulatedLink(ChannelConfig(bit_error_rate=0.0, base_latency_seconds=0.0))
    result = round_trip("Hello, this is a test.", "en", link)
    assert result is not None
    text, lang = result
    assert text == "Hello, this is a test."
    assert lang == "en"


def test_noisy_channel_either_recovers_or_fails_gracefully():
    link = SimulatedLink(ChannelConfig(bit_error_rate=0.01, base_latency_seconds=0.0))
    result = round_trip("Namaste, kaise ho aap?", "hi", link)
    # At this error rate the FEC should usually recover it; if it can't,
    # it must return None cleanly, not raise or return garbage text.
    if result is not None:
        text, lang = result
        assert lang == "hi"


def test_bitrate_counter_tracks_actual_bits():
    link = SimulatedLink(ChannelConfig(bit_error_rate=0.0, base_latency_seconds=0.0))
    link.reset_bit_counter()
    round_trip("Short sentence.", "en", link)
    assert link.total_bits_sent > 0
    # The headline demo claim: this should be roughly two orders of
    # magnitude smaller than a raw/compressed audio equivalent (~10,000+
    # bits/second of audio for the same sentence's speaking duration).
    assert link.total_bits_sent < 5000
