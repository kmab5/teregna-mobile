import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { Text } from "./text";
import { useThemeColors, type ThemeColors } from "@/theme/colors";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

// 44 is the accessibility floor for a touch target; nothing tappable goes below.
const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-11 px-3", text: "text-[14px]" },
  md: { box: "h-12 px-4", text: "text-[15px]" },
  lg: { box: "h-14 px-6", text: "text-[16px]" },
};

function palette(c: ThemeColors, v: Variant) {
  switch (v) {
    case "primary":
      return { bg: c.primary, fg: c.onPrimary, border: "transparent" };
    case "accent":
      return { bg: c.accent, fg: c.onAccent, border: "transparent" };
    case "outline":
      return { bg: c.surface, fg: c.ink, border: c.border };
    case "destructive":
      return { bg: c.surface, fg: c.destructive, border: c.border };
    case "ghost":
    default:
      return { bg: "transparent", fg: c.ink, border: "transparent" };
  }
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  icon,
  style,
  ...props
}: PressableProps & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const c = useThemeColors();
  const p = palette(c, variant);
  const off = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(off), busy: loading }}
      disabled={off}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md border",
        SIZES[size].box,
        className,
      )}
      style={({ pressed }) => [
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={p.fg} /> : icon}
      <Text
        tone="inherit"
        style={{ color: p.fg }}
        className={cn("font-medium", SIZES[size].text)}
      >
        {title}
      </Text>
    </Pressable>
  );
}
