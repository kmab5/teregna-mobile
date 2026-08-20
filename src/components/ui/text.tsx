import { Text as RNText, type TextProps } from "react-native";
import { useThemeColors } from "@/theme/colors";
import { cn } from "@/lib/cn";

/**
 * Typed text.
 *
 * React Native has no cascading font or colour inheritance, so every text node
 * needs both set explicitly. Colour comes from the theme object as a style, not
 * from a `dark:` class - see theme/colors.ts for why.
 */
type Variant = "display" | "title" | "body" | "small" | "mono" | "monoLg" | "label";

const SIZES: Record<Variant, string> = {
  display: "font-display text-[28px] leading-[34px]",
  title: "font-display text-[19px] leading-[24px]",
  body: "font-sans text-[16px] leading-[24px]",
  small: "font-sans text-[13px] leading-[18px]",
  label: "font-sans text-[11px] uppercase tracking-wide",
  mono: "font-mono text-[13px]",
  monoLg: "font-mono-bold text-[22px]",
};

const MUTED: Variant[] = ["small", "mono", "label"];

export function Text({
  variant = "body",
  tone,
  className,
  style,
  ...props
}: TextProps & {
  variant?: Variant;
  /** Overrides the variant default. `inherit` leaves colour to the caller. */
  tone?: "ink" | "muted" | "primary" | "accent" | "warning" | "danger" | "inherit";
}) {
  const c = useThemeColors();

  const resolved =
    tone === "inherit"
      ? undefined
      : tone === "muted"
        ? c.inkMuted
        : tone === "primary"
          ? c.primary
          : tone === "accent"
            ? c.accent
            : tone === "warning"
              ? c.warning
              : tone === "danger"
                ? c.destructive
                : tone === "ink"
                  ? c.ink
                  : MUTED.includes(variant)
                    ? c.inkMuted
                    : c.ink;

  return (
    <RNText
      className={cn(SIZES[variant], className)}
      style={[resolved ? { color: resolved } : null, style]}
      {...props}
    />
  );
}
