import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  CircleHelp,
  Languages,
  LogOut,
  Palette,
  Receipt,
  Store,
  UserRound,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { LanguageToggle } from "@/components/teregna/language-toggle";
import { ThemeToggle } from "@/components/teregna/theme-toggle";
import { GuideSheet } from "@/components/teregna/guide-sheet";
import { supabase } from "@/lib/supabase";
import { unregisterPush } from "@/lib/push";
import { useAuth } from "@/lib/auth";
import { useMyProvider, useProfile } from "@/lib/queries";
import { upsertProfile } from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

/**
 * Account.
 *
 * Reorganised around what people come here to do rather than what the data model
 * looks like: reach their history, change how the app behaves, or get out. The
 * old version was four undifferentiated cards, so the two things that matter
 * most - history and preferences - carried the same weight as the sign-out
 * button.
 */
export default function AccountScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: provider } = useMyProvider();

  const [guideOpen, setGuideOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      upsertProfile({
        display_name: (name ?? profile?.display_name ?? "").trim(),
        phone: (phone ?? profile?.phone ?? "").trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      setEditOpen(false);
      toast(t("set.saved"));
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  if (!user) {
    return (
      <ScrollView className="flex-1 px-5" contentContainerClassName="py-4 gap-4">
        <Card className="items-center py-8">
          <UserRound size={28} color={c.inkMuted} />
          <Text variant="title" className="mt-3 text-center">
            {t("acct.notSignedIn")}
          </Text>
          <Text variant="small" className="mt-1 text-center">
            {t("acct.guestBody")}
          </Text>
          <Button
            title={t("auth.signIn")}
            className="mt-5"
            onPress={() => router.push("/(auth)/sign-in")}
          />
        </Card>

        <Preferences onGuide={() => setGuideOpen(true)} />
        <GuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="py-4 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Identity first: who am I signed in as, and how do I change it. */}
        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: c.pillPrimaryBg }}
            >
              <Text
                className="font-display text-[18px] font-semibold"
                style={{ color: c.pillPrimaryText }}
              >
                {(profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text variant="title" className="text-[17px]">
                {profile?.display_name ?? "—"}
              </Text>
              <Text variant="small">{user.email}</Text>
            </View>
          </View>

          {profile?.phone ? (
            <Text variant="mono" className="text-[13px]">
              {profile.phone}
            </Text>
          ) : null}

          <Button
            title={t("acct.editProfile")}
            variant="outline"
            size="sm"
            className="self-start"
            onPress={() => {
              setName(null);
              setPhone(null);
              setEditOpen(true);
            }}
          />
        </Card>

        <Row
          icon={<Receipt size={18} color={c.primary} />}
          title={t("acct.history")}
          body={t("acct.historyBody")}
          onPress={() => router.push("/history")}
        />

        {/* Anyone can become a provider with the same account, so the door is
            here rather than behind a separate sign-up. */}
        {!provider ? (
          <Row
            icon={<Store size={18} color={c.primary} />}
            title={t("acct.becomeProvider")}
            body={t("acct.becomeProviderBody")}
            onPress={() => router.push("/(business)/onboarding")}
          />
        ) : null}

        <Preferences onGuide={() => setGuideOpen(true)} />

        <Card>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await unregisterPush();
              await supabase.auth.signOut();
              qc.clear();
              router.replace("/(customer)/browse");
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            className="flex-row items-center gap-3"
          >
            <LogOut size={18} color={c.destructive} />
            <Text className="font-medium text-destructive dark:text-d-destructive">
              {t("set.signOut")}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("acct.editProfile")}
      >
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
        <View className="flex-row gap-2 pb-2">
          <Button
            title={t("common.cancel")}
            variant="outline"
            className="flex-1"
            onPress={() => setEditOpen(false)}
          />
          <Button
            title={save.isPending ? t("common.saving") : t("common.save")}
            className="flex-1"
            loading={save.isPending}
            onPress={() => save.mutate()}
          />
        </View>
      </Sheet>

      <GuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

function Preferences({ onGuide }: { onGuide: () => void }) {
  const t = useT();
  const c = useThemeColors();

  return (
    <>
      <Card className="gap-4">
        <Text className="text-[11px] font-medium uppercase tracking-wide text-ink-muted dark:text-d-ink-muted">
          {t("acct.preferences")}
        </Text>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Palette size={15} color={c.inkMuted} />
            <Text className="text-[14px] font-medium">{t("theme.title")}</Text>
          </View>
          <ThemeToggle />
        </View>

        <View className="gap-2 border-t border-border pt-4 dark:border-d-border">
          <View className="flex-row items-center gap-2">
            <Languages size={15} color={c.inkMuted} />
            <Text className="text-[14px] font-medium">{t("common.language")}</Text>
          </View>
          <LanguageToggle className="self-start" />
        </View>
      </Card>

      <Row
        icon={<CircleHelp size={18} color={c.primary} />}
        title={t("guide.title")}
        body={t("guide.open")}
        onPress={onGuide}
      />
    </>
  );
}

function Row({
  icon,
  title,
  body,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Card className="flex-row items-center gap-3">
        {icon}
        <View className="flex-1">
          <Text className="font-medium">{title}</Text>
          <Text variant="small">{body}</Text>
        </View>
        <ChevronRight size={18} color={c.inkMuted} />
      </Card>
    </Pressable>
  );
}
