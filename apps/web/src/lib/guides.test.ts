import { describe, expect, it } from "vitest";
import { localizeGuideDetail, localizeGuideSummary } from "./guides";
import type { GuideDetail, GuideSummary } from "@herrera/db";

const baseSummary: GuideSummary = {
  slug: "test-guide",
  title: "Title EN",
  titleEs: "Título ES",
  excerpt: "Excerpt EN",
  excerptEs: "Extracto ES",
  heroImageUrl: null,
  publishedAt: null,
};

const baseDetail: GuideDetail = {
  ...baseSummary,
  body: "Body EN",
  bodyEs: "Cuerpo ES",
  metaTitle: "Meta EN",
  metaTitleEs: "Meta ES",
  metaDescription: "Desc EN",
  metaDescriptionEs: "Desc ES",
};

describe("localizeGuideSummary", () => {
  it("uses ES values under 'es' locale", () => {
    const result = localizeGuideSummary(baseSummary, "es");
    expect(result.title).toBe("Título ES");
    expect(result.excerpt).toBe("Extracto ES");
  });

  it("uses EN values under 'en' locale", () => {
    const result = localizeGuideSummary(baseSummary, "en");
    expect(result.title).toBe("Title EN");
    expect(result.excerpt).toBe("Excerpt EN");
  });

  it("falls back to EN when ES title is blank", () => {
    const result = localizeGuideSummary({ ...baseSummary, titleEs: "" }, "es");
    expect(result.title).toBe("Title EN");
  });

  it("falls back to EN when ES excerpt is null", () => {
    const result = localizeGuideSummary({ ...baseSummary, excerptEs: null }, "es");
    expect(result.excerpt).toBe("Excerpt EN");
  });
});

describe("localizeGuideDetail", () => {
  it("uses ES values for all fields under 'es' locale", () => {
    const result = localizeGuideDetail(baseDetail, "es");
    expect(result.title).toBe("Título ES");
    expect(result.body).toBe("Cuerpo ES");
    expect(result.metaTitle).toBe("Meta ES");
    expect(result.metaDescription).toBe("Desc ES");
  });

  it("uses EN values for all fields under 'en' locale", () => {
    const result = localizeGuideDetail(baseDetail, "en");
    expect(result.title).toBe("Title EN");
    expect(result.body).toBe("Body EN");
    expect(result.metaTitle).toBe("Meta EN");
    expect(result.metaDescription).toBe("Desc EN");
  });

  it("falls back to EN body when ES body is blank", () => {
    const result = localizeGuideDetail({ ...baseDetail, bodyEs: "" }, "es");
    expect(result.body).toBe("Body EN");
  });

  it("falls back to EN body when ES body is whitespace-only", () => {
    const result = localizeGuideDetail({ ...baseDetail, bodyEs: "   " }, "es");
    expect(result.body).toBe("Body EN");
  });

  it("preserves null body when EN body is null", () => {
    const result = localizeGuideDetail({ ...baseDetail, body: null, bodyEs: null }, "es");
    expect(result.body).toBeNull();
  });

  it("does not expose *Es fields in the returned shape", () => {
    const result = localizeGuideDetail(baseDetail, "es");
    expect("bodyEs" in result).toBe(false);
    expect("titleEs" in result).toBe(false);
    expect("metaTitleEs" in result).toBe(false);
  });
});
