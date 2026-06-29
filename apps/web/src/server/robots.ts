export function robotsBody(isDemo: boolean): string {
  if (isDemo) return "User-agent: *\nDisallow: /\n";
  // Production: allow crawling. (A real sitemap is added with the SEO pages in D12.)
  return "User-agent: *\nAllow: /\n";
}
