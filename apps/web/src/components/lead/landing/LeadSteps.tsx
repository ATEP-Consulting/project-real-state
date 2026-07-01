import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import type { LandingContent } from "@/lib/lead-landing-content";
import styles from "./LeadSteps.module.css";

/** Three-step "how it works" strip. Hairline dividers, not cards. */
export function LeadSteps({ content }: { content: LandingContent }) {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <h2 className={styles.title}>{content.stepsTitle}</h2>
        </Reveal>
        <div className={styles.steps}>
          {content.steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className={styles.step}>
                <span className={styles.num}>{s.n}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepBody}>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
