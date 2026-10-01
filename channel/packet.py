"""
Packet format for the VaaniSetu channel layer.

Wire format (before FEC is applied on top by fec.py):

    [1 byte]  language_tag_length (N)
    [N bytes] language_tag, UTF-8 (e.g. "hi", "ta", "te")
    [4 bytes] payload_length, big-endian unsigned int
    [payload_length bytes] compressed text payload (from compression.py)

FEC (fec.py) wraps the *entire* byte string produced by pack() below, so
error correction protects the language tag and length headers too, not
just the text payload.
"""

import struct
from dataclasses import dataclass


@dataclass
class Packet:
    language_tag: str
    payload: bytes  # compressed text, from compression.compress_text()


def pack(packet: Packet) -> bytes:
    lang_bytes = packet.language_tag.encode("utf-8")
    if len(lang_bytes) > 255:
        raise ValueError("language_tag too long")
    header = struct.pack("!B", len(lang_bytes)) + lang_bytes
    header += struct.pack("!I", len(packet.payload))
    return header + packet.payload


def unpack(data: bytes) -> Packet:
    lang_len = struct.unpack_from("!B", data, 0)[0]
    offset = 1
    language_tag = data[offset : offset + lang_len].decode("utf-8")
    offset += lang_len
    payload_len = struct.unpack_from("!I", data, offset)[0]
    offset += 4
    payload = data[offset : offset + payload_len]
    return Packet(language_tag=language_tag, payload=payload)
