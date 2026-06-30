import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { StarRating } from "@/components/ui/StarRating";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";
import styles from "./Trust.module.css";

export function Trust() {
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
              <Eyebrow>Your agent</Eyebrow>
              <h2 className={styles.name}>{REALTOR.name}</h2>
              {REALTOR.bioLong.map((p) => (
                <p key={p.slice(0, 24)} className={styles.bioText}>
                  {p}
                </p>
              ))}
              <p className={styles.license}>
                {REALTOR.title} · {REALTOR.license} · {REALTOR.memberOf}
              </p>

              <ul className={styles.testimonials}>
                {TESTIMONIALS.slice(0, 2).map((t) => (
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
