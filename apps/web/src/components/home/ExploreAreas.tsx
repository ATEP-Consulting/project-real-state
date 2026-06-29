import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { FEATURED_AREAS, type Area } from "@/data/areas";
import styles from "./ExploreAreas.module.css";

function AreaTile({ area, big = false }: { area: Area; big?: boolean }) {
  return (
    <Link href={`/areas/${area.slug}`} className={`${styles.tile} ${big ? styles.big : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={area.image} alt={area.name} className={styles.img} loading="lazy" />
      <div className={styles.scrim} />
      <div className={styles.tileBody}>
        <h3 className={styles.tileName}>{area.name}</h3>
        <p className={styles.tileCount}>{area.count} properties</p>
      </div>
    </Link>
  );
}

export function ExploreAreas() {
  const [hero, ...rest] = FEATURED_AREAS;
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.head}>
            <Eyebrow>Explore by area</Eyebrow>
            <h2 className={styles.title}>Florida neighborhoods</h2>
          </div>
          <div className={styles.grid}>
            {hero && <AreaTile area={hero} big />}
            {rest.slice(0, 4).map((a) => (
              <AreaTile key={a.slug} area={a} />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
