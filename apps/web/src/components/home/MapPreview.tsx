import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { MapMockup } from "./MapMockup";
import styles from "./MapPreview.module.css";

const POINTS = [
  "Draw, move and combine multiple zones",
  "Prices and availability in real time",
  "Save searches and get alerts",
];

export function MapPreview() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>The map</p>
              <h2 className={styles.title}>Search by drawing your zone</h2>
              <p className={styles.text}>
                Forget rigid filters. Trace the exact area you want to live in and see only
                what&apos;s inside it, in real time.
              </p>
              <ul className={styles.points}>
                {POINTS.map((p) => (
                  <li key={p} className={styles.point}>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href="/search">
                <Button variant="primary" size="lg">
                  Explore the map
                </Button>
              </Link>
            </div>
            <div className={styles.preview}>
              <MapMockup />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
