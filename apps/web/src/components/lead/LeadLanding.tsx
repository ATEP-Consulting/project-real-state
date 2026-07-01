import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeadHero } from "./landing/LeadHero";
import { LeadSteps } from "./landing/LeadSteps";
import { LeadHook } from "./landing/LeadHook";
import { LeadTrust } from "./landing/LeadTrust";
import { LeadClosing } from "./landing/LeadClosing";
import { LANDING_CONTENT } from "@/lib/lead-landing-content";
import type { Intent } from "@/lib/lead-capture";
import type { QualificationQuestionConfig } from "@herrera/db";

/**
 * The buy/sell/rent landing page: an editorial, form-first composition.
 * Hero (photo + embedded capture flow) → how it works → the per-intent hook
 * → agent trust → closing CTA. Content is tailored per intent in
 * `lead-landing-content.ts`; every section reuses the site design system.
 */
export function LeadLanding({
  intent,
  questions,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
}) {
  const content = LANDING_CONTENT[intent];
  return (
    <SiteLayout transparentHeader>
      <Seo title={`${content.title} · Herrera`} description={content.lede} path={`/${intent}`} />
      <LeadHero intent={intent} questions={questions} content={content} />
      <LeadSteps content={content} />
      <LeadHook content={content} />
      <LeadTrust intent={intent} />
      <LeadClosing content={content} />
    </SiteLayout>
  );
}
