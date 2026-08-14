import { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/teregna/status-badge";
import { PushPrompt } from "@/components/teregna/push-prompt";
import { SkeletonList } from "@/components/ui/skeleton";
import { useMyRequests } from "@/lib/queries";
import { cancelRequest } from "@/lib/rpc";
import { isRace } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/i18n/provider";
import { elapsed, makeFormat } from "@/lib/format";
import { ACTIVE_STATUSES, type MyRequest } from "@/lib/database.types";
import { cn } from "@/lib/cn";

export default function RequestsScreen() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const { data, isPending, isRefetching, refetch } = useMyRequests(user?.id);

  // A ticking clock, so "12 mins waiting" does not silently freeze at whatever
  // it said when the screen mounted.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (ready && !user) router.replace("/(auth)/sign-in");
  }, [ready, user, router]);

  const cancel = useMutation({
    mutationFn: (id: string) => cancelRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myRequests() }),
    onError: (e) => {
      // A race is the normal outcome of two people acting at once, not a bug.
      if (isRace(e)) qc.invalidateQueries({ queryKey: qk.myRequests() });
    },
  });

  const rows = data ?? [];
  const active = rows.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const past = rows.filter((r) => !ACTIVE_STATUSES.includes(r.status));

  return (
    <Screen title={t("req.title")} subtitle={t("req.subtitle")}>
      <FlatList
        ListHeaderComponent={
          active.length > 0 ? (
            <View className="pb-1">
              <PushPrompt audience="receiver" />
            </View>
          ) : null
        }
        data={[
          ...(active.length ? [{ header: t("req.waitingNow") }] : []),
          ...active,
          ...(past.length ? [{ header: t("req.earlier") }] : []),
          ...past,
        ]}
        keyExtractor={(item, i) =>
          "header" in item ? `h-${item.header}-${i}` : item.id
        }
        contentContainerClassName="gap-3 pb-6"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6D28D9" />
        }
        renderItem={({ item }) =>
          "header" in item ? (
            <Text className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
              {item.header}
            </Text>
          ) : (
            <RequestCard
              request={item}
              now={now}
              onCancel={() => cancel.mutate(item.id)}
              pending={cancel.isPending && cancel.variables === item.id}
            />
          )
        }
        ListEmptyComponent={
          isPending ? (
            <SkeletonList count={3} />
          ) : (
            <Card className="items-center py-10">
              <Inbox size={28} color="#5B517A" />
              <Text variant="title" className="mt-3">
                {t("req.emptyTitle")}
              </Text>
              <Text variant="small" className="mt-1 text-center">
                {t("req.emptyBody")}
              </Text>
              <Link href="/(tabs)/browse" asChild>
                <Button title={t("landing.ctaFind")} className="mt-5" />
              </Link>
            </Card>
          )
        }
      />
    </Screen>
  );
}

function RequestCard({
  request,
  now,
  onCancel,
  pending,
}: {
  request: MyRequest;
  now: number;
  onCancel: () => void;
  pending: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const isActive = ACTIVE_STATUSES.includes(request.status);
  const wait = elapsed(request.created_at, now);

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        {/* Position answers the only question a receiver has. */}
        {isActive && request.position ? (
          <View className="items-center">
            <Text className="font-mono-bold text-[30px] leading-[32px] text-primary dark:text-d-primary">
              {request.position}
            </Text>
            <Text className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
              {t("req.inLine")}
            </Text>
          </View>
        ) : null}

        <View className="flex-1">
          <Text variant="title">{request.provider_name}</Text>

          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            {isActive ? (
              <Text
                className={cn(
                  "font-mono text-[12px]",
                  wait.minutes >= 45
                    ? "text-destructive dark:text-d-destructive"
                    : wait.minutes >= 20
                      ? "text-warning dark:text-d-warning"
                      : "text-ink-muted dark:text-d-ink-muted",
                )}
              >
                {t("wait.waiting", {
                  value: wait.value,
                  unit: wait.isHours
                    ? t.plural("wait.hr", Math.floor(wait.minutes / 60))
                    : t.plural("wait.min", wait.minutes),
                })}
              </Text>
            ) : (
              <Text variant="mono" className="text-[12px]">
                {fmt.dateTime(request.created_at)}
              </Text>
            )}
          </View>

          {request.items.length > 0 ? (
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {request.items.map((it, i) => (
                <View
                  key={`${it.item_id ?? it.name}-${i}`}
                  className="rounded-full bg-muted px-2.5 py-0.5 dark:bg-d-muted"
                >
                  <Text className="text-[11px] text-ink dark:text-d-ink">
                    {it.quantity > 1 ? `${it.quantity}× ` : ""}
                    {it.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {request.note ? (
            <Text variant="small" className="mt-2">
              {request.note}
            </Text>
          ) : null}

          {isActive ? (
            <Button
              title={t("common.cancel")}
              variant="destructive"
              size="sm"
              loading={pending}
              onPress={onCancel}
              className="mt-3 self-start"
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}
