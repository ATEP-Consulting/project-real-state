import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import styles from "./CaptureInvite.module.css";

export function CaptureInvite() {
  const { openCapture } = useLeadCapture();
  const [address, setAddress] = useState("");

  // "What's my home worth?" = a thin Sell-branch variant: open the sell flow with the
  // typed address pre-filled as the first answer (the seeded sell branch leads with `address`).
  function onValuation(e: FormEvent) {
    e.preventDefault();
    const a = address.trim();
    openCapture("sell", a ? { initialAnswers: { address: a } } : undefined);
  }

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.buy}>
              <p className={styles.eyebrow}>Buy</p>
              <h2 className={styles.title}>Find your next home</h2>
              <p className={styles.text}>
                Tell us what you&apos;re looking for and we&apos;ll send a curated selection before
                it hits the market.
              </p>
              <Button variant="secondary" size="lg" onClick={() => openCapture("buy")}>
                Start my search
              </Button>
            </div>

            <div className={styles.sell}>
              <p className={styles.eyebrowLight}>Sell</p>
              <h2 className={styles.titleLight}>What&apos;s your home worth?</h2>
              <p className={styles.textLight}>
                Get a free, no-obligation valuation based on real sales in your neighborhood.
              </p>
              <form className={styles.valForm} onSubmit={onValuation}>
                <input
                  className={styles.valInput}
                  type="text"
                  aria-label="Your property address"
                  placeholder="Your property address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button type="submit" className={styles.valBtn}>
                  Get a free valuation
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
