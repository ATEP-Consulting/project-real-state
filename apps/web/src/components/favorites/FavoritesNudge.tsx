import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import styles from "./FavoritesNudge.module.css";

export function FavoritesNudge() {
  const { count, captured, openFavoritesCapture } = useFavorites();
  const [dismissed, setDismissed] = useState(false);
  if (captured || dismissed || count === 0) return null;
  const noun = count <= 1 ? "this home" : "these homes";
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.panel}>
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
          >
            ×
          </button>
          <div className={styles.body}>
            <h2 className={styles.title}>Want Nilyan to keep an eye on {noun}?</h2>
            <p className={styles.text}>
              Leave your details and she&rsquo;ll alert you to price drops and new listings like{" "}
              {noun} — no account needed.
            </p>
          </div>
          <button type="button" className={styles.cta} onClick={openFavoritesCapture}>
            Get alerts
          </button>
        </div>
      </Container>
    </section>
  );
}
