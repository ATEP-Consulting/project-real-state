import { describe, expect, it } from "vitest";
import { contentInsertSchema } from "./content";

const base = {
  type: "neighborhood" as const,
  slug: "winter-park",
  title: "Winter Park",
};

describe("contentInsertSchema", () => {
  it("accepts a valid neighborhood page", () => {
    expect(() => contentInsertSchema.parse(base)).not.toThrow();
  });

  it("rejects an invalid content type", () => {
    expect(() => contentInsertSchema.parse({ ...base, type: "wiki" })).toThrow();
  });

  it("accepts metaTitleEs and metaDescriptionEs (nullable ES SEO columns)", () => {
    const parsed = contentInsertSchema.parse({
      ...base,
      metaTitleEs: "Parque de Invierno | Casas en Venta",
      metaDescriptionEs: "Explore propiedades en venta en Winter Park, Florida.",
    });
    expect(parsed.metaTitleEs).toBe("Parque de Invierno | Casas en Venta");
    expect(parsed.metaDescriptionEs).toBe("Explore propiedades en venta en Winter Park, Florida.");
  });

  it("accepts metaTitleEs and metaDescriptionEs as undefined (nullable)", () => {
    const parsed = contentInsertSchema.parse(base);
    expect(parsed.metaTitleEs).toBeUndefined();
    expect(parsed.metaDescriptionEs).toBeUndefined();
  });
});
