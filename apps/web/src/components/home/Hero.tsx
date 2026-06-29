import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HeroSearch } from "./HeroSearch";
import styles from "./Hero.module.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=70";

export function Hero() {
  return (
    <section
      className={styles.hero}
      style={{
        backgroundImage: `linear-gradient(rgba(11,24,22,.42), rgba(11,24,22,.52)), url(${HERO_IMAGE})`,
      }}
    >
      <Container>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Florida · Licensed Realtor®</p>
          <h1 className={styles.title}>Find your place in Florida.</h1>
          <p className={styles.lede}>
            Curated properties across Miami, Coral Gables, Naples and the entire coast. Buy, sell or
            rent with close, expert guidance.
          </p>

          <HeroSearch />

          <Link href="/search" className={styles.drawLink}>
            or draw your area on the map →
          </Link>
        </div>
      </Container>

      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollLabel}>SCROLL</span>
        <span className={styles.chevron} />
      </div>
    </section>
  );
}
