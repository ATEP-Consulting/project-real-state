import { describe, expect, it } from "vitest";
import { searchFilterInsertSchema, searchFilterSelectSchema } from "./search-filters";

describe("search_filters schema", () => {
  it("accepts a valid filter row", () => {
    const parsed = searchFilterInsertSchema.parse({
      key: "price",
      control: "range",
      label: "Price",
      options: [],
    });
    expect(parsed.key).toBe("price");
    expect(parsed.control).toBe("range");
  });

  it("rejects an unknown control", () => {
    expect(() =>
      searchFilterInsertSchema.parse({ key: "x", control: "slider", label: "X" }),
    ).toThrow();
  });

  it("select schema exposes the admin-editable columns", () => {
    const keys = Object.keys(searchFilterSelectSchema.shape);
    expect(keys).toEqual(
      expect.arrayContaining([
        "key",
        "control",
        "label",
        "labelEs",
        "options",
        "advanced",
        "isActive",
      ]),
    );
  });
});
