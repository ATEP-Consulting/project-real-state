export type NavItem = { label: string; href: string };

// "Areas" is intentionally omitted until D12 Phase A builds the area pages on the
// real Miami feed (see docs/superpowers/plans/2026-06-30-d12-seo.md).
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Rent", href: "/rent" },
  { label: "Guides", href: "/guides" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: readonly { heading: string; items: readonly NavItem[] }[] = [
  {
    heading: "Explore",
    items: [
      { label: "Buy", href: "/buy" },
      { label: "Sell", href: "/sell" },
      { label: "Rent", href: "/rent" },
      { label: "Map search", href: "/search" },
      { label: "Saved homes", href: "/favorites" },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "Guides", href: "/guides" },
      { label: "About Nilyan", href: "/about" },
      // D12 Phase A: restore area links (/areas/[city]) when the Miami feed lands.
      { label: "Explore areas", href: "/search" },
    ],
  },
  {
    heading: "Contact",
    items: [
      { label: "hola@nilyanherrera.com", href: "mailto:hola@nilyanherrera.com" },
      { label: "Book a visit", href: "/contact" },
      { label: "Contact Nilyan", href: "/contact" },
    ],
  },
];
