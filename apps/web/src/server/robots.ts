export function robotsBody(isDemo: boolean, sitemapUrl?: string): string {
  const sitemap = sitemapUrl ? `Sitemap: ${sitemapUrl}\n` : "";
  // Demo: block all crawling (the preview is gated + noindex anyway).
  if (isDemo) return `User-agent: *\nDisallow: /\n${sitemap}`;
  // Production: allow crawling, point at the sitemap.
  return `User-agent: *\nAllow: /\n${sitemap}`;
}
