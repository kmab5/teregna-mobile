import { Linking, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Clock, Phone, TriangleAlert } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/teregna/status-badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/i18n/provider";
import { makeFormat, elapsed } from "@/lib/format";
import { useThemeColors } from "@/theme/colors";
import type { OrderDetail } from "@/lib/database.types";

/**
 * One order, in full.
 *
 * Exists because "Sara, 2 items" is not enough to actually do the job. A
 * provider needs the line items, the price and a way to reach the person; a
 * customer needs to know who is serving them and when they can call.
 *
 * Which phone number appears is decided in the database, not here - this screen
 * renders whatever it is permitted to see, and says so plainly when that is
 * nothing.
 */
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const c = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async (): Promise<OrderDetail | null> => {
      const { data, error } = await supabase
        .from("order_detail")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as OrderDetail | null;
    },
    refetchInterval: 20_000,
  });

  const isProvider = Boolean(order && user && order.receiver_id !== user.id);
  const phone = isProvider ? order?.receiver_phone : order?.provider_phone;
  const counterparty = isProvider ? order?.receiver_name : order?.provider_name;

  // Only meaningful while the person is still waiting.
  const waiting = order && order.status === "queued";
  const waited = order ? elapsed(order.created_at).minutes : 0;
  const overdue =
    waiting && order.expected_minutes > 0 && waited > order.expected_minutes;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="h-12 flex-row items-center border-b border-border px-2 dark:border-d-border">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} color={c.primary} />
        </Pressable>
        <Text className="font-display text-[16px] font-semibold">
          {t("order.title")}
        </Text>
      </View>

      {!order ? null : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="py-4 gap-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="display" className="flex-1">
              {counterparty}
            </Text>
            <StatusBadge status={order.status} />
          </View>

          {overdue ? (
            <View
              className="flex-row items-center gap-2 rounded-md p-3"
              style={{ backgroundColor: c.softBg }}
            >
              <TriangleAlert size={16} color={c.warning} />
              <Text className="flex-1 text-[13px] font-medium text-warning dark:text-d-warning">
                {t("order.overdue")}
              </Text>
            </View>
          ) : null}

          <Card className="gap-3">
            <Text className="text-[11px] font-medium uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
              {isProvider ? t("order.customer") : t("order.provider")}
            </Text>
            <Text variant="title" className="text-[16px]">
              {counterparty}
            </Text>

            {phone ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("order.call")} ${counterparty}`}
                onPress={() => Linking.openURL(`tel:${phone}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="flex-row items-center gap-2 self-start rounded-md border border-border px-3 py-2.5 dark:border-d-border"
              >
                <Phone size={15} color={c.primary} />
                <Text className="font-mono text-[14px] text-primary dark:text-d-primary">
                  {phone}
                </Text>
              </Pressable>
            ) : (
              <Text variant="small">
                {isProvider ? t("order.noPhone") : t("order.phoneAfterStart")}
              </Text>
            )}
          </Card>

          {order.items.length > 0 ? (
            <Card className="gap-2.5">
              <Text className="text-[11px] font-medium uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
                {t("order.items")}
              </Text>
              {order.items.map((it, i) => (
                <View
                  key={`${it.item_id ?? it.name}-${i}`}
                  className="flex-row items-center justify-between gap-3"
                >
                  <Text className="flex-1">
                    {it.quantity > 1 ? `${it.quantity}× ` : ""}
                    {it.name}
                  </Text>
                  <Text variant="mono" className="text-[13px] text-ink dark:text-d-ink">
                    {fmt.money(it.price)}
                  </Text>
                </View>
              ))}
              <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2.5 dark:border-d-border">
                <Text className="font-medium">{t("order.total")}</Text>
                <Text className="font-mono-bold text-[16px]">
                  {fmt.money(order.total_price)}
                </Text>
              </View>
            </Card>
          ) : null}

          {order.note ? (
            <Card>
              <Text variant="small">{order.note}</Text>
            </Card>
          ) : null}

          <Card className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="small">{t("order.placed")}</Text>
              <Text variant="mono" className="text-[13px]">
                {fmt.dateTime(order.created_at)}
              </Text>
            </View>
            {order.expected_minutes > 0 ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Clock size={13} color={c.inkMuted} />
                  <Text variant="small">{t("order.expected")}</Text>
                </View>
                <Text variant="mono" className="text-[13px]">
                  {t("order.minutes", { count: order.expected_minutes })}
                </Text>
              </View>
            ) : null}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
