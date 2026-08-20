import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { ChartCard, StatCard } from "@/components/teregna/chart";
import { BusinessScreen } from "@/components/teregna/business-screen";
import { useAnalytics } from "@/lib/queries";
import { useT, useLocale } from "@/i18n/provider";
import { formatDuration, makeFormat } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Provider } from "@/lib/database.types";

const RANGES = [7, 30, 90];

export default function AnalyticsScreen() {
  return <BusinessScreen>{(p) => <Analytics provider={p} />}</BusinessScreen>;
}

function Analytics({ provider }: { provider: Provider }) {
  const t = useT();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const [days, setDays] = useState(30);
  const { data } = useAnalytics(provider.id, days);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-7 pt-4 gap-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row gap-2">
        {RANGES.map((r) => (
          <Pressable
            key={r}
            accessibilityRole="button"
            accessibilityState={{ selected: days === r }}
            onPress={() => setDays(r)}
            className={cn(
              "h-9 justify-center rounded-full px-3.5",
              days === r ? "" : "",
            )}
          >
            <Text
              className={cn(
                "text-[13px] font-medium",
                days === r
                  ? ""
                  : "",
              )}
            >
              {t("an.days", { count: r })}
            </Text>
          </Pressable>
        ))}
      </View>

      {!data ? null : (
        <>
          <View className="flex-row flex-wrap gap-2.5">
            <StatCard
              label={t("an.requests")}
              value={String(data.totals.total)}
              hint={t("an.requestsHint")}
            />
            <StatCard label={t("an.completed")} value={String(data.totals.completed)} />
            <StatCard label={t("an.cancelled")} value={String(data.totals.cancelled)} />
            <StatCard
              label={t("an.rate")}
              value={fmt.percent(data.completion_rate)}
              hint={t("an.rateHint")}
            />
            <StatCard
              label={t("an.typical")}
              value={formatDuration(data.median_time_to_complete_seconds)}
              hint={t("an.typicalHint", {
                value: formatDuration(data.avg_time_to_complete_seconds),
              })}
            />
            <StatCard
              label={t("an.now")}
              value={String(data.current_queue_length)}
              hint={t("an.nowHint")}
            />
          </View>

          <ChartCard
            title={t("an.overTime")}
            description={t("an.overTimeHint")}
            kind="area"
            data={data.over_time.map((p) => ({
              label: fmt.day(p.day),
              value: p.count,
            }))}
          />

          <ChartCard
            title={t("an.byItem")}
            description={t("an.byItemHint")}
            horizontal
            data={data.by_item.map((p) => ({ label: p.item, value: p.count }))}
          />

          <ChartCard
            title={t("an.hours")}
            description={t("an.hoursHint")}
            data={data.busiest_hours.map((p) => ({
              label: `${String(p.hour).padStart(2, "0")}:00`,
              value: p.count,
            }))}
          />
        </>
      )}
    </ScrollView>
  );
}
