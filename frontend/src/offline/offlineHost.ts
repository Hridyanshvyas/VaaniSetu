/**
 * Offline Call Host Management Bridge
 *
 * Allows one Android mobile device to act as an embedded peer-to-peer call server,
 * enabling two devices to connect over Hotspot or local Wi-Fi with zero server/laptop.
 */

import {NativeModules, Platform} from 'react-native';

const {OfflineSpeechModule} = NativeModules;

export interface OfflineHostInfo {
  running: boolean;
  ip: string;
  port: number;
  hostAddress: string;
}

export async function startOfflineHost(port: number = 8080): Promise<OfflineHostInfo> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.startOfflineHost) {
    try {
      const info = await OfflineSpeechModule.startOfflineHost(port);
      return {
        running: Boolean(info?.running),
        ip: info?.ip || '192.168.43.1',
        port: typeof info?.port === 'number' ? info.port : port,
        hostAddress: info?.hostAddress || `192.168.43.1:${port}`,
      };
    } catch (e: any) {
      console.warn('Could not start offline host:', e);
      throw new Error(e?.message || 'Failed to start offline hotspot host.');
    }
  }
  return {
    running: false,
    ip: '127.0.0.1',
    port,
    hostAddress: `127.0.0.1:${port}`,
  };
}

export async function stopOfflineHost(): Promise<boolean> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.stopOfflineHost) {
    try {
      return await OfflineSpeechModule.stopOfflineHost();
    } catch {
      return false;
    }
  }
  return false;
}

export async function getOfflineHostInfo(): Promise<OfflineHostInfo> {
  if (Platform.OS === 'android' && OfflineSpeechModule?.getOfflineHostInfo) {
    try {
      const info = await OfflineSpeechModule.getOfflineHostInfo();
      return {
        running: Boolean(info?.running),
        ip: info?.ip || '192.168.43.1',
        port: typeof info?.port === 'number' ? info.port : 8080,
        hostAddress: info?.hostAddress || '192.168.43.1:8080',
      };
    } catch {
      // Fallback
    }
  }
  return {
    running: false,
    ip: '192.168.43.1',
    port: 8080,
    hostAddress: '192.168.43.1:8080',
  };
}
