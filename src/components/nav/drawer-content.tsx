import { Pressable, ScrollView, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  CircleHelp,
  LogOut,
  Receipt,
  Settings as SettingsIcon,
  Store,
  UserRound,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Mark } from "@/components/teregna/position-badge";
import { supabase } from "@/lib/supabase";
import { unregisterPush } from "@/lib/push";
import { useAuth } from "@/lib/auth";
import { useMyProvider, useProfile } from "@/lib/queries";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";

/**
 * The drawer.
 *
 * Everything that is about WHO you are rather than what you are doing: identity,
 * which side of the product you are on, settings, and the way out. The bottom
 * bar is left to the working surfaces, which is why Account and Settings are no
 * longer tabs — they were competing for space with the queue.
 *
 * Switching sides lives here because it is the same kind of decision: it changes
 * the whole app, not the current screen.
 */
export function DrawerContent({ onClose }: { onClose: () => void }) {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: provider } = useMyProvider();

  const isBusinessRoute =
    pathname === "/" ||
    ["/archive", "/items", "/analytics"].some((r) => pathname.startsWith(r));

  function go(path: string) {
    onClose();
    router.push(path as never);
  }

  function switchTo(mode: "customer" | "business") {
    onClose();
    router.replace(mode === "business" ? "/(business)" : "/(customer)/browse");
  }

  return (
    <View className="flex-1" style={{ backgroundColor: c.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5">
          <Mark />
        </View>

        {/* Identity */}
        <View className="mt-5 flex-row items-center gap-3 px-5">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: c.pillPrimaryBg }}
          >
            <Text
              tone="inherit"
              style={{ color: c.pillPrimaryText }}
              className="font-display text-[18px] font-semibold"
            >
              {(profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text variant="title" className="text-[16px]" numberOfLines={1}>
              {user ? (profile?.display_name ?? "—") : t("acct.notSignedIn")}
            </Text>
            <Text variant="small" numberOfLines={1}>
              {user?.email ?? t("acct.guestBody")}
            </Text>
          </View>
        </View>

        {!user ? (
          <View className="mt-5 px-5">
            <Pressable
              accessibilityRole="button"
              onPress={() => go("/(auth)/sign-in")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              className="h-12 items-center justify-center rounded-md"
            >
              <View
                className="h-12 w-full items-center justify-center rounded-md"
                style={{ backgroundColor: c.primary }}
              >
                <Text tone="inherit" style={{ color: c.onPrimary }} className="font-medium">
                  {t("auth.signIn")}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Which side of the product */}
        {user ? (
          <View className="mt-7 px-5">
            <Text variant="label" className="mb-2">
              {t("drawer.viewAs")}
            </Text>
            <ModeCard
              active={!isBusinessRoute}
              icon={<UserRound size={18} color={!isBusinessRoute ? c.pillPrimaryText : c.inkMuted} />}
              title={t("drawer.customer")}
              hint={t("drawer.customerHint")}
              onPress={() => switchTo("customer")}
            />
            <View className="h-2" />
            <ModeCard
              active={isBusinessRoute}
              icon={<Store size={18} color={isBusinessRoute ? c.pillPrimaryText : c.inkMuted} />}
              title={t("drawer.business")}
              hint={provider ? t("drawer.businessHint") : t("drawer.noBusiness")}
              onPress={() =>
                provider ? switchTo("business") : go("/(business)/onboarding")
              }
            />
          </View>
        ) : null}

        {/* Everything else */}
        <View className="mt-7">
          <Item
            icon={<SettingsIcon size={18} color={c.inkMuted} />}
            label={t("set.central")}
            onPress={() => go("/settings")}
          />
          {user ? (
            <Item
              icon={<Receipt size={18} color={c.inkMuted} />}
              label={t("acct.history")}
              onPress={() => go("/history")}
            />
          ) : null}
          <Item
            icon={<CircleHelp size={18} color={c.inkMuted} />}
            label={t("guide.title")}
            onPress={() => go("/guide")}
          />
        </View>

        {user ? (
          <View className="mt-4 border-t pt-4" style={{ borderColor: c.border }}>
            <Item
              icon={<LogOut size={18} color={c.destructive} />}
              label={t("set.signOut")}
              danger
              onPress={async () => {
                onClose();
                await unregisterPush();
                await supabase.auth.signOut();
                router.replace("/(customer)/browse");
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ModeCard({
  active,
  icon,
  title,
  hint,
  onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        className="flex-row items-center gap-3 rounded-md border p-3"
        style={{
          backgroundColor: active ? c.pillPrimaryBg : c.surface,
          borderColor: active ? c.pillPrimaryBg : c.border,
        }}
      >
        {icon}
        <View className="flex-1">
          <Text
            tone="inherit"
            style={{ color: active ? c.pillPrimaryText : c.ink }}
            className="font-medium"
          >
            {title}
          </Text>
          <Text
            tone="inherit"
            style={{ color: active ? c.pillPrimaryText : c.inkMuted }}
            className="text-[12px]"
          >
            {hint}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Item({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      className="h-14 flex-row items-center gap-3 px-5"
    >
      {icon}
      <Text
        tone="inherit"
        style={{ color: danger ? c.destructive : c.ink }}
        className="flex-1 font-medium"
      >
        {label}
      </Text>
      {!danger ? <ChevronRight size={17} color={c.inkMuted} /> : null}
    </Pressable>
  );
}
