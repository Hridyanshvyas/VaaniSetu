# `channel/` — Low-Bitrate Channel & Error Correction Subsystem

The `channel/` module is the core engineering differentiator of VaaniSetu. It enables robust, intelligible voice transmission across links operating at **300 to 2,400 bits per second** — conditions under which conventional VoIP and digital voice codecs (Opus, AMR, Speex) drop out completely.

---

## 💡 Why This Works: The Bit-Budget Mathematics

A standard digitized voice stream requires:
$$\text{VoIP Bitrate} \approx 16{,}000 \text{ to } 64{,}000 \text{ bps}$$
$$\text{5-second voice snippet} \approx 80{,}000 \text{ to } 320{,}000 \text{ bits}$$

In contrast, a 5-second spoken sentence contains approximately 10 to 25 words:
$$\text{Text Length} \approx 60 \text{ to } 150 \text{ characters}$$
$$\text{Compressed Payload} \approx 40 \text{ to } 70 \text{ bytes}$$
$$\text{Packet + Reed-Solomon Parity} \approx 55 \text{ to } 90 \text{ bytes (440 to 720 bits)}$$

**Result**: VaaniSetu achieves an immediate **40x to 100x reduction in bandwidth**, enabling natural voice calls across weak military HF radios, tactical VHF, LoRa transceivers, and degraded 2G networks.

---

## 📁 Components

### 1. `compression.py` (Text Compression)
- Uses Zlib/Deflate compression tuned for short multilingual Unicode text strings.
- Functions:
  - `compress_text(text: str) -> bytes`: Encodes UTF-8 text and compresses with level 9 compression.
  - `decompress_text(data: bytes) -> str`: Restores original UTF-8 text without loss.

### 2. `packet.py` (Binary Wire Format)
Encapsulates language metadata and compressed payload into a compact, fixed binary frame:

```
+--------------------+------------------------+------------------+-------------------------+
| lang_len (1 byte)  | language_tag (N bytes) | pay_len (4 byte) | payload (pay_len bytes) |
+--------------------+------------------------+------------------+-------------------------+
```

- FEC protects the entire packed byte string, ensuring the language header and length descriptors are just as resilient to corruption as the payload itself.
- Functions: `pack(packet: Packet) -> bytes`, `unpack(data: bytes) -> Packet`.

### 3. `fec.py` (Reed-Solomon Forward Error Correction)
- Uses systematic Reed-Solomon encoding (`reedsolo.RSCodec`) with configurable parity symbols (`PARITY_BYTES = 10` by default).
- **Error Recovery**: Capable of detecting and automatically correcting up to $\lfloor \frac{\text{PARITY\_BYTES}}{2} \rfloor = 5$ corrupted bytes per packet.
- **Fail-Safe Integrity Contract**: If corruption exceeds error recovery capacity, `decode()` returns `None`. The system **never** guesses or returns corrupted garble.

### 4. `simulated_link.py` (Constrained Radio Transport Simulator)
- Replaces physical radio hardware during development and evaluation, sitting behind a standard `send(data: bytes) -> bytes` interface.
- Parameters:
  - `bits_per_second`: Bandwidth ceiling (default 2,400 to 12,000 bps).
  - `bit_error_rate`: Probability of any given bit being inverted (e.g. $10^{-3}$).
  - `base_latency_seconds`: Propagation delay.
- Tracks `total_bits_sent` to feed live bit counters on the mobile UI.

---

## 🧪 Testing the Channel

Run the automated channel round-trip and bit budget tests:

```bash
python -m pytest tests/test_channel_roundtrip.py -v
```

Tests verify:
1. Exact reconstruction on clean channels.
2. Bit flips corrected seamlessly by Reed-Solomon FEC.
3. Severe corruption handled gracefully without raising unhandled exceptions or returning false text.
4. Total bits transmitted per typical sentence remains strictly under the hackathon target budget (<800 bits).
