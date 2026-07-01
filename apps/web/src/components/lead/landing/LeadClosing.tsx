import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import type { LandingContent } from "@/lib/lead-landing-content";
import styles from "./LeadClosing.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;

/**
 * The closing moment: a deep forest band that makes calling Nilyan the star.
 * Her portrait humanizes it; the phone number is the elegant focal CTA;
 * "Start now" stays as a quieter path back to the hero form.
 */
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={REALTOR.photo}
              alt={REALTOR.name}
              className={styles.portrait}
              loading="lazy"
            />
            <h2 className={styles.title}>{content.closingTitle}</h2>
            <p className={styles.text}>{content.closingText}</p>

            <a className={styles.phone} href={TEL}>
              {REALTOR.phone}
            </a>
            <p className={styles.phoneSub}>Call or text.</p>

            <button type="button" className={styles.start} onClick={scrollToForm}>
              Or start online
            </button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
