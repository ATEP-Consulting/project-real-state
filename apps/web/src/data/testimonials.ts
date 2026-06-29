export type Testimonial = { quote: string; author: string; context: string; rating: number };

/** Our own sample testimonials (Google reviews come later). Fair-Housing-clean: about service, not people. */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Sold our Coral Gables home in three weeks and above asking. Professional from start to finish.",
    author: "Marta & Diego R.",
    context: "Sold in Coral Gables",
    rating: 5,
  },
  {
    quote:
      "We moved from Spain and Nilyan made it easy — she found exactly the neighborhood we were looking for.",
    author: "Familia Castaño",
    context: "Relocated to Miami",
    rating: 5,
  },
  {
    quote:
      "She walked us through every cost — taxes, insurance, HOA — before we made an offer. No surprises at closing.",
    author: "Priya N.",
    context: "Bought in Brickell",
    rating: 5,
  },
];
