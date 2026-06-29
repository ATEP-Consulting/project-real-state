import { useEffect, useRef, type MutableRefObject } from "react";
import type { GeoJSONSource, Map as MlMap, MapMouseEvent } from "maplibre-gl";

const DRAW_SRC = "draw-zone";

function ringGeoJSON(ring: [number, number][], closed: boolean): GeoJSON.Feature {
  const coords = closed && ring.length >= 3 ? [...ring, ring[0]!] : ring;
  return {
    type: "Feature",
    properties: {},
    geometry:
      closed && ring.length >= 3
        ? { type: "Polygon", coordinates: [coords] }
        : { type: "LineString", coordinates: coords },
  };
}

export function useDrawZone({
  mapRef,
  drawing,
  onDrawingChange,
  drawnPoly,
  onPolyChange,
  reduce,
}: {
  mapRef: MutableRefObject<MlMap | null>;
  drawing: boolean;
  onDrawingChange: (on: boolean) => void;
  drawnPoly: [number, number][] | null;
  onPolyChange: (ring: [number, number][] | null) => void;
  reduce: boolean;
}) {
  const draftRef = useRef<[number, number][]>([]);

  // Ensure the draw source + layers exist (idempotent), once the map is ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ensure = () => {
      if (map.getSource(DRAW_SRC)) return;
      map.addSource(DRAW_SRC, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-fill",
        type: "fill",
        source: DRAW_SRC,
        paint: { "fill-color": "#a9794a", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "draw-line",
        type: "line",
        source: DRAW_SRC,
        paint: { "line-color": "#8f6238", "line-width": 2, "line-dasharray": [2, 1] },
      });
    };
    if (map.isStyleLoaded()) ensure();
    else map.once("load", ensure);
  }, [mapRef]);

  // Reflect the committed polygon (or a cleared one).
  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource(DRAW_SRC) as GeoJSONSource | undefined;
    if (!src) return;
    if (drawnPoly && drawnPoly.length >= 3) src.setData(ringGeoJSON(drawnPoly, true));
    else if (!drawing) src.setData({ type: "FeatureCollection", features: [] });
  }, [drawnPoly, drawing, mapRef]);

  // Drawing interactions.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = () => map.getSource(DRAW_SRC) as GeoJSONSource | undefined;

    if (!drawing) {
      draftRef.current = [];
      map.getCanvas().style.cursor = "";
      map.doubleClickZoom.enable();
      return;
    }

    draftRef.current = [];
    map.getCanvas().style.cursor = "crosshair";
    map.doubleClickZoom.disable();
    src()?.setData({ type: "FeatureCollection", features: [] });

    const onClick = (e: MapMouseEvent) => {
      draftRef.current = [...draftRef.current, [e.lngLat.lng, e.lngLat.lat]];
      src()?.setData(ringGeoJSON(draftRef.current, draftRef.current.length >= 3));
    };
    const finish = () => {
      const ring = draftRef.current;
      if (ring.length >= 3) onPolyChange(ring);
      onDrawingChange(false);
    };
    const onDbl = (e: MapMouseEvent) => {
      e.preventDefault();
      finish();
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") finish();
      if (ev.key === "Escape") {
        draftRef.current = [];
        onDrawingChange(false);
        onPolyChange(null);
      }
    };

    map.on("click", onClick);
    map.on("dblclick", onDbl);
    window.addEventListener("keydown", onKey);
    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDbl);
      window.removeEventListener("keydown", onKey);
      map.getCanvas().style.cursor = "";
      map.doubleClickZoom.enable();
    };
    // `reduce` kept in deps to hold a stable signature alongside SearchMap.
  }, [drawing, onPolyChange, onDrawingChange, mapRef, reduce]);
}
