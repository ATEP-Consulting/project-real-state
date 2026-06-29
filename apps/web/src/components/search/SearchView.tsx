import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SearchResults } from "./SearchResults";
import { debounce } from "@/lib/debounce";
import { serializeSearchQuery, type Bbox, type SearchParams } from "@/lib/search-params";
import type { ListingCardVM } from "@/lib/listing";
import type { ListingMapPoint } from "@/lib/map-points";
import type { InitialView } from "./SearchMap";
import type { SearchResult } from "@/server/run-search";
import styles from "./SearchView.module.css";

const SearchMap = dynamic(() => import("./SearchMap").then((m) => m.SearchMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map…</div>,
});

export function SearchView({
  initial,
  initialView,
  params,
  styleUrl,
}: {
  initial: SearchResult;
  initialView: InitialView;
  params: SearchParams;
  query: Record<string, string>;
  styleUrl: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<ListingCardVM[]>(initial.cards);
  const [points, setPoints] = useState<ListingMapPoint[]>(initial.points);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [poly, setPoly] = useState<[number, number][] | null>(params.poly ?? null);
  const [mobileView, setMobileView] = useState<"list" | "map">("map");
  const paramsRef = useRef<SearchParams>(params);
  // True once a navigation AWAY from /search begins. Map interactions (zoom/pan/draw)
  // can leave a refetch in flight; without this guard that late router.replace({pathname:
  // "/search"}) would yank the user back to /search after they clicked away.
  const leavingRef = useRef(false);

  const fetchFor = useCallback(
    async (next: SearchParams) => {
      if (leavingRef.current) return;
      paramsRef.current = next;
      const qs = serializeSearchQuery(next);
      void router.replace({ pathname: "/search", query: qs }, undefined, { shallow: true });
      setLoading(true);
      try {
        const res = await fetch(`/api/search?${new URLSearchParams(qs).toString()}`);
        const data: SearchResult = await res.json();
        if (leavingRef.current) return;
        setCards(data.cards);
        setPoints(data.points);
        setTotal(data.total);
      } finally {
        if (!leavingRef.current) setLoading(false);
      }
    },
    [router],
  );

  // Debounced viewport-driven refetch (drops bbox while a drawn zone is active — the polygon wins).
  const onViewportChange = useMemo(
    () =>
      debounce((bbox: Bbox) => {
        const next: SearchParams = { ...paramsRef.current };
        if (paramsRef.current.poly) delete next.bbox;
        else next.bbox = bbox;
        void fetchFor(next);
      }, 400),
    [fetchFor],
  );

  // Stop writing the URL once the user navigates off /search. A shallow replace stays on
  // /search (url starts with "/search") and must NOT trip this; any other target = leaving.
  useEffect(() => {
    const onRouteChangeStart = (url: string) => {
      if (!url.startsWith("/search")) leavingRef.current = true;
    };
    router.events.on("routeChangeStart", onRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", onRouteChangeStart);
      onViewportChange.cancel();
    };
  }, [router, onViewportChange]);

  const onPolyChange = useCallback(
    (ring: [number, number][] | null) => {
      setPoly(ring);
      const next: SearchParams = { ...paramsRef.current };
      if (ring) {
        next.poly = ring;
        delete next.bbox;
      } else delete next.poly;
      void fetchFor(next);
    },
    [fetchFor],
  );

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.results} ${mobileView === "list" ? styles.show : styles.hideMobile}`}
      >
        <SearchResults
          cards={cards}
          total={total}
          loading={loading}
          hoveredSlug={hoveredSlug}
          onHover={setHoveredSlug}
        />
      </div>

      <div
        className={`${styles.mapWrap} ${mobileView === "map" ? styles.show : styles.hideMobile}`}
      >
        <SearchMap
          points={points}
          initialView={initialView}
          hoveredSlug={hoveredSlug}
          onHoverSlug={setHoveredSlug}
          onViewportChange={onViewportChange}
          styleUrl={styleUrl}
          drawnPoly={poly}
          onPolyChange={onPolyChange}
          drawing={drawing}
          onDrawingChange={setDrawing}
        />
        <div className={styles.tools}>
          {poly ? (
            <button type="button" className={styles.tool} onClick={() => onPolyChange(null)}>
              Clear zone
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.tool} ${drawing ? styles.toolActive : ""}`}
              onClick={() => setDrawing((d) => !d)}
            >
              {drawing ? "Click points · double-click to finish" : "Draw a zone"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.mobileToggle} role="tablist" aria-label="View">
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === "list"}
          className={mobileView === "list" ? styles.mtActive : ""}
          onClick={() => setMobileView("list")}
        >
          List
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === "map"}
          className={mobileView === "map" ? styles.mtActive : ""}
          onClick={() => setMobileView("map")}
        >
          Map
        </button>
      </div>
    </div>
  );
}
