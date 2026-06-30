import type { GetServerSideProps } from "next";
import { Seo } from "@/components/seo/Seo";
import { getSearchFilters, type SearchFilterConfig } from "@herrera/db";
import { Header } from "@/components/layout/Header";
import { SearchView } from "@/components/search/SearchView";
import { runSearch, type SearchResult } from "@/server/run-search";
import { parseSearchParams, serializeSearchQuery, type SearchParams } from "@/lib/search-params";
import { boundsFromPoints } from "@/lib/map-points";
import { DEFAULT_VIEW, MAP_STYLE_URL } from "@/lib/map-style";
import type { InitialView } from "@/components/search/SearchMap";

type Props = {
  initial: SearchResult;
  initialView: InitialView;
  params: SearchParams;
  query: Record<string, string>;
  styleUrl: string;
  filters: SearchFilterConfig[];
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const params = parseSearchParams(ctx.query);
  let initial: SearchResult = { cards: [], points: [], total: 0 };
  try {
    initial = await runSearch(params);
  } catch (e) {
    console.warn("[search] query failed:", (e as Error).message);
  }
  let initialView: InitialView;
  if (params.bbox) initialView = { kind: "bounds", bounds: params.bbox };
  else {
    const b = boundsFromPoints(initial.points);
    initialView = b ? { kind: "bounds", bounds: b } : { kind: "center", ...DEFAULT_VIEW };
  }
  let filters: SearchFilterConfig[] = [];
  try {
    filters = await getSearchFilters();
  } catch (e) {
    console.warn("[search] filter config failed:", (e as Error).message);
  }
  return {
    props: {
      initial,
      initialView,
      params,
      query: serializeSearchQuery(params),
      styleUrl: MAP_STYLE_URL,
      filters,
    },
  };
};

export default function SearchPage(props: Props) {
  return (
    <>
      <Seo
        title="Search Florida homes — Herrera"
        description="Search homes across Florida on an interactive map."
        path="/search"
      />
      <Header />
      <SearchView {...props} />
    </>
  );
}
