import type { PropertyType, SearchParams } from "./search-params";

// The control union mirrors the DB `search_filter_control` enum 1:1 (kept inline so this stays a
// pure, dependency-free module the UI + tests can import without pulling the DB client).
export type FilterControl = "range" | "min_select" | "enum_select" | "boolean";

// Presentation config for one filter — structurally matches @herrera/db `SearchFilterConfig`
// (a DB row drives which filters show + labels/options/order; this code owns the param binding).
export type FilterConfig = {
  key: string;
  control: FilterControl;
  label: string;
  labelEs: string | null;
  options: { value: string; label: string; labelEs?: string }[];
  advanced: boolean;
};

export type FilterBinding = {
  control: FilterControl;
  isSet: (p: SearchParams) => boolean;
  clear: (p: SearchParams) => SearchParams;
};

const omit = (p: SearchParams, ...keys: (keyof SearchParams)[]): SearchParams => {
  const next = { ...p };
  for (const k of keys) delete next[k];
  return next;
};

const boolBinding = (key: keyof SearchParams): FilterBinding => ({
  control: "boolean",
  isSet: (p) => p[key] === true,
  clear: (p) => omit(p, key),
});

// key → typed-param binding. Only keys present here are rendered by the UI — an unknown `key` in the
// DB config is silently ignored (the param/SQL mapping stays in code = injection-safe seam).
export const FILTER_BINDINGS: Record<string, FilterBinding> = {
  price: {
    control: "range",
    isSet: (p) => p.minPrice != null || p.maxPrice != null,
    clear: (p) => omit(p, "minPrice", "maxPrice"),
  },
  beds: {
    control: "min_select",
    isSet: (p) => p.minBeds != null,
    clear: (p) => omit(p, "minBeds"),
  },
  baths: {
    control: "min_select",
    isSet: (p) => p.minBaths != null,
    clear: (p) => omit(p, "minBaths"),
  },
  propertyType: {
    control: "enum_select",
    isSet: (p) => (p.types?.length ?? 0) > 0,
    clear: (p) => omit(p, "types"),
  },
  waterfront: boolBinding("waterfront"),
  pool: boolBinding("pool"),
  age55: boolBinding("age55"),
  noHoa: boolBinding("noHoa"),
};

export function activeFilterKeys(p: SearchParams, configs: FilterConfig[]): string[] {
  return configs.filter((c) => FILTER_BINDINGS[c.key]?.isSet(p)).map((c) => c.key);
}

export function activeFilterCount(p: SearchParams, configs: FilterConfig[]): number {
  return activeFilterKeys(p, configs).length;
}

// Min-select binding helper (beds/baths share the shape): which SearchParams key a config drives.
export function minKeyFor(key: string): "minBeds" | "minBaths" | null {
  if (key === "beds") return "minBeds";
  if (key === "baths") return "minBaths";
  return null;
}

export const readTypes = (p: SearchParams): PropertyType[] => p.types ?? [];
