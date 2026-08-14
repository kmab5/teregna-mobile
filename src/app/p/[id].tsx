import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { ChevronLeft, MapPin, PackageX, Send, Users } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useProviderItems } from "@/lib/queries";
import { createRequest } from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/i18n/provider";
import { makeFormat } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ItemView, ProviderPublic } from "@/lib/database.types";

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const fmt = makeFormat(locale);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: provider } = useQuery({
    queryKey: qk.provider(id),
    queryFn: async (): Promise<ProviderPublic | null> => {
      const { data, error } = await supabase
        .from("provider_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as ProviderPublic | null;
    },
  });

  const { data: items } = useProviderItems(id);

  const [selected, setSelected] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");

  /**
   * One key per compose attempt, reused on retry. Mobile needs this more than
   * web: a submit that fires as the phone loses signal gets retried, and without
   * the key that is a duplicate in someone's queue.
   */
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

  const lines = useMemo(
    () => Object.entries(selected).map(([item_id, quantity]) => ({ item_id, quantity })),
    [selected],
  );

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const item = items?.find((i) => i.id === l.item_id);
        return sum + (item?.price ?? 0) * l.quantity;
      }, 0),
    [lines, items],
  );

  /**
   * Selected items the provider expects to run out of before this person's turn.
   * A heads-up, never a barrier - stock is the provider's own estimate, people
   * cancel, and providers restock.
   */
  const depleted = useMemo(
    () =>
      lines
        .map((l) => items?.find((i) => i.id === l.item_id))
        .filter((i): i is ItemView => Boolean(i?.is_depleted)),
    [lines, items],
  );

  const send = useMutation({
    mutationFn: () =>
      createRequest({
        providerId: id,
        items: lines,
        note: note.trim() || null,
        idempotencyKey,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myRequests() });
      qc.invalidateQueries({ queryKey: ["discovery"] });
      qc.invalidateQueries({ queryKey: qk.providerItems(id) });
      setSelected({});
      setNote("");
      setIdempotencyKey(Crypto.randomUUID());
      router.replace("/(tabs)/requests");
    },
    onError: (e) => Alert.alert(t(errorKey(e) as never)),
  });

  function toggle(itemId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = 1;
      return next;
    });
  }

  function onSubmit() {
    if (!user) {
      // Sign-in is deferred to the moment it buys something. The selections are
      // held in component state, and the sheet is re-entered from My requests.
      router.push({
        pathname: "/(auth)/sign-in",
        params: { next: `/p/${id}` },
      });
      return;
    }
    send.mutate();
  }

  if (!provider) {
    return (
      <SafeAreaView className="flex-1 bg-bg dark:bg-d-bg">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-6" />
      </SafeAreaView>
    );
  }

  const busy = provider.queue_length > 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-2 px-2 pb-1 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-muted dark:active:bg-d-muted"
        >
          <ChevronLeft size={22} color="#6D28D9" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-5">
        <View className="flex-row items-start justify-between gap-3">
          <Text variant="display" className="flex-1">
            {provider.name}
          </Text>
          <View
            className={cn(
              "flex-row items-center gap-1 rounded-full px-2.5 py-1.5",
              busy ? "bg-primary/10 dark:bg-d-primary/20" : "bg-accent/10 dark:bg-d-accent/20",
            )}
          >
            <Users size={13} color={busy ? "#6D28D9" : "#15803D"} />
            <Text className="font-mono text-[12px]" style={{ color: busy ? "#6D28D9" : "#15803D" }}>
              {provider.queue_length === 0
                ? t("queue.none")
                : t.plural("queue.waiting", provider.queue_length)}
            </Text>
          </View>
        </View>

        <View className="mt-2 flex-row items-center gap-3">
          {provider.category ? (
            <View className="rounded-full bg-muted px-2 py-0.5 dark:bg-d-muted">
              <Text className="text-[11px] capitalize text-ink-muted dark:text-d-ink-muted">
                {provider.category}
              </Text>
            </View>
          ) : null}
          {provider.location ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#5B517A" />
              <Text variant="small">{provider.location}</Text>
            </View>
          ) : null}
        </View>

        {provider.description ? (
          <Text variant="small" className="mt-3">
            {provider.description}
          </Text>
        ) : null}

        {items && items.length > 0 ? (
          <>
            <Text variant="title" className="mb-2 mt-6">
              {t("prov.offers")}
            </Text>
            <View className="gap-2">
              {items.map((item) => {
                const isSel = Boolean(selected[item.id]);
                const qty = selected[item.id] ?? 1;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSel }}
                    accessibilityLabel={t("send.addAria", { name: item.name })}
                    onPress={() => toggle(item.id)}
                    className={cn(
                      "flex-row items-center gap-3 rounded-sm border p-3",
                      isSel
                        ? "border-primary bg-primary/5 dark:border-d-primary dark:bg-d-primary/10"
                        : "border-border bg-surface dark:border-d-border dark:bg-d-surface",
                    )}
                  >
                    <View
                      className={cn(
                        "h-5 w-5 items-center justify-center rounded-sm border-2",
                        isSel
                          ? "border-primary bg-primary dark:border-d-primary dark:bg-d-primary"
                          : "border-border dark:border-d-border",
                      )}
                    >
                      {isSel ? (
                        <Text className="text-[12px] text-on-primary dark:text-d-on-primary">
                          ✓
                        </Text>
                      ) : null}
                    </View>

                    <View className="flex-1">
                      <Text className="font-medium">{item.name}</Text>
                      {item.description ? (
                        <Text variant="small" numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                      {item.stock !== null ? (
                        item.is_depleted ? (
                          <View className="mt-1 flex-row items-center gap-1">
                            <PackageX size={12} color="#B45309" />
                            <Text className="text-[11px] font-medium text-warning dark:text-d-warning">
                              {t("stock.depleted")}
                            </Text>
                          </View>
                        ) : (
                          <Text className="mt-1 font-mono text-[11px] text-ink-muted dark:text-d-ink-muted">
                            {t.plural("stock.left", item.available ?? 0)}
                          </Text>
                        )
                      ) : null}
                    </View>

                    {isSel ? (
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          accessibilityLabel={t("send.fewerAria", { name: item.name })}
                          onPress={() =>
                            setSelected((p) => ({ ...p, [item.id]: Math.max(1, qty - 1) }))
                          }
                          className="h-9 w-9 items-center justify-center rounded-sm border border-border dark:border-d-border"
                        >
                          <Text>−</Text>
                        </Pressable>
                        <Text className="w-6 text-center font-mono">{qty}</Text>
                        <Pressable
                          accessibilityLabel={t("send.moreAria", { name: item.name })}
                          onPress={() =>
                            setSelected((p) => ({ ...p, [item.id]: Math.min(99, qty + 1) }))
                          }
                          className="h-9 w-9 items-center justify-center rounded-sm border border-border dark:border-d-border"
                        >
                          <Text>+</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    <Text variant="mono" className="text-[13px]">
                      {fmt.money(item.price, item.currency)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text variant="small" className="mt-6">
            {t("prov.noItems")}
          </Text>
        )}

        <View className="mt-6 gap-1.5">
          <Text className="font-medium text-[14px]">{t("send.note")}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={500}
            multiline
            placeholder={t("send.notePlaceholder")}
            placeholderTextColor="#5B517A"
            className="min-h-20 rounded-sm border border-border bg-surface p-3 font-sans text-[16px] text-ink dark:border-d-border dark:bg-d-surface dark:text-d-ink"
          />
        </View>

        {depleted.length > 0 ? (
          <View className="mt-4 flex-row gap-2.5 rounded-sm bg-warning/10 p-3 dark:bg-d-warning/15">
            <PackageX size={16} color="#B45309" />
            <View className="flex-1">
              <Text className="text-[14px] font-medium text-warning dark:text-d-warning">
                {t("stock.warnTitle")}
              </Text>
              <Text variant="small" className="mt-0.5">
                {t("stock.warnBody", {
                  provider: provider.name,
                  items: depleted.map((i) => i.name).join(", "),
                })}
              </Text>
            </View>
          </View>
        ) : null}

        {total > 0 ? (
          <View className="mt-4 flex-row items-center justify-between rounded-sm bg-muted px-3 py-2.5 dark:bg-d-muted">
            <Text variant="small">{t("send.estimated")}</Text>
            <Text className="font-mono-bold text-[15px]">{fmt.money(total)}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Anchored so the primary action is always under the thumb. */}
      <View className="border-t border-border bg-bg px-5 pb-4 pt-3 dark:border-d-border dark:bg-d-bg">
        <Button
          size="lg"
          title={
            send.isPending
              ? t("send.sending")
              : user
                ? t("send.join")
                : t("send.joinSignedOut")
          }
          loading={send.isPending}
          icon={<Send size={17} color="#FFFFFF" />}
          onPress={onSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
