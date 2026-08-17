import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Mark } from "@/components/teregna/position-badge";
import { LanguageToggle } from "@/components/teregna/language-toggle";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/oauth";
import { useT } from "@/i18n/provider";

export default function SignIn() {
  const t = useT();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  function done() {
    // replace, not push: the auth screen must not sit in the back stack for
    // someone to swipe back into once signed in.
    if (next) router.replace(next as never);
    else router.replace("/(tabs)/browse");
  }

  async function submitEmail() {
    setBusy(true);
    setError(null);
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: name.trim() || undefined } },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
    setBusy(false);

    if (result.error) {
      setError(
        mode === "signin" ? t("auth.badCredentials") : result.error.message,
      );
      return;
    }
    done();
  }

  async function submitGoogle() {
    setGoogleBusy(true);
    setError(null);
    const result = await signInWithGoogle();
    setGoogleBusy(false);
    if (result.ok) return done();
    if (result.reason === "cancelled") setError(t("auth.oauthCancelled"));
    else setError(t("auth.googleFailed"));
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg dark:bg-d-bg">
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="grow justify-center py-12"
        keyboardShouldPersistTaps="handled"
      >
        <Mark className="mb-6" />

        <Text variant="display">
          {mode === "signup" ? t("auth.createTitle") : t("auth.welcome")}
        </Text>
        <Text variant="small" className="mt-2">
          {mode === "signup" ? t("auth.createSub") : t("auth.welcomeSub")}
        </Text>

        <Button
          title={googleBusy ? t("auth.googleBusy") : t("auth.google")}
          variant="outline"
          size="lg"
          loading={googleBusy}
          onPress={submitGoogle}
          className="mt-8"
        />

        <View className="my-5 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border dark:bg-d-border" />
          <Text variant="small" className="uppercase">
            {t("auth.or")}
          </Text>
          <View className="h-px flex-1 bg-border dark:bg-d-border" />
        </View>

        <View className="gap-4">
          {mode === "signup" ? (
            <Field
              label={t("auth.name")}
              value={name}
              onChangeText={setName}
              placeholder={t("auth.namePlaceholder")}
              autoComplete="name"
            />
          ) : null}

          <Field
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            error={error}
          />

          <Button
            title={
              busy
                ? t("common.loading")
                : mode === "signup"
                  ? t("auth.create")
                  : t("auth.signIn")
            }
            size="lg"
            loading={busy}
            disabled={!email.trim() || password.length < 8}
            onPress={submitEmail}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-6 self-start py-2"
        >
          <Text variant="small">
            {mode === "signin" ? t("auth.newHere") : t("auth.haveAccount")}{" "}
            <Text className="font-medium text-primary dark:text-d-primary">
              {mode === "signin" ? t("auth.create") : t("auth.signIn")}
            </Text>
          </Text>
        </Pressable>

        {/* Available before signing in: someone who cannot read the current
            language needs the way out first, not after. */}
        <LanguageToggle className="mt-8 self-start" />
      </ScrollView>
    </SafeAreaView>
  );
}
