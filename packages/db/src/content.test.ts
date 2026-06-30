import { describe, expect, it } from "vitest";
import { contentInsertSchema } from "./schema/content";
import { GUIDES } from "./seed/guides";

describe("GUIDES seed", () => {
  it("has 3 published guides with unique slugs that validate", () => {
    expect(GUIDES).toHaveLength(3);
    const slugs = new Set(GUIDES.map((g) => g.slug));
    expect(slugs.size).toBe(3);
    for (const g of GUIDES) {
      expect(g.type).toBe("guide");
      expect(g.status).toBe("published");
      expect(g.title.length).toBeGreaterThan(0);
      expect((g.body ?? "").length).toBeGreaterThan(0);
      expect(() => contentInsertSchema.parse(g)).not.toThrow();
    }
  });
});
