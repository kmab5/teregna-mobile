import { Pressable, View } from "react-native";
import { Menu } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Mark } from "@/components/teregna/position-badge";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { useDrawer } from "./drawer";
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
/**
 * Top bar.
 *
 * The mode switch moved into the drawer: it changes the entire app, which is a
 * heavier decision than a bar button implies, and it sat awkwardly next to the
 * business name it was about to replace.
 */
export function ModeBar({
  mode,
  provider,
}: {
  mode: "customer" | "business";
  /** Shown in business mode. */
  provider?: Provider | null;
}) {
  const t = useT();
  const c = useThemeColors();
  const drawer = useDrawer();
  const business = mode === "business";

  return (
    <View
      className="h-12 flex-row items-center gap-1 border-b pl-2 pr-5"
      style={{
        backgroundColor: business ? c.chrome : c.bg,
        borderColor: business ? c.chromeBorder : c.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("drawer.open")}
        onPress={drawer.open}
        hitSlop={6}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        className="h-11 w-11 items-center justify-center rounded-full"
      >
        <Menu size={20} color={business ? c.onChrome : c.ink} />
      </Pressable>

      {business ? (
        <Text
          numberOfLines={1}
          tone="inherit"
          style={{ color: c.onChrome }}
          className="flex-1 text-[15px] font-medium"
        >
          {provider?.name ?? t("nav.myBusiness")}
        </Text>
      ) : (
        <>
          <Mark />
          <Text className="ml-1.5 flex-1 font-display text-[16px] font-semibold">
            {t("app.name")}
          </Text>
        </>
      )}
    </View>
  );
}
