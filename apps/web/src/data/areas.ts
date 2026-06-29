export type Area = { name: string; slug: string; blurb: string; image: string; count: number };

/** Curated explore-by-area tiles (bento: first = large). Links resolve to /areas/[city] (D12). Free-license photos. */
export const FEATURED_AREAS: readonly Area[] = [
  {
    name: "Miami Beach",
    slug: "miami-beach",
    blurb: "Oceanfront living and a global market.",
    image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1000&q=70",
    count: 126,
  },
  {
    name: "Coral Gables",
    slug: "coral-gables",
    blurb: "Tree-lined avenues, Mediterranean architecture.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70",
    count: 48,
  },
  {
    name: "Coconut Grove",
    slug: "coconut-grove",
    blurb: "Leafy, bayside, and walkable.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70",
    count: 63,
  },
  {
    name: "Brickell",
    slug: "brickell",
    blurb: "High-rise energy on the bay.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=70",
    count: 91,
  },
  {
    name: "Naples",
    slug: "naples",
    blurb: "Gulf-coast calm, refined waterfront.",
    image: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=70",
    count: 54,
  },
];
