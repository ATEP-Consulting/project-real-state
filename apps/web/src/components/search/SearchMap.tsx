import { useEffect, useRef } from "react";
import {
  Map as MlMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type MapMouseEvent,
} from "maplibre-gl";
import { pointsToGeoJSON, type ListingMapPoint } from "@/lib/map-points";
import { DEFAULT_VIEW } from "@/lib/map-style";
import type { Bbox } from "@/lib/search-params";
import { useDrawZone } from "./useDrawZone";
import styles from "./SearchMap.module.css";

export type InitialView =
  | { kind: "bounds"; bounds: [number, number, number, number] }
  | { kind: "center"; center: [number, number]; zoom: number };

const SRC = "listings";

export function SearchMap({
  points,
  initialView,
  hoveredSlug,
  onHoverSlug,
  onViewportChange,
  styleUrl,
  drawnPoly,
  onPolyChange,
  drawing,
  onDrawingChange,
}: {
  points: ListingMapPoint[];
  initialView: InitialView;
  hoveredSlug: string | null;
  onHoverSlug: (slug: string | null) => void;
  onViewportChange: (bbox: Bbox) => void;
  styleUrl: string;
  drawnPoly: [number, number][] | null;
  onPolyChange: (ring: [number, number][] | null) => void;
  drawing: boolean;
  onDrawingChange: (on: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  // Unclustered listings render as HTML-marker price pills (white chip + shadow + dark price —
  // the Redfin/Idealista look), pooled by slug. A symbol layer can't do this cleanly: SDF tinting
  // balloons the icon, plain icons can't tint on hover, and 9-slice sizing is brittle. DOM markers
  // give full CSS control (shadow, hover scale), reliable two-way hover, and easy clicks.
  const markersRef = useRef<globalThis.Map<string, Marker>>(new window.Map());
  const hoveredRef = useRef<string | null>(null);
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MlMap({
      container: containerRef.current,
      style: styleUrl,
      attributionControl: { compact: true },
      // Initialize at a LOW (region) zoom. A clustered GeoJSON source created while the map is
      // already at high zoom never generates its tiles (a blank listings layer); created at low
      // zoom it tiles, and we then fit to the target view — which re-tiles cleanly, exactly like
      // interactive zooming does.
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const markerPool = markersRef.current; // stable Map instance; safe to use in cleanup

    // Build (or refresh) the price-pill markers for the unclustered listings currently in view.
    // Pooled by slug: existing markers are re-positioned, gone ones removed, new ones created.
    const syncMarkers = () => {
      if (!map.getSource(SRC)) return;
      let feats: ReturnType<typeof map.querySourceFeatures>;
      try {
        feats = map.querySourceFeatures(SRC, { filter: ["!", ["has", "point_count"]] });
      } catch {
        return;
      }
      const pool = markerPool;
      const seen = new Set<string>();
      for (const f of feats) {
        const slug = f.properties?.slug as string | undefined;
        if (!slug || seen.has(slug)) continue; // dedupe: a point can appear in several tiles
        seen.add(slug);
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const existing = pool.get(slug);
        if (existing) {
          existing.setLngLat(coords);
          continue;
        }
        // marker root (positioned by MapLibre) wraps the pill button (free to scale on hover
        // without fighting MapLibre's positioning transform on the root).
        const root = document.createElement("div");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = styles.pricePin!;
        btn.textContent = (f.properties?.priceLabel as string | undefined) ?? "";
        btn.setAttribute("aria-label", `View listing — ${btn.textContent}`);
        if (slug === hoveredRef.current) btn.classList.add(styles.pricePinActive!);
        btn.addEventListener("mouseenter", () => onHoverSlug(slug));
        btn.addEventListener("mouseleave", () => onHoverSlug(null));
        btn.addEventListener("focus", () => onHoverSlug(slug));
        btn.addEventListener("blur", () => onHoverSlug(null));
        btn.addEventListener("click", () => window.location.assign(`/homes/${slug}`));
        root.appendChild(btn);
        const marker = new Marker({ element: root }).setLngLat(coords).addTo(map);
        pool.set(slug, marker);
      }
      for (const [slug, marker] of pool) {
        if (!seen.has(slug)) {
          marker.remove();
          pool.delete(slug);
        }
      }
    };

    map.on("load", () => {
      // Add the clustered source + layers once the map has settled (first idle). Adding it
      // synchronously in `load` left its tiles ungenerated at high zoom (a blank listings layer);
      // creating it on a settled map tiles reliably. The constructor positions the initial view,
      // so there is no fit here and no spurious initial moveend.
      map.once("idle", () => {
        map.addSource(SRC, {
          type: "geojson",
          data: pointsToGeoJSON(points),
          cluster: true,
          // Seed homes are tightly concentrated (~3km/city, e.g. 16 in Winter Park). Cluster them
          // into a clean numbered circle at region/metro zoom; from neighborhood zoom in
          // (> clusterMaxZoom) supercluster returns individual points which become price-pill
          // markers (see syncMarkers).
          clusterRadius: 50,
          clusterMaxZoom: 12,
          promoteId: "slug",
        });

        // Clusters: a forest circle with a white count.
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SRC,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#15302c",
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 50, 28],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SRC,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
            "text-font": ["Noto Sans Regular"],
          },
          paint: { "text-color": "#ffffff" },
        });

        // D6 SEED: intelligence layers (schools/transit/walkability/POI) mount here as
        // toggleable map layers fed by a swappable data source. Not built in D2.

        // Keep the price-pill markers in sync with whatever is unclustered + in view. `idle` fires
        // after every move settle AND after setData re-tiles, so this single hook covers the
        // initial fit, panning/zooming, and data refetches.
        map.on("idle", syncMarkers);

        map.on("click", "clusters", (e: MapMouseEvent) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
          if (!f) return;
          const id = f.properties?.cluster_id;
          if (id == null) return;
          (map.getSource(SRC) as GeoJSONSource).getClusterExpansionZoom(id).then((zoom) => {
            map.easeTo({
              center: (f.geometry as GeoJSON.Point).coordinates as [number, number],
              zoom,
              animate: !reduce,
            });
          });
        });
        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });

        // Now move to the target view. Animate it (briefly) so the clustered source re-tiles
        // through the intermediate zooms — a hard jump to high zoom leaves its tiles ungenerated
        // (blank). Under reduced motion we cap the zoom instead (see below) and jump.
        if (initialView.kind === "bounds") {
          map.fitBounds(initialView.bounds as LngLatBoundsLike, {
            padding: 64,
            maxZoom: 15,
            // Honour prefers-reduced-motion: jump (no fly animation). The clustered source is born
            // at a low zoom and the price-pill markers sync on `idle` (after tiles load), so a hard
            // jump to the target zoom tiles + renders fine — no need to cap the zoom (which would
            // strand reduced-motion users in a clusters-only view with no price pills).
            animate: !reduce,
            duration: 600,
          });
        } else {
          map.jumpTo({ center: initialView.center, zoom: initialView.zoom });
        }

        // Emit viewport changes only AFTER the initial fit settles, so the programmatic fit
        // doesn't refetch the same view or write ?bbox= to the URL on load.
        let ready = false;
        map.once("idle", () => {
          ready = true;
        });
        const emit = () => {
          if (!ready) return;
          const b = map.getBounds();
          onViewportChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        };
        map.on("moveend", emit);
      });
    });

    return () => {
      markerPool.forEach((m) => m.remove());
      markerPool.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new data when points change (viewport/filter refetch). Marker refresh follows on the
  // resulting `idle`.
  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource(SRC) as GeoJSONSource | undefined;
    if (src) src.setData(pointsToGeoJSON(points));
  }, [points]);

  // Reflect card-hover → pin highlight (and keep hoveredRef current for freshly-created markers).
  useEffect(() => {
    hoveredRef.current = hoveredSlug;
    markersRef.current.forEach((marker, slug) => {
      const btn = marker.getElement().firstElementChild;
      btn?.classList.toggle(styles.pricePinActive!, slug === hoveredSlug);
    });
  }, [hoveredSlug]);

  // Draw-zone control (Task 8).
  useDrawZone({ mapRef, drawing, onDrawingChange, drawnPoly, onPolyChange, reduce });

  return (
    <div
      ref={containerRef}
      className={styles.map}
      aria-label="Map of search results"
      role="application"
    />
  );
}
