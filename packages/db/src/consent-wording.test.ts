import { describe, expect, it } from "vitest";
import {
  qualificationConsentWording,
  contactFormConsentWording,
  inquiryConsentWording,
  marketingConsentWording,
  QUALIFICATION_CONSENT_WORDING_EN,
  CONTACT_FORM_CONSENT_WORDING_EN,
  INQUIRY_CONSENT_WORDING_EN,
  MARKETING_WORDING_EN,
} from "./consent-wording";

describe("qualificationConsentWording", () => {
  it("returns EN by default (no locale)", () => {
    expect(qualificationConsentWording(undefined)).toBe(QUALIFICATION_CONSENT_WORDING_EN);
  });
  it("returns EN for locale 'en'", () => {
    expect(qualificationConsentWording("en")).toBe(QUALIFICATION_CONSENT_WORDING_EN);
  });
  it("EN wording is byte-for-byte the original (39e25af)", () => {
    expect(QUALIFICATION_CONSENT_WORDING_EN).toBe(
      "I agree to be contacted by Herrera about my real estate needs using the details I provided. Message/data rates may apply.",
    );
  });
  it("returns ES for locale 'es' — general real-estate-needs style", () => {
    expect(qualificationConsentWording("es")).toContain("necesidades inmobiliarias");
  });
  it("ES does not say 'esta propiedad'", () => {
    expect(qualificationConsentWording("es")).not.toContain("esta propiedad");
  });
});

describe("contactFormConsentWording", () => {
  it("returns EN by default (no locale)", () => {
    expect(contactFormConsentWording(undefined)).toBe(CONTACT_FORM_CONSENT_WORDING_EN);
  });
  it("returns EN for locale 'en'", () => {
    expect(contactFormConsentWording("en")).toBe(CONTACT_FORM_CONSENT_WORDING_EN);
  });
  it("EN wording is byte-for-byte the original (39e25af)", () => {
    expect(CONTACT_FORM_CONSENT_WORDING_EN).toBe(
      "Contact form — agreed to be contacted about this enquiry.",
    );
  });
  it("returns ES for locale 'es' — enquiry style", () => {
    expect(contactFormConsentWording("es")).toContain("consulta");
  });
});

describe("inquiryConsentWording", () => {
  it("returns EN by default (no locale)", () => {
    expect(inquiryConsentWording(undefined)).toBe(INQUIRY_CONSENT_WORDING_EN);
  });
  it("returns EN for locale 'en'", () => {
    expect(inquiryConsentWording("en")).toBe(INQUIRY_CONSENT_WORDING_EN);
  });
  it("EN wording is byte-for-byte the original (39e25af)", () => {
    expect(INQUIRY_CONSENT_WORDING_EN).toBe(
      "I agree to be contacted by Herrera about this property using the details I provided. Message/data rates may apply.",
    );
  });
  it("returns ES for locale 'es' — contains 'esta propiedad'", () => {
    expect(inquiryConsentWording("es")).toContain("esta propiedad");
  });
});

describe("marketingConsentWording", () => {
  it("returns EN by default (no locale)", () => {
    expect(marketingConsentWording(undefined)).toBe(MARKETING_WORDING_EN);
  });
  it("returns EN for locale 'en'", () => {
    expect(marketingConsentWording("en")).toBe(MARKETING_WORDING_EN);
  });
  it("EN wording is byte-for-byte the original", () => {
    expect(MARKETING_WORDING_EN).toBe(
      "I'd like to receive news and new listings from Herrera by email.",
    );
  });
  it("returns ES for locale 'es'", () => {
    expect(marketingConsentWording("es")).toContain("novedades");
  });
});
