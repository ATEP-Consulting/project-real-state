import { useEffect, useRef } from "react";
import {
  Map as MlMap,
  NavigationControl,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type MapMouseEvent,
} from "maplibre-gl";
import { pointsToGeoJSON, type ListingMapPoint } from "@/lib/map-points";
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
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (initialView.kind === "bounds") {
        map.fitBounds(initialView.bounds as LngLatBoundsLike, {
          padding: 64,
          maxZoom: 15,
          animate: false,
        });
      } else {
        map.jumpTo({ center: initialView.center, zoom: initialView.zoom });
      }

      map.addSource(SRC, {
        type: "geojson",
        data: pointsToGeoJSON(points),
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 14,
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

      const emit = () => {
        const b = map.getBounds();
        onViewportChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      };
      map.on("moveend", emit);
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
