import { useEffect, useRef } from "react";
import { Map as MlMap, Marker, NavigationControl } from "maplibre-gl";
import styles from "./LocationMap.module.css";

/** A small client-only MapLibre map with a single marker (reuses D2's pattern; no clustering). */
export function LocationMap({
  lng,
  lat,
  styleUrl,
}: {
  lng: number;
  lat: number;
  styleUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = new MlMap({
      container: ref.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: 14,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const el = document.createElement("div");
    el.className = styles.pin!;
    new Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={ref}
      className={styles.map}
      aria-label="Map showing the listing location"
      role="application"
    />
  );
}
