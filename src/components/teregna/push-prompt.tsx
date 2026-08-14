import { useEffect, useState } from "react";
import { View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Bell } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { registerForPush } from "@/lib/push";
import { useT } from "@/i18n/provider";

const ASKED_KEY = "teregna_push_asked";

/**
 * Asks for notification permission at a moment it obviously pays off.
 *
 * Not on launch: a prompt before someone knows what the app does gets declined,
 * and on iOS a decline is close to permanent - the OS will not ask again, so the
 * only route back is the Settings app. Shown instead once the person is already
 * in a queue or already running one, where the value is self-evident.
 *
 * Asked at most once. Declining is a real answer, not something to re-litigate
 * on every visit.
 */
export function PushPrompt({ audience }: { audience: "receiver" | "provider" }) {
  const t = useT();
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(ASKED_KEY)
      .then((asked) => {
        if (!cancelled && !asked) setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function dismiss() {
    setVisible(false);
    await SecureStore.setItemAsync(ASKED_KEY, "1").catch(() => {});
  }

  async function enable() {
    setBusy(true);
    const outcome = await registerForPush();
    setBusy(false);
    await dismiss();

    if (outcome === "granted") toast(t("push.enabled"));
    else if (outcome === "denied") toast(t("push.denied"), { tone: "info" });
    else if (outcome === "unsupported") toast(t("push.unsupported"), { tone: "info" });
  }

  if (!visible) return null;

  return (
    <View className="rounded-md border border-primary/30 bg-primary/5 p-4 dark:border-d-primary/30 dark:bg-d-primary/10">
      <View className="flex-row items-start gap-2.5">
        <Bell size={18} color="#6D28D9" />
        <View className="flex-1">
          <Text className="font-medium text-[15px]">{t("push.enableTitle")}</Text>
          <Text variant="small" className="mt-0.5">
            {audience === "provider"
              ? t("push.enableProviderBody")
              : t("push.enableBody")}
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Button
              title={t("push.enable")}
              size="sm"
              loading={busy}
              onPress={enable}
            />
            <Button
              title={t("push.notNow")}
              variant="ghost"
              size="sm"
              onPress={dismiss}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
