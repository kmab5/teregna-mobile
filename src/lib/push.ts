import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "./supabase";

/**
 * Push notifications.
 *
 * This is the one thing a mobile app gives the product that the web app cannot:
 * a provider learns about a request without the app open, and a receiver learns
 * their turn is close without watching the screen.
 *
 * Permission is deliberately NOT requested on launch. A prompt before the person
 * knows what the app does gets denied, and on iOS a denial is close to
 * permanent. It is asked for at the moment it obviously pays off - right after
 * a first request is sent, or when a provider opens their queue.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android needs an explicit channel or notifications arrive silently. */
export async function configureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("queue", {
    name: "Queue updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6D28D9",
  });
}

export type PushOutcome = "granted" | "denied" | "unsupported" | "error";

/**
 * Ask, register, and store the token against the profile.
 *
 * Returns rather than throws: a device without push is a normal state, not a
 * failure, and nothing in the app should break because of it.
 */
export async function registerForPush(): Promise<PushOutcome> {
  // Simulators have no push service. Checking avoids a confusing error in dev.
  if (!Device.isDevice) return "unsupported";

  try {
    await configureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== "granted") {
      // Only prompts if the person has not already answered.
      if (!existing.canAskAgain) return "denied";
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") return "denied";

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )).data;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "error";

    // Stored through the same RPC surface as everything else, so RLS applies.
    await supabase.rpc("upsert_profile", {
      p: { push_token: token, push_platform: Platform.OS },
    });

    return "granted";
  } catch {
    return "error";
  }
}

/** Clears the token so a signed-out phone stops receiving someone's queue. */
export async function unregisterPush(): Promise<void> {
  try {
    await supabase.rpc("upsert_profile", { p: { push_token: null } });
  } catch {
    // Signing out matters more than clearing the token.
  }
}

export function useNotificationResponse(onOpen: (data: unknown) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    onOpen(response.notification.request.content.data);
  });
}
