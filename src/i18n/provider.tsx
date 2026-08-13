import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getLocales } from "expo-localization";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { createTranslator, type Translator } from "./translate";
import { en } from "./messages/en";
import { am } from "./messages/am";
import type { Messages } from "./messages/en";

const CATALOGUES: Record<Locale, Messages> = { en, am };
const STORE_KEY = "teregna_locale";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  ready: boolean;
}

const I18nContext = createContext<Ctx | null>(null);

/**
 * Locale state.
 *
 * Unlike the web app - where the locale is a cookie read on the server before
 * render - a native app has to load it asynchronously at startup. `ready` lets
 * the root layout hold the splash screen until then, so nobody sees English
 * flash before their choice is applied.
 *
 * With no stored choice we follow the device language, which is the behaviour an
 * Amharic-speaking user expects on first launch.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let resolved: Locale = DEFAULT_LOCALE;
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (isLocale(stored)) {
          resolved = stored;
        } else {
          const device = getLocales()[0]?.languageCode;
          if (isLocale(device)) resolved = device;
        }
      } catch {
        // A storage failure must not block the app; fall back to the default.
      }
      if (!cancelled) {
        setLocaleState(resolved);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      ready,
      setLocale: (l: Locale) => {
        setLocaleState(l);
        void SecureStore.setItemAsync(STORE_KEY, l).catch(() => {});
      },
    }),
    [locale, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): Translator {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return useMemo(
    () => createTranslator(ctx.locale, CATALOGUES[ctx.locale]),
    [ctx.locale],
  );
}

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used inside <I18nProvider>");
  return { locale: ctx.locale, setLocale: ctx.setLocale, ready: ctx.ready };
}
