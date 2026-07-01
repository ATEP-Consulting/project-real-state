import { CallCta } from "@/components/marketing/CallCta";
import type { LandingContent } from "@/lib/lead-landing-content";

/** The landing's closing CTA: the shared forest call band, pointed back to the hero form. */
export function LeadClosing({ content }: { content: LandingContent }) {
  return (
    <CallCta
      title={content.closingTitle}
      text={content.closingText}
      secondaryLabel="Or start online"
      secondaryHref="#lead-form"
    />
  );
}
