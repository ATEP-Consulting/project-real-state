import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import type { LandingContent } from "@/lib/lead-landing-content";
import styles from "./LeadHook.module.css";

/** The per-intent differentiator, on a dark forest band with a light visual card. */
export function LeadHook({ content }: { content: LandingContent }) {
  const h = content.hook;
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div>
              <p className={styles.eyebrow}>{h.eyebrow}</p>
              <h2 className={styles.title}>{h.title}</h2>
              <p className={styles.text}>{h.text}</p>
              <ul className={styles.points}>
                {h.points.map((p) => (
                  <li key={p} className={styles.point}>
                    {p}
                  </li>
                ))}
              </ul>
              {h.cta && (
                <Link href={h.cta.href} className={styles.ctaLink}>
                  {h.cta.label} →
                </Link>
              )}
            </div>
            <div className={styles.visualWrap}>
              <HookVisual variant={h.visual} />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function HookVisual({ variant }: { variant: LandingContent["hook"]["visual"] }) {
  if (variant === "cost") {
    const rows = [
      ["Mortgage (est.)", "$2,940"],
      ["Property taxes", "$410"],
      ["Insurance + flood", "$320"],
      ["HOA / CDD", "$180"],
    ];
    return (
      <div className={styles.card}>
        <p className={styles.cardLabel}>Sample monthly estimate</p>
        <ul className={styles.rows}>
          {rows.map(([label, value]) => (
            <li key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <span>Est. total</span>
          <span>$3,850/mo</span>
        </div>
        <p className={styles.cardNote}>Illustrative estimate, not a quote.</p>
      </div>
    );
  }

  if (variant === "area") {
    const chips = [
      "Schools",
      "Commute times",
      "Transit",
      "Walkability",
      "Parks & shops",
      "Everyday amenities",
    ];
    return (
      <div className={styles.card}>
        <p className={styles.cardLabel}>What Nilyan checks</p>
        <div className={styles.chips}>
          {chips.map((c) => (
            <span key={c} className={styles.chip}>
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // stats
  return (
    <div className={styles.statCard}>
      {REALTOR.stats.map((s) => (
        <div key={s.label} className={styles.stat}>
          <span className={styles.statValue}>{s.value}</span>
          <span className={styles.statLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
