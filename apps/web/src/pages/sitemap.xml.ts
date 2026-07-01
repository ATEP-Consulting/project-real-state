import type { GetServerSideProps } from "next";
import { getPublishedGuides, getPublishedListingSlugs } from "@herrera/db";
import { buildSitemapXml } from "@/lib/seo";

const STATIC_PATHS = ["/", "/buy", "/sell", "/rent", "/about", "/contact", "/guides"];

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
  res.write(buildSitemapXml(paths)); // both locales per path
  res.end();
  return { props: {} };
};

export default function SiteMap() {
  return null;
}
