import { Pressable, View } from "react-native";
import { Languages } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

/**
 * Two locales, so a segmented control beats a picker: both options visible, one
 * tap. Each label is written in its own language so it is legible regardless of
 * which one is active.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t("common.language")}
      className={cn("flex-row items-center gap-2", className)}
    >
      <Languages size={15} color="#5B517A" />
      <View className="flex-row rounded-full bg-muted p-0.5 dark:bg-d-muted">
        {LOCALES.map((code) => {
          const active = code === locale;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setLocale(code)}
              className={cn(
                "rounded-full px-3 py-1.5",
                active && "bg-surface dark:bg-d-surface",
              )}
            >
              <Text
                className={cn(
                  "text-[12px] font-medium",
                  active
                    ? "text-ink dark:text-d-ink"
                    : "text-ink-muted dark:text-d-ink-muted",
                )}
              >
                {LOCALE_LABELS[code]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
