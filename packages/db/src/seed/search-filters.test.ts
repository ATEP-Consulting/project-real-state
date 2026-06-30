import { describe, expect, it } from "vitest";
import { searchFilterInsertSchema } from "../schema/search-filters";
import { SEARCH_FILTERS } from "./search-filters";

describe("SEARCH_FILTERS default config", () => {
  it("has the 8 intended keys in order", () => {
    expect(SEARCH_FILTERS.map((f) => f.key)).toEqual([
      "price",
      "beds",
      "baths",
      "propertyType",
      "waterfront",
      "pool",
      "age55",
      "noHoa",
    ]);
  });

  it("every row validates and carries an ES label", () => {
    for (const row of SEARCH_FILTERS) {
      expect(() => searchFilterInsertSchema.parse(row)).not.toThrow();
      expect(row.labelEs, row.key).toBeTruthy();
    }
  });

  it("booleans live in the More-filters panel; primary controls in the bar", () => {
    const advanced = SEARCH_FILTERS.filter((f) => f.advanced).map((f) => f.key);
    expect(advanced).toEqual(["waterfront", "pool", "age55", "noHoa"]);
  });
});
