import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Supabase client for React Native.
 *
 * Two differences from the web client, both forced by the platform:
 *
 * 1. There is no localStorage, so the session needs an explicit storage
 *    adapter. SecureStore is used rather than AsyncStorage because the value
 *    being stored is a refresh token - on Android it lands in EncryptedSharedPreferences
 *    rather than a plaintext file.
 *
 * 2. `detectSessionInUrl` must be false. That option exists for the browser,
 *    where the OAuth fragment arrives in window.location. On native the code
 *    comes back through a deep link and we exchange it ourselves.
 */

/**
 * SecureStore rejects keys containing characters outside [A-Za-z0-9._-], and
 * refuses values over 2048 bytes. Supabase session keys contain a project ref
 * and colons, and a session with a large JWT can exceed the limit - so keys are
 * sanitised and values are chunked.
 */
const CHUNK_SIZE = 1800;

function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key);
    const head = await SecureStore.getItemAsync(base);
    if (head === null) return null;

    // A chunked value stores its part count in the head slot.
    const match = /^__chunks__(\d+)$/.exec(head);
    if (!match) return head;

    const count = Number(match[1]);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${base}__${i}`);
      if (part === null) return null; // Partial write; treat as absent.
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key);
    await this.removeItem(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(base, value);
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    // Parts first, header last, so a crash mid-write leaves no header claiming
    // parts that were never stored.
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${base}__${i}`, chunks[i]);
    }
    await SecureStore.setItemAsync(base, `__chunks__${chunks.length}`);
  },

  async removeItem(key: string): Promise<void> {
    const base = safeKey(key);
    const head = await SecureStore.getItemAsync(base);
    const match = head ? /^__chunks__(\d+)$/.exec(head) : null;
    if (match) {
      const count = Number(match[1]);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${base}__${i}`);
      }
    }
    await SecureStore.deleteItemAsync(base);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Failing loudly at startup beats a screen of empty lists and a silent 401.
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
