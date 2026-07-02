import type { Locale } from "./i18n/config";

/**
 * Country calling-code data + phone normalization for the PhoneInput control.
 *
 * Deliberately LOOSE (lead-gen first, ADR-007): we normalize what the user typed
 * into a "+<dial><digits>" shape so Nilyan can always dial/WhatsApp back, but we
 * never run strict per-country validation — a validator that rejects a real
 * number loses a real lead. Country names come from Intl.DisplayNames, so the
 * list stays a tiny iso→dial table instead of a 240-name×2-locale dictionary.
 */
export type Country = { iso: string; dial: string };

export const DEFAULT_COUNTRY_ISO = "US";

// ISO 3166-1 alpha-2 → ITU E.164 calling code. NANP members all share dial "1"
// (the area code is part of the subscriber number).
export const COUNTRIES: Country[] = [
  { iso: "AD", dial: "376" },
  { iso: "AE", dial: "971" },
  { iso: "AF", dial: "93" },
  { iso: "AG", dial: "1" },
  { iso: "AI", dial: "1" },
  { iso: "AL", dial: "355" },
  { iso: "AM", dial: "374" },
  { iso: "AO", dial: "244" },
  { iso: "AR", dial: "54" },
  { iso: "AS", dial: "1" },
  { iso: "AT", dial: "43" },
  { iso: "AU", dial: "61" },
  { iso: "AW", dial: "297" },
  { iso: "AZ", dial: "994" },
  { iso: "BA", dial: "387" },
  { iso: "BB", dial: "1" },
  { iso: "BD", dial: "880" },
  { iso: "BE", dial: "32" },
  { iso: "BF", dial: "226" },
  { iso: "BG", dial: "359" },
  { iso: "BH", dial: "973" },
  { iso: "BI", dial: "257" },
  { iso: "BJ", dial: "229" },
  { iso: "BM", dial: "1" },
  { iso: "BN", dial: "673" },
  { iso: "BO", dial: "591" },
  { iso: "BQ", dial: "599" },
  { iso: "BR", dial: "55" },
  { iso: "BS", dial: "1" },
  { iso: "BT", dial: "975" },
  { iso: "BW", dial: "267" },
  { iso: "BY", dial: "375" },
  { iso: "BZ", dial: "501" },
  { iso: "CA", dial: "1" },
  { iso: "CD", dial: "243" },
  { iso: "CF", dial: "236" },
  { iso: "CG", dial: "242" },
  { iso: "CH", dial: "41" },
  { iso: "CI", dial: "225" },
  { iso: "CK", dial: "682" },
  { iso: "CL", dial: "56" },
  { iso: "CM", dial: "237" },
  { iso: "CN", dial: "86" },
  { iso: "CO", dial: "57" },
  { iso: "CR", dial: "506" },
  { iso: "CU", dial: "53" },
  { iso: "CV", dial: "238" },
  { iso: "CW", dial: "599" },
  { iso: "CY", dial: "357" },
  { iso: "CZ", dial: "420" },
  { iso: "DE", dial: "49" },
  { iso: "DJ", dial: "253" },
  { iso: "DK", dial: "45" },
  { iso: "DM", dial: "1" },
  { iso: "DO", dial: "1" },
  { iso: "DZ", dial: "213" },
  { iso: "EC", dial: "593" },
  { iso: "EE", dial: "372" },
  { iso: "EG", dial: "20" },
  { iso: "ER", dial: "291" },
  { iso: "ES", dial: "34" },
  { iso: "ET", dial: "251" },
  { iso: "FI", dial: "358" },
  { iso: "FJ", dial: "679" },
  { iso: "FK", dial: "500" },
  { iso: "FM", dial: "691" },
  { iso: "FO", dial: "298" },
  { iso: "FR", dial: "33" },
  { iso: "GA", dial: "241" },
  { iso: "GB", dial: "44" },
  { iso: "GD", dial: "1" },
  { iso: "GE", dial: "995" },
  { iso: "GF", dial: "594" },
  { iso: "GG", dial: "44" },
  { iso: "GH", dial: "233" },
  { iso: "GI", dial: "350" },
  { iso: "GL", dial: "299" },
  { iso: "GM", dial: "220" },
  { iso: "GN", dial: "224" },
  { iso: "GP", dial: "590" },
  { iso: "GQ", dial: "240" },
  { iso: "GR", dial: "30" },
  { iso: "GT", dial: "502" },
  { iso: "GU", dial: "1" },
  { iso: "GW", dial: "245" },
  { iso: "GY", dial: "592" },
  { iso: "HK", dial: "852" },
  { iso: "HN", dial: "504" },
  { iso: "HR", dial: "385" },
  { iso: "HT", dial: "509" },
  { iso: "HU", dial: "36" },
  { iso: "ID", dial: "62" },
  { iso: "IE", dial: "353" },
  { iso: "IL", dial: "972" },
  { iso: "IM", dial: "44" },
  { iso: "IN", dial: "91" },
  { iso: "IQ", dial: "964" },
  { iso: "IR", dial: "98" },
  { iso: "IS", dial: "354" },
  { iso: "IT", dial: "39" },
  { iso: "JE", dial: "44" },
  { iso: "JM", dial: "1" },
  { iso: "JO", dial: "962" },
  { iso: "JP", dial: "81" },
  { iso: "KE", dial: "254" },
  { iso: "KG", dial: "996" },
  { iso: "KH", dial: "855" },
  { iso: "KI", dial: "686" },
  { iso: "KM", dial: "269" },
  { iso: "KN", dial: "1" },
  { iso: "KR", dial: "82" },
  { iso: "KW", dial: "965" },
  { iso: "KY", dial: "1" },
  { iso: "KZ", dial: "7" },
  { iso: "LA", dial: "856" },
  { iso: "LB", dial: "961" },
  { iso: "LC", dial: "1" },
  { iso: "LI", dial: "423" },
  { iso: "LK", dial: "94" },
  { iso: "LR", dial: "231" },
  { iso: "LS", dial: "266" },
  { iso: "LT", dial: "370" },
  { iso: "LU", dial: "352" },
  { iso: "LV", dial: "371" },
  { iso: "LY", dial: "218" },
  { iso: "MA", dial: "212" },
  { iso: "MC", dial: "377" },
  { iso: "MD", dial: "373" },
  { iso: "ME", dial: "382" },
  { iso: "MG", dial: "261" },
  { iso: "MH", dial: "692" },
  { iso: "MK", dial: "389" },
  { iso: "ML", dial: "223" },
  { iso: "MM", dial: "95" },
  { iso: "MN", dial: "976" },
  { iso: "MO", dial: "853" },
  { iso: "MP", dial: "1" },
  { iso: "MQ", dial: "596" },
  { iso: "MR", dial: "222" },
  { iso: "MS", dial: "1" },
  { iso: "MT", dial: "356" },
  { iso: "MU", dial: "230" },
  { iso: "MV", dial: "960" },
  { iso: "MW", dial: "265" },
  { iso: "MX", dial: "52" },
  { iso: "MY", dial: "60" },
  { iso: "MZ", dial: "258" },
  { iso: "NA", dial: "264" },
  { iso: "NC", dial: "687" },
  { iso: "NE", dial: "227" },
  { iso: "NG", dial: "234" },
  { iso: "NI", dial: "505" },
  { iso: "NL", dial: "31" },
  { iso: "NO", dial: "47" },
  { iso: "NP", dial: "977" },
  { iso: "NR", dial: "674" },
  { iso: "NU", dial: "683" },
  { iso: "NZ", dial: "64" },
  { iso: "OM", dial: "968" },
  { iso: "PA", dial: "507" },
  { iso: "PE", dial: "51" },
  { iso: "PF", dial: "689" },
  { iso: "PG", dial: "675" },
  { iso: "PH", dial: "63" },
  { iso: "PK", dial: "92" },
  { iso: "PL", dial: "48" },
  { iso: "PM", dial: "508" },
  { iso: "PR", dial: "1" },
  { iso: "PS", dial: "970" },
  { iso: "PT", dial: "351" },
  { iso: "PW", dial: "680" },
  { iso: "PY", dial: "595" },
  { iso: "QA", dial: "974" },
  { iso: "RE", dial: "262" },
  { iso: "RO", dial: "40" },
  { iso: "RS", dial: "381" },
  { iso: "RU", dial: "7" },
  { iso: "RW", dial: "250" },
  { iso: "SA", dial: "966" },
  { iso: "SB", dial: "677" },
  { iso: "SC", dial: "248" },
  { iso: "SD", dial: "249" },
  { iso: "SE", dial: "46" },
  { iso: "SG", dial: "65" },
  { iso: "SH", dial: "290" },
  { iso: "SI", dial: "386" },
  { iso: "SK", dial: "421" },
  { iso: "SL", dial: "232" },
  { iso: "SM", dial: "378" },
  { iso: "SN", dial: "221" },
  { iso: "SO", dial: "252" },
  { iso: "SR", dial: "597" },
  { iso: "SS", dial: "211" },
  { iso: "ST", dial: "239" },
  { iso: "SV", dial: "503" },
  { iso: "SX", dial: "1" },
  { iso: "SY", dial: "963" },
  { iso: "SZ", dial: "268" },
  { iso: "TC", dial: "1" },
  { iso: "TD", dial: "235" },
  { iso: "TG", dial: "228" },
  { iso: "TH", dial: "66" },
  { iso: "TJ", dial: "992" },
  { iso: "TK", dial: "690" },
  { iso: "TL", dial: "670" },
  { iso: "TM", dial: "993" },
  { iso: "TN", dial: "216" },
  { iso: "TO", dial: "676" },
  { iso: "TR", dial: "90" },
  { iso: "TT", dial: "1" },
  { iso: "TV", dial: "688" },
  { iso: "TW", dial: "886" },
  { iso: "TZ", dial: "255" },
  { iso: "UA", dial: "380" },
  { iso: "UG", dial: "256" },
  { iso: "US", dial: "1" },
  { iso: "UY", dial: "598" },
  { iso: "UZ", dial: "998" },
  { iso: "VA", dial: "39" },
  { iso: "VC", dial: "1" },
  { iso: "VE", dial: "58" },
  { iso: "VG", dial: "1" },
  { iso: "VI", dial: "1" },
  { iso: "VN", dial: "84" },
  { iso: "VU", dial: "678" },
  { iso: "WF", dial: "681" },
  { iso: "WS", dial: "685" },
  { iso: "XK", dial: "383" },
  { iso: "YE", dial: "967" },
  { iso: "YT", dial: "262" },
  { iso: "ZA", dial: "27" },
  { iso: "ZM", dial: "260" },
  { iso: "ZW", dial: "263" },
];

const BY_ISO = new Map(COUNTRIES.map((c) => [c.iso, c]));

export function countryByIso(iso: string): Country | undefined {
  return BY_ISO.get(iso);
}

// Countries where the trunk "0" is PART of the subscriber number (never strip it).
const KEEP_LEADING_ZERO_DIALS = new Set(["39"]); // Italy (+ Vatican via 39)

/** Localized country display name (Intl.DisplayNames), ISO code as fallback. */
export function countryName(iso: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(iso) ?? iso;
  } catch {
    return iso;
  }
}

/**
 * "+<dial><digits>" from what the user typed, or "" when there are no digits
 * (so an untouched phone field never satisfies the phone-or-email gate).
 * Strips formatting, a self-typed country code, and the trunk zero (except IT).
 */
export function normalizePhone(dial: string, national: string): string {
  let digits = national.replace(/\D/g, "");
  if (!digits) return "";
  // User typed the country code themselves ("+34 612..." or "0034612...").
  if (national.trim().startsWith("+") && digits.startsWith(dial)) {
    digits = digits.slice(dial.length);
  } else if (digits.startsWith(`00${dial}`)) {
    digits = digits.slice(dial.length + 2);
  }
  if (!KEEP_LEADING_ZERO_DIALS.has(dial)) digits = digits.replace(/^0+/, "");
  if (!digits) return "";
  return `+${dial}${digits}`;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Full list, US pinned first, the rest A→Z by localized name. */
export function sortedCountries(locale: Locale): Country[] {
  const rest = COUNTRIES.filter((c) => c.iso !== DEFAULT_COUNTRY_ISO).sort((a, b) =>
    countryName(a.iso, locale).localeCompare(countryName(b.iso, locale), locale),
  );
  const us = countryByIso(DEFAULT_COUNTRY_ISO);
  return us ? [us, ...rest] : rest;
}

/** Filter by localized name (accent-insensitive), ISO code, or dial code (± "+"). */
export function searchCountries(query: string, locale: Locale): Country[] {
  const q = fold(query.trim().replace(/^\+/, ""));
  const all = sortedCountries(locale);
  if (!q) return all;
  return all.filter(
    (c) =>
      fold(countryName(c.iso, locale)).includes(q) ||
      c.iso.toLowerCase() === q ||
      c.dial.startsWith(q),
  );
}
