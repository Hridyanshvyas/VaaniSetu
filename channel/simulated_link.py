"""
Software-simulated low-bitrate link for the VaaniSetu prototype.

This stands in for a real radio/RF transport (HF/VHF, LoRa, SDR). It
caps throughput, injects random bit errors, and adds latency, so the
rest of the pipeline (compression + FEC) can be proven against a
realistic noisy, bandwidth-starved channel without needing hardware.

Keep this behind the same interface (`send` / `receive`) so it can be
swapped for a real transport later (see docs/BUILD_PLAN.md step 8)
without touching backend/ or channel/{compression,fec,packet}.py.
"""

import random
import time
from dataclasses import dataclass


import os

@dataclass
class ChannelConfig:
    bits_per_second: int = int(os.getenv("CHANNEL_BPS", "12000"))      # high-throughput simulated link
    bit_error_rate: float = float(os.getenv("CHANNEL_BER", "0.001"))   # probability any given bit is flipped
    base_latency_seconds: float = float(os.getenv("CHANNEL_LATENCY", "0.01"))  # 10ms low-latency radio propagation


class SimulatedLink:
    def __init__(self, config: ChannelConfig = ChannelConfig()):
        self.config = config
        self.total_bits_sent = 0  # running counter for the demo's live bitrate display

    def send(self, data: bytes) -> bytes:
        """Simulate transmitting `data` over the constrained channel.
        Returns the (possibly corrupted) bytes as received on the other end.
        Also sleeps to simulate real transmission time at the configured
        bitrate — remove/mock this in unit tests that don't want to wait."""
        num_bits = len(data) * 8
        self.total_bits_sent += num_bits

        transmission_time = num_bits / self.config.bits_per_second
        time.sleep(self.config.base_latency_seconds + transmission_time)

        return self._corrupt(data)

    def _corrupt(self, data: bytes) -> bytes:
        if self.config.bit_error_rate <= 0:
            return data
        mutable = bytearray(data)
        for byte_index in range(len(mutable)):
            for bit_index in range(8):
                if random.random() < self.config.bit_error_rate:
                    mutable[byte_index] ^= 1 << bit_index
        return bytes(mutable)

    def reset_bit_counter(self) -> None:
        self.total_bits_sent = 0


# TODO(channel-lead): expose total_bits_sent and elapsed time to the
# backend so the frontend's live "bits used" counter (see
# frontend/src/screens/) can display real numbers, not estimates.
