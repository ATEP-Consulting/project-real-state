export type Area = { name: string; slug: string; blurb: string; image: string };

/** Curated explore-by-area tiles. Links resolve to /areas/[city] (built in D12). Photos are free-license. */
export const FEATURED_AREAS: readonly Area[] = [
  {
    name: "Miami",
    slug: "miami",
    blurb: "Coastal energy, walkable neighborhoods, and a global market.",
    image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=800&q=70",
  },
  {
    name: "Coral Gables",
    slug: "coral-gables",
    blurb: "Tree-lined avenues and Mediterranean architecture.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70",
  },
  {
    name: "Naples",
    slug: "naples",
    blurb: "Gulf-coast calm with refined waterfront living.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70",
  },
  {
    name: "Orlando",
    slug: "orlando",
    blurb: "Central-Florida growth, new communities, and value.",
    image: "https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800&q=70",
  },
  {
    name: "Tampa",
    slug: "tampa",
    blurb: "Bayfront revival with character-filled districts.",
    image: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=70",
  },
  {
    name: "Fort Lauderdale",
    slug: "fort-lauderdale",
    blurb: "Canalside homes and an easygoing coastal pace.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=70",
  },
];
