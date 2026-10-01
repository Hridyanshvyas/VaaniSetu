import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {PermissionsAndroid, Platform} from 'react-native';
import RNFS from 'react-native-fs';

let recorderInstance: AudioRecorderPlayer | null = null;
let isRecordingActive = false;
let startRecordingPromise: Promise<string> | null = null;
let recordingStartTime = 0;

function getRecorder(): AudioRecorderPlayer {
  if (!recorderInstance) {
    recorderInstance = new AudioRecorderPlayer();
    recorderInstance.setSubscriptionDuration(0.1);
  }
  return recorderInstance;
}

// Pre-computed fast lookup table for zero-copy Base64 decoding
const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < b64chars.length; i++) {
  lookup[b64chars.charCodeAt(i)] = i;
}

export function fastBase64ToUint8Array(base64: string): Uint8Array {
  const len = base64.length;
  let bufferLength = base64.length * 0.75;
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[base64.charCodeAt(i)];
    const e2 = lookup[base64.charCodeAt(i + 1)];
    const e3 = lookup[base64.charCodeAt(i + 2)];
    const e4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bufferLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bufferLength) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const already = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (already) return true;
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'VaaniSetu needs microphone access to transmit your voice.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  return true;
}

export async function startPushToTalk(): Promise<void> {
  const hasPermission = await requestMicPermission();
  if (!hasPermission) {
    throw new Error('Microphone permission is required to record speech.');
  }

  const rec = getRecorder();

  // If already recording, stop first
  if (isRecordingActive) {
    try {
      await rec.stopRecorder();
    } catch {
      // Ignore cleanup error
    }
    isRecordingActive = false;
  }

  const audioPath = Platform.select({
    android: `${RNFS.CachesDirectoryPath}/vaani_input.mp4`,
    ios: `${RNFS.CachesDirectoryPath}/vaani_input.m4a`,
  });

  recordingStartTime = Date.now();
  isRecordingActive = true;
  startRecordingPromise = rec.startRecorder(audioPath);
  await startRecordingPromise;
}

export async function stopPushToTalk(): Promise<string> {
  const rec = getRecorder();

  // If start is still initializing, wait for it
  if (startRecordingPromise) {
    try {
      await startRecordingPromise;
    } catch {
      // Ignore start error here
    }
    startRecordingPromise = null;
  }

  // Ensure minimum 450ms recording duration to prevent native recorder crash
  const elapsed = Date.now() - recordingStartTime;
  if (elapsed < 450) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 450 - elapsed));
  }

  isRecordingActive = false;
  try {
    const uri = await rec.stopRecorder();
    return uri || `${RNFS.CachesDirectoryPath}/vaani_input.mp4`;
  } catch (error: any) {
    // Fallback to cache file if stopRecorder throws recorder is null
    const fallbackPath = `${RNFS.CachesDirectoryPath}/vaani_input.mp4`;
    const exists = await RNFS.exists(fallbackPath);
    if (exists) {
      return fallbackPath;
    }
    throw error;
  }
}

export async function recordedFileToBytes(uri: string): Promise<ArrayBuffer> {
  const cleanPath = uri.replace('file://', '');
  const exists = await RNFS.exists(cleanPath);
  if (!exists) {
    throw new Error(
      'Audio recording file was not found. Please hold the button while speaking.',
    );
  }
  const stat = await RNFS.stat(cleanPath);
  if (stat.size < 200) {
    throw new Error(
      'Recording was too short. Please hold the button while speaking.',
    );
  }
  const base64 = await RNFS.readFile(cleanPath, 'base64');
  const bytes = fastBase64ToUint8Array(base64);
  return bytes.buffer as ArrayBuffer;
}
