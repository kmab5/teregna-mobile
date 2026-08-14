import { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, CircleAlert, Play } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BusinessScreen } from "@/components/teregna/business-screen";
import { PositionBadge } from "@/components/teregna/position-badge";
import { StatusBadge } from "@/components/teregna/status-badge";
import { useProfile, useProviderItems, useProviderQueue } from "@/lib/queries";
import { finishRequest, startRequest } from "@/lib/rpc";
import { errorKey, isRace } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useT } from "@/i18n/provider";
import { elapsed } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ItemView, Profile, Provider, QueueRow } from "@/lib/database.types";

export default function QueueScreen() {
  return <BusinessScreen>{(provider) => <Queue provider={provider} />}</BusinessScreen>;
}

function Queue({ provider }: { provider: Provider }) {
  const t = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const key = qk.queue(provider.id);

  const { data: queue, isRefetching, refetch } = useProviderQueue(provider.id);
  const { data: items } = useProviderItems(provider.id);
  const { data: profile } = useProfile();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  /**
   * Optimistic, because the provider is standing in front of a customer and a
   * spinner is not an acceptable answer. Reconciled against the RPC result: if
   * the receiver cancelled half a second earlier, the row comes back with the
   * reason rather than silently vanishing.
   */
  const finish = useMutation({
    mutationFn: (id: string) => finishRequest(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<QueueRow[]>(key);
      qc.setQueryData<QueueRow[]>(key, (old) => (old ?? []).filter((r) => r.id !== id));
      return { previous };
    },
    onError: (e, _id, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      if (isRace(e)) qc.invalidateQueries({ queryKey: key });
      toast(t(errorKey(e) as never), { tone: "error" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.archive(provider.id) });
      qc.invalidateQueries({ queryKey: qk.providerItems(provider.id) });
      toast(t("pq.finishedTitle"), { body: t("pq.finishedBody") });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const start = useMutation({
    mutationFn: (id: string) => startRequest(id),
    onError: (e) => {
      if (isRace(e)) qc.invalidateQueries({ queryKey: key });
      toast(t(errorKey(e) as never), { tone: "error" });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const rows = queue ?? [];
  const steps = setupSteps(provider, items ?? [], profile ?? null, t);
  const remaining = steps.filter((s) => !s.done);

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      className="flex-1"
      contentContainerClassName="px-5 pb-7 gap-3 pt-4"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6D28D9" />
      }
      ListHeaderComponent={
        <View className="gap-4">
          {remaining.length > 0 ? <SetupChecklist steps={steps} /> : null}
          <View className="flex-row items-baseline gap-2">
            <Text className="font-mono-bold text-[30px] text-ink dark:text-d-ink">
              {rows.length}
            </Text>
            <Text variant="small">{t("pq.waiting")}</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <QueueCard
          row={item}
          now={now}
          pending={
            (finish.isPending && finish.variables === item.id) ||
            (start.isPending && start.variables === item.id)
          }
          onStart={() => start.mutate(item.id)}
          onFinish={() => finish.mutate(item.id)}
        />
      )}
      ListEmptyComponent={
        <Card className="items-center py-10">
          <CheckCheck size={28} color="#5B517A" />
          <Text variant="title" className="mt-3">
            {t("pq.emptyTitle")}
          </Text>
          <Text variant="small" className="mt-1 text-center">
            {provider.is_active ? t("pq.emptyOpen") : t("pq.emptyClosed")}
          </Text>
        </Card>
      }
    />
  );
}

function QueueCard({
  row,
  now,
  pending,
  onStart,
  onFinish,
}: {
  row: QueueRow;
  now: number;
  pending: boolean;
  onStart: () => void;
  onFinish: () => void;
}) {
  const t = useT();
  const wait = elapsed(row.created_at, now);
  const active = row.status === "in_progress";

  return (
    <Card className={cn(pending && "opacity-50", active && "border-primary dark:border-d-primary")}>
      <View className="flex-row items-start gap-3">
        <PositionBadge position={row.position} active={active} />

        <View className="flex-1">
          <Text className="font-medium">{row.receiver_name}</Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <StatusBadge status={row.status} />
          </View>

          {row.items.length > 0 ? (
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {row.items.map((it, i) => (
                <View
                  key={`${it.item_id ?? it.name}-${i}`}
                  className="rounded-full bg-muted px-2.5 py-0.5 dark:bg-d-muted"
                >
                  <Text className="text-[11px]">
                    {it.quantity > 1 ? `${it.quantity}× ` : ""}
                    {it.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {row.note ? (
            <Text variant="small" className="mt-2">
              {row.note}
            </Text>
          ) : null}
        </View>

        {/* Wait time escalates past 20 and 45 minutes, but the number itself
            always carries the information - colour is never the only signal. */}
        <View className="items-end">
          <Text
            className={cn(
              "font-mono-bold text-[20px]",
              wait.minutes >= 45
                ? "text-destructive dark:text-d-destructive"
                : wait.minutes >= 20
                  ? "text-warning dark:text-d-warning"
                  : "text-ink-muted dark:text-d-ink-muted",
            )}
          >
            {wait.value}
          </Text>
          <Text className="text-[10px] uppercase text-ink-muted dark:text-d-ink-muted">
            {wait.isHours
              ? t.plural("wait.hr", Math.floor(wait.minutes / 60))
              : t.plural("wait.min", wait.minutes)}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        {row.status === "queued" ? (
          <Button
            title={t("pq.start")}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={pending}
            onPress={onStart}
            icon={<Play size={15} color="#6D28D9" />}
          />
        ) : null}
        <Button
          title={t("pq.finish")}
          variant="accent"
          size="sm"
          className="flex-1"
          disabled={pending}
          onPress={onFinish}
          icon={<Check size={16} color="#FFFFFF" />}
        />
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------- checklist -- */

interface Step {
  id: string;
  label: string;
  cta: string;
  href: string;
  done: boolean;
}

function setupSteps(
  provider: Provider,
  items: ItemView[],
  profile: Profile | null,
  t: ReturnType<typeof useT>,
): Step[] {
  return [
    {
      id: "details",
      label: t("chk.details"),
      cta: t("chk.detailsCta"),
      href: "/business/settings",
      done: Boolean(provider.location && provider.category),
    },
    {
      id: "phone",
      label: t("chk.phone"),
      cta: t("chk.phoneCta"),
      href: "/business/settings",
      done: Boolean(profile?.phone),
    },
    {
      id: "items",
      label: t("chk.items"),
      cta: t("chk.itemsCta"),
      href: "/business/items",
      done: items.length > 0,
    },
    {
      id: "visible",
      label: t("chk.visible"),
      cta: t("chk.visibleCta"),
      href: "/business/items",
      done: items.some((i) => i.is_visible),
    },
    {
      id: "open",
      label: t("chk.open"),
      cta: t("chk.openCta"),
      href: "/business/settings",
      done: provider.is_active,
    },
  ];
}

/**
 * Being live but unfindable is the worst state in the product: the provider
 * thinks they are open and nothing happens. So it is stated, not left to be
 * inferred from an empty queue.
 */
function SetupChecklist({ steps }: { steps: Step[] }) {
  const t = useT();
  const router = useRouter();
  const remaining = steps.filter((s) => !s.done);
  const next = remaining[0];

  return (
    <View className="rounded-md border border-warning/40 bg-warning/10 p-4 dark:border-d-warning/40 dark:bg-d-warning/10">
      <View className="flex-row items-start gap-2.5">
        <CircleAlert size={18} color="#B45309" />
        <View className="flex-1">
          <Text variant="title" className="text-[16px]">
            {remaining.length === steps.length
              ? t("chk.headingAll")
              : t.plural("chk.heading", remaining.length)}
          </Text>
          <Text variant="small" className="mt-1">
            {t("chk.body")}
          </Text>

          <View className="mt-3 gap-1.5">
            {steps.map((s) => (
              <View key={s.id} className="flex-row items-center gap-2">
                <View
                  className={cn(
                    "h-4 w-4 items-center justify-center rounded-full border",
                    s.done
                      ? "border-accent bg-accent"
                      : "border-border bg-surface dark:border-d-border dark:bg-d-surface",
                  )}
                >
                  {s.done ? <Check size={10} color="#FFFFFF" /> : null}
                </View>
                <Text
                  className={cn(
                    "text-[13px]",
                    s.done && "text-ink-muted line-through dark:text-d-ink-muted",
                  )}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {next ? (
            <Button
              title={next.cta}
              size="sm"
              className="mt-4 self-start"
              onPress={() => router.navigate(next.href as never)}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
