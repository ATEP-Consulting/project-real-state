// Free, no-token vector style (ADR-012) — Carto Voyager (colored: blue water, green parks,
// warm roads), the Idealista/Redfin look. Override with NEXT_PUBLIC_MAP_STYLE_URL.
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// Central-Florida fallback view when a search has no results to fit to.
export const DEFAULT_VIEW = { center: [-81.38, 28.54] as [number, number], zoom: 9 };
