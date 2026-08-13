import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { Text } from "./text";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const BASE =
  "flex-row items-center justify-center gap-2 rounded-md active:opacity-80";

const VARIANTS: Record<Variant, { box: string; label: string }> = {
  primary: {
    box: "bg-primary dark:bg-d-primary",
    label: "text-on-primary dark:text-d-on-primary",
  },
  accent: {
    box: "bg-accent dark:bg-d-accent",
    label: "text-on-accent dark:text-d-on-accent",
  },
  outline: {
    box: "border border-border dark:border-d-border bg-surface dark:bg-d-surface",
    label: "text-ink dark:text-d-ink",
  },
  ghost: { box: "bg-transparent", label: "text-ink dark:text-d-ink" },
  destructive: {
    box: "border border-border dark:border-d-border bg-surface dark:bg-d-surface",
    label: "text-destructive dark:text-d-destructive",
  },
};

// 44 is the accessibility floor for a touch target; nothing tappable goes below.
const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-11 px-3", text: "text-[14px]" },
  md: { box: "h-12 px-4", text: "text-[15px]" },
  lg: { box: "h-14 px-6", text: "text-[16px]" },
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  icon,
  ...props
}: PressableProps & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(off), busy: loading }}
      disabled={off}
      className={cn(BASE, VARIANTS[variant].box, SIZES[size].box, off && "opacity-50", className)}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" /> : icon}
      <Text
        className={cn(
          "font-medium",
          VARIANTS[variant].label,
          SIZES[size].text,
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
