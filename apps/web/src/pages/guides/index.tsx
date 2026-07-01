import type { GetStaticProps } from "next";
import Link from "next/link";
import { getPublishedGuides, type GuideSummary } from "@herrera/db";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/marketing/PageHero";
import { CallCta } from "@/components/marketing/CallCta";
import styles from "./Guides.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=68&auto=format&fit=crop";

type Props = { guides: GuideSummary[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  let guides: GuideSummary[] = [];
  try {
    guides = await getPublishedGuides();
  } catch (err) {
    console.warn("[guides] unavailable:", (err as Error).message);
  }
  return { props: { guides }, revalidate: 300 };
};

export default function GuidesIndex({ guides }: Props) {
  return (
    <SiteLayout transparentHeader>
      <Seo
        title="Guides — buying, selling & owning in Florida — Herrera"
        description="Plain-English guides to Florida real estate: flood zones and insurance, HOA vs CDD fees, and a first-time buyer's roadmap."
        path="/guides"
      />
      <PageHero
        image={HERO_IMAGE}
        eyebrow="Guides"
        title="Florida real estate, explained"
        lede="Straight answers to the questions that shape a Florida purchase. No jargon, no pressure."
      />

      <section className={styles.listSection}>
        <Container>
          {guides.length === 0 ? (
            <p className={styles.empty}>Guides are coming soon.</p>
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
                        <span className={styles.cardMore}>Read guide →</span>
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
        title="Still have questions?"
        text="Nilyan can walk you through any of this, no pressure."
        secondaryLabel="Send a message"
        secondaryHref="/contact"
      />
    </SiteLayout>
  );
}
