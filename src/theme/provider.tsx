import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "nativewind";

export type ThemePreference = "light" | "dark" | "system";

const STORE_KEY = "teregna_theme";

interface Ctx {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** What is actually being rendered, after resolving "system". */
  resolved: "light" | "dark";
  ready: boolean;
}

const ThemeContext = createContext<Ctx | null>(null);

/**
 * Theme preference.
 *
 * "system" is the default and stays an explicit option rather than being implied
 * by the absence of a choice: someone who has set their phone to switch at dusk
 * expects the app to follow, and someone who overrides it expects that to stick.
 * Collapsing the two into a boolean loses that distinction.
 *
 * Stored alongside the locale, so a reinstall of the JS bundle keeps both.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(STORE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
          setColorScheme(stored);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [setColorScheme]);

  const value = useMemo<Ctx>(
    () => ({
      preference,
      ready,
      resolved: colorScheme === "dark" ? "dark" : "light",
      setPreference: (p) => {
        setPreferenceState(p);
        setColorScheme(p);
        void SecureStore.setItemAsync(STORE_KEY, p).catch(() => {});
      },
    }),
    [preference, ready, colorScheme, setColorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePreference must be used inside <ThemeProvider>");
  return ctx;
}
