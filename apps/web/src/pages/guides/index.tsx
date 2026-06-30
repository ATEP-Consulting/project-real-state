import type { GetStaticProps } from "next";
import Link from "next/link";
import { getPublishedGuides, type GuideSummary } from "@herrera/db";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Guides.module.css";

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
    <SiteLayout>
      <Seo
        title="Guides — buying, selling & owning in Florida — Herrera"
        description="Plain-English guides to Florida real estate: flood zones and insurance, HOA vs CDD fees, and a first-time buyer's roadmap."
        path="/guides"
      />
      <Container>
        <header className={styles.head}>
          <Eyebrow>Guides</Eyebrow>
          <h1 className={styles.h1}>Florida real estate, explained</h1>
          <p className={styles.lede}>
            Straight answers to the questions that shape a Florida purchase — no jargon, no
            pressure.
          </p>
        </header>

        {guides.length === 0 ? (
          <p className={styles.empty}>Guides are coming soon.</p>
        ) : (
          <ul className={styles.grid}>
            {guides.map((g) => (
              <li key={g.slug}>
                <Reveal>
                  <Link href={`/guides/${g.slug}`} className={styles.card}>
                    {g.heroImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.cardImg} src={g.heroImageUrl} alt="" loading="lazy" />
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
    </SiteLayout>
  );
}
