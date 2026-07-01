import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { FEATURED_AREAS, type Area } from "@/data/areas";
import { useTranslation } from "@/lib/i18n";
import styles from "./ExploreAreas.module.css";

function AreaTile({
  area,
  big = false,
  propertiesLabel,
}: {
  area: Area;
  big?: boolean;
  propertiesLabel: string;
}) {
  // D12 Phase A: restore the per-area link (/areas/[city]) when the Miami feed lands.
  // For now tiles route to /search to avoid dead links on mock-Orlando area pages.
  return (
    <Link href="/search" className={`${styles.tile} ${big ? styles.big : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={area.image} alt={area.name} className={styles.img} loading="lazy" />
      <div className={styles.scrim} />
      <div className={styles.tileBody}>
        <h3 className={styles.tileName}>{area.name}</h3>
        <p className={styles.tileCount}>
          {area.count} {propertiesLabel}
        </p>
      </div>
    </Link>
  );
}

export function ExploreAreas() {
  const { m } = useTranslation();
  const [hero, ...rest] = FEATURED_AREAS;
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.head}>
            <Eyebrow>{m.home.areasEyebrow}</Eyebrow>
            <h2 className={styles.title}>{m.home.areasTitle}</h2>
          </div>
          <div className={styles.grid}>
            {hero && (
              <AreaTile area={hero} big propertiesLabel={m.home.areasProperties} />
            )}
            {rest.slice(0, 4).map((a) => (
              <AreaTile key={a.slug} area={a} propertiesLabel={m.home.areasProperties} />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
