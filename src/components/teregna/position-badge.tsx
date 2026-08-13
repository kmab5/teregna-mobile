import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";

/**
 * The brand signature: a position marker.
 *
 * Filled when this is the one being served, outlined when waiting. Mono digits
 * because a provider scans these down a column and proportional figures make
 * the column jitter.
 */
export function PositionBadge({
  position,
  active = false,
  size = "md",
}: {
  position: number;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const type = size === "lg" ? "text-[20px]" : size === "sm" ? "text-[13px]" : "text-[16px]";

  return (
    <View
      accessibilityLabel={`Position ${position}`}
      className={cn(
        "items-center justify-center rounded-full border-2",
        box,
        active
          ? "border-primary bg-primary dark:border-d-primary dark:bg-d-primary"
          : "border-border bg-surface dark:border-d-border dark:bg-d-surface",
      )}
    >
      <Text
        className={cn(
          "font-mono-bold",
          type,
          active
            ? "text-on-primary dark:text-d-on-primary"
            : "text-ink dark:text-d-ink",
        )}
      >
        {position}
      </Text>
    </View>
  );
}

/** The mark: three positions, decreasing. Same idea as the web logo. */
export function Mark({ className }: { className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-1.5", className)}>
      <View className="h-3.5 w-3.5 rounded-full bg-primary dark:bg-d-primary" />
      <View className="h-2.5 w-2.5 rounded-full border-2 border-primary/60 dark:border-d-primary/60" />
      <View className="h-1.5 w-1.5 rounded-full border border-primary/35 dark:border-d-primary/35" />
    </View>
  );
}
