import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  DEFAULT_COUNTRY_ISO,
  countryByIso,
  countryName,
  normalizePhone,
  searchCountries,
  sortedCountries,
} from "./phone";

describe("COUNTRIES data", () => {
  it("has a sane, deduped list with valid shapes", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    const isos = new Set(COUNTRIES.map((c) => c.iso));
    expect(isos.size).toBe(COUNTRIES.length); // no duplicate ISO codes
    for (const c of COUNTRIES) {
      expect(c.iso).toMatch(/^[A-Z]{2}$/);
      expect(c.dial).toMatch(/^[1-9]\d{0,3}$/); // 1–4 digits, no leading zero, no '+'
    }
  });

  it("includes the market-critical countries", () => {
    for (const iso of ["US", "CA", "MX", "CO", "VE", "BR", "AR", "ES", "CU", "DO"]) {
      expect(countryByIso(iso)?.iso).toBe(iso);
    }
    expect(countryByIso("US")?.dial).toBe("1");
    expect(countryByIso("ES")?.dial).toBe("34");
  });

  it("defaults to the US", () => {
    expect(DEFAULT_COUNTRY_ISO).toBe("US");
  });
});

describe("countryName", () => {
  it("localizes names per locale", () => {
    expect(countryName("US", "en")).toBe("United States");
    expect(countryName("US", "es")).toBe("Estados Unidos");
    expect(countryName("ES", "es")).toBe("España");
  });
  it("never throws — returns a non-empty string even for unknown regions", () => {
    expect(countryName("ZZ", "en").length).toBeGreaterThan(0); // platform fallback
    expect(countryName("not-a-code", "en")).toBe("not-a-code"); // invalid shape → our fallback
  });
});

describe("normalizePhone", () => {
  it("returns empty for no digits (gating: empty phone stays empty)", () => {
    expect(normalizePhone("1", "")).toBe("");
    expect(normalizePhone("1", "  ( ) - ")).toBe("");
  });
  it("builds +dial + digits, stripping formatting", () => {
    expect(normalizePhone("1", "(305) 555-0148")).toBe("+13055550148");
    expect(normalizePhone("34", "612 34 56 78")).toBe("+34612345678");
  });
  it("drops the trunk leading zero (UK-style)", () => {
    expect(normalizePhone("44", "07911 123456")).toBe("+447911123456");
  });
  it("keeps the leading zero for Italy (the 0 is part of the number)", () => {
    expect(normalizePhone("39", "06 6982 1234")).toBe("+390669821234");
  });
  it("drops a redundant country code the user typed themselves", () => {
    expect(normalizePhone("34", "+34 612 345 678")).toBe("+34612345678");
  });
});

describe("sortedCountries", () => {
  it("pins the US first, then sorts by localized name", () => {
    const en = sortedCountries("en");
    expect(en[0]!.iso).toBe("US");
    const names = en.slice(1).map((c) => countryName(c.iso, "en"));
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en"));
    expect(names).toEqual(sorted);
  });
});

describe("searchCountries", () => {
  it("matches by localized name, accent-insensitively", () => {
    const hit = searchCountries("espana", "es");
    expect(hit.some((c) => c.iso === "ES")).toBe(true);
    expect(searchCountries("Spain", "en").some((c) => c.iso === "ES")).toBe(true);
  });
  it("matches by dial code with or without '+'", () => {
    expect(searchCountries("+34", "en").some((c) => c.iso === "ES")).toBe(true);
    expect(searchCountries("34", "en").some((c) => c.iso === "ES")).toBe(true);
  });
  it("returns the pinned-first full list for an empty query", () => {
    const all = searchCountries("", "en");
    expect(all.length).toBe(COUNTRIES.length);
    expect(all[0]!.iso).toBe("US");
  });
});
