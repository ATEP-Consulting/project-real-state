# ADR-012 — Map & geospatial search

- **Status:** Accepted (Phase 0). Map provider: **MapLibre GL** (confirmed 2026-06-29).
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

`/search` is the **signature screen**: a synced results-list + interactive-map split view with
hover-card ↔ pin linking, viewport-driven result reloads, a **draw-a-zone** polygon filter, and
clustering — plus map **intelligence layers** (schools, transit, walkability, shops/POI). The map
is WebGL and touches `window`, so it can't be server-rendered.

## Decision

- **Map library: MapLibre GL JS (default, recommended)**, loaded **client-only** via `next/dynamic`
  `{ ssr: false }`. **Mapbox GL JS** is the documented alternative (richer hosted styles/data, but
  requires a token + billing). *(Confirmed: MapLibre — see below.)*
- **Geospatial queries on the backend via PostGIS** (ADR-002): viewport **bbox** (`&&` /
  `ST_MakeEnvelope`), **draw-a-zone** polygon (`ST_Within`/`ST_Intersects`), nearest-POI
  (`ST_DWithin`), and **clustering** (server-side grid/supercluster as appropriate).
- **Synced list ↔ map:** results and pins share one state; panning/zooming refetches for the
  visible area (debounced); hovering a card highlights its pin and vice versa. Filters + viewport
  live in the **query string** (shareable, SSR-friendly, ADR-001).
- **Intelligence layers** (schools/transit/walkability/POI): rendered as toggleable map layers,
  fed by **free or mock data for the demo**, wired behind an interface so **real APIs swap in
  later** with no UI change.
- **Mobile:** a **list/map toggle** (mobile-first), not a cramped split.

## Consequences

- MapLibre keeps the demo free of vendor tokens/billing and avoids lock-in; tiles can come from a
  free/open source for the demo. If we need premium styles/geocoding/traffic, Mapbox is a config
  swap (both share a near-identical GL API).
- PostGIS does the spatial heavy lifting; the map is a presentation layer.
- Query-string state makes searches shareable and the page SSR+CSR friendly.
- Layer data behind an interface means the demo's mock schools/POI become real feeds later without
  touching the map UI (parallels the listings seed→MLS swap, ADR-006).

## Decision confirmed

**Provider:** **MapLibre GL** (confirmed in Phase 0 review). No token, no cost, no lock-in for the
demo. If premium hosted styles / geocoding / specific data layers are ever needed, **Mapbox GL** is
a near-drop-in swap (shared GL API).

## Alternatives considered

- **Google Maps JS API** — easy data layers but heavier licensing/cost and less control over the
  premium look; rejected as default.
- **Leaflet (raster)** — simpler, but no vector/WebGL polish, weaker clustering/draw UX for the
  signature screen.
