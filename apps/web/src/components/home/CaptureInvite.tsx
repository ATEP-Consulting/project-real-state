import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import { useTranslation } from "@/lib/i18n";
import styles from "./CaptureInvite.module.css";

export function CaptureInvite() {
  const { openCapture } = useLeadCapture();
  const { m } = useTranslation();
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
              <p className={styles.eyebrow}>{m.home.captureBuyEyebrow}</p>
              <h2 className={styles.title}>{m.home.captureBuyTitle}</h2>
              <p className={styles.text}>{m.home.captureBuyText}</p>
              <Button variant="secondary" size="lg" onClick={() => openCapture("buy")}>
                {m.home.captureBuyBtn}
              </Button>
            </div>

            <div className={styles.sell}>
              <p className={styles.eyebrowLight}>{m.home.captureSellEyebrow}</p>
              <h2 className={styles.titleLight}>{m.home.captureSellTitle}</h2>
              <p className={styles.textLight}>{m.home.captureSellText}</p>
              <form className={styles.valForm} onSubmit={onValuation}>
                <input
                  className={styles.valInput}
                  type="text"
                  aria-label={m.home.captureAddressLabel}
                  placeholder={m.home.captureAddressPlaceholder}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button type="submit" className={styles.valBtn}>
                  {m.home.captureValBtn}
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
