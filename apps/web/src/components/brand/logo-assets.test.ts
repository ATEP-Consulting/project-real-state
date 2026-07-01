import { describe, expect, it } from "vitest";
import { NH_PATH } from "./nh-path";
import { REALTOR } from "../../data/realtor";

// The NH mark ships as committed, generated path data (Playfair outlines). These guard
// against silent corruption of that asset and the tagline the lockup/footer depend on.
// The component itself is purely presentational, so there is no render logic to test.
describe("NH logo assets", () => {
  it("NH_PATH is a well-formed, non-empty SVG path", () => {
    expect(NH_PATH.length).toBeGreaterThan(500);
    expect(NH_PATH.startsWith("M")).toBe(true);
    // only valid path-command letters + coordinate characters
    expect(NH_PATH).toMatch(/^[MLQCZmlqcz0-9,.\- ]+$/);
  });

  it("exposes the brand tagline rendered by the lockup + footer", () => {
    expect(REALTOR.tagline).toBe("Real Estate · Miami");
  });
});
