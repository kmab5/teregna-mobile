import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Typed text with the brand faces applied.
 *
 * A wrapper rather than raw <Text> because React Native has no cascading font
 * inheritance - every text node needs the family set explicitly, and forgetting
 * one silently falls back to the system font.
 */
type Variant = "display" | "title" | "body" | "small" | "mono" | "monoLg";

const VARIANTS: Record<Variant, string> = {
  display: "font-display text-[28px] leading-[34px] text-ink dark:text-d-ink",
  title: "font-display text-[19px] leading-[24px] text-ink dark:text-d-ink",
  body: "font-sans text-[16px] leading-[24px] text-ink dark:text-d-ink",
  small: "font-sans text-[13px] leading-[18px] text-ink-muted dark:text-d-ink-muted",
  mono: "font-mono text-[13px] text-ink-muted dark:text-d-ink-muted",
  monoLg: "font-mono-bold text-[22px] text-ink dark:text-d-ink",
};

export function Text({
  variant = "body",
  className,
  ...props
}: TextProps & { variant?: Variant }) {
  return <RNText className={cn(VARIANTS[variant], className)} {...props} />;
}
