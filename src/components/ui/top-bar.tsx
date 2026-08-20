import { View } from "react-native";
import { Mark } from "@/components/teregna/position-badge";
import { Text } from "./text";
import { cn } from "@/lib/cn";

/**
 * App bar.
 *
 * Padding alone did not solve this: content still began immediately under the
 * status bar, so the screen read as though it started mid-page. A real bar gives
 * the status icons something to sit against and separates system chrome from
 * app content, which is what the gap was actually missing.
 *
 * Deliberately short (48px) and unobtrusive - this is a queue app, and vertical
 * space on a phone belongs to the queue.
 */
export function TopBar({
  title,
  right,
  showMark = true,
  className,
}: {
  title?: string;
  right?: React.ReactNode;
  showMark?: boolean;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "h-12 flex-row items-center gap-2.5 border-b px-5",
        // Same background as the safe-area strip above it. A different surface
        // colour here draws a visible seam right under the status bar.
        "",
        className,
      )}
    >
      {showMark ? <Mark /> : null}
      {title ? (
        <Text className="font-display text-[16px] font-semibold" numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      <View className="flex-1" />
      {right}
    </View>
  );
}
