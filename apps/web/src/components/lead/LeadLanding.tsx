import Head from "next/head";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { LeadCaptureFlow } from "./LeadCaptureFlow";
import type { Intent } from "@/lib/lead-capture";
import type { QualificationQuestionConfig } from "@herrera/db";
import styles from "./LeadLanding.module.css";

const COPY: Record<Intent, { title: string; lede: string; eyebrow: string }> = {
  buy: {
    eyebrow: "Buy",
    title: "Find your place in Florida",
    lede: "A few quick questions and Nilyan curates homes that fit — often before they hit the market.",
  },
  sell: {
    eyebrow: "Sell",
    title: "What's your home worth?",
    lede: "Tell us about your property and get a free, no-obligation valuation from a licensed local realtor.",
  },
  rent: {
    eyebrow: "Rent",
    title: "Find your next rental",
    lede: "Share what you need and Nilyan sends rentals that match your timeline and budget.",
  },
};

export function LeadLanding({
  intent,
  questions,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
}) {
  const c = COPY[intent];
  return (
    <SiteLayout>
      <Head>
        <title>{`${c.title} · Herrera`}</title>
        <meta name="description" content={c.lede} />
      </Head>
      <section className={styles.section}>
        <Container>
          <div className={styles.grid}>
            <div className={styles.intro}>
              <p className={styles.eyebrow}>{c.eyebrow}</p>
              <h1 className={styles.title}>{c.title}</h1>
              <p className={styles.lede}>{c.lede}</p>
            </div>
            <div className={styles.flowCard}>
              <LeadCaptureFlow intent={intent} questions={questions} landingPath={`/${intent}`} />
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
