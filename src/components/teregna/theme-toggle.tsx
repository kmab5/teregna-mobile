import { Pressable, View } from "react-native";
import { Moon, Smartphone, Sun } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useThemePreference, type ThemePreference } from "@/theme/provider";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

const OPTIONS: { value: ThemePreference; labelKey: string; icon: typeof Sun }[] = [
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
  { value: "system", labelKey: "theme.system", icon: Smartphone },
];

/**
 * Three options, not a switch: "follow my phone" is a real preference, and a
 * two-state toggle silently converts it into a fixed choice the first time it
 * is touched.
 */
export function ThemeToggle() {
  const c = useThemeColors();
  const t = useT();
  const { preference, setPreference } = useThemePreference();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t("theme.title")}
      className="flex-row gap-2"
    >
      {OPTIONS.map(({ value, labelKey, icon: Icon }) => {
        const active = preference === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => setPreference(value)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flex: 1 })}
          >
            <View
              className={cn(
                "items-center gap-1.5 rounded-md border py-3",
                active
                  ? ""
                  : "",
              )}
            >
              <Icon size={18} color={active ? c.primary : c.inkMuted} />
              <Text
                className={cn(
                  "text-[12px] font-medium",
                  active
                    ? ""
                    : "",
                )}
              >
                {t(labelKey as never)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
