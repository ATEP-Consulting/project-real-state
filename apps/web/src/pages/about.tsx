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
import styles from "./about.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=68&auto=format&fit=crop";

const VALUES = [
  {
    title: "Honest numbers",
    body: "You get the real monthly cost in Florida: insurance, flood, HOA and taxes, before you commit.",
  },
  {
    title: "A local network",
    body: "Relationships across Miami, Coral Gables and the coast that open doors, including off-market listings.",
  },
  {
    title: "Personal follow-through",
    body: "You work with me directly, start to finish. I answer my own phone.",
  },
];

export default function About() {
  return (
    <SiteLayout transparentHeader>
      <Seo
        title="About Nilyan Herrera · Licensed Florida Realtor®"
        description="Meet Nilyan Herrera, a licensed Florida Realtor® helping buyers, sellers and renters across Miami and the coast with honest numbers and close guidance."
        path="/about"
      />
      <PageHero
        image={HERO_IMAGE}
        eyebrow="About · Licensed Florida Realtor®"
        title="Nilyan Herrera"
        lede={REALTOR.bioShort}
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
                  {REALTOR.stats.map((s) => (
                    <div key={s.label} className={styles.stat}>
                      <span className={styles.statValue}>{s.value}</span>
                      <span className={styles.statLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className={styles.bioHead}>Close guidance, honest numbers.</h2>
                {REALTOR.bioLong.map((p) => (
                  <p key={p.slice(0, 24)} className={styles.bioText}>
                    {p}
                  </p>
                ))}
                <p className={styles.license}>
                  {REALTOR.license} · {REALTOR.memberOf}
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
            <h2 className={styles.valuesTitle}>How I work</h2>
          </Reveal>
          <div className={styles.values}>
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06}>
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
            <Eyebrow>What clients say</Eyebrow>
            <ul className={styles.quotes}>
              {TESTIMONIALS.map((t) => (
                <li key={t.author} className={styles.quote}>
                  <StarRating value={t.rating} />
                  <p className={styles.quoteText}>“{t.quote}”</p>
                  <p className={styles.quoteAuthor}>
                    {t.author} · <span className={styles.quoteContext}>{t.context}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <CallCta
        title="Let's talk about your move."
        text="Tell me what you're after and I'll take it from there. I answer personally."
        secondaryLabel="Send a message"
        secondaryHref="/contact"
      />
    </SiteLayout>
  );
}
