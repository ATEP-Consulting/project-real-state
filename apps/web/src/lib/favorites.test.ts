import { describe, expect, it } from "vitest";
import { favoritesCaptureCopy } from "./favorites";

describe("favoritesCaptureCopy", () => {
  it("uses the singular for 0 or 1 saved home", () => {
    expect(favoritesCaptureCopy(0).sub).toContain("this home");
    expect(favoritesCaptureCopy(1).sub).toContain("this home");
  });
  it("uses the plural for 2+ saved homes", () => {
    expect(favoritesCaptureCopy(2).sub).toContain("these homes");
    expect(favoritesCaptureCopy(9).sub).toContain("these homes");
  });
});
