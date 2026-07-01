import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import { useTranslation } from "@/lib/i18n";
import { HeroSearch } from "./HeroSearch";
import styles from "./Hero.module.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=70";

export function Hero() {
  const { openCapture } = useLeadCapture();
  const { m } = useTranslation();

  const CAPTURE: { intent: "buy" | "sell" | "rent"; verb: string }[] = [
    { intent: "buy", verb: m.home.heroBuy },
    { intent: "sell", verb: m.home.heroSell },
    { intent: "rent", verb: m.home.heroRent },
  ];

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
          <p className={styles.eyebrow}>{m.home.heroEyebrow}</p>
          <h1 className={styles.title}>{m.home.heroTitle}</h1>
          <p className={styles.lede}>{m.home.heroLede}</p>

          {/* PRIMARY — lead capture (the hero's #1 action), styled like the search tabs */}
          <div className={styles.captureWrap}>
            <span className={styles.captureLabel}>{m.home.iWantTo}</span>
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
            <span>{m.home.heroExplore}</span>
          </div>
          <HeroSearch />
          <Link href="/search" className={styles.drawLink}>
            {m.home.heroDrawLink}
          </Link>
        </div>
      </Container>

      <button
        type="button"
        className={styles.scrollCue}
        onClick={scrollDown}
        aria-label={m.home.heroScrollLabel}
      >
        <span className={styles.scrollLabel}>SCROLL</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
    </section>
  );
}
