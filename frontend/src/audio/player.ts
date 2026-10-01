import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const player = new AudioRecorderPlayer();

const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function fastUint8ArrayToBase64(bytes: Uint8Array): string {
  let base64 = '';
  const len = bytes.length;
  const extraBytes = len % 3;
  const mainLength = len - extraBytes;

  for (let i = 0; i < mainLength; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    base64 +=
      b64chars[b0 >> 2] +
      b64chars[((b0 & 3) << 4) | (b1 >> 4)] +
      b64chars[((b1 & 15) << 2) | (b2 >> 6)] +
      b64chars[b2 & 63];
  }

  if (extraBytes === 1) {
    const b0 = bytes[mainLength];
    base64 += b64chars[b0 >> 2] + b64chars[(b0 & 3) << 4] + '==';
  } else if (extraBytes === 2) {
    const b0 = bytes[mainLength];
    const b1 = bytes[mainLength + 1];
    base64 +=
      b64chars[b0 >> 2] +
      b64chars[((b0 & 3) << 4) | (b1 >> 4)] +
      b64chars[(b1 & 15) << 2] +
      '=';
  }
  return base64;
}

/** Persist received WAV bytes briefly, then play them through the device speaker. */
export async function playReceivedAudio(audio: ArrayBuffer): Promise<void> {
  try {
    const bytes = new Uint8Array(audio);
    const base64Data = fastUint8ArrayToBase64(bytes);
    const path = `${RNFS.CachesDirectoryPath}/vaanisetu-received.wav`;
    await RNFS.writeFile(path, base64Data, 'base64');
    await player.stopPlayer();
    await player.startPlayer(`file://${path}`);
  } catch (error) {
    console.warn('Failed to play received audio:', error);
  }
}
