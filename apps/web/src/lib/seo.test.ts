import { describe, expect, it } from "vitest";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd } from "./seo";

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
