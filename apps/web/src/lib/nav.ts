export type NavItem = { label: string; href: string };

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Rent", href: "/rent" },
  { label: "Areas", href: "/areas" },
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
    ],
  },
  {
    heading: "Areas",
    items: [
      { label: "Miami Beach", href: "/areas/miami-beach" },
      { label: "Coral Gables", href: "/areas/coral-gables" },
      { label: "Brickell", href: "/areas/brickell" },
      { label: "Naples", href: "/areas/naples" },
    ],
  },
  {
    heading: "Contact",
    items: [
      { label: "hola@nilyanherrera.com", href: "mailto:hola@nilyanherrera.com" },
      { label: "Book a visit", href: "/contact" },
      { label: "Instagram", href: "/contact" },
      { label: "LinkedIn", href: "/contact" },
    ],
  },
];
