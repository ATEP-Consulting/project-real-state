import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Coral Gables")).toBe("coral-gables");
  });
  it("collapses non-alphanumeric runs and trims", () => {
    expect(slugify("Coconut  Grove!")).toBe("coconut-grove");
    expect(slugify("Brickell & Bay")).toBe("brickell-bay");
  });
  it("strips accents", () => {
    expect(slugify("Café Brí")).toBe("cafe-bri");
  });
});
