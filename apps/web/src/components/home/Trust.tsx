import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { StarRating } from "@/components/ui/StarRating";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";
import { useTranslation } from "@/lib/i18n";
import styles from "./Trust.module.css";

export function Trust() {
  const { m } = useTranslation();

  // Prose fields come from messages; structural fields (value, name, rating) stay in data.
  const statLabels = [m.realtor.statLabel0, m.realtor.statLabel1, m.realtor.statLabel2];
  const bioLong = [m.realtor.bioLong0, m.realtor.bioLong1];

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
              <Eyebrow>{m.home.trustEyebrow}</Eyebrow>
              <h2 className={styles.name}>{REALTOR.name}</h2>
              {bioLong.map((p, i) => (
                <p key={i} className={styles.bioText}>
                  {p}
                </p>
              ))}
              <p className={styles.license}>
                {m.realtor.title} &middot; {REALTOR.license} &middot; {m.realtor.memberOf}
              </p>

              <ul className={styles.testimonials}>
                {TESTIMONIALS.slice(0, 2).map((t, i) => (
                  <li key={t.author} className={styles.quote}>
                    <StarRating value={t.rating} />
                    <p className={styles.quoteText}>
                      &ldquo;
                      {i === 0 ? m.testimonials.t0quote : m.testimonials.t1quote}
                      &rdquo;
                    </p>
                    <p className={styles.quoteAuthor}>
                      {t.author} &middot;{" "}
                      <span className={styles.quoteContext}>
                        {i === 0 ? m.testimonials.t0context : m.testimonials.t1context}
                      </span>
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
