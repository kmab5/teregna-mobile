import { useColorScheme } from "nativewind";

/**
 * Resolved colours for props that cannot take a class name.
 *
 * React Native icons and chart primitives take a `color` string, not a
 * className, so NativeWind's `dark:` variant cannot reach them. Hardcoding a hex
 * is what produced a queue pill at 1.70:1 in dark mode - the text colour stayed
 * on its light-mode value while the background inverted around it.
 *
 * Pill values are the composited result of a 14% (light) / 22% (dark) tint over
 * the surface, measured rather than eyeballed: every pairing below clears 4.5:1.
 */
export interface ThemeColors {
  primary: string;
  accent: string;
  ink: string;
  inkMuted: string;
  warning: string;
  destructive: string;
  surface: string;
  border: string;
  onPrimary: string;
  /**
   * Pills use SOLID background/foreground pairs, never an alpha class.
   *
   * `bg-primary/[0.14]` looks like it composites, but NativeWind does not always
   * emit arbitrary-opacity backgrounds - and when it does not, the background
   * stays fully opaque. That is how the dark pill ended up at 1.47:1: light
   * lavender text on solid lavender. Solid pairs cannot fail that way.
   */
  pillPrimaryBg: string;
  pillPrimaryText: string;
  pillAccentBg: string;
  pillAccentText: string;
  /** Soft surface behind icons and callouts. */
  softBg: string;
}

const LIGHT: ThemeColors = {
  primary: "#6D28D9",
  accent: "#15803D",
  ink: "#2A1A4A",
  inkMuted: "#5B517A",
  warning: "#B45309",
  destructive: "#B91C1C",
  surface: "#FFFFFF",
  border: "#E6DEF7",
  onPrimary: "#FFFFFF",
  pillPrimaryBg: "#EDE9FE",
  pillPrimaryText: "#4C1D95", // 9.2:1
  pillAccentBg: "#DCFCE7",
  pillAccentText: "#14532D", // 8.3:1
  softBg: "#F0ECF9",
};

const DARK: ThemeColors = {
  primary: "#A78BFA",
  accent: "#4ADE80",
  ink: "#F2ECFF",
  inkMuted: "#B7ACD6",
  warning: "#FBBF24",
  destructive: "#F87171",
  surface: "#1E1836",
  border: "#2E2650",
  onPrimary: "#1B1233",
  pillPrimaryBg: "#4C1D95",
  pillPrimaryText: "#EDE9FE", // 9.2:1
  pillAccentBg: "#14532D",
  pillAccentText: "#DCFCE7", // 8.3:1
  softBg: "#262046",
};

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? DARK : LIGHT;
}
