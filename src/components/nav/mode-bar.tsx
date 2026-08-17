import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Store, UserRound } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Mark } from "@/components/teregna/position-badge";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import type { Provider } from "@/lib/database.types";

/**
 * Top bar with the mode switch.
 *
 * Customer and provider are two different jobs, not two tabs of one job. Sharing
 * a bottom bar meant a provider working a shift saw Browse and My requests
 * alongside their queue, which are irrelevant while serving someone.
 *
 * Switching swaps the entire layout - top bar, bottom bar, and the routes behind
 * them - so each mode only ever shows its own surfaces. The button back to the
 * other side is always in the top bar, so neither is a trap.
 */
export function ModeBar({
  mode,
  provider,
}: {
  mode: "customer" | "business";
  /** Shown in business mode, and decides whether the switch is offered at all. */
  provider?: Provider | null;
}) {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const business = mode === "business";

  return (
    <View
      className={cn(
        "h-12 flex-row items-center gap-2.5 border-b px-5",
        business
          ? "border-chrome-border bg-chrome dark:border-d-chrome-border dark:bg-d-chrome"
          : "border-border bg-bg dark:border-d-border dark:bg-d-bg",
      )}
    >
      {business ? (
        <Text numberOfLines={1} className="flex-1 font-medium text-[15px]">
          {provider?.name ?? t("nav.myBusiness")}
        </Text>
      ) : (
        <>
          <Mark />
          <Text className="flex-1 font-display text-[16px] font-semibold">
            {t("app.name")}
          </Text>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.replace(business ? "/(customer)/browse" : "/(business)")
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        className={cn(
          "h-9 flex-row items-center gap-1.5 rounded-full px-3",
          "border border-border dark:border-d-border",
        )}
      >
        {business ? (
          <UserRound size={14} color={c.primary} />
        ) : (
          <Store size={14} color={c.primary} />
        )}
        <Text className="text-[12px] font-medium text-primary dark:text-d-primary">
          {business ? t("nav.customerView") : t("nav.myBusiness")}
        </Text>
      </Pressable>
    </View>
  );
}
