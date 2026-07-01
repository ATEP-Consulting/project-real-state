import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import styles from "./FavoritesNudge.module.css";

/**
 * Closing capture panel on /favorites — same forest-on-cream treatment as the
 * marketing CallCta (Nilyan's portrait + serif headline + bronze action), but it
 * opens the login-less favorites capture. Dismissible; hidden once captured.
 */
export function FavoritesNudge() {
  const { count, captured, openFavoritesCapture } = useFavorites();
  const [dismissed, setDismissed] = useState(false);
  if (captured || dismissed || count === 0) return null;
  const noun = count <= 1 ? "this home" : "these homes";

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.panel}>
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
            >
              ×
            </button>
            <div className={styles.inner}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={REALTOR.photo} alt={REALTOR.name} className={styles.portrait} loading="lazy" />
              <h2 className={styles.title}>Want Nilyan to watch {noun} for you?</h2>
              <p className={styles.text}>
                Leave your details and she&rsquo;ll personally alert you to price drops and new
                listings like {noun}. No account, no obligation.
              </p>
              <button type="button" className={styles.cta} onClick={openFavoritesCapture}>
                Get price alerts
              </button>
              <p className={styles.sub}>She replies personally, usually within the day.</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
