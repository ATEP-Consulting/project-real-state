import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./MapPreview.module.css";

export function MapPreview() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.copy}>
              <Eyebrow>Search the map</Eyebrow>
              <h2 className={styles.title}>Explore listings on an interactive map</h2>
              <p className={styles.text}>
                Pan and zoom to see what&apos;s available, draw your own search zone, and compare
                neighborhoods side by side. The list and the map stay in sync.
              </p>
              <Link href="/search">
                <Button variant="secondary" size="lg">
                  Open map search
                </Button>
              </Link>
            </div>
            <Link href="/search" className={styles.preview} aria-label="Open map search">
              <div className={styles.pin} style={{ top: "32%", left: "28%" }} />
              <div className={styles.pin} style={{ top: "52%", left: "58%" }} />
              <div className={styles.pin} style={{ top: "68%", left: "38%" }} />
              <span className={styles.previewLabel}>
                Interactive map · built in the search view
              </span>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
