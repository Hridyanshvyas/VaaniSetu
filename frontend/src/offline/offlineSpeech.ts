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
  status?: string;
  error?: string;
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
      console.warn('Native Android TTS error:', e);
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

export async function startOfflineSTT(language: string = 'hi'): Promise<boolean> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.startListening) {
    try {
      await OfflineSpeechModule.startListening(language);
      return true;
    } catch (e: any) {
      console.warn('Offline speech recognition start failed:', e);
      return false;
    }
  }
  return false;
}

export async function stopOfflineSTT(): Promise<OfflineSTTResult> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.stopListening) {
    try {
      const result = await OfflineSpeechModule.stopListening();
      return {
        text: (result?.text || '').trim(),
        confidence: typeof result?.confidence === 'number' ? result.confidence : 0.92,
        language: result?.language || 'hi',
        status: result?.status,
        error: result?.error,
      };
    } catch (e: any) {
      return {
        text: '',
        confidence: 0,
        language: 'hi',
        status: 'error',
        error: e?.message || 'Offline speech recognition stop failed.',
      };
    }
  }
  return {
    text: '',
    confidence: 0,
    language: 'hi',
    status: 'unavailable',
    error: 'Offline STT requires Android SpeechRecognizer.',
  };
}
