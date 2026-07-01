import { useRouter } from "next/router";
import { asLocale, type Locale } from "./config";
import { en, type Messages } from "./messages/en";
import { es } from "./messages/es";

const DICTS: Record<Locale, Messages> = { en, es };

export function getMessages(locale: Locale): Messages {
  return DICTS[locale];
}

/** Locale-aware messages for client + server render (reads the active route locale). */
export function useTranslation(): { m: Messages; locale: Locale } {
  const locale = asLocale(useRouter().locale);
  return { m: getMessages(locale), locale };
}

export type { Messages, Locale };
