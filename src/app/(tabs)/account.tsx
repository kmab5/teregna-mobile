import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/teregna/language-toggle";
import { ThemeToggle } from "@/components/teregna/theme-toggle";
import { GuideSheet } from "@/components/teregna/guide-sheet";
import { supabase } from "@/lib/supabase";
import { unregisterPush } from "@/lib/push";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/queries";
import { useT } from "@/i18n/provider";

export default function AccountScreen() {
  const t = useT();
  const [guideOpen, setGuideOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return (
    <Screen title={t("acct.title")}>
      <View className="gap-4">
        <Card>
          <Text variant="title">{t("common.language")}</Text>
          <LanguageToggle className="mt-3 self-start" />
        </Card>

        <Card>
          <Text variant="title">{t("theme.title")}</Text>
          <View className="mt-3">
            <ThemeToggle />
          </View>
        </Card>

        <Card>
          <Text variant="title">{t("guide.title")}</Text>
          <Button
            title={t("guide.open")}
            variant="outline"
            className="mt-3 self-start"
            onPress={() => setGuideOpen(true)}
          />
        </Card>

        {user ? (
          <>
            <Card>
              <Text variant="title">{t("set.yourDetails")}</Text>
              <Text variant="small" className="mt-2">
                {profile?.display_name ?? "—"}
              </Text>
              <Text variant="mono" className="mt-1 text-[12px]">
                {user.email}
              </Text>
            </Card>

            <Card>
              <Text variant="title">{t("set.account")}</Text>
              <Button
                title={t("set.signOut")}
                variant="outline"
                className="mt-3 self-start"
                onPress={async () => {
                  // Clear the token first: a signed-out phone must stop receiving
              // someone else’s queue.
              await unregisterPush();
              await supabase.auth.signOut();
                  router.replace("/(tabs)/browse");
                }}
              />
            </Card>
          </>
        ) : (
          <Card>
            <Text variant="title">{t("auth.welcome")}</Text>
            <Text variant="small" className="mt-1">
              {t("auth.welcomeSub")}
            </Text>
            <Button
              title={t("auth.signIn")}
              className="mt-4 self-start"
              onPress={() => router.push("/(auth)/sign-in")}
            />
          </Card>
        )}
      </View>

      <GuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Screen>
  );
}
