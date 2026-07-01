import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import styles from "./CallCta.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;

/**
 * Deep forest closing band that makes calling Nilyan the star: her portrait,
 * the phone number as the focal CTA, and a quieter secondary action. The
 * secondary either scrolls to an on-page anchor ("#id") or links elsewhere.
 */
export function CallCta({
  title,
  text,
  secondaryLabel,
  secondaryHref,
}: {
  title: string;
  text: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  const isAnchor = secondaryHref.startsWith("#");

  function scrollToTarget() {
    const el = document.getElementById(secondaryHref.slice(1));
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.panel}>
            <div className={styles.inner}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={REALTOR.photo}
                alt={REALTOR.name}
                className={styles.portrait}
                loading="lazy"
              />
              <h2 className={styles.title}>{title}</h2>
              <p className={styles.text}>{text}</p>

              <a className={styles.phone} href={TEL}>
                {REALTOR.phone}
              </a>
              <p className={styles.phoneSub}>Call or text.</p>

              {isAnchor ? (
                <button type="button" className={styles.secondary} onClick={scrollToTarget}>
                  {secondaryLabel}
                </button>
              ) : (
                <Link href={secondaryHref} className={styles.secondary}>
                  {secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
