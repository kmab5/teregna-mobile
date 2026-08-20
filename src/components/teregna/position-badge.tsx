import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/theme/colors";
import { cn } from "@/lib/cn";

/**
 * The brand signature: a position marker.
 *
 * Filled when this is the one being served, outlined when waiting. Mono digits,
 * because a provider scans these down a column and proportional figures make the
 * column jitter.
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
  const c = useThemeColors();
  const box = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const type = size === "lg" ? "text-[20px]" : size === "sm" ? "text-[13px]" : "text-[16px]";

  return (
    <View
      accessibilityLabel={`Position ${position}`}
      className={cn("items-center justify-center rounded-full border-2", box)}
      style={{
        backgroundColor: active ? c.primary : c.surface,
        borderColor: active ? c.primary : c.border,
      }}
    >
      <Text
        tone="inherit"
        style={{ color: active ? c.onPrimary : c.ink }}
        className={cn("font-mono-bold", type)}
      >
        {position}
      </Text>
    </View>
  );
}

/** The mark: three positions, decreasing. */
export function Mark({ className }: { className?: string }) {
  const c = useThemeColors();
  return (
    <View className={cn("flex-row items-center gap-1.5", className)}>
      <View className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c.primary }} />
      <View
        className="h-2.5 w-2.5 rounded-full border-2"
        style={{ borderColor: c.primary, opacity: 0.6 }}
      />
      <View
        className="h-1.5 w-1.5 rounded-full border"
        style={{ borderColor: c.primary, opacity: 0.35 }}
      />
    </View>
  );
}
