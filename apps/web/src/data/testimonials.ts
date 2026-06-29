export type Testimonial = { quote: string; author: string; context: string };

/** Our own sample testimonials (Google reviews come later). Fair-Housing-clean: about service, not people. */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Nilyan walked us through every cost — taxes, insurance, HOA — before we made an offer. No surprises at closing.",
    author: "M. & J. Alvarez",
    context: "Bought in Coral Gables",
  },
  {
    quote:
      "She priced our home right and it sold quickly. Communication was fast and honest the whole way through.",
    author: "Priya N.",
    context: "Sold in Orlando",
  },
  {
    quote:
      "As first-time renters we felt looked after. Nilyan found us the right place and explained the lease clearly.",
    author: "Daniel R.",
    context: "Rented in Tampa",
  },
];
