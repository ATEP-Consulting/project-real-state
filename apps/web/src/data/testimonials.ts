export type Testimonial = { author: string; rating: number };

/** Our own sample testimonials (Google reviews come later). Fair-Housing-clean: about service, not people. */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    author: "Marta & Diego R.",
    rating: 5,
  },
  {
    author: "Familia Castaño",
    rating: 5,
  },
  {
    author: "Priya N.",
    rating: 5,
  },
];
