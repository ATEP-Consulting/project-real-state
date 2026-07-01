import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useTranslation } from "@/lib/i18n";
import styles from "./FavoritesNudge.module.css";

/**
 * Closing capture panel on /favorites — same forest-on-cream treatment as the
 * marketing CallCta (Nilyan's portrait + serif headline + bronze action), but it
 * opens the login-less favorites capture. Dismissible; hidden once captured.
 */
export function FavoritesNudge() {
  const { m } = useTranslation();
  const { count, captured, openFavoritesCapture } = useFavorites();
  const [dismissed, setDismissed] = useState(false);
  if (captured || dismissed || count === 0) return null;
  const isSingular = count <= 1;

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.panel}>
            <button
              type="button"
              className={styles.dismiss}
              aria-label={m.favorites.nudgeDismiss}
              onClick={() => setDismissed(true)}
            >
              ×
            </button>
            <div className={styles.inner}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={REALTOR.photo} alt={REALTOR.name} className={styles.portrait} loading="lazy" />
              <h2 className={styles.title}>
                {isSingular ? m.favorites.nudgeTitleSingular : m.favorites.nudgeTitlePlural}
              </h2>
              <p className={styles.text}>
                {isSingular ? m.favorites.nudgeTextSingular : m.favorites.nudgeTextPlural}
              </p>
              <button type="button" className={styles.cta} onClick={openFavoritesCapture}>
                {m.favorites.nudgeCta}
              </button>
              <p className={styles.sub}>{m.favorites.nudgeSub}</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
