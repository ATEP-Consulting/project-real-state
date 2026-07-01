import Head from "next/head";
import { Container } from "@/components/ui/Container";
import { LeadCaptureFlow } from "../LeadCaptureFlow";
import type { Intent } from "@/lib/lead-capture";
import type { QualificationQuestionConfig } from "@herrera/db";
import type { LandingContent } from "@/lib/lead-landing-content";
import styles from "./LeadHero.module.css";

/**
 * Split hero: full-bleed intent photo + forest scrim, white intro on the left,
 * the capture flow as a solid white card floating on the right. Runs under the
 * transparent header (like the home hero). The form is visible on load.
 */
export function LeadHero({
  intent,
  questions,
  content,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
  content: LandingContent;
}) {
  return (
    <>
      {/* Discover the hero photo immediately (a background-image is otherwise found late,
          after CSS parsing) so it is the priority download and lands fast. */}
      <Head>
        <link rel="preload" as="image" href={content.image} />
      </Head>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(rgba(11,24,22,.55), rgba(11,24,22,.62)), url(${content.image})`,
        }}
      >
        <Container>
          <div className={styles.grid}>
            <div className={styles.intro}>
              <p className={styles.eyebrow}>{content.eyebrow}</p>
              <h1 className={styles.title}>{content.title}</h1>
              <p className={styles.lede}>{content.lede}</p>
            </div>
            <div className={styles.formCard} id="lead-form">
              <LeadCaptureFlow intent={intent} questions={questions} landingPath={`/${intent}`} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
