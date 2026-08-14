import { INTL_LOCALE, type Locale } from "@/i18n/config";

/**
 * Locale-aware formatting.
 *
 * Hermes ships full ICU in Expo SDK 50+, so Intl works on device. These are
 * plain functions rather than a hook so they can be used outside components.
 */
export function makeFormat(locale: Locale) {
  const intl = INTL_LOCALE[locale];
  return {
    money(value: number | null | undefined, currency = "ETB") {
      if (value === null || value === undefined) return "—";
      try {
        return new Intl.NumberFormat(intl, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${currency} ${value.toFixed(0)}`;
      }
    },
    dateTime(iso: string | null) {
      if (!iso) return "—";
      const d = new Date(iso);
      try {
        return new Intl.DateTimeFormat(intl, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(d);
      } catch {
        return d.toLocaleString();
      }
    },
    day(iso: string) {
      const d = new Date(iso);
      try {
        return new Intl.DateTimeFormat(intl, { month: "short", day: "numeric" })
          .format(d);
      } catch {
        return d.toLocaleDateString();
      }
    },
    percent(rate: number | null) {
      if (rate === null) return "—";
      try {
        return new Intl.NumberFormat(intl, {
          style: "percent",
          maximumFractionDigits: 0,
        }).format(rate);
      } catch {
        return `${Math.round(rate * 100)}%`;
      }
    },
  };
}

/** Whole minutes elapsed, plus the value split from its unit for styling. */
export function elapsed(since: string, now: number = Date.now()) {
  const mins = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000));
  if (mins < 60) return { value: String(mins), minutes: mins, isHours: false };
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return {
    value: rem ? `${hrs}:${String(rem).padStart(2, "0")}` : String(hrs),
    minutes: mins,
    isHours: true,
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}
