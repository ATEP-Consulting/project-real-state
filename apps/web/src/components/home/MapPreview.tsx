import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { useTranslation } from "@/lib/i18n";
import { MapMockup } from "./MapMockup";
import styles from "./MapPreview.module.css";

export function MapPreview() {
  const { m } = useTranslation();

  const POINTS = [m.home.mapPoint0, m.home.mapPoint1, m.home.mapPoint2];

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>{m.home.mapEyebrow}</p>
              <h2 className={styles.title}>{m.home.mapTitle}</h2>
              <p className={styles.text}>{m.home.mapText}</p>
              <ul className={styles.points}>
                {POINTS.map((p) => (
                  <li key={p} className={styles.point}>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href="/search">
                <Button variant="primary" size="lg">
                  {m.home.mapCta}
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
