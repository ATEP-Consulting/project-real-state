import { CallCta } from "@/components/marketing/CallCta";
import type { LandingContent } from "@/lib/lead-landing-content";
import { useTranslation } from "@/lib/i18n";

/** The landing's closing CTA: the shared forest call band, pointed back to the hero form. */
export function LeadClosing({ content }: { content: LandingContent }) {
  const { m } = useTranslation();
  return (
    <CallCta
      title={content.closingTitle}
      text={content.closingText}
      secondaryLabel={m.landing.closingSecondary}
      secondaryHref="#lead-form"
    />
  );
}
