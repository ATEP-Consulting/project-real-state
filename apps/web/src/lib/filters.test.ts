import { describe, expect, it } from "vitest";
import type { SearchParams } from "./search-params";
import { FILTER_BINDINGS, activeFilterCount, activeFilterKeys, type FilterConfig } from "./filters";

const cfg: FilterConfig[] = [
  { key: "price", control: "range", label: "Price", labelEs: null, options: [], advanced: false },
  {
    key: "waterfront",
    control: "boolean",
    label: "Waterfront",
    labelEs: null,
    options: [],
    advanced: true,
  },
  {
    key: "beds",
    control: "min_select",
    label: "Beds",
    labelEs: null,
    options: [],
    advanced: false,
  },
];

describe("FILTER_BINDINGS", () => {
  it("price isSet when either bound present; clear removes both", () => {
    const p: SearchParams = { minPrice: 300000 };
    expect(FILTER_BINDINGS.price!.isSet(p)).toBe(true);
    expect(FILTER_BINDINGS.price!.clear({ minPrice: 1, maxPrice: 2, minBeds: 2 })).toEqual({
      minBeds: 2,
    });
  });

  it("boolean isSet/clear", () => {
    expect(FILTER_BINDINGS.waterfront!.isSet({ waterfront: true })).toBe(true);
    expect(FILTER_BINDINGS.waterfront!.isSet({})).toBe(false);
    expect(FILTER_BINDINGS.waterfront!.clear({ waterfront: true, pool: true })).toEqual({
      pool: true,
    });
  });

  it("active keys + count reflect only configured + set filters", () => {
    const p: SearchParams = { minPrice: 300000, waterfront: true, q: "x" };
    expect(activeFilterKeys(p, cfg).sort()).toEqual(["price", "waterfront"]);
    expect(activeFilterCount(p, cfg)).toBe(2);
  });
});
