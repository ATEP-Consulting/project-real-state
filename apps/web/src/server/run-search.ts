import { searchListings } from "@herrera/db";
import { toListingCardVM, type ListingCardVM } from "@/lib/listing";
import { toMapPoint, type ListingMapPoint } from "@/lib/map-points";
import type { SearchParams } from "@/lib/search-params";

export type SearchResult = { cards: ListingCardVM[]; points: ListingMapPoint[]; total: number };

export async function runSearch(p: SearchParams): Promise<SearchResult> {
  const { rows, total } = await searchListings({
    bbox: p.bbox,
    poly: p.poly,
    q: p.q,
    types: p.types,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    minBeds: p.minBeds,
    minBaths: p.minBaths,
    waterfront: p.waterfront,
    pool: p.pool,
    age55: p.age55,
    noHoa: p.noHoa,
  });
  const cards = rows.map(toListingCardVM);
  const points = rows.map(toMapPoint).filter((x): x is ListingMapPoint => x !== null);
  return { cards, points, total };
}
