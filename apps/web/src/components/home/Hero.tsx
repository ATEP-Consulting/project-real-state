import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import { HeroSearch } from "./HeroSearch";
import styles from "./Hero.module.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=70";

const CAPTURE: { intent: "buy" | "sell" | "rent"; verb: string }[] = [
  { intent: "buy", verb: "Buy" },
  { intent: "sell", verb: "Sell" },
  { intent: "rent", verb: "Rent" },
];

export function Hero() {
  const { openCapture } = useLeadCapture();

  // Click the SCROLL cue to glide past the full-height hero to the content below.
  function scrollDown() {
    const header = document.querySelector("header");
    const headerH = header instanceof HTMLElement ? header.offsetHeight : 76;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: window.innerHeight - headerH, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section
      className={styles.hero}
      style={{
        backgroundImage: `linear-gradient(rgba(11,24,22,.42), rgba(11,24,22,.52)), url(${HERO_IMAGE})`,
      }}
    >
      <Container>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Florida · Licensed Realtor®</p>
          <h1 className={styles.title}>Find your place in Florida.</h1>
          <p className={styles.lede}>
            Curated properties across Miami, Coral Gables, Naples and the entire coast. Buy, sell or
            rent with close, expert guidance.
          </p>

          {/* PRIMARY — lead capture (the hero's #1 action), styled like the search tabs */}
          <div className={styles.captureWrap}>
            <span className={styles.captureLabel}>I want to</span>
            <div className={styles.capture} role="group" aria-label="Start with Nilyan">
              {CAPTURE.map((c) => (
                <button
                  key={c.intent}
                  type="button"
                  className={styles.captureBtn}
                  onClick={() => openCapture(c.intent)}
                >
                  {c.verb}
                </button>
              ))}
            </div>
          </div>

          {/* SECONDARY — explore listings yourself (the signature /search) */}
          <div className={styles.exploreDivider}>
            <span>Or explore listings yourself</span>
          </div>
          <HeroSearch />
          <Link href="/search" className={styles.drawLink}>
            or draw your area on the map →
          </Link>
        </div>
      </Container>

      <button
        type="button"
        className={styles.scrollCue}
        onClick={scrollDown}
        aria-label="Scroll to listings"
      >
        <span className={styles.scrollLabel}>SCROLL</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
    </section>
  );
}
