export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** Next may pass `locale` as string | undefined; normalize to a supported Locale. */
export function asLocale(x: unknown): Locale {
  return isLocale(x) ? x : DEFAULT_LOCALE;
}

/** Localized value with a silent EN fallback: ES only when present + non-blank under `es`. */
export function pickLocalized(
  base: string,
  es: string | null | undefined,
  locale: Locale,
): string {
  if (locale === "es" && typeof es === "string" && es.trim() !== "") return es;
  return base;
}
