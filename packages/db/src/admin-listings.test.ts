import { describe, expect, it } from "vitest";
import { manualListingSchema } from "./admin-listings";
import { uniqueSlug } from "./slug";

describe("manualListingSchema", () => {
  const base = {
    propertyType: "condo",
    price: 500000,
    addressLine1: "1 A St",
    city: "Miami",
    zip: "33101",
  };

  it("requires core fields and applies defaults", () => {
    const r = manualListingSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.state).toBe("FL");
      expect(r.data.visibility).toBe("private_link");
      expect(r.data.status).toBe("off_market");
    }
  });

  it("accepts descriptionEs when provided and preserves its value", () => {
    const r = manualListingSchema.safeParse({ ...base, descriptionEs: "Hermosa propiedad" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.descriptionEs).toBe("Hermosa propiedad");
  });

  it("parses successfully when descriptionEs is omitted (optional)", () => {
    const r = manualListingSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.descriptionEs == null).toBe(true);
  });

  it("rejects a bad visibility / property type / missing price", () => {
    expect(manualListingSchema.safeParse({ ...base, visibility: "nope" }).success).toBe(false);
    expect(manualListingSchema.safeParse({ ...base, propertyType: "castle" }).success).toBe(false);
    expect(
      manualListingSchema.safeParse({
        propertyType: "condo",
        addressLine1: "x",
        city: "c",
        zip: "1",
      }).success,
    ).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("suffixes collisions", () => {
    expect(uniqueSlug("a", [])).toBe("a");
    expect(uniqueSlug("a", ["b"])).toBe("a");
    expect(uniqueSlug("a", ["a", "a-2"])).toBe("a-3");
  });
});
