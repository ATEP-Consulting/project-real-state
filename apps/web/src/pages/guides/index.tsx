import type { GetStaticProps } from "next";
import Link from "next/link";
import { getPublishedGuides } from "@herrera/db";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/marketing/PageHero";
import { CallCta } from "@/components/marketing/CallCta";
import { useTranslation } from "@/lib/i18n";
import { asLocale } from "@/lib/i18n/config";
import { localizeGuideSummary, type LocalizedGuideSummary } from "@/lib/guides";
import styles from "./Guides.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=68&auto=format&fit=crop";

type Props = { guides: LocalizedGuideSummary[] };

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const locale = asLocale(ctx.locale);
  let guides: LocalizedGuideSummary[] = [];
  try {
    const raw = await getPublishedGuides();
    guides = raw.map((g) => localizeGuideSummary(g, locale));
  } catch (err) {
    console.warn("[guides] unavailable:", (err as Error).message);
  }
  return { props: { guides }, revalidate: 300 };
};

export default function GuidesIndex({ guides }: Props) {
  const { m } = useTranslation();
  return (
    <SiteLayout transparentHeader>
      <Seo
        title={m.guides.seoTitle}
        description={m.guides.seoDescription}
        path="/guides"
      />
      <PageHero
        image={HERO_IMAGE}
        eyebrow={m.guides.heroEyebrow}
        title={m.guides.heroTitle}
        lede={m.guides.heroLede}
      />

      <section className={styles.listSection}>
        <Container>
          {guides.length === 0 ? (
            <p className={styles.empty}>{m.guides.empty}</p>
          ) : (
            <ul className={styles.grid}>
              {guides.map((g, i) => (
                <li key={g.slug}>
                  <Reveal delay={i * 0.06}>
                    <Link href={`/guides/${g.slug}`} className={styles.card}>
                      {g.heroImageUrl && (
                        <div className={styles.cardImgWrap}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className={styles.cardImg}
                            src={g.heroImageUrl}
                            alt=""
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className={styles.cardBody}>
                        <h2 className={styles.cardTitle}>{g.title}</h2>
                        {g.excerpt && <p className={styles.cardExcerpt}>{g.excerpt}</p>}
                        <span className={styles.cardMore}>{m.guides.cardReadMore}</span>
                      </div>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <CallCta
        title={m.guides.ctaTitle}
        text={m.guides.ctaText}
        secondaryLabel={m.guides.ctaSecondary}
        secondaryHref="/contact"
      />
    </SiteLayout>
  );
}
