import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { REALTOR } from "@/data/realtor";
import type { LandingContent } from "@/lib/lead-landing-content";
import styles from "./LeadClosing.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;

/** Closing reassurance + a jump back to the hero form, for anyone who scrolled past it. */
export function LeadClosing({ content }: { content: LandingContent }) {
  function scrollToForm() {
    const el = document.getElementById("lead-form");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.inner}>
            <h2 className={styles.title}>{content.closingTitle}</h2>
            <p className={styles.text}>{content.closingText}</p>
            <div className={styles.actions}>
              <Button type="button" size="lg" onClick={scrollToForm}>
                Start now
              </Button>
              <a className={styles.call} href={TEL}>
                Call {REALTOR.phone}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
