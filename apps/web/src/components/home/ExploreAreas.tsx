import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { FEATURED_AREAS } from "@/data/areas";
import styles from "./ExploreAreas.module.css";

export function ExploreAreas() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <Eyebrow>Explore by area</Eyebrow>
          <h2 className={styles.title}>Find the right corner of Florida</h2>
          <div className={styles.grid}>
            {FEATURED_AREAS.map((area) => (
              <Link key={area.slug} href={`/areas/${area.slug}`} className={styles.tile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={area.image} alt={area.name} className={styles.img} loading="lazy" />
                <div className={styles.scrim} />
                <div className={styles.tileBody}>
                  <h3 className={styles.tileName}>{area.name}</h3>
                  <p className={styles.tileBlurb}>{area.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
