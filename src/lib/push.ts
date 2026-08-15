import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

/**
 * Push notifications.
 *
 * The one thing a mobile app gives this product that the web app cannot: a
 * provider learns about a request without the app open, and a receiver learns
 * their turn is close without watching the screen.
 *
 * ---------------------------------------------------------------------------
 * Why everything here is loaded lazily
 *
 * `expo-notifications` THROWS AT IMPORT TIME in Expo Go on Android: remote
 * notifications were removed from Expo Go in SDK 53. A static `import` at the
 * top of this file therefore does not fail gracefully - it takes down the whole
 * module graph, and because the root layout imports this file, expo-router then
 * reports every route as "missing the required default export" and finally dies
 * on `Cannot read property 'ErrorBoundary' of undefined`. None of those messages
 * mention notifications.
 *
 * So the module is pulled in with a dynamic import, behind an environment check
 * AND a try/catch. The check avoids a pointless attempt; the try/catch is what
 * guarantees a throwing import can never crash the app, even if the check is
 * ever wrong about a runtime.
 *
 * The practical consequence: push does nothing in Expo Go. Test it with a
 * development build (`eas build --profile development`).
 * ---------------------------------------------------------------------------
 */

/**
 * `executionEnvironment` reports `storeClient` for BOTH Expo Go and a dev build
 * with expo-dev-client, so it cannot tell them apart. `appOwnership === "expo"`
 * is Expo Go specifically, which is the only place the import actually fails.
 */
export const isExpoGo = Constants.appOwnership === "expo";

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (cached !== undefined) return cached;

  if (isExpoGo) {
    cached = null;
    return null;
  }

  try {
    const mod = await import("expo-notifications");
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    cached = mod;
    return mod;
  } catch {
    // A runtime without the native module. Push is simply unavailable.
    cached = null;
    return null;
  }
}

/** Android delivers silently without an explicit channel. */
export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const N = await loadNotifications();
  if (!N) return;
  try {
    await N.setNotificationChannelAsync("queue", {
      name: "Queue updates",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6D28D9",
    });
  } catch {
    // Non-fatal.
  }
}

export type PushOutcome = "granted" | "denied" | "unsupported" | "error";

/**
 * Ask, register, and store the token against the profile.
 *
 * Returns rather than throws: a device without push is a normal state, not a
 * failure, and nothing in the app should break because of it.
 */
export async function registerForPush(): Promise<PushOutcome> {
  const N = await loadNotifications();
  if (!N) return "unsupported";

  try {
    // A simulator has no push service; checking avoids a confusing dev error.
    const Device = await import("expo-device");
    if (!Device.isDevice) return "unsupported";

    await configureAndroidChannel();

    const existing = await N.getPermissionsAsync();
    let status = existing.status;

    if (status !== "granted") {
      if (!existing.canAskAgain) return "denied";
      status = (await N.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return "denied";

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const token = (
      await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "error";

    // Through the same RPC surface as everything else, so RLS applies.
    await supabase.rpc("upsert_profile", {
      p: { push_token: token, push_platform: Platform.OS },
    });

    return "granted";
  } catch {
    return "error";
  }
}

/** Clears the token so a signed-out phone stops receiving someone else's queue. */
export async function unregisterPush(): Promise<void> {
  try {
    await supabase.rpc("upsert_profile", { p: { push_token: null } });
  } catch {
    // Signing out matters more than clearing the token.
  }
}

/** Returns an unsubscribe function, or a no-op where push is unavailable. */
export async function onNotificationTapped(
  handler: (data: Record<string, unknown>) => void,
): Promise<() => void> {
  const N = await loadNotifications();
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data as Record<string, unknown>);
  });
  return () => sub.remove();
}
