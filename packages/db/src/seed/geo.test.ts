import { describe, expect, it } from "vitest";
import { PLACES, jitterCoord } from "./geo";
import { makeRng } from "./prng";

describe("geo", () => {
  it("has central-Florida places with plausible coordinates", () => {
    expect(PLACES.length).toBeGreaterThanOrEqual(15);
    for (const p of PLACES) {
      expect(p.lat).toBeGreaterThan(27.8);
      expect(p.lat).toBeLessThan(29.0);
      expect(p.lng).toBeGreaterThan(-82.1);
      expect(p.lng).toBeLessThan(-80.9);
      expect(p.zip).toMatch(/^\d{5}$/);
    }
  });

  it("jitters coordinates tightly around the place center (clustering)", () => {
    const rng = makeRng(1);
    const p = PLACES[0]!;
    for (let i = 0; i < 50; i++) {
      const [lng, lat] = jitterCoord(p, rng);
      expect(Math.abs(lat - p.lat)).toBeLessThan(0.03);
      expect(Math.abs(lng - p.lng)).toBeLessThan(0.03);
    }
  });
});
