// Human-readable labels for the internal `leads.source` capture keys (the raw
// snake_case values stored at lead creation). One place to add new sources.
export const SOURCE_LABEL: Record<string, string> = {
  qualification_flow: "Buy/Sell/Rent form",
  listing_inquiry: "Listing inquiry",
};

/** Friendly label for a stored source key; prettifies unknown keys, dash for none. */
export function formatSource(source: string | null): string {
  if (!source) return "—";
  return SOURCE_LABEL[source] ?? source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
