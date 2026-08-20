import { View } from "react-native";
import { Check, Clock, Loader, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors, type ThemeColors } from "@/theme/colors";
import { useT } from "@/i18n/provider";
import type { RequestStatus } from "@/lib/database.types";

/**
 * Status is never signalled by colour alone: every state carries an icon and a
 * word too. Roughly 1 in 12 men has a colour vision deficiency, and the queue
 * has to work for them unchanged.
 */
function palette(c: ThemeColors, status: RequestStatus) {
  switch (status) {
    case "in_progress":
      return { bg: c.pillPrimaryBg, fg: c.pillPrimaryText, Icon: Loader };
    case "completed":
      return { bg: c.pillAccentBg, fg: c.pillAccentText, Icon: Check };
    case "cancelled":
      return { bg: c.pillDangerBg, fg: c.pillDangerText, Icon: X };
    case "queued":
    default:
      return { bg: c.pillNeutralBg, fg: c.pillNeutralText, Icon: Clock };
  }
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const t = useT();
  const c = useThemeColors();
  const { bg, fg, Icon } = palette(c, status);

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: bg }}
    >
      <Icon size={13} color={fg} />
      <Text tone="inherit" style={{ color: fg }} className="text-[12px] font-medium">
        {t(`status.${status}`)}
      </Text>
    </View>
  );
}
