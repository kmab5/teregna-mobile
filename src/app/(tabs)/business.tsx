import { View } from "react-native";
import { useRouter } from "expo-router";
import { Store } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PositionBadge } from "@/components/teregna/position-badge";
import { useMyProvider, useProviderQueue } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useT } from "@/i18n/provider";

/**
 * The provider surface, first slice.
 *
 * Shows the live queue read-only. The working actions - start, finish, restore,
 * items, analytics - are the next milestone, tracked in LOG.md. This exists now
 * so the realtime path can be exercised end to end on a device rather than
 * landing untested later.
 */
export default function BusinessScreen() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { data: provider, isPending } = useMyProvider();
  const { data: queue } = useProviderQueue(provider?.id);

  if (!user) {
    return (
      <Screen title={t("nav.myBusiness")}>
        <Card>
          <Text variant="small">{t("auth.provSub")}</Text>
          <Button
            title={t("auth.signIn")}
            className="mt-4 self-start"
            onPress={() => router.push("/(auth)/sign-in")}
          />
        </Card>
      </Screen>
    );
  }

  if (isPending) return <Screen title={t("nav.myBusiness")} />;

  if (!provider) {
    return (
      <Screen title={t("nav.myBusiness")}>
        <Card className="items-center py-10">
          <Store size={28} color="#5B517A" />
          <Text variant="title" className="mt-3">
            {t("ob.bTitle")}
          </Text>
          <Text variant="small" className="mt-1 text-center">
            {t("ob.bSubtitle")}
          </Text>
        </Card>
      </Screen>
    );
  }

  const rows = queue ?? [];

  return (
    <Screen title={t("pq.title")} subtitle={provider.name}>
      <View className="mb-3 flex-row items-baseline gap-2">
        <Text className="font-mono-bold text-[28px] text-ink dark:text-d-ink">
          {rows.length}
        </Text>
        <Text variant="small">{t("pq.waiting")}</Text>
      </View>

      <View className="gap-3">
        {rows.length === 0 ? (
          <Card className="items-center py-10">
            <Text variant="title">{t("pq.emptyTitle")}</Text>
            <Text variant="small" className="mt-1 text-center">
              {provider.is_active ? t("pq.emptyOpen") : t("pq.emptyClosed")}
            </Text>
          </Card>
        ) : (
          rows.map((row) => (
            <Card key={row.id}>
              <View className="flex-row items-center gap-3">
                <PositionBadge
                  position={row.position}
                  active={row.status === "in_progress"}
                />
                <View className="flex-1">
                  <Text className="font-medium">{row.receiver_name}</Text>
                  {row.note ? (
                    <Text variant="small" numberOfLines={1}>
                      {row.note}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
