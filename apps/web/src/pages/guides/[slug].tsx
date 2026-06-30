import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { getGuideBySlug, getPublishedGuides, type GuideDetail } from "@herrera/db";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import styles from "./Guide.module.css";

type Props = { guide: GuideDetail };

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
  try {
    const guide = await getGuideBySlug(slug);
    if (!guide) return { notFound: true, revalidate: 30 };
    return { props: { guide }, revalidate: 300 };
  } catch (err) {
    console.warn("[guides] props unavailable:", (err as Error).message);
    return { notFound: true, revalidate: 30 };
  }
};

export default function GuideArticle({ guide }: Props) {
  const path = `/guides/${guide.slug}`;
  const description = guide.metaDescription ?? guide.excerpt ?? guide.title;
  const paragraphs = (guide.body ?? "").split(/\n\n+/).filter(Boolean);
  return (
    <SiteLayout>
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
            { name: "Home", url: absoluteUrl("/") },
            { name: "Guides", url: absoluteUrl("/guides") },
            { name: guide.title, url: absoluteUrl(path) },
          ]),
        ]}
      />
      <article className={styles.article}>
        <Container>
          <Link href="/guides" className={styles.back}>
            ← All guides
          </Link>
          <h1 className={styles.h1}>{guide.title}</h1>
          {guide.excerpt && <p className={styles.lede}>{guide.excerpt}</p>}
          {guide.heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.hero} src={guide.heroImageUrl} alt="" />
          )}
          <div className={styles.body}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className={styles.cta}>
            <p className={styles.ctaText}>Thinking about a move in Florida?</p>
            <Link href="/contact" className={styles.ctaBtn}>
              Talk to Nilyan
            </Link>
          </div>
        </Container>
      </article>
    </SiteLayout>
  );
}
