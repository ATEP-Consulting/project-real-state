import type { GuideDetail, GuideSummary } from "@herrera/db";
import { pickLocalized, type Locale } from "./i18n/config";

/** Resolved summary with EN fields replaced by their ES equivalents (silent EN fallback). */
export type LocalizedGuideSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  publishedAt: string | null;
};

/** Resolved detail with EN fields replaced by their ES equivalents (silent EN fallback). */
export type LocalizedGuideDetail = LocalizedGuideSummary & {
  body: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export function localizeGuideSummary(g: GuideSummary, locale: Locale): LocalizedGuideSummary {
  return {
    slug: g.slug,
    title: pickLocalized(g.title, g.titleEs, locale),
    excerpt: g.excerpt != null ? pickLocalized(g.excerpt, g.excerptEs, locale) : null,
    heroImageUrl: g.heroImageUrl,
    publishedAt: g.publishedAt,
  };
}

export function localizeGuideDetail(g: GuideDetail, locale: Locale): LocalizedGuideDetail {
  return {
    slug: g.slug,
    title: pickLocalized(g.title, g.titleEs, locale),
    excerpt: g.excerpt != null ? pickLocalized(g.excerpt, g.excerptEs, locale) : null,
    heroImageUrl: g.heroImageUrl,
    publishedAt: g.publishedAt,
    body: g.body != null ? pickLocalized(g.body, g.bodyEs, locale) : null,
    metaTitle: g.metaTitle != null ? pickLocalized(g.metaTitle, g.metaTitleEs, locale) : null,
    metaDescription:
      g.metaDescription != null
        ? pickLocalized(g.metaDescription, g.metaDescriptionEs, locale)
        : null,
  };
}
