/** @type {import('tailwindcss').Config} */

/**
 * Brand tokens, ported from teregna-web/src/app/globals.css.
 *
 * React Native has no CSS custom properties, so light/dark cannot be swapped by
 * redefining variables on a parent. NativeWind's `dark:` variant is the
 * mechanism instead, which means each token needs both values named here.
 */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- light ---
        bg: "#FAF7FF",
        surface: "#FFFFFF",
        "surface-2": "#F7F3FE",
        ink: "#2A1A4A",
        "ink-muted": "#5B517A",
        primary: "#6D28D9",
        "primary-hover": "#5B21B6",
        "on-primary": "#FFFFFF",
        accent: "#15803D",
        "on-accent": "#FFFFFF",
        border: "#E6DEF7",
        muted: "#F0ECF9",
        warning: "#B45309",
        destructive: "#B91C1C",
        // Provider chrome. Deliberately NOT `ink` - that token inverts between
        // themes, and using it as a background produced white-on-white on web.
        chrome: "#2A1A4A",
        "on-chrome": "#FFFFFF",
        "on-chrome-muted": "#BDB4D4",
        "chrome-border": "#3D2E63",

        // --- dark ---
        "d-bg": "#141024",
        "d-surface": "#1E1836",
        "d-surface-2": "#262046",
        "d-ink": "#F2ECFF",
        "d-ink-muted": "#B7ACD6",
        "d-primary": "#A78BFA",
        "d-on-primary": "#1B1233",
        "d-accent": "#4ADE80",
        "d-on-accent": "#0B2818",
        "d-border": "#2E2650",
        "d-muted": "#262046",
        "d-warning": "#FBBF24",
        "d-destructive": "#F87171",
        "d-chrome": "#38306E",
        "d-on-chrome": "#F2ECFF",
        "d-on-chrome-muted": "#B7ACD6",
        "d-chrome-border": "#4A4088",
      },
      fontFamily: {
        display: ["Outfit_600SemiBold"],
        sans: ["WorkSans_400Regular"],
        medium: ["WorkSans_500Medium"],
        mono: ["JetBrainsMono_400Regular"],
        "mono-bold": ["JetBrainsMono_600SemiBold"],
      },
      borderRadius: { sm: 6, md: 10, lg: 16 },
    },
  },
  plugins: [],
};
