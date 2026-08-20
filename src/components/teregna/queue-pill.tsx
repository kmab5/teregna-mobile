import { View } from "react-native";
import { Users } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";

/**
 * "3 waiting" / "No queue".
 *
 * A count, never an identity. Both the background and the text come from the
 * same resolved theme, so they cannot end up from different schemes - which is
 * how this landed at 1.47:1 twice.
 */
export function QueuePill({ count, className }: { count: number; className?: string }) {
  const c = useThemeColors();
  const t = useT();
  const busy = count > 0;

  const bg = busy ? c.pillPrimaryBg : c.pillAccentBg;
  const fg = busy ? c.pillPrimaryText : c.pillAccentText;

  return (
    <View
      className={cn("flex-row items-center gap-1.5 rounded-full px-2.5 py-1", className)}
      style={{ backgroundColor: bg }}
    >
      <Users size={12} color={fg} />
      <Text tone="inherit" style={{ color: fg }} className="font-mono text-[12px] font-medium">
        {count === 0 ? t("queue.none") : t.plural("queue.waiting", count)}
      </Text>
    </View>
  );
}
