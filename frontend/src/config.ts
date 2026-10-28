import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_SERVER_HOST = 'vaanisetu.server_host';

export const SERVER_PRESETS = [
  {label: 'Offline Engine', host: 'offline', desc: '100% On-Device Standalone (No Server Needed)'},
  {label: 'Hotspot', host: '192.168.137.1:8000', desc: 'Windows Mobile Hotspot (Relay)'},
  {label: 'Wi-Fi LAN', host: '172.16.19.92:8000', desc: 'Local PC Network IP'},
  {label: 'Emulator', host: '10.0.2.2:8000', desc: 'Android Studio Emulator'},
  {label: 'Render Cloud', host: 'vaanisetu.onrender.com', desc: 'Cloud deployment'},
] as const;

export const DEFAULT_BACKEND_HOST = 'offline';

let activeBackendHost = DEFAULT_BACKEND_HOST;

export function isOfflineHost(host: string = activeBackendHost): boolean {
  const h = host.trim().toLowerCase();
  return h === 'offline' || h === 'local' || h === 'none' || h === 'device';
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
  const isCloud = !host.includes(':') || host.includes('onrender.com') || host.includes('.app');
  const scheme = isCloud ? 'https' : 'http';
  return `${scheme}://${host}`;
}

export function getBackendWsUrl(host: string = activeBackendHost): string {
  if (isOfflineHost(host)) {
    return 'offline';
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
    return {ok: true, service: 'VaaniSetu On-Device Engine (Offline)'};
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
    if (err && err.name === 'AbortError') {
      return {ok: false, error: 'Connection timed out (server unreachable)'};
    }
    return {
      ok: false,
      error: (err && err.message) || 'Cannot connect to server. Check IP & Wi-Fi.',
    };
  }
}

export const SUPPORTED_LANGUAGES = [
  {code: 'hi', label: 'Hindi', script: 'हिन्दी', speaker: 'Divya'},
  {code: 'ta', label: 'Tamil', script: 'தமிழ்', speaker: 'Jaya'},
  {code: 'te', label: 'Telugu', script: 'తెలుగు', speaker: 'Prakash'},
  {code: 'en', label: 'English', script: 'English', speaker: 'Mary'},
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/**
 * Visual-only roadmap languages for showcase.
 * These are NOT selectable for calls and are NOT sent to backend.
 */
export const UPCOMING_LANGUAGES = [
  {code: 'gu', label: 'Gujarati', script: 'ગુજરાતી'},
  {code: 'mr', label: 'Marathi', script: 'मराठी'},
  {code: 'kn', label: 'Kannada', script: 'ಕನ್ನಡ'},
  {code: 'ml', label: 'Malayalam', script: 'മലയാളം'},
  {code: 'bn', label: 'Bengali', script: 'বাংলা'},
  {code: 'or', label: 'Odia', script: 'ଓଡ଼ିଆ'},
] as const;

export type UpcomingLanguage = (typeof UPCOMING_LANGUAGES)[number];

