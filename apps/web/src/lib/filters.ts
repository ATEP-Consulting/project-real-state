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
  paramKeys: (keyof SearchParams)[]; // the SearchParams field(s) this filter owns
  isSet: (p: SearchParams) => boolean;
  clear: (p: SearchParams) => SearchParams;
};

const omit = (p: SearchParams, ...keys: (keyof SearchParams)[]): SearchParams => {
  const next = { ...p };
  for (const k of keys) delete next[k];
  return next;
};

const makeBinding = (
  control: FilterControl,
  paramKeys: (keyof SearchParams)[],
  isSet: (p: SearchParams) => boolean,
): FilterBinding => ({ control, paramKeys, isSet, clear: (p) => omit(p, ...paramKeys) });

// key → typed-param binding. Only keys present here are rendered by the UI — an unknown `key` in the
// DB config is silently ignored (the param/SQL mapping stays in code = injection-safe seam).
export const FILTER_BINDINGS: Record<string, FilterBinding> = {
  price: makeBinding(
    "range",
    ["minPrice", "maxPrice"],
    (p) => p.minPrice != null || p.maxPrice != null,
  ),
  beds: makeBinding("min_select", ["minBeds"], (p) => p.minBeds != null),
  baths: makeBinding("min_select", ["minBaths"], (p) => p.minBaths != null),
  propertyType: makeBinding("enum_select", ["types"], (p) => (p.types?.length ?? 0) > 0),
  waterfront: makeBinding("boolean", ["waterfront"], (p) => p.waterfront === true),
  pool: makeBinding("boolean", ["pool"], (p) => p.pool === true),
  age55: makeBinding("boolean", ["age55"], (p) => p.age55 === true),
  noHoa: makeBinding("boolean", ["noHoa"], (p) => p.noHoa === true),
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

/** Copy just the param keys owned by `configs` out of `p` (e.g. seed a panel draft). */
export function pickKeys(p: SearchParams, configs: FilterConfig[]): SearchParams {
  const out: SearchParams = {};
  for (const c of configs) {
    const b = FILTER_BINDINGS[c.key];
    if (!b) continue;
    for (const k of b.paramKeys) if (p[k] !== undefined) Object.assign(out, { [k]: p[k] });
  }
  return out;
}

/** A patch that clears every param key owned by `configs` (sets them undefined so a merge removes them). */
export function clearKeysPatch(configs: FilterConfig[]): SearchParams {
  const patch: SearchParams = {};
  for (const c of configs) {
    const b = FILTER_BINDINGS[c.key];
    if (!b) continue;
    for (const k of b.paramKeys) Object.assign(patch, { [k]: undefined });
  }
  return patch;
}
