import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getGuideBySlug, getPublishedGuides } from "@herrera/db";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { CallCta } from "@/components/marketing/CallCta";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { useTranslation } from "@/lib/i18n";
import { asLocale } from "@/lib/i18n/config";
import { localizeGuideDetail, type LocalizedGuideDetail } from "@/lib/guides";
import styles from "./Guide.module.css";

type Props = { guide: LocalizedGuideDetail };

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: { params: { slug: string } }[] = [];
  try {
    const guides = await getPublishedGuides();
    paths = guides.map((g) => ({ params: { slug: g.slug } }));
  } catch (err) {
    console.warn("[guides] paths unavailable:", (err as Error).message);
  }
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug ?? "");
  const locale = asLocale(ctx.locale);
  try {
    const raw = await getGuideBySlug(slug);
    if (!raw) return { notFound: true, revalidate: 30 };
    const guide = localizeGuideDetail(raw, locale);
    return { props: { guide }, revalidate: 300 };
  } catch (err) {
    console.warn("[guides] props unavailable:", (err as Error).message);
    return { notFound: true, revalidate: 30 };
  }
};

export default function GuideArticle({ guide }: Props) {
  const { m } = useTranslation();
  const path = `/guides/${guide.slug}`;
  const description = guide.metaDescription ?? guide.excerpt ?? guide.title;
  return (
    <SiteLayout transparentHeader>
      <Seo
        title={guide.metaTitle ?? `${guide.title} — Herrera`}
        description={description}
        path={path}
        image={guide.heroImageUrl}
        jsonLd={[
          articleJsonLd({
            title: guide.title,
            description,
            url: absoluteUrl(path),
            image: guide.heroImageUrl,
            datePublished: guide.publishedAt,
          }),
          breadcrumbJsonLd([
            { name: m.guides.breadcrumbHome, url: absoluteUrl("/") },
            { name: m.nav.guides, url: absoluteUrl("/guides") },
            { name: guide.title, url: absoluteUrl(path) },
          ]),
        ]}
      />
      <PageHero
        image={guide.heroImageUrl ?? undefined}
        eyebrow={m.guides.eyebrow}
        title={guide.title}
        lede={guide.excerpt ?? undefined}
      />

      <article className={styles.article}>
        <Container>
          <div className={styles.prose}>
            <Link href="/guides" className={styles.back}>
              {m.guides.allGuidesLink}
            </Link>
            {/* Markdown body — react-markdown ignores raw HTML by default (no rehype-raw),
                so authored content can't inject markup. */}
            <div className={styles.body}>
              <ReactMarkdown>{guide.body ?? ""}</ReactMarkdown>
            </div>
          </div>
        </Container>
      </article>

      <CallCta
        title={m.guides.articleCtaTitle}
        text={m.guides.articleCtaText}
        secondaryLabel={m.guides.articleCtaSecondary}
        secondaryHref="/contact"
      />
    </SiteLayout>
  );
}
