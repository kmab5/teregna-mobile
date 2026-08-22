import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/queries";
import { upsertProfile } from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

/** Permissive on purpose: local formats vary and a strict pattern rejects real numbers. */
const PHONE_RE = /^[+0-9][0-9\s-]{6,}$/;

/**
 * Collects a phone number from anyone signed in without one.
 *
 * The signup form requires it, but Google sign-in returns no phone and accounts
 * created before it was required have none either. Without a number a provider
 * finishes the job and has no way to say so, which breaks the one thing the
 * product is for.
 *
 * Deliberately not dismissable: there is no path through this except entering a
 * number, because a "later" that never comes leaves the account permanently
 * unable to complete a transaction.
 */
export function PhoneGate() {
  const t = useT();
  const c = useThemeColors();
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const { data: profile, isPending } = useProfile();
  const [phone, setPhone] = useState("");

  const save = useMutation({
    mutationFn: () => upsertProfile({ phone: phone.trim() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile() }),
  });

  // Only once we know: a null profile mid-load must not flash the sheet.
  const needsPhone =
    ready && Boolean(user) && !isPending && profile !== undefined &&
    !profile?.phone?.trim();

  if (!needsPhone) return null;

  return (
    <Sheet
      open
      // No-op: the sheet has no dismiss path by design.
      onClose={() => {}}
      title={t("phone.gateTitle")}
      description={t("phone.gateBody")}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: c.pillPrimaryBg }}
      >
        <Phone size={22} color={c.pillPrimaryText} />
      </View>

      <Field
        label={t("auth.phone")}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+251 91 234 5678"
        autoFocus
        mono
        error={save.isError ? t(errorKey(save.error) as never) : null}
      />

      <Button
        title={save.isPending ? t("common.saving") : t("phone.gateSave")}
        size="lg"
        loading={save.isPending}
        disabled={!PHONE_RE.test(phone.trim())}
        onPress={() => save.mutate()}
      />
      <View className="h-2" />
    </Sheet>
  );
}
