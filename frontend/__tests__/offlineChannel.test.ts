import {
  compressText,
  decompressText,
  packPacket,
  unpackPacket,
  fecEncode,
  fecDecode,
  OfflineSimulatedLink,
  stringToUtf8Bytes,
  utf8BytesToString,
} from '../src/offline/offlineChannel';
import {translateOffline, OFFLINE_TACTICAL_PROMPTS} from '../src/offline/offlineTranslator';
import {OfflinePipeline} from '../src/offline/offlinePipeline';

describe('Offline Channel Unit Tests', () => {
  it('UTF-8 encodes and decodes multilingual Indic text correctly', () => {
    const hindi = 'नमस्ते भारत, वाणी सेतु में आपका स्वागत है।';
    const tamil = 'வணக்கம் இந்தியா, வாணி சேதுவுக்கு வரவேற்கிறோம்.';
    const telugu = 'నమస్కారం భారతదేశం, వాణి సేతుకు స్వాగతం.';

    expect(utf8BytesToString(stringToUtf8Bytes(hindi))).toBe(hindi);
    expect(utf8BytesToString(stringToUtf8Bytes(tamil))).toBe(tamil);
    expect(utf8BytesToString(stringToUtf8Bytes(telugu))).toBe(telugu);
  });

  it('compresses and decompresses text losslessly', () => {
    const original = 'Emergency medical assistance required at checkpoint four.';
    const compressed = compressText(original);
    expect(compressed.length).toBeGreaterThan(0);
    const recovered = decompressText(compressed);
    expect(recovered).toBe(original);
  });

  it('packs and unpacks binary wire packets', () => {
    const payload = compressText('बाढ़ का पानी तेज़ी से बढ़ रहा है।');
    const packet = {languageTag: 'hi', payload};
    const packed = packPacket(packet);
    const unpacked = unpackPacket(packed);

    expect(unpacked.languageTag).toBe('hi');
    expect(decompressText(unpacked.payload)).toBe('बाढ़ का पानी तेज़ी से बढ़ रहा है।');
  });

  it('Reed-Solomon FEC recovers byte corruption', () => {
    const msg = stringToUtf8Bytes('Radio check, can you hear me?');
    const encoded = fecEncode(msg, 10);
    expect(encoded.length).toBe(msg.length + 10);

    // Corrupt 2 bytes
    const corrupted = new Uint8Array(encoded);
    corrupted[3] ^= 0x5a;
    corrupted[7] ^= 0x3c;

    const decoded = fecDecode(corrupted, 10);
    expect(decoded).not.toBeNull();
    expect(utf8BytesToString(decoded!)).toBe('Radio check, can you hear me?');
  });

  it('Reed-Solomon FEC fails gracefully when corruption exceeds parity limit', () => {
    const msg = stringToUtf8Bytes('Bridge collapsed at sector 2.');
    const encoded = fecEncode(msg, 10);

    // Corrupt 7 bytes (limit for 10 ECC symbols is 5 bytes)
    const heavilyCorrupted = new Uint8Array(encoded);
    for (let i = 0; i < 7; i++) {
      heavilyCorrupted[i * 2] ^= 0xff;
    }

    const decoded = fecDecode(heavilyCorrupted, 10);
    expect(decoded).toBeNull();
  });

  it('translates tactical phrases across English, Hindi, Tamil, and Telugu', () => {
    const enPhrase = 'Emergency medical help needed immediately.';
    const hi = translateOffline(enPhrase, 'en', 'hi');
    const ta = translateOffline(enPhrase, 'en', 'ta');
    const te = translateOffline(enPhrase, 'en', 'te');

    expect(hi).toContain('आपातकालीन');
    expect(ta).toContain('அவசர');
    expect(te).toContain('అత్యవసర');
  });

  it('runs end-to-end OfflinePipeline exchange and tracks bit budget', async () => {
    const pipeline = new OfflinePipeline({
      bitsPerSecond: 12000,
      bitErrorRate: 0.0,
      baseLatencyMs: 0,
    });

    const result = await pipeline.processExchange(
      'Rescue team dispatched to our coordinates.',
      'en',
      'hi',
    );

    expect(result.lost).toBe(false);
    expect(result.transcribed_text).toBe('Rescue team dispatched to our coordinates.');
    expect(result.translated_text).toContain('बचाव दल');
    expect(result.bits_used).toBeGreaterThan(0);
    // Verified bit budget: ultra compact text payload (< 800 bits!)
    expect(result.bits_used).toBeLessThan(800);
  });
});
