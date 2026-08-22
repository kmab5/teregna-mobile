import { Pressable, View } from "react-native";
import { Menu } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Mark } from "@/components/teregna/position-badge";
import { useDrawer } from "./drawer";
import { useProviderQueue } from "@/lib/queries";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import type { Provider } from "@/lib/database.types";

/**
 * Top bar.
 *
 * 64px with two lines rather than 48 with one. The single-line version was the
 * same height as a list row, so it read as content rather than chrome, and it
 * had room for a name and nothing else.
 *
 * The second line carries the thing you would otherwise open a screen to check:
 * how many people are waiting, or whether you are closed.
 */
export function ModeBar({
  mode,
  provider,
}: {
  mode: "customer" | "business";
  provider?: Provider | null;
}) {
  const t = useT();
  const c = useThemeColors();
  const drawer = useDrawer();
  const business = mode === "business";
  const { data: queue } = useProviderQueue(business ? provider?.id : undefined);

  const waiting = queue?.length ?? 0;
  const subtitle = business
    ? provider && !provider.is_active
      ? t("bar.closed")
      : waiting > 0
        ? t("bar.businessSub", { count: waiting })
        : t("bar.businessIdle")
    : t("bar.customerSub");

  return (
    <View
      className="h-16 flex-row items-center gap-1 border-b pl-2 pr-5"
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
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <Menu size={22} color={business ? c.onChrome : c.ink} />
      </Pressable>

      {!business ? <Mark className="ml-0.5 mr-1.5" /> : null}

      <View className="flex-1">
        <Text
          numberOfLines={1}
          tone="inherit"
          style={{ color: business ? c.onChrome : c.ink }}
          className="font-display text-[17px] font-semibold"
        >
          {business ? (provider?.name ?? t("nav.myBusiness")) : t("app.name")}
        </Text>
        <Text
          numberOfLines={1}
          tone="inherit"
          style={{ color: business ? c.onChromeMuted : c.inkMuted }}
          className="text-[12px]"
        >
          {subtitle}
        </Text>
      </View>

      {/* A live dot, so "open" is visible without reading. Paired with the word
          below it, never colour alone. */}
      {business && provider ? (
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: provider.is_active ? c.accent : c.inkMuted }}
        />
      ) : null}
    </View>
  );
}
