import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./CaptureInvite.module.css";

export function CaptureInvite() {
  const router = useRouter();
  const [address, setAddress] = useState("");

  // Presentational — the real "what's my home worth?" magnet (capture + consent) is D7.
  function onValuation(e: FormEvent) {
    e.preventDefault();
    const qs = address.trim() ? `?address=${encodeURIComponent(address.trim())}` : "";
    void router.push(`/home-value${qs}`);
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
              <Link href="/buy">
                <Button variant="secondary" size="lg">
                  Start my search
                </Button>
              </Link>
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
