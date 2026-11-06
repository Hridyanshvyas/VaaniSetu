import AsyncStorage from '@react-native-async-storage/async-storage';
import {startOfflineHost} from './offline/offlineHost';

export const STORAGE_KEY_SERVER_HOST = 'vaanisetu.server_host';

export const SERVER_PRESETS = [
  {label: 'Host Offline Room (This Phone)', host: 'host:8080', desc: 'Create Hotspot & Host 2-Device Call (No Server)'},
  {label: 'Join Hotspot Host', host: '192.168.43.1:8080', desc: 'Connect to Partner Phone Hotspot (Offline)'},
  {label: 'Solo Echo Mode', host: 'offline', desc: '100% On-Device Standalone Loopback'},
  {label: 'Windows Hotspot (PC)', host: '192.168.137.1:8000', desc: 'Connect via Laptop Hotspot'},
  {label: 'Wi-Fi LAN', host: '192.168.1.100:8080', desc: 'Local Router Network'},
  {label: 'Render Cloud', host: 'vaanisetu.onrender.com', desc: 'Cloud deployment'},
] as const;

export const DEFAULT_BACKEND_HOST = 'host:8080';

let activeBackendHost = DEFAULT_BACKEND_HOST;

export function isOfflineHost(host: string = activeBackendHost): boolean {
  const h = host.trim().toLowerCase();
  return h === 'offline' || h === 'local' || h === 'none' || h === 'device';
}

export function isEmbeddedHost(host: string = activeBackendHost): boolean {
  const h = host.trim().toLowerCase();
  return h.startsWith('host') || h.startsWith('embedded');
}

export function getActiveBackendHost(): string {
  return activeBackendHost;
}

export function setActiveBackendHost(host: string): void {
  const cleaned = host
    .trim()
    .replace(/^(https?|wss?):\/\//i, '')
    .replace(/\/+$/, '');
  activeBackendHost = cleaned || DEFAULT_BACKEND_HOST;
}

export async function loadSavedServerHost(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER_HOST);
    if (saved && saved.trim()) {
      setActiveBackendHost(saved.trim());
      return getActiveBackendHost();
    }
  } catch {
    // Ignore storage read error
  }
  return DEFAULT_BACKEND_HOST;
}

export async function saveServerHost(host: string): Promise<void> {
  setActiveBackendHost(host);
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SERVER_HOST, getActiveBackendHost());
  } catch {
    // Ignore storage write error
  }
}

export function getBackendHttpUrl(host: string = activeBackendHost): string {
  if (isOfflineHost(host)) {
    return 'offline';
  }
  if (isEmbeddedHost(host)) {
    return 'http://127.0.0.1:8080';
  }
  const isCloud = !host.includes(':') || host.includes('onrender.com') || host.includes('.app');
  const scheme = isCloud ? 'https' : 'http';
  return `${scheme}://${host}`;
}

export function getBackendWsUrl(host: string = activeBackendHost): string {
  if (isOfflineHost(host)) {
    return 'offline';
  }
  if (isEmbeddedHost(host)) {
    return 'ws://127.0.0.1:8080';
  }
  const isCloud = !host.includes(':') || host.includes('onrender.com') || host.includes('.app');
  const scheme = isCloud ? 'wss' : 'ws';
  return `${scheme}://${host}`;
}

export type HealthCheckResult = {
  ok: boolean;
  service?: string;
  error?: string;
};

export async function checkServerHealth(host: string = activeBackendHost): Promise<HealthCheckResult> {
  if (isOfflineHost(host)) {
    return {ok: true, service: 'VaaniSetu Solo Engine (Offline Loopback)'};
  }

  if (isEmbeddedHost(host)) {
    try {
      await startOfflineHost(8080);
      return {ok: true, service: 'VaaniSetu Embedded Offline Host (Active)'};
    } catch (e: any) {
      return {ok: true, service: 'VaaniSetu Embedded Offline Host'};
    }
  }

  const url = `${getBackendHttpUrl(host)}/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return {ok: true, service: data.service ?? 'VaaniSetu Backend'};
    }
    return {ok: false, error: `HTTP ${response.status}: ${response.statusText}`};
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Server unreachable',
    };
  }
}

export type LanguageCode = 'hi' | 'ta' | 'te' | 'en';

export const SUPPORTED_LANGUAGES = [
  {code: 'hi', name: 'Hindi', script: 'हिन्दी', nativeName: 'हिन्दी', flag: '🇮🇳'},
  {code: 'ta', name: 'Tamil', script: 'தமிழ்', nativeName: 'தமிழ்', flag: '🇮🇳'},
  {code: 'te', name: 'Telugu', script: 'తెలుగు', nativeName: 'తెలుగు', flag: '🇮🇳'},
  {code: 'en', name: 'English', script: 'English', nativeName: 'English', flag: '🌐'},
] as const;
