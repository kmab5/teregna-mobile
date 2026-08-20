import { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Store, TriangleAlert } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { LanguageToggle } from "@/components/teregna/language-toggle";
import { ThemeToggle } from "@/components/teregna/theme-toggle";
import { PushStatus } from "@/components/teregna/push-status";
import { supabase } from "@/lib/supabase";
import { unregisterPush } from "@/lib/push";
import { useAuth } from "@/lib/auth";
import { useMyProvider, useProfile } from "@/lib/queries";
import {
  deleteMyAccount,
  setProviderActive,
  upsertProfile,
  upsertProvider,
} from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

const CONFIRM = "DELETE";

/**
 * One settings screen for both sides of the product.
 *
 * There used to be two - an Account tab for customers and a Settings tab for
 * providers - which meant the same person edited their name in one place and
 * their phone number in another depending on which mode they happened to be in.
 * Everything about the account now lives here; the business section simply
 * appears for people who have one.
 */
export default function SettingsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: provider } = useMyProvider();

  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [bizName, setBizName] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const saveProfile = useMutation({
    mutationFn: () =>
      upsertProfile({
        display_name: (name ?? profile?.display_name ?? "").trim(),
        phone: (phone ?? profile?.phone ?? "").trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      toast(t("set.saved"));
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const saveBusiness = useMutation({
    mutationFn: () =>
      upsertProvider({
        id: provider!.id,
        name: (bizName ?? provider?.name ?? "").trim(),
        location: (location ?? provider?.location ?? "").trim() || null,
        category: (category ?? provider?.category ?? "").trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast(t("set.saved"));
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const active = useMutation({
    mutationFn: (v: boolean) => setProviderActive(provider!.id, v),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast(v ? t("set.openedTitle") : t("set.closedTitle"), {
        body: v ? t("set.openedBody") : t("set.closedBody"),
      });
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await unregisterPush();
      const result = await deleteMyAccount();
      await supabase.auth.signOut();
      return result;
    },
    onSuccess: (result) => {
      qc.clear();
      toast(t("acct.deletedTitle"), {
        body:
          result.cancelled_requests > 0
            ? t.plural("acct.deletedBody", result.cancelled_requests)
            : undefined,
      });
      router.replace("/(customer)/browse");
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1" style={{ backgroundColor: c.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="h-12 flex-row items-center border-b px-2"
        style={{ borderColor: c.border }}
      >
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
          {t("set.central")}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="py-4 gap-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <Card className="gap-4">
            <Text variant="label">{t("set.profile")}</Text>
            <Field
              label={t("set.yourName")}
              value={name ?? profile?.display_name ?? ""}
              onChangeText={setName}
              hint={t("acct.nameHint")}
            />
            <Field
              label={t("set.phone")}
              value={phone ?? profile?.phone ?? ""}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              hint={t("set.phoneHint")}
              mono
            />
            <Text variant="mono" className="text-[12px]">
              {user.email}
            </Text>
            <Button
              title={saveProfile.isPending ? t("common.saving") : t("common.save")}
              loading={saveProfile.isPending}
              onPress={() => saveProfile.mutate()}
              className="self-start"
            />
          </Card>
        ) : null}

        {/* Business, only for people who have one. */}
        {user && provider ? (
          <Card className="gap-4">
            <Text variant="label">{t("set.business")}</Text>

            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-[15px] font-medium">{t("set.openTitle")}</Text>
                <Text variant="small" className="mt-0.5">
                  {t("set.openBody")}
                </Text>
              </View>
              <Switch
                value={provider.is_active}
                onValueChange={(v) => active.mutate(v)}
                accessibilityLabel={t("set.openTitle")}
                trackColor={{ true: c.accent, false: c.border }}
                thumbColor={c.surface}
              />
            </View>

            <View className="h-px" style={{ backgroundColor: c.border }} />

            <Field
              label={t("set.bizName")}
              value={bizName ?? provider.name}
              onChangeText={setBizName}
            />
            <Field
              label={t("set.location")}
              value={location ?? provider.location ?? ""}
              onChangeText={setLocation}
              placeholder={t("set.locationPlaceholder")}
            />
            <Field
              label={t("set.category")}
              value={category ?? provider.category ?? ""}
              onChangeText={setCategory}
            />
            <Button
              title={saveBusiness.isPending ? t("common.saving") : t("set.saveDetails")}
              loading={saveBusiness.isPending}
              onPress={() => saveBusiness.mutate()}
              className="self-start"
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(business)/items" as never)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              className="flex-row items-center gap-3 rounded-md border p-3"
            >
              <Store size={17} color={c.primary} />
              <View className="flex-1">
                <Text className="font-medium">{t("set.manageItems")}</Text>
                <Text variant="small">{t("set.manageItemsHint")}</Text>
              </View>
              <ChevronRight size={17} color={c.inkMuted} />
            </Pressable>
          </Card>
        ) : null}

        {user ? <PushStatus /> : null}

        <Card className="gap-4">
          <Text variant="label">{t("set.appearance")}</Text>
          <ThemeToggle />
          <View className="h-px" style={{ backgroundColor: c.border }} />
          <Text variant="label">{t("common.language")}</Text>
          <LanguageToggle className="self-start" />
        </Card>

        {user ? (
          <Card className="gap-3">
            <Text variant="label">{t("set.dangerZone")}</Text>
            <Text variant="small">
              {provider ? t("set.deleteWarnProvider") : t("acct.deleteWarn")}
            </Text>
            <Button
              title={t("acct.delete")}
              variant="destructive"
              className="self-start"
              onPress={() => {
                setTyped("");
                setConfirmOpen(true);
              }}
            />
          </Card>
        ) : null}
      </ScrollView>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("acct.deleteTitle")}
      >
        <View
          className="flex-row items-start gap-2.5 rounded-sm p-3"
          style={{ backgroundColor: c.pillDangerBg }}
        >
          <TriangleAlert size={17} color={c.pillDangerText} />
          <Text
            tone="inherit"
            style={{ color: c.pillDangerText }}
            className="flex-1 text-[14px]"
          >
            {t("acct.irreversible")}
          </Text>
        </View>

        <View className="gap-1.5">
          <Text variant="small">{t("acct.whatHappens")}</Text>
          <Text variant="small">• {t("acct.scrub")}</Text>
          <Text variant="small">• {t("acct.cancels")}</Text>
          {provider ? (
            <>
              <Text variant="small">• {t("acct.shopCloses")}</Text>
              <Text variant="small">• {t("acct.queueTold")}</Text>
              <Text variant="small">• {t("acct.histProvider")}</Text>
            </>
          ) : (
            <Text variant="small">• {t("acct.histReceiver")}</Text>
          )}
        </View>

        <Field
          label={t("acct.confirmLabel", { word: CONFIRM })}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          mono
        />

        <View className="flex-row gap-2 pb-2">
          <Button
            title={t("acct.keep")}
            variant="outline"
            className="flex-1"
            onPress={() => setConfirmOpen(false)}
          />
          <Button
            title={remove.isPending ? t("acct.deleting") : t("acct.forever")}
            variant="destructive"
            className="flex-1"
            loading={remove.isPending}
            disabled={typed.trim() !== CONFIRM}
            onPress={() => remove.mutate()}
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
