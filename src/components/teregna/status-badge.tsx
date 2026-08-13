import { View } from "react-native";
import { Check, Clock, Loader, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import type { RequestStatus } from "@/lib/database.types";

/**
 * Status is never signalled by colour alone: every state carries an icon and a
 * word too. Roughly 1 in 12 men has a colour vision deficiency, and the queue
 * has to work for them unchanged.
 */
const CONFIG: Record<
  RequestStatus,
  { icon: typeof Check; box: string; fg: string }
> = {
  queued: {
    icon: Clock,
    box: "bg-muted dark:bg-d-muted",
    fg: "#5B517A",
  },
  in_progress: {
    icon: Loader,
    box: "bg-primary/10 dark:bg-d-primary/20",
    fg: "#6D28D9",
  },
  completed: {
    icon: Check,
    box: "bg-accent/10 dark:bg-d-accent/20",
    fg: "#15803D",
  },
  cancelled: {
    icon: X,
    box: "bg-destructive/10 dark:bg-d-destructive/20",
    fg: "#B91C1C",
  },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const t = useT();
  const { icon: Icon, box, fg } = CONFIG[status];

  return (
    <View className={cn("flex-row items-center gap-1.5 rounded-full px-2.5 py-1", box)}>
      <Icon size={13} color={fg} />
      <Text className="text-[12px] font-medium" style={{ color: fg }}>
        {t(`status.${status}`)}
      </Text>
    </View>
  );
}
