/**
 * Offline Speech Synthesis & Recognition Service
 *
 * Bridges React Native with Android's built-in offline TextToSpeech and SpeechRecognizer engines.
 */

import {NativeModules, Platform} from 'react-native';

const {OfflineSpeechModule} = NativeModules;

export interface OfflineSTTResult {
  text: string;
  confidence: number;
  language: string;
}

export async function isOfflineSpeechSupported(): Promise<{
  ttsReady: boolean;
  sttAvailable: boolean;
}> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.isAvailable) {
    try {
      return await OfflineSpeechModule.isAvailable();
    } catch {
      return {ttsReady: false, sttAvailable: false};
    }
  }
  return {ttsReady: false, sttAvailable: false};
}

export async function speakOffline(text: string, language: string = 'hi'): Promise<boolean> {
  if (!text || !text.trim()) return false;

  if (Platform.OS === 'android' && OfflineSpeechModule?.speak) {
    try {
      await OfflineSpeechModule.speak(text.trim(), language);
      return true;
    } catch (e) {
      console.warn('Native Android TTS error, fallback to audio:', e);
      return false;
    }
  }
  return false;
}

export async function stopSpeakingOffline(): Promise<void> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.stopSpeaking) {
    try {
      await OfflineSpeechModule.stopSpeaking();
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function startOfflineSTT(language: string = 'hi'): Promise<OfflineSTTResult> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.startListening) {
    try {
      const result = await OfflineSpeechModule.startListening(language);
      return {
        text: (result.text || '').trim(),
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.94,
        language: result.language || language,
      };
    } catch (e: any) {
      throw new Error(e?.message || 'Offline speech recognition failed.');
    }
  }
  throw new Error('Offline STT is only supported on Android with SpeechRecognizer.');
}

export async function stopOfflineSTT(): Promise<void> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.stopListening) {
    try {
      await OfflineSpeechModule.stopListening();
    } catch {
      // Ignore cleanup error
    }
  }
}
