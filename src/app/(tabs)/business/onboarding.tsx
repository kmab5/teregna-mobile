import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  setProviderActive,
  upsertItem,
  upsertProfile,
  upsertProvider,
} from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  "barber", "salon", "tailor", "clinic", "dentist",
  "laundry", "repair", "mechanic", "other",
];

const STEP_KEYS = ["ob.business", "ob.contact", "ob.services"] as const;

/**
 * Required onboarding.
 *
 * A provider who is live with no location, category or phone is worse off than
 * one who never signed up: they are waiting on a queue that cannot fill, and the
 * few customers who do find them cannot tell what is on offer. So the essentials
 * are gated per step rather than collected optionally and skipped in silence.
 */
export default function Onboarding() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState([{ name: "", price: "", duration: "" }]);

  // Each step states what is still missing, so Continue is never a dead button
  // with an unexplained disabled state.
  const missing: string[] =
    step === 0
      ? ([
          !name.trim() && t("ob.needName"),
          !category && t("ob.needCategory"),
          !location.trim() && t("ob.needLocation"),
        ].filter(Boolean) as string[])
      : step === 1
        ? ([
            !displayName.trim() && t("ob.needYourName"),
            !/^[+0-9][0-9\s-]{6,}$/.test(phone.trim()) && t("ob.needPhone"),
          ].filter(Boolean) as string[])
        : [];

  const filled = services.filter((s) => s.name.trim());

  const finish = useMutation({
    mutationFn: async () => {
      await upsertProfile({ display_name: displayName.trim(), phone: phone.trim() });
      const provider = await upsertProvider({
        name: name.trim(),
        category,
        location: location.trim(),
        description: description.trim() || null,
      });
      for (const s of filled) {
        await upsertItem({
          provider_id: provider.id,
          name: s.name.trim(),
          price: s.price ? Number(s.price) : null,
          duration_minutes: s.duration ? Number(s.duration) : null,
        });
      }
      // Only open the doors once there is something to show.
      if (filled.length > 0) await setProviderActive(provider.id, true);
      return provider;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      qc.invalidateQueries({ queryKey: qk.profile() });
      toast(filled.length > 0 ? t("ob.liveTitle") : t("ob.createdTitle"), {
        body: filled.length > 0 ? t("ob.liveBody") : t("ob.createdBody"),
      });
      router.replace("/business" as never);
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg dark:bg-d-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-7 pt-5 gap-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-2">
          {STEP_KEYS.map((k, i) => (
            <View key={k} className="flex-1 flex-row items-center gap-2">
              <View
                className={cn(
                  "h-7 w-7 items-center justify-center rounded-full border-2",
                  i < step
                    ? "border-accent bg-accent"
                    : i === step
                      ? "border-primary bg-primary dark:border-d-primary dark:bg-d-primary"
                      : "border-border dark:border-d-border",
                )}
              >
                {i < step ? (
                  <Check size={13} color="#FFFFFF" />
                ) : (
                  <Text
                    className={cn(
                      "font-mono text-[12px]",
                      i === step
                        ? "text-on-primary dark:text-d-on-primary"
                        : "text-ink-muted dark:text-d-ink-muted",
                    )}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < STEP_KEYS.length - 1 ? (
                <View className="h-px flex-1 bg-border dark:bg-d-border" />
              ) : null}
            </View>
          ))}
        </View>

        {step === 0 ? (
          <View className="gap-4">
            <View>
              <Text variant="display">{t("ob.bTitle")}</Text>
              <Text variant="small" className="mt-1">
                {t("ob.bSubtitle")}
              </Text>
            </View>
            <Field
              label={t("ob.bName")}
              value={name}
              onChangeText={setName}
              placeholder={t("ob.bNamePlaceholder")}
            />
            <View className="gap-2">
              <Text className="font-medium text-[14px]">{t("ob.bCategory")}</Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === c }}
                    onPress={() => setCategory(c)}
                    className={cn(
                      "h-10 justify-center rounded-full px-3.5",
                      category === c
                        ? "bg-primary dark:bg-d-primary"
                        : "bg-muted dark:bg-d-muted",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[13px] font-medium capitalize",
                        category === c
                          ? "text-on-primary dark:text-d-on-primary"
                          : "text-ink-muted dark:text-d-ink-muted",
                      )}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Field
              label={t("ob.bLocation")}
              value={location}
              onChangeText={setLocation}
              placeholder={t("set.locationPlaceholder")}
              hint={t("ob.bLocationHint")}
            />
            <Field
              label={t("ob.bDescription")}
              value={description}
              onChangeText={setDescription}
              multiline
              className="h-20 py-3"
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View className="gap-4">
            <View>
              <Text variant="display">{t("ob.cTitle")}</Text>
              <Text variant="small" className="mt-1">
                {t("ob.cSubtitle")}
              </Text>
            </View>
            <Field
              label={t("set.yourName")}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t("auth.namePlaceholder")}
            />
            <Field
              label={t("set.phone")}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+251 91 234 5678"
              mono
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-4">
            <View>
              <Text variant="display">{t("ob.sTitle")}</Text>
              <Text variant="small" className="mt-1">
                {t("ob.sSubtitle")}
              </Text>
            </View>

            {services.map((s, i) => (
              <Card key={i} className="gap-3">
                <View className="flex-row items-end gap-2">
                  <View className="flex-1">
                    <Field
                      label={t("ob.sName", { n: i + 1 })}
                      value={s.name}
                      onChangeText={(v) => {
                        const next = [...services];
                        next[i] = { ...next[i], name: v };
                        setServices(next);
                      }}
                      placeholder={t("it.namePlaceholder")}
                    />
                  </View>
                  {services.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("ob.sRemove", { n: i + 1 })}
                      onPress={() => setServices(services.filter((_, j) => j !== i))}
                      className="h-12 w-11 items-center justify-center"
                    >
                      <Trash2 size={16} color="#B91C1C" />
                    </Pressable>
                  ) : null}
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Field
                      label={t("it.price")}
                      value={s.price}
                      onChangeText={(v) => {
                        const next = [...services];
                        next[i] = { ...next[i], price: v };
                        setServices(next);
                      }}
                      keyboardType="numeric"
                      mono
                    />
                  </View>
                  <View className="flex-1">
                    <Field
                      label={t("it.minutes")}
                      value={s.duration}
                      onChangeText={(v) => {
                        const next = [...services];
                        next[i] = { ...next[i], duration: v };
                        setServices(next);
                      }}
                      keyboardType="numeric"
                      mono
                    />
                  </View>
                </View>
              </Card>
            ))}

            <Button
              title={t("ob.sAddAnother")}
              variant="outline"
              onPress={() => setServices([...services, { name: "", price: "", duration: "" }])}
              icon={<Plus size={16} color="#6D28D9" />}
            />

            <Text variant="small">{t("ob.sMinutesNote")}</Text>

            {filled.length === 0 ? (
              <View className="rounded-sm bg-warning/10 p-3 dark:bg-d-warning/15">
                <Text className="text-[13px] text-warning dark:text-d-warning">
                  {t("ob.sSkipWarning")}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {missing.length > 0 ? (
          <Text variant="small">{t("ob.stillNeeded", { list: missing.join(", ") })}</Text>
        ) : null}

        <View className="flex-row gap-3">
          {step > 0 ? (
            <Button
              title={t("common.back")}
              variant="outline"
              size="lg"
              onPress={() => setStep(step - 1)}
              icon={<ArrowLeft size={16} color="#6D28D9" />}
            />
          ) : null}

          {step < STEP_KEYS.length - 1 ? (
            <Button
              title={t("common.continue")}
              size="lg"
              className="flex-1"
              disabled={missing.length > 0}
              onPress={() => setStep(step + 1)}
              icon={<ArrowRight size={16} color="#FFFFFF" />}
            />
          ) : (
            <Button
              title={
                finish.isPending
                  ? t("ob.settingUp")
                  : filled.length > 0
                    ? t("ob.openQueue")
                    : t("ob.finishForNow")
              }
              size="lg"
              className="flex-1"
              loading={finish.isPending}
              onPress={() => finish.mutate()}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
