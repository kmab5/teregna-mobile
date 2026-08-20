import { useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BusinessScreen } from "@/components/teregna/business-screen";
import { StatusBadge } from "@/components/teregna/status-badge";
import { useProviderArchive } from "@/lib/queries";
import { restoreRequest } from "@/lib/rpc";
import { errorKey, isRace } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useT, useLocale } from "@/i18n/provider";
import { makeFormat } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Provider, RequestStatus } from "@/lib/database.types";
import { useThemeColors } from "@/theme/colors";

type Filter = "all" | RequestStatus;

export default function ArchiveScreen() {
  return <BusinessScreen>{(p) => <ArchiveList provider={p} />}</BusinessScreen>;
}

function ArchiveList({ provider }: { provider: Provider }) {
  const c = useThemeColors();
  const t = useT();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isRefetching, refetch } = useProviderArchive(provider.id);

  const restore = useMutation({
    // Back of the queue is the honest default: the work was not done, and the
    // people who arrived meanwhile did nothing wrong.
    mutationFn: (id: string) => restoreRequest(id, "back"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.archive(provider.id) });
      qc.invalidateQueries({ queryKey: qk.queue(provider.id) });
      qc.invalidateQueries({ queryKey: qk.providerItems(provider.id) });
      toast(t("arc.restoredTitle"), { body: t("arc.restoredBody") });
    },
    onError: (e) => {
      if (isRace(e)) qc.invalidateQueries({ queryKey: qk.archive(provider.id) });
      toast(t(errorKey(e) as never), { tone: "error" });
    },
  });

  const rows = (data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      className="flex-1"
      contentContainerClassName="px-5 pb-7 gap-3 pt-4"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />
      }
      ListHeaderComponent={
        <View className="gap-3">
          <Text variant="small">{t("arc.subtitle")}</Text>
          <View className="flex-row gap-2">
            {(["all", "completed", "cancelled"] as Filter[]).map((f) => (
              <Pressable
                key={f}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === f }}
                onPress={() => setFilter(f)}
                className={cn(
                  "h-9 justify-center rounded-full px-3.5",
                  filter === f
                    ? ""
                    : "",
                )}
              >
                <Text
                  className={cn(
                    "text-[13px] font-medium",
                    filter === f
                      ? ""
                      : "",
                  )}
                >
                  {f === "all" ? t("common.all") : t(`status.${f}` as never)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <View className="flex-row items-start justify-between gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("order.open")}
              onPress={() =>
                router.push({ pathname: "/order/[id]", params: { id: item.id } })
              }
              style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="font-medium">{item.receiver_name}</Text>
              <View className="mt-1 flex-row flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                <Text variant="mono" className="text-[12px]">
                  {fmt.dateTime(item.archived_at)}
                </Text>
              </View>
              {item.items.length > 0 ? (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {item.items.map((it, i) => (
                    <View
                      key={`${it.item_id ?? it.name}-${i}`}
                      className="rounded-full px-2.5 py-0.5"
                    >
                      <Text className="text-[11px]">
                        {it.quantity > 1 ? `${it.quantity}× ` : ""}
                        {it.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {item.note ? (
                <Text variant="small" className="mt-2">
                  {item.note}
                </Text>
              ) : null}
            </Pressable>
          </View>

          {/* Nothing here is ever truly gone; restore is always available. */}
          <Button
            title={t("arc.restore")}
            variant="outline"
            size="sm"
            className="mt-3 self-start"
            loading={restore.isPending && restore.variables === item.id}
            onPress={() => restore.mutate(item.id)}
            icon={<RotateCcw size={15} color={c.primary} />}
          />
        </Card>
      )}
      ListEmptyComponent={
        <Card className="items-center py-10">
          <Archive size={28} color={c.inkMuted} />
          <Text variant="title" className="mt-3">
            {t("arc.emptyTitle")}
          </Text>
          <Text variant="small" className="mt-1 text-center">
            {t("arc.emptyBody")}
          </Text>
        </Card>
      }
    />
  );
}
