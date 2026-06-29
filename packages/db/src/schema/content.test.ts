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
});
