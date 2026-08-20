import { useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Inbox } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/teregna/status-badge";
import { useMyRequests } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/i18n/provider";
import { makeFormat } from "@/lib/format";
import { useThemeColors } from "@/theme/colors";
import { ACTIVE_STATUSES } from "@/lib/database.types";
import { cn } from "@/lib/cn";

/**
 * Everything a customer has ever requested.
 *
 * The requests tab is a working view - what is happening now, with the past
 * folded underneath. This is the archive: nothing drops off it, and every entry
 * still opens its full order, so a receipt from three weeks ago is as reachable
 * as this morning's.
 */
export default function HistoryScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const { user } = useAuth();
  const { data, isRefetching, refetch } = useMyRequests(user?.id);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  const rows = (data ?? []).filter((r) => {
    if (filter === "all") return true;
    if (filter === "active") return ACTIVE_STATUSES.includes(r.status);
    return r.status === filter;
  });

  return (
    <View className="flex-1" style={{ backgroundColor: c.bg }}>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        className="flex-1 px-5"
        contentContainerClassName="py-4 gap-3"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />
        }
        ListHeaderComponent={
          <View className="flex-row gap-2 pb-1">
            {(["all", "active", "completed", "cancelled"] as const).map((f) => (
              <Pressable
                key={f}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === f }}
                onPress={() => setFilter(f)}
                className={cn(
                  "h-9 justify-center rounded-full px-3",
                  filter === f ? "" : "",
                )}
              >
                <Text
                  className={cn(
                    "text-[12px] font-medium",
                    filter === f
                      ? ""
                      : "",
                  )}
                >
                  {f === "all"
                    ? t("hist.all")
                    : f === "active"
                      ? t("hist.active")
                      : t(`status.${f}` as never)}
                </Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("order.open")}
            onPress={() =>
              router.push({ pathname: "/order/[id]", params: { id: item.id } })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card>
              <View className="flex-row items-start justify-between gap-3">
                <Text variant="title" className="flex-1 text-[16px]">
                  {item.provider_name}
                </Text>
                <StatusBadge status={item.status} />
              </View>
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text variant="mono" className="text-[12px]">
                  {fmt.dateTime(item.created_at)}
                </Text>
                {item.items.length > 0 ? (
                  <Text variant="small">
                    {item.items.reduce((n, i) => n + i.quantity, 0)}×
                  </Text>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card className="items-center py-10">
            <Inbox size={26} color={c.inkMuted} />
            <Text variant="title" className="mt-3">
              {t("hist.empty")}
            </Text>
            <Text variant="small" className="mt-1 text-center">
              {t("hist.emptyBody")}
            </Text>
          </Card>
        }
      />
    </View>
  );
}
