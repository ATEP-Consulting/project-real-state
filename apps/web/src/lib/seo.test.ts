import { describe, expect, it } from "vitest";
import { absoluteUrl, alternatesFor, articleJsonLd, breadcrumbJsonLd, buildSitemapXml, localizedUrl } from "./seo";

describe("absoluteUrl", () => {
  it("joins the site URL + path without double slashes", () => {
    expect(absoluteUrl("/guides/x")).toMatch(/^https?:\/\/[^/]+\/guides\/x$/);
    expect(absoluteUrl("guides/x")).toMatch(/\/guides\/x$/);
  });
});

describe("articleJsonLd", () => {
  it("builds an Article node", () => {
    const j = articleJsonLd({ title: "T", description: "D", url: "https://x/y" }) as Record<
      string,
      unknown
    >;
    expect(j["@type"]).toBe("Article");
    expect(j.headline).toBe("T");
    expect(j.url).toBe("https://x/y");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items in order", () => {
    const j = breadcrumbJsonLd([
      { name: "Home", url: "https://x/" },
      { name: "Guides", url: "https://x/guides" },
    ]) as { itemListElement: { position: number; name: string }[] };
    expect(j.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(j.itemListElement[1]!.name).toBe("Guides");
  });
});

describe("localizedUrl", () => {
  it("en has no prefix; es is prefixed; root is clean", () => {
    expect(localizedUrl("/search", "en")).toMatch(/\/search$/);
    expect(localizedUrl("/search", "es")).toMatch(/\/es\/search$/);
    expect(localizedUrl("/", "es")).toMatch(/\/es$/); // no trailing slash on /es
  });
});

describe("alternatesFor", () => {
  it("emits en, es and x-default (x-default = en)", () => {
    const a = alternatesFor("/guides");
    expect(a.map((x) => x.hrefLang)).toEqual(["en", "es", "x-default"]);
    expect(a.find((x) => x.hrefLang === "x-default")!.href).toBe(
      a.find((x) => x.hrefLang === "en")!.href,
    );
    expect(a.find((x) => x.hrefLang === "es")!.href).toMatch(/\/es\/guides$/);
  });
});

describe("buildSitemapXml", () => {
  it("lists both language URLs for every path with xhtml alternates", () => {
    const xml = buildSitemapXml(["/guides"]);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toMatch(/<loc>[^<]+\/guides<\/loc>/);
    expect(xml).toMatch(/<loc>[^<]+\/es\/guides<\/loc>/);
    expect(xml).toContain('hreflang="x-default"');
  });
});
