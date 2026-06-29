export type NavItem = { label: string; href: string };

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Rent", href: "/rent" },
  { label: "Search", href: "/search" },
  { label: "Areas", href: "/areas" },
  { label: "Guides", href: "/guides" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: readonly { heading: string; items: readonly NavItem[] }[] = [
  {
    heading: "Explore",
    items: [
      { label: "Search homes", href: "/search" },
      { label: "Areas", href: "/areas" },
      { label: "Guides", href: "/guides" },
      { label: "Favorites", href: "/favorites" },
    ],
  },
  {
    heading: "Work with Nilyan",
    items: [
      { label: "Buy", href: "/buy" },
      { label: "Sell", href: "/sell" },
      { label: "Rent", href: "/rent" },
      { label: "What's my home worth?", href: "/home-value" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];
