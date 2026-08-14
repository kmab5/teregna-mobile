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

/**
 * Project credentials.
 *
 * Supabase replaced the legacy JWT `anon` / `service_role` keys with opaque
 * `sb_publishable_...` / `sb_secret_...` keys. The legacy pair is deprecated at
 * the end of 2026 and new projects no longer get them at all, so the publishable
 * key is what this app uses.
 *
 * Functionally it is the same deal as the anon key: low privilege, safe to ship
 * in a client bundle, and RLS is what actually protects the data. Only the
 * format and the management story changed.
 *
 * Several names are accepted because the dashboard, the docs and older setups
 * each suggest a different one, and a mismatch shows up as "cannot connect"
 * rather than anything that names the real problem.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Fail loudly at startup. A missing key otherwise surfaces as empty lists and
  // silent 401s, which is a much longer path to the actual cause.
  throw new Error(
    [
      "Supabase is not configured.",
      "",
      "Create a .env file next to package.json containing:",
      "",
      "  EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co",
      "  EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...",
      "",
      "Find both in the dashboard under Project Settings > API Keys.",
      "Use the PUBLISHABLE key, never the secret one - this bundle ships to phones.",
      "",
      "Then restart with a cleared cache: npx expo start -c",
      "(EXPO_PUBLIC_ vars are inlined at build time, so a plain reload will not pick up changes.)",
    ].join("\n"),
  );
}

if (key.startsWith("sb_secret_") || key.includes("service_role")) {
  // A secret key in a phone bundle bypasses RLS entirely. Refuse to start.
  throw new Error(
    "A SECRET Supabase key is configured in EXPO_PUBLIC_*. That key bypasses Row " +
      "Level Security and must never ship in a client. Use the publishable key.",
  );
}

export const supabase = createClient(url, key, {
  auth: {
    storage: Platform.OS === "web" ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
