import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import type { LandingContent } from "@/lib/lead-landing-content";
import { useTranslation } from "@/lib/i18n";
import styles from "./LeadHook.module.css";

/** The per-intent differentiator, on a dark forest band with a light visual card. */
export function LeadHook({ content }: { content: LandingContent }) {
  const { m } = useTranslation();
  const statLabels = [m.realtor.statLabel0, m.realtor.statLabel1, m.realtor.statLabel2];
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
              <HookVisual variant={h.visual} statLabels={statLabels} m={m} />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function HookVisual({
  variant,
  statLabels,
  m,
}: {
  variant: LandingContent["hook"]["visual"];
  statLabels: string[];
  m: ReturnType<typeof useTranslation>["m"];
}) {
  if (variant === "cost") {
    const cc = m.landing.costCard;
    const rows: [string, string][] = [
      [cc.row0, "$2,940"],
      [cc.row1, "$410"],
      [cc.row2, "$320"],
      [cc.row3, "$180"],
    ];
    return (
      <div className={styles.card}>
        <p className={styles.cardLabel}>{cc.label}</p>
        <ul className={styles.rows}>
          {rows.map(([label, value]) => (
            <li key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <span>{cc.total}</span>
          <span>$3,850/mo</span>
        </div>
        <p className={styles.cardNote}>{cc.note}</p>
      </div>
    );
  }

  if (variant === "area") {
    const ac = m.landing.areaCard;
    const chips = [ac.chip0, ac.chip1, ac.chip2, ac.chip3, ac.chip4, ac.chip5];
    return (
      <div className={styles.card}>
        <p className={styles.cardLabel}>{ac.label}</p>
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
      {REALTOR.stats.map((s, i) => (
        <div key={s.value} className={styles.stat}>
          <span className={styles.statValue}>{s.value}</span>
          <span className={styles.statLabel}>{statLabels[i]}</span>
        </div>
      ))}
    </div>
  );
}
