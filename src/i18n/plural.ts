import type { Locale } from "./config";

export type PluralCategory = "one" | "other";

/**
 * Plural category selection that works on Hermes.
 *
 * Hermes ships partial Intl: NumberFormat and DateTimeFormat delegate to the
 * platform's ICU, but `Intl.PluralRules` is simply absent on Android. Calling
 * `new Intl.PluralRules(...)` there throws "undefined cannot be used as a
 * constructor" and takes the whole render tree down - which is exactly what
 * happened on device.
 *
 * So: use the real thing when it exists, and fall back to the CLDR rules
 * transcribed below when it does not. No polyfill dependency, because for two
 * locales with two categories each the rules are short enough to state exactly
 * and test against a reference implementation.
 *
 * CLDR cardinal rules (verified against Node's full-ICU Intl.PluralRules):
 *
 *   en   one: i = 1 and v = 0        (0 -> other, 1 -> one, 1.0 -> one, 1.5 -> other)
 *   am   one: i = 0 or n = 1         (0 -> ONE, 0.5 -> one, 1 -> one, 1.5 -> other)
 *
 * That difference at zero is the whole reason this is not a `n === 1` check:
 * Amharic says "0 ደቂቃ" in the singular form.
 */
const hasIntlPluralRules =
  typeof Intl !== "undefined" && typeof Intl.PluralRules === "function";

function cldrFallback(locale: Locale, n: number): PluralCategory {
  const abs = Math.abs(n);
  // i = integer digits, v = visible fraction digits.
  const i = Math.floor(abs);
  const v = Number.isInteger(abs) ? 0 : 1;

  if (locale === "am") {
    return i === 0 || abs === 1 ? "one" : "other";
  }
  // en
  return i === 1 && v === 0 ? "one" : "other";
}

export function createPluralSelector(
  locale: Locale,
  intlLocale: string,
): (n: number) => PluralCategory {
  if (hasIntlPluralRules) {
    try {
      const rules = new Intl.PluralRules(intlLocale);
      return (n) => rules.select(n) as PluralCategory;
    } catch {
      // A runtime that exposes the constructor but rejects the locale.
    }
  }
  return (n) => cldrFallback(locale, n);
}

/** Exported for the parity test, which compares it against a real ICU build. */
export const __cldrFallback = cldrFallback;
