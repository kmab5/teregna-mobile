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

/** Permissive on purpose: local formats vary and a strict pattern rejects real numbers. */
const PHONE_RE = /^[+0-9][0-9\s-]{6,}$/;

export default function SignIn() {
  const t = useT();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  function done() {
    // replace, not push: the auth screen must not sit in the back stack for
    // someone to swipe back into once signed in.
    if (next) router.replace(next as never);
    else router.replace("/(customer)/browse");
  }

  async function submitEmail() {
    setBusy(true);
    setError(null);
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                display_name: name.trim() || undefined,
                // Carried through the signup metadata so the provisioning
                // trigger can store it without a second round trip.
                phone: phone.trim(),
              },
            },
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
    <SafeAreaView edges={["top", "bottom"]} className="flex-1">
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
          <View className="h-px flex-1" />
          <Text variant="small" className="uppercase">
            {t("auth.or")}
          </Text>
          <View className="h-px flex-1" />
        </View>

        <View className="gap-4">
          {mode === "signup" ? (
            <>
              <Field
                label={t("auth.name")}
                value={name}
                onChangeText={setName}
                placeholder={t("auth.namePlaceholder")}
                autoComplete="name"
              />
              {/*
                Required, not optional. The product exists so two people can
                meet; without a number the provider finishes the job and has no
                way to say so.
              */}
              <Field
                label={t("auth.phone")}
                value={phone}
                onChangeText={setPhone}
                placeholder="+251 91 234 5678"
                keyboardType="phone-pad"
                autoComplete="tel"
                hint={t("auth.phoneHint")}
                mono
              />
            </>
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
            disabled={
              !email.trim() ||
              password.length < 8 ||
              (mode === "signup" && !PHONE_RE.test(phone.trim()))
            }
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
            <Text className="font-medium">
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
