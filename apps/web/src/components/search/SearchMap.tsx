import { useEffect, useRef } from "react";
import {
  Map as MlMap,
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
          clusterRadius: 24,
          // clusterMaxZoom = the deepest zoom supercluster builds cluster levels for; ABOVE it
          // MapLibre just overzooms the last tile (so a LOW value keeps everything lumped — the
          // opposite of what you want). Keep it high so homes separate into individual price pins
          // at neighborhood/street zoom (the Redfin/Idealista feel); region zoom still clusters.
          clusterMaxZoom: 16,
          promoteId: "slug",
        });

        // Clusters
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

        // Unclustered: a pill behind a price label, hover-aware via feature-state.
        const hoverColor = [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#a9794a",
          "#ffffff",
        ];
        map.addLayer({
          id: "pins",
          type: "circle",
          source: SRC,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": 13,
            "circle-color": hoverColor as never,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#15302c",
          },
        });
        map.addLayer({
          id: "pin-labels",
          type: "symbol",
          source: SRC,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "text-field": ["get", "priceLabel"],
            "text-size": 11,
            "text-font": ["Noto Sans Bold"],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#ffffff",
              "#15302c",
            ],
          },
        });

        // D6 SEED: intelligence layers (schools/transit/walkability/POI) mount here as
        // toggleable map layers fed by a swappable data source. Not built in D2.

        const setHover = (slug: string | null) => {
          if (hoveredRef.current === slug) return;
          if (hoveredRef.current)
            map.setFeatureState({ source: SRC, id: hoveredRef.current }, { hover: false });
          hoveredRef.current = slug;
          if (slug) map.setFeatureState({ source: SRC, id: slug }, { hover: true });
          onHoverSlug(slug);
        };

        map.on("mousemove", "pins", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const f = e.features?.[0];
          if (f?.id != null) setHover(String(f.id));
        });
        map.on("mouseleave", "pins", () => {
          map.getCanvas().style.cursor = "";
          setHover(null);
        });
        map.on("click", "pins", (e) => {
          const slug = e.features?.[0]?.properties?.slug;
          if (slug) window.location.assign(`/homes/${slug}`);
        });
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

        // Now move to the target view. Animate it (briefly) so the clustered source re-tiles
        // through the intermediate zooms — a hard jump to high zoom leaves its tiles ungenerated
        // (blank). Under reduced motion we cap the zoom instead (see below) and jump.
        if (initialView.kind === "bounds") {
          map.fitBounds(initialView.bounds as LngLatBoundsLike, {
            padding: 64,
            maxZoom: reduce ? 11 : 15,
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
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new data when points change (viewport/filter refetch).
  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource(SRC) as GeoJSONSource | undefined;
    if (src) src.setData(pointsToGeoJSON(points));
  }, [points]);

  // Reflect card-hover → pin highlight.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(SRC)) return;
    if (hoveredRef.current && hoveredRef.current !== hoveredSlug)
      map.setFeatureState({ source: SRC, id: hoveredRef.current }, { hover: false });
    hoveredRef.current = hoveredSlug;
    if (hoveredSlug) map.setFeatureState({ source: SRC, id: hoveredSlug }, { hover: true });
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
