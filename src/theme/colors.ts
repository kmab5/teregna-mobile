import { useColorScheme } from "nativewind";

/**
 * The single source of truth for colour.
 *
 * ---------------------------------------------------------------------------
 * Why colour does not use `dark:` classes
 *
 * The app previously had TWO independent mechanisms deciding what "dark" meant:
 * NativeWind's `dark:` variant, and this object. They have to agree on every
 * single element, and when they disagreed the result was dark-mode text painted
 * on light-mode backgrounds - which is what "the pill contrast is ruined" and
 * "the background is too bright" both were.
 *
 * They cannot disagree now, because there is only one of them. NativeWind is
 * used for LAYOUT (flex, spacing, radius, size); every colour comes from here as
 * an inline style. A parity check fails the build on any `dark:` colour class.
 * ---------------------------------------------------------------------------
 */
export interface ThemeColors {
  scheme: "light" | "dark";

  // surfaces
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  muted: string;
  /** Soft tint behind icons and callouts. */
  softBg: string;

  // text
  ink: string;
  inkMuted: string;

  // brand
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  warning: string;
  onWarning: string;
  destructive: string;

  // provider chrome
  chrome: string;
  onChrome: string;
  onChromeMuted: string;
  chromeBorder: string;

  // pills — solid pairs, never alpha, so contrast cannot depend on whether a
  // class compiled
  pillPrimaryBg: string;
  pillPrimaryText: string;
  pillAccentBg: string;
  pillAccentText: string;
  pillWarnBg: string;
  pillWarnText: string;
  pillDangerBg: string;
  pillDangerText: string;
  pillNeutralBg: string;
  pillNeutralText: string;
}

const LIGHT: ThemeColors = {
  scheme: "light",
  bg: "#FAF7FF",
  surface: "#FFFFFF",
  surface2: "#F7F3FE",
  border: "#E6DEF7",
  muted: "#F0ECF9",
  softBg: "#F0ECF9",

  ink: "#2A1A4A",
  inkMuted: "#5B517A",

  primary: "#6D28D9",
  onPrimary: "#FFFFFF",
  accent: "#15803D",
  onAccent: "#FFFFFF",
  warning: "#B45309",
  onWarning: "#FFFFFF",
  destructive: "#B91C1C",

  chrome: "#F3EEFE",
  onChrome: "#2A1A4A",
  onChromeMuted: "#5B517A",
  chromeBorder: "#DDD2F5",

  pillPrimaryBg: "#EDE9FE",
  pillPrimaryText: "#4C1D95",
  pillAccentBg: "#DCFCE7",
  pillAccentText: "#14532D",
  pillWarnBg: "#FEF3C7",
  pillWarnText: "#78350F",
  pillDangerBg: "#FEE2E2",
  pillDangerText: "#7F1D1D",
  pillNeutralBg: "#F0ECF9",
  pillNeutralText: "#4B4370",
};

const DARK: ThemeColors = {
  scheme: "dark",
  bg: "#100D1C",
  surface: "#1A1530",
  surface2: "#221C3D",
  border: "#2E2650",
  muted: "#241E42",
  softBg: "#241E42",

  ink: "#F2ECFF",
  inkMuted: "#B0A5D0",

  primary: "#A78BFA",
  onPrimary: "#1B1233",
  accent: "#4ADE80",
  onAccent: "#0B2818",
  warning: "#FBBF24",
  onWarning: "#3A2606",
  destructive: "#F87171",

  chrome: "#1F1938",
  onChrome: "#F2ECFF",
  onChromeMuted: "#B0A5D0",
  chromeBorder: "#332B57",

  pillPrimaryBg: "#3B2A72",
  pillPrimaryText: "#E9E1FF",
  pillAccentBg: "#12432A",
  pillAccentText: "#BBF7D0",
  pillWarnBg: "#4A3208",
  pillWarnText: "#FDE68A",
  pillDangerBg: "#4C1D1D",
  pillDangerText: "#FECACA",
  pillNeutralBg: "#241E42",
  pillNeutralText: "#CFC6EA",
};

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? DARK : LIGHT;
}
