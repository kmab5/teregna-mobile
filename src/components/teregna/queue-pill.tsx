import { View } from "react-native";
import { Users } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

/**
 * "3 waiting" / "No queue".
 *
 * A count, never an identity. Colours come from the theme rather than a literal,
 * because the tinted background inverts between schemes and a fixed text colour
 * ends up unreadable on one of them.
 */
export function QueuePill({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const t = useT();
  const c = useThemeColors();
  const busy = count > 0;

  return (
    <View
      className={cn(
        "flex-row items-center gap-1.5 rounded-full px-2.5 py-1",
        busy
          ? "bg-primary/[0.14] dark:bg-d-primary/[0.22]"
          : "bg-accent/[0.14] dark:bg-d-accent/[0.22]",
        className,
      )}
    >
      <Users size={12} color={busy ? c.pillPrimaryText : c.pillAccentText} />
      <Text
        className="font-mono text-[12px] font-medium"
        style={{ color: busy ? c.pillPrimaryText : c.pillAccentText }}
      >
        {count === 0 ? t("queue.none") : t.plural("queue.waiting", count)}
      </Text>
    </View>
  );
}
