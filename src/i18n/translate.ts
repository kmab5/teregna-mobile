import { INTL_LOCALE, type Locale } from "./config";
import type { MessageKey, Messages } from "./messages/en";

export type Values = Record<string, string | number>;

/**
 * Interpolates `{name}` placeholders. Deliberately not a template engine: the
 * catalogue holds sentences, not logic.
 */
function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in values ? String(values[key]) : whole,
  );
}

export type Translator = {
  (key: MessageKey, values?: Values): string;
  /**
   * Picks between `<base>.one` and `<base>.other` using the locale's real CLDR
   * plural categories via Intl.PluralRules.
   *
   * This is why it is not a `count === 1` check: Amharic puts 0 in the `one`
   * category, so "0 waiting" takes the singular form. Hard-coding English
   * rules would produce wrong Amharic on every zero.
   */
  plural: (base: string, count: number, values?: Values) => string;
  locale: Locale;
  intlLocale: string;
};

export function createTranslator(locale: Locale, messages: Messages): Translator {
  const pluralRules = new Intl.PluralRules(INTL_LOCALE[locale]);

  const t = ((key: MessageKey, values?: Values) => {
    const template = messages[key];
    if (template === undefined) {
      // Types make this unreachable at build time; this only guards a stale
      // client bundle against a newer catalogue.
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }
    return interpolate(template, values);
  }) as Translator;

  t.plural = (base, count, values) => {
    const category = pluralRules.select(count);
    const exact = `${base}.${category}` as MessageKey;
    const fallback = `${base}.other` as MessageKey;
    const template = messages[exact] ?? messages[fallback];
    if (template === undefined) return base;
    return interpolate(template, { count, ...values });
  };

  t.locale = locale;
  t.intlLocale = INTL_LOCALE[locale];
  return t;
}
