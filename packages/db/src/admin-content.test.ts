import { describe, expect, it } from "vitest";
import { guideUpsertSchema } from "./admin-content";

describe("guideUpsertSchema", () => {
  it("requires a title and defaults to draft", () => {
    const r = guideUpsertSchema.safeParse({ title: "My guide" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("draft");
  });
  it("accepts optional slug / body / status=published", () => {
    const r = guideUpsertSchema.safeParse({
      title: "My guide",
      slug: "my-guide",
      body: "## Hello\n\nSome **markdown**.",
      status: "published",
    });
    expect(r.success).toBe(true);
  });
  it("rejects an empty payload or a bad status", () => {
    expect(guideUpsertSchema.safeParse({}).success).toBe(false);
    expect(guideUpsertSchema.safeParse({ title: "x", status: "live" }).success).toBe(false);
  });
  it("accepts and preserves ES fields when provided", () => {
    const r = guideUpsertSchema.safeParse({
      title: "My guide",
      titleEs: "Mi guía",
      excerptEs: "Un resumen corto",
      bodyEs: "## Sección\n\nTexto en español.",
      metaTitleEs: "Título Meta ES",
      metaDescriptionEs: "Descripción meta en español",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.titleEs).toBe("Mi guía");
      expect(r.data.excerptEs).toBe("Un resumen corto");
      expect(r.data.bodyEs).toBe("## Sección\n\nTexto en español.");
      expect(r.data.metaTitleEs).toBe("Título Meta ES");
      expect(r.data.metaDescriptionEs).toBe("Descripción meta en español");
    }
  });
  it("parses successfully when ES fields are omitted (all optional)", () => {
    const r = guideUpsertSchema.safeParse({ title: "English only" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.titleEs).toBeUndefined();
      expect(r.data.metaTitleEs).toBeUndefined();
    }
  });
});
