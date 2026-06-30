import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { searchFilters, type SearchFilter } from "./schema/search-filters";

// JSON-safe projection (no timestamps) — the shape passed to /search as the `filters` prop.
export type SearchFilterConfig = Pick<
  SearchFilter,
  "key" | "control" | "label" | "labelEs" | "options" | "advanced"
>;

/** Active filters in display order. Drives the /search filter bar (admin-editable in D11). */
export async function getSearchFilters(): Promise<SearchFilterConfig[]> {
  return getDb()
    .select({
      key: searchFilters.key,
      control: searchFilters.control,
      label: searchFilters.label,
      labelEs: searchFilters.labelEs,
      options: searchFilters.options,
      advanced: searchFilters.advanced,
    })
    .from(searchFilters)
    .where(eq(searchFilters.isActive, true))
    .orderBy(asc(searchFilters.sortOrder));
}
