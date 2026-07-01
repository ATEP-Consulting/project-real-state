import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { StarRating } from "@/components/ui/StarRating";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";
import type { Intent } from "@/lib/lead-capture";
import { useTranslation } from "@/lib/i18n";
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

const TESTIMONIAL_QUOTES = ["t0quote", "t1quote", "t2quote"] as const;
const TESTIMONIAL_CONTEXTS = ["t0context", "t1context", "t2context"] as const;

export function LeadTrust({ intent }: { intent: Intent }) {
  const { m } = useTranslation();
  const statLabels = [m.realtor.statLabel0, m.realtor.statLabel1, m.realtor.statLabel2];
  const indices = PICK[intent];
  const quotes = indices
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
                {REALTOR.stats.map((s, i) => (
                  <div key={s.value} className={styles.stat}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={styles.statLabel}>{statLabels[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.bio}>
              <h2 className={styles.name}>{REALTOR.name}</h2>
              <p className={styles.role}>{m.realtor.title}</p>
              <p className={styles.bioText}>{m.realtor.bioLong0}</p>
              <p className={styles.license}>
                {REALTOR.license} · {m.realtor.memberOf}
              </p>

              <ul className={styles.testimonials}>
                {quotes.map((t, qi) => {
                  const srcIdx = indices[qi] ?? 0;
                  const quoteKey = TESTIMONIAL_QUOTES[srcIdx];
                  const ctxKey = TESTIMONIAL_CONTEXTS[srcIdx];
                  return (
                    <li key={t.author} className={styles.quote}>
                      <StarRating value={t.rating} />
                      <p className={styles.quoteText}>"{quoteKey ? m.testimonials[quoteKey] : ""}"</p>
                      <p className={styles.quoteAuthor}>
                        {t.author} · <span className={styles.quoteContext}>{ctxKey ? m.testimonials[ctxKey] : ""}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
