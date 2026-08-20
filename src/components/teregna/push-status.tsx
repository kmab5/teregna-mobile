import { useState } from "react";
import { View } from "react-native";
import Constants from "expo-constants";
import { Bell, BellOff, CircleCheck, TriangleAlert } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isExpoGo, registerForPush } from "@/lib/push";
import { useProfile } from "@/lib/queries";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

/**
 * Why notifications are or are not working, on this device.
 *
 * "Notifications aren't firing" has at least four causes - Expo Go, no EAS
 * project id, permission denied, no token stored - and none of them announce
 * themselves. Rather than leaving that to be guessed at, the app states which
 * one applies. `private.push_diagnosis()` answers the same question from the
 * server side.
 */
export function PushStatus() {
  const t = useT();
  const c = useThemeColors();
  const toast = useToast();
  const { data: profile, refetch } = useProfile();
  const [busy, setBusy] = useState(false);

  const hasProjectId = Boolean(
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
  );
  const registered = Boolean(profile?.push_token);

  // The first blocker in the order they must be resolved.
  const blocker = isExpoGo
    ? t("push.expoGo")
    : !hasProjectId
      ? t("push.noProject")
      : null;

  const ok = registered && !blocker;

  async function retry() {
    setBusy(true);
    const outcome = await registerForPush();
    setBusy(false);
    await refetch();
    if (outcome === "granted") toast(t("push.enabled"));
    else if (outcome === "denied") toast(t("push.denied"), { tone: "info" });
    else toast(t("push.unsupported"), { tone: "info" });
  }

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        {ok ? (
          <CircleCheck size={17} color={c.accent} />
        ) : blocker ? (
          <TriangleAlert size={17} color={c.warning} />
        ) : (
          <BellOff size={17} color={c.inkMuted} />
        )}
        <Text className="text-[16px] font-medium">{t("push.status")}</Text>
      </View>

      <Text variant="small">
        {blocker ?? (registered ? t("push.onDevice") : t("push.notRegistered"))}
      </Text>

      {!blocker ? (
        <Button
          title={busy ? t("common.loading") : registered ? t("push.retry") : t("push.enable")}
          variant="outline"
          size="sm"
          loading={busy}
          onPress={retry}
          className="self-start"
          icon={<Bell size={15} color={c.primary} />}
        />
      ) : null}
    </Card>
  );
}
