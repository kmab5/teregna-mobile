import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { ChartLine, Table2 } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/provider";

export interface Point {
  label: string;
  value: number;
}

/**
 * Charts drawn directly with react-native-svg.
 *
 * No chart library: victory-native pulls in Skia and gifted-charts is another
 * dependency to keep in step with the SDK, while these two shapes are a handful
 * of rects and a path. It also keeps the bundle honest - react-native-svg is
 * already here for the icons.
 *
 * The table toggle is not optional. Someone with a colour vision deficiency, a
 * screen reader, or simply a need for the exact number gets the same content one
 * tap away.
 */
export function ChartCard({
  title,
  description,
  data,
  kind = "bar",
  horizontal = false,
}: {
  title: string;
  description?: string;
  data: Point[];
  kind?: "bar" | "area";
  horizontal?: boolean;
}) {
  const t = useT();
  const [asTable, setAsTable] = useState(false);
  const empty = data.length === 0 || data.every((d) => d.value === 0);

  return (
    <Card>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="title" className="text-[16px]">
            {title}
          </Text>
          {description ? (
            <Text variant="small" className="mt-0.5">
              {description}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: asTable }}
          onPress={() => setAsTable((v) => !v)}
          className="h-9 flex-row items-center gap-1.5 rounded-sm border border-border px-2.5 dark:border-d-border"
        >
          {asTable ? (
            <ChartLine size={13} color="#5B517A" />
          ) : (
            <Table2 size={13} color="#5B517A" />
          )}
          <Text className="text-[12px] font-medium text-ink-muted dark:text-d-ink-muted">
            {asTable ? t("chart.chart") : t("chart.table")}
          </Text>
        </Pressable>
      </View>

      <View className="mt-4">
        {empty ? (
          <Text variant="small" className="py-8 text-center">
            {t("chart.empty")}
          </Text>
        ) : asTable ? (
          <DataTable
            data={data}
            firstCol={horizontal ? t("chart.item") : t("chart.when")}
            valueCol={t("an.requests")}
          />
        ) : horizontal ? (
          <HorizontalBars data={data} />
        ) : kind === "area" ? (
          <AreaChart data={data} />
        ) : (
          <VerticalBars data={data} />
        )}
      </View>
    </Card>
  );
}

function DataTable({
  data,
  firstCol,
  valueCol,
}: {
  data: Point[];
  firstCol: string;
  valueCol: string;
}) {
  return (
    <ScrollView className="max-h-64" nestedScrollEnabled>
      <View className="flex-row border-b border-border pb-2 dark:border-d-border">
        <Text className="flex-1 text-[13px] font-medium">{firstCol}</Text>
        <Text className="text-[13px] font-medium">{valueCol}</Text>
      </View>
      {data.map((d) => (
        <View
          key={d.label}
          className="flex-row border-b border-border/60 py-2 dark:border-d-border/60"
        >
          <Text className="flex-1 text-[13px]">{d.label}</Text>
          <Text variant="mono" className="text-[13px] text-ink dark:text-d-ink">
            {d.value}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const H = 150;

function VerticalBars({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  // Show at most ~24 columns; beyond that the bars are thinner than a finger
  // and the chart says nothing the table does not say better.
  const shown = data.length > 24 ? data.slice(-24) : data;
  const w = 100 / shown.length;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
        {shown.map((d, i) => {
          const h = Math.max((d.value / max) * (H - 8), d.value > 0 ? 2 : 0);
          return (
            <Rect
              key={d.label}
              x={i * w + w * 0.15}
              y={H - h}
              width={w * 0.7}
              height={h}
              fill="#6D28D9"
              rx={1}
            />
          );
        })}
      </Svg>
      <View className="mt-1.5 flex-row justify-between">
        <Text variant="mono" className="text-[10px]">
          {shown[0]?.label}
        </Text>
        <Text variant="mono" className="text-[10px]">
          {shown[shown.length - 1]?.label}
        </Text>
      </View>
    </View>
  );
}

function AreaChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const shown = data.length > 60 ? data.slice(-60) : data;
  const step = shown.length > 1 ? 100 / (shown.length - 1) : 100;

  const points = shown.map((d, i) => {
    const x = i * step;
    const y = H - 6 - (d.value / max) * (H - 14);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M${points.join(" L")}`;
  const fill = `${line} L100,${H} L0,${H} Z`;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
        <Path d={fill} fill="#6D28D9" fillOpacity={0.14} />
        <Path d={line} stroke="#6D28D9" strokeWidth={1.5} fill="none" />
      </Svg>
      <View className="mt-1.5 flex-row justify-between">
        <Text variant="mono" className="text-[10px]">
          {shown[0]?.label}
        </Text>
        <Text variant="mono" className="text-[10px]">
          {shown[shown.length - 1]?.label}
        </Text>
      </View>
    </View>
  );
}

/** Horizontal bars keep long item names readable, which vertical ones cannot. */
function HorizontalBars({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View className="gap-2.5">
      {data.slice(0, 8).map((d) => (
        <View key={d.label} className="gap-1">
          <View className="flex-row justify-between">
            <Text className="flex-1 text-[13px]" numberOfLines={1}>
              {d.label}
            </Text>
            <Text variant="mono" className="text-[13px] text-ink dark:text-d-ink">
              {d.value}
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-muted dark:bg-d-muted">
            <View
              className="h-2 rounded-full bg-primary dark:bg-d-primary"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View className="min-w-[46%] flex-1 rounded-md border border-border bg-surface p-3.5 dark:border-d-border dark:bg-d-surface">
      <Text className="text-[11px] uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
        {label}
      </Text>
      <Text className="mt-1 font-mono-bold text-[26px] text-ink dark:text-d-ink">
        {value}
      </Text>
      {hint ? (
        <Text variant="small" className="mt-0.5 text-[11px]">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
