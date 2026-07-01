// Centralized SEO/structured-data helpers (template-driven; only the data filling
// these changes when the real Miami feed lands). Used by <Seo> and the sitemap.

import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n/config";

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

/** Absolute URL for a site path in a given locale (en = no prefix, es = "/es"). */
export function localizedUrl(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path;
  if (locale === DEFAULT_LOCALE) return absoluteUrl(path);
  return `${SITE_URL}/${locale}${clean}`;
}

export type AlternateLink = { hrefLang: string; href: string };

/** Reciprocal hreflang set + x-default (= default locale) for a site path. */
export function alternatesFor(path: string): AlternateLink[] {
  const links: AlternateLink[] = LOCALES.map((l) => ({ hrefLang: l, href: localizedUrl(path, l) }));
  return [...links, { hrefLang: "x-default", href: localizedUrl(path, DEFAULT_LOCALE) }];
}

/** Bilingual sitemap: two <url> entries per path, each carrying the xhtml alternates. */
export function buildSitemapXml(paths: string[]): string {
  const alt = (path: string) =>
    LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${localizedUrl(path, l)}"/>`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${localizedUrl(path, DEFAULT_LOCALE)}"/>`)
      .join("\n");
  const entries = paths
    .flatMap((path) =>
      LOCALES.map(
        (l) => `  <url>\n    <loc>${localizedUrl(path, l)}</loc>\n${alt(path)}\n  </url>`,
      ),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`;
}
