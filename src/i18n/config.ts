/** Locale configuration. No URL prefixes - see the note in ./index.ts. */

export const LOCALES = ["en", "am"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Persisted in SecureStore so the choice survives a reinstall of the JS bundle. */
export const LOCALE_COOKIE = "teregna_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
};

/**
 * BCP-47 tags for Intl.*. Amharic as spoken in Ethiopia, so dates, numbers and
 * currency follow local convention rather than a generic Amharic default.
 */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-ET",
  am: "am-ET",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
