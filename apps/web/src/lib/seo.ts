// Centralized SEO/structured-data helpers (template-driven; only the data filling
// these changes when the real Miami feed lands). Used by <Seo> and the sitemap.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://herrera-swart.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Nilyan Herrera";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

/** schema.org RealEstateAgent node for the site owner. */
export function organizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: SITE_URL,
    areaServed: "Miami, FL",
  };
}

/** schema.org WebSite node. */
export function webSiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/** schema.org Article node for a guide. */
export function articleJsonLd(a: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished?: string | null;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    url: a.url,
    ...(a.image ? { image: a.image } : {}),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    author: { "@type": "RealEstateAgent", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "RealEstateAgent", name: SITE_NAME, url: SITE_URL },
  };
}

/** schema.org BreadcrumbList from ordered {name,url} crumbs. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
