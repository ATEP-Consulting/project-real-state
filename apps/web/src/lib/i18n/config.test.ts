import { describe, expect, it } from "vitest";
import { asLocale, isLocale, pickLocalized } from "./config";

describe("isLocale / asLocale", () => {
  it("recognizes supported locales and defaults the rest", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(asLocale("es")).toBe("es");
    expect(asLocale(undefined)).toBe("en"); // Next passes locale=undefined off-i18n
    expect(asLocale("fr")).toBe("en");
  });
});

describe("pickLocalized (silent EN fallback)", () => {
  it("uses ES only when present and non-empty under es", () => {
    expect(pickLocalized("Home", "Casa", "es")).toBe("Casa");
    expect(pickLocalized("Home", "  ", "es")).toBe("Home"); // blank ES → fall back
    expect(pickLocalized("Home", null, "es")).toBe("Home");
    expect(pickLocalized("Home", "Casa", "en")).toBe("Home"); // en never uses ES
  });
});
