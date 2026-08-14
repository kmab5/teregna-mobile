import { useState } from "react";
import { ScrollView, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { BusinessScreen } from "@/components/teregna/business-screen";
import { useProfile } from "@/lib/queries";
import {
  deleteMyAccount,
  setProviderActive,
  upsertProfile,
  upsertProvider,
} from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import { unregisterPush } from "@/lib/push";
import { useT } from "@/i18n/provider";
import type { Provider } from "@/lib/database.types";

const CONFIRM = "DELETE";

export default function SettingsScreen() {
  return <BusinessScreen>{(p) => <Settings provider={p} />}</BusinessScreen>;
}

function Settings({ provider }: { provider: Provider }) {
  const t = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const { data: profile } = useProfile();

  const [name, setName] = useState(provider.name);
  const [location, setLocation] = useState(provider.location ?? "");
  const [category, setCategory] = useState(provider.category ?? "");
  const [description, setDescription] = useState(provider.description ?? "");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const active = useMutation({
    mutationFn: (value: boolean) => setProviderActive(provider.id, value),
    onSuccess: (_d, value) => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast(value ? t("set.openedTitle") : t("set.closedTitle"), {
        body: value ? t("set.openedBody") : t("set.closedBody"),
      });
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const saveBusiness = useMutation({
    mutationFn: () =>
      upsertProvider({
        id: provider.id,
        name: name.trim(),
        location: location.trim() || null,
        category: category.trim() || null,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast(t("set.saved"));
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      upsertProfile({
        display_name: (displayName ?? profile?.display_name ?? "").trim(),
        phone: (phone ?? profile?.phone ?? "").trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      toast(t("set.saved"));
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const result = await deleteMyAccount();
      // Clear the token first: a signed-out phone must stop receiving
              // someone else’s queue.
              await unregisterPush();
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
      router.replace("/(tabs)/browse");
    },
    onError: (e) => toast(t(errorKey(e) as never), { tone: "error" }),
  });

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-7 pt-4 gap-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text variant="title" className="text-[16px]">
                {t("set.openTitle")}
              </Text>
              <Text variant="small" className="mt-1">
                {t("set.openBody")}
              </Text>
            </View>
            <Switch
              value={provider.is_active}
              onValueChange={(v) => active.mutate(v)}
              accessibilityLabel={t("set.openTitle")}
              trackColor={{ true: "#15803D", false: "#E6DEF7" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        <Card className="gap-4">
          <Text variant="title" className="text-[16px]">
            {t("set.details")}
          </Text>
          <Field label={t("set.bizName")} value={name} onChangeText={setName} />
          <Field
            label={t("set.location")}
            value={location}
            onChangeText={setLocation}
            placeholder={t("set.locationPlaceholder")}
          />
          <Field label={t("set.category")} value={category} onChangeText={setCategory} />
          <Field
            label={t("set.description")}
            value={description}
            onChangeText={setDescription}
            multiline
            className="h-20 py-3"
          />
          <Button
            title={saveBusiness.isPending ? t("common.saving") : t("common.save")}
            loading={saveBusiness.isPending}
            onPress={() => saveBusiness.mutate()}
            className="self-start"
          />
        </Card>

        <Card className="gap-4">
          <Text variant="title" className="text-[16px]">
            {t("set.yourDetails")}
          </Text>
          <Field
            label={t("set.yourName")}
            value={displayName ?? profile?.display_name ?? ""}
            onChangeText={setDisplayName}
          />
          <Field
            label={t("set.phone")}
            value={phone ?? profile?.phone ?? ""}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            hint={t("set.phoneHint")}
            mono
          />
          <Button
            title={saveProfile.isPending ? t("common.saving") : t("set.saveDetails")}
            loading={saveProfile.isPending}
            onPress={() => saveProfile.mutate()}
            className="self-start"
          />
        </Card>

        <Card className="gap-3">
          <Text variant="title" className="text-[16px]">
            {t("set.account")}
          </Text>
          <Button
            title={t("set.signOut")}
            variant="outline"
            className="self-start"
            onPress={async () => {
              // Clear the token first: a signed-out phone must stop receiving
              // someone else’s queue.
              await unregisterPush();
              await supabase.auth.signOut();
              qc.clear();
              router.replace("/(tabs)/browse");
            }}
          />
          <View className="border-t border-border pt-3 dark:border-d-border">
            <Text variant="small">{t("set.deleteWarnProvider")}</Text>
            <Button
              title={t("acct.delete")}
              variant="destructive"
              className="mt-3 self-start"
              onPress={() => {
                setTyped("");
                setConfirmOpen(true);
              }}
            />
          </View>
        </Card>
      </ScrollView>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("acct.deleteTitle")}
      >
        <View className="flex-row items-start gap-2.5 rounded-sm bg-destructive/10 p-3 dark:bg-d-destructive/15">
          <TriangleAlert size={17} color="#B91C1C" />
          <Text className="flex-1 text-[14px] text-destructive dark:text-d-destructive">
            {t("acct.irreversible")}
          </Text>
        </View>

        <View className="gap-1.5">
          <Text variant="small">{t("acct.whatHappens")}</Text>
          <Text variant="small">• {t("acct.scrub")}</Text>
          <Text variant="small">• {t("acct.cancels")}</Text>
          <Text variant="small">• {t("acct.shopCloses")}</Text>
          <Text variant="small">• {t("acct.queueTold")}</Text>
          {/* Those records belong to the customers too, so they are not ours
              to erase. Saying so avoids a support ticket later. */}
          <Text variant="small">• {t("acct.histProvider")}</Text>
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
    </>
  );
}
