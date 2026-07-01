import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { StarRating } from "@/components/ui/StarRating";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";
import type { Intent } from "@/lib/lead-capture";
import styles from "./LeadTrust.module.css";

/**
 * Agent portrait + stats badge + two testimonials, picked to match the intent
 * (a seller sees a "sold" story, a buyer a "bought" story).
 */
const PICK: Record<Intent, readonly number[]> = {
  buy: [2, 1],
  sell: [0, 2],
  rent: [1, 0],
};

export function LeadTrust({ intent }: { intent: Intent }) {
  const quotes = PICK[intent]
    .map((i) => TESTIMONIALS[i])
    .filter((t): t is Testimonial => Boolean(t));
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.photoWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={REALTOR.photo} alt={REALTOR.name} className={styles.photo} loading="lazy" />
              <div className={styles.stats}>
                {REALTOR.stats.map((s) => (
                  <div key={s.label} className={styles.stat}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.bio}>
              <h2 className={styles.name}>{REALTOR.name}</h2>
              <p className={styles.role}>{REALTOR.title}</p>
              <p className={styles.bioText}>{REALTOR.bioLong[0]}</p>
              <p className={styles.license}>
                {REALTOR.license} · {REALTOR.memberOf}
              </p>

              <ul className={styles.testimonials}>
                {quotes.map((t) => (
                  <li key={t.author} className={styles.quote}>
                    <StarRating value={t.rating} />
                    <p className={styles.quoteText}>“{t.quote}”</p>
                    <p className={styles.quoteAuthor}>
                      {t.author} · <span className={styles.quoteContext}>{t.context}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
