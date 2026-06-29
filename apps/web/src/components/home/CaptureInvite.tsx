import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./CaptureInvite.module.css";

export function CaptureInvite() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.band}>
            <p className={styles.eyebrowLight}>What will it really cost?</p>
            <h2 className={styles.title}>Know the true monthly cost before you fall in love.</h2>
            <p className={styles.text}>
              Florida ownership is more than a list price — insurance, flood exposure, taxes, HOA
              and CDD fees all add up. Tell us what you&apos;re looking for and Nilyan will send a
              clear, honest breakdown. All figures are estimates.
            </p>
            <div className={styles.actions}>
              <Link href="/buy">
                <Button variant="primary" size="lg">
                  Start with what you want
                </Button>
              </Link>
              <Link href="/home-value">
                <Button variant="ghost" size="lg" className={styles.ghostOnDark}>
                  What&apos;s my home worth?
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
