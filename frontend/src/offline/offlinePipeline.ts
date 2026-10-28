/**
 * Offline Pipeline Orchestrator for VaaniSetu
 *
 * Runs the end-to-end voice bridge completely on-device without an external server:
 * STT -> Indic Translation -> Compression -> Reed-Solomon FEC -> Low-Bitrate Link -> FEC Recovery -> Decompression -> Offline TTS.
 */

import {
  compressText,
  decompressText,
  fecEncode,
  fecDecode,
  packPacket,
  unpackPacket,
  OfflineSimulatedLink,
  DEFAULT_OFFLINE_CHANNEL_CONFIG,
  type ChannelConfig,
} from './offlineChannel';
import {translateOffline} from './offlineTranslator';
import {speakOffline} from './offlineSpeech';

export interface OfflineExchangeResult {
  type: 'exchange';
  text: string | null;
  transcribed_text: string;
  translated_text: string;
  language: string;
  confidence: number;
  bits_used: number;
  lost: boolean;
}

export class OfflinePipeline {
  private link: OfflineSimulatedLink;

  constructor(config: ChannelConfig = DEFAULT_OFFLINE_CHANNEL_CONFIG) {
    this.link = new OfflineSimulatedLink(config);
  }

  get totalBitsSent(): number {
    return this.link.totalBitsSent;
  }

  resetBitCounter(): void {
    this.link.resetBitCounter();
  }

  setBps(bps: number): void {
    this.link.config.bitsPerSecond = bps;
  }

  setBer(ber: number): void {
    this.link.config.bitErrorRate = ber;
  }

  /**
   * Run one complete offline voice exchange given transcribed or detected text.
   */
  async processExchange(
    inputText: string,
    sourceLanguage: string,
    targetLanguage: string,
    confidence: number = 0.95,
  ): Promise<OfflineExchangeResult> {
    const cleanInput = inputText.trim();
    if (!cleanInput) {
      return {
        type: 'exchange',
        text: '',
        transcribed_text: '',
        translated_text: '',
        language: targetLanguage,
        confidence: 0.0,
        bits_used: 0,
        lost: false,
      };
    }

    // 1. On-Device Indic Translation
    const translatedText = translateOffline(cleanInput, sourceLanguage, targetLanguage);

    // 2. Text Compression (Zlib level 9)
    const compressed = compressText(translatedText);

    // 3. Binary Wire Packet Framing
    const packetBytes = packPacket({
      languageTag: targetLanguage,
      payload: compressed,
    });

    // 4. Reed-Solomon Forward Error Correction
    const protectedBytes = fecEncode(packetBytes);

    // 5. Constrained Low-Bitrate Link Simulation
    const bitsBefore = this.link.totalBitsSent;
    const receivedBytes = await this.link.send(protectedBytes);
    const bitsUsed = this.link.totalBitsSent - bitsBefore;

    // 6. Reed-Solomon Error Recovery
    const recoveredPacketBytes = fecDecode(receivedBytes);
    if (!recoveredPacketBytes) {
      // Corruption exceeded RS parity limits
      return {
        type: 'exchange',
        text: null,
        transcribed_text: cleanInput,
        translated_text: translatedText,
        language: targetLanguage,
        confidence,
        bits_used: bitsUsed,
        lost: true,
      };
    }

    // 7. Packet Unpacking & Zlib Decompression
    try {
      const unpacked = unpackPacket(recoveredPacketBytes);
      const recoveredText = decompressText(unpacked.payload);

      // 8. On-Device Native TTS Output
      void speakOffline(recoveredText, unpacked.languageTag);

      return {
        type: 'exchange',
        text: recoveredText,
        transcribed_text: cleanInput,
        translated_text: translatedText,
        language: unpacked.languageTag,
        confidence,
        bits_used: bitsUsed,
        lost: false,
      };
    } catch {
      // Parsing or decompression error on corrupt stream
      return {
        type: 'exchange',
        text: null,
        transcribed_text: cleanInput,
        translated_text: translatedText,
        language: targetLanguage,
        confidence,
        bits_used: bitsUsed,
        lost: true,
      };
    }
  }
}

export const sharedOfflinePipeline = new OfflinePipeline();
