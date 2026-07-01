/**
 * ADR-020 — Per-surface locale-aware consent wording selectors.
 *
 * Each capture surface stores the wording matching ITS OWN copy. EN values are
 * byte-identical to the original strings before D13 (verified against git 39e25af).
 * Only the wording string is locale-aware. Channel, purpose, and granted logic are unchanged.
 */

export type Locale = "en" | "es";

// ---------------------------------------------------------------------------
// Qualification flow (Buy / Sell / Rent) — "my real estate needs"
// ---------------------------------------------------------------------------
export const QUALIFICATION_CONSENT_WORDING_EN =
  "I agree to be contacted by Herrera about my real estate needs using the details I provided. Message/data rates may apply.";
export const QUALIFICATION_CONSENT_WORDING_ES =
  "Acepto que Herrera se comunique conmigo sobre mis necesidades inmobiliarias utilizando los datos que proporcioné. Pueden aplicar tarifas de mensajes/datos.";

/** Returns the qualification-flow contact consent wording in the given locale (defaults to EN). */
export function qualificationConsentWording(locale?: Locale): string {
  return locale === "es" ? QUALIFICATION_CONSENT_WORDING_ES : QUALIFICATION_CONSENT_WORDING_EN;
}

// ---------------------------------------------------------------------------
// General contact form — "this enquiry"
// ---------------------------------------------------------------------------
export const CONTACT_FORM_CONSENT_WORDING_EN =
  "Contact form — agreed to be contacted about this enquiry.";
export const CONTACT_FORM_CONSENT_WORDING_ES =
  "Formulario de contacto — acepto ser contactado/a sobre esta consulta.";

/** Returns the contact-form consent wording in the given locale (defaults to EN). */
export function contactFormConsentWording(locale?: Locale): string {
  return locale === "es" ? CONTACT_FORM_CONSENT_WORDING_ES : CONTACT_FORM_CONSENT_WORDING_EN;
}

// ---------------------------------------------------------------------------
// Per-listing inquiry — "this property"
// ---------------------------------------------------------------------------
export const INQUIRY_CONSENT_WORDING_EN =
  "I agree to be contacted by Herrera about this property using the details I provided. Message/data rates may apply.";
export const INQUIRY_CONSENT_WORDING_ES =
  "Acepto que Herrera se comunique conmigo sobre esta propiedad utilizando los datos que proporcioné. Pueden aplicar tarifas de mensajes/datos.";

/** Returns the per-listing inquiry consent wording in the given locale (defaults to EN). */
export function inquiryConsentWording(locale?: Locale): string {
  return locale === "es" ? INQUIRY_CONSENT_WORDING_ES : INQUIRY_CONSENT_WORDING_EN;
}

// ---------------------------------------------------------------------------
// Marketing opt-in (email-scoped, always optional) — shared across surfaces
// ---------------------------------------------------------------------------
export const MARKETING_WORDING_EN =
  "I'd like to receive news and new listings from Herrera by email.";
export const MARKETING_WORDING_ES =
  "Quiero recibir novedades y nuevas propiedades por correo (opcional).";

/** Returns the marketing opt-in wording in the given locale (defaults to EN). */
export function marketingConsentWording(locale?: Locale): string {
  return locale === "es" ? MARKETING_WORDING_ES : MARKETING_WORDING_EN;
}
