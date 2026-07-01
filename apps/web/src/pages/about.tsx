import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { StarRating } from "@/components/ui/StarRating";
import { PageHero } from "@/components/marketing/PageHero";
import { CallCta } from "@/components/marketing/CallCta";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";
import { useTranslation } from "@/lib/i18n";
import styles from "./about.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=68&auto=format&fit=crop";

const TESTIMONIAL_QUOTES = ["t0quote", "t1quote", "t2quote"] as const;
const TESTIMONIAL_CONTEXTS = ["t0context", "t1context", "t2context"] as const;

export default function About() {
  const { m } = useTranslation();
  const statLabels = [m.realtor.statLabel0, m.realtor.statLabel1, m.realtor.statLabel2];
  const bioLong = [m.realtor.bioLong0, m.realtor.bioLong1];

  const VALUES = [
    { title: m.about.value0title, body: m.about.value0body },
    { title: m.about.value1title, body: m.about.value1body },
    { title: m.about.value2title, body: m.about.value2body },
  ];

  return (
    <SiteLayout transparentHeader>
      <Seo
        title={m.about.seoTitle}
        description={m.about.seoDescription}
        path="/about"
      />
      <PageHero
        image={HERO_IMAGE}
        eyebrow={m.about.heroEyebrow}
        title={m.about.heroTitle}
        lede={m.realtor.bioShort}
      />

      {/* Bio + portrait + stats */}
      <section className={styles.bioSection}>
        <Container>
          <Reveal>
            <div className={styles.bioGrid}>
              <div className={styles.photoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={REALTOR.photo}
                  alt={REALTOR.name}
                  className={styles.photo}
                  loading="lazy"
                />
                <div className={styles.stats}>
                  {REALTOR.stats.map((s, i) => (
                    <div key={s.value} className={styles.stat}>
                      <span className={styles.statValue}>{s.value}</span>
                      <span className={styles.statLabel}>{statLabels[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className={styles.bioHead}>{m.about.bioHead}</h2>
                {bioLong.map((p, i) => (
                  <p key={i} className={styles.bioText}>
                    {p}
                  </p>
                ))}
                <p className={styles.license}>
                  {REALTOR.license} · {m.realtor.memberOf}
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* How I work */}
      <section className={styles.valuesSection}>
        <Container>
          <Reveal>
            <h2 className={styles.valuesTitle}>{m.about.valuesTitle}</h2>
          </Reveal>
          <div className={styles.values}>
            {VALUES.map((v, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className={styles.value}>
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueBody}>{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section className={styles.quotesSection}>
        <Container>
          <Reveal>
            <Eyebrow>{m.about.testimonialsEyebrow}</Eyebrow>
            <ul className={styles.quotes}>
              {TESTIMONIALS.map((t, i) => (
                <li key={t.author} className={styles.quote}>
                  <StarRating value={t.rating} />
                  <p className={styles.quoteText}>"{m.testimonials[TESTIMONIAL_QUOTES[i]!]}"</p>
                  <p className={styles.quoteAuthor}>
                    {t.author} · <span className={styles.quoteContext}>{m.testimonials[TESTIMONIAL_CONTEXTS[i]!]}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <CallCta
        title={m.about.ctaTitle}
        text={m.about.ctaText}
        secondaryLabel={m.about.ctaSecondary}
        secondaryHref="/contact"
      />
    </SiteLayout>
  );
}
