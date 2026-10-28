import {getBackendHttpUrl} from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionRegistration = {
  userId: string;
  callId: string;
  nativeLanguage: string;
};

export const SESSION_STORAGE_KEY = 'vaanisetu.session';

export async function registerSession({
  userId,
  callId,
  nativeLanguage,
}: SessionRegistration): Promise<{paired: boolean}> {
  const httpUrl = getBackendHttpUrl();
  if (httpUrl === 'offline') {
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({userId, callId, nativeLanguage}),
    );
    return {paired: true};
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${httpUrl}/sessions/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user_id: userId,
        call_id: callId,
        native_language: nativeLanguage,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let detail = 'Could not register with backend.';
      try {
        const errorJson = await response.json();
        detail = errorJson.detail ?? detail;
      } catch {
        detail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(detail);
    }

    const registered = await response.json();
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({userId, callId, nativeLanguage}),
    );
    return registered;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out reaching ${httpUrl}. Ensure the server is running and phone is on the same network.`);
    }
    if (err.message && err.message.includes('Network request failed')) {
      throw new Error(`Cannot reach backend at ${httpUrl}. Check server IP and Wi-Fi connection.`);
    }
    throw err;
  }
}

/**
 * Tell the backend to tear down the call and reset the bit counter.
 * Best-effort — ignores network errors so the local logout always completes.
 */
export async function endCall(callId: string): Promise<void> {
  try {
    const httpUrl = getBackendHttpUrl();
    if (httpUrl === 'offline') {
      return;
    }
    await fetch(`${httpUrl}/sessions/${encodeURIComponent(callId)}`, {
      method: 'DELETE',
    });
  } catch {
    // Ignore — backend may have restarted; local session is cleared regardless.
  }
}

export async function loadSavedSession(): Promise<SessionRegistration | null> {
  const saved = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!saved) return null;
  try {
    const session = JSON.parse(saved);
    const nativeLanguage = session.nativeLanguage ?? session.language;
    if (!session.userId || !session.callId || !nativeLanguage) return null;
    return {userId: session.userId, callId: session.callId, nativeLanguage};
  } catch {
    return null;
  }
}
