import Head from "next/head";
import { Container } from "@/components/ui/Container";
import styles from "./PageHero.module.css";

/**
 * Scrimmed photo hero for content pages (about, contact). Same visual language
 * as the lead landings' hero, without the embedded form. Runs under the
 * transparent header; the photo is preloaded so it lands fast.
 */
export function PageHero({
  image,
  eyebrow,
  title,
  lede,
}: {
  image?: string;
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <>
      {image && (
        <Head>
          <link rel="preload" as="image" href={image} />
        </Head>
      )}
      <section
        className={styles.hero}
        style={
          image
            ? {
                backgroundImage: `linear-gradient(rgba(11,24,22,.5), rgba(11,24,22,.6)), url(${image})`,
              }
            : undefined
        }
      >
        <Container>
          <div className={styles.inner}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1 className={styles.title}>{title}</h1>
            {lede && <p className={styles.lede}>{lede}</p>}
          </div>
        </Container>
      </section>
    </>
  );
}
