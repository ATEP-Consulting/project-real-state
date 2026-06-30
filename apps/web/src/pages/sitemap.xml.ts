import type { GetServerSideProps } from "next";
import { getPublishedGuides, getPublishedListingSlugs } from "@herrera/db";
import { absoluteUrl } from "@/lib/seo";

// Indexable routes that exist today. Area/location pages (D12 Phase A) are added
// when the real Miami feed lands. Legal stubs are noindex, so excluded.
const STATIC_PATHS = ["/", "/buy", "/sell", "/rent", "/about", "/contact", "/guides"];

function buildXml(urls: string[]): string {
  const body = urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const paths = [...STATIC_PATHS];
  try {
    const guides = await getPublishedGuides();
    paths.push(...guides.map((g) => `/guides/${g.slug}`));
  } catch (e) {
    console.warn("[sitemap] guides unavailable:", (e as Error).message);
  }
  try {
    const slugs = await getPublishedListingSlugs();
    paths.push(...slugs.map((s) => `/homes/${s}`));
  } catch (e) {
    console.warn("[sitemap] listings unavailable:", (e as Error).message);
  }
  res.setHeader("Content-Type", "text/xml");
  res.write(buildXml(paths.map((p) => absoluteUrl(p))));
  res.end();
  return { props: {} };
};

export default function SiteMap() {
  return null;
}
