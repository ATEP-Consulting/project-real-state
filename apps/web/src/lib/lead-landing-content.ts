import type { Intent } from "./lead-capture";
import type { Messages } from "@/lib/i18n/messages/en";

/**
 * Per-intent content for the buy/sell/rent landing pages. Keeps the section
 * components dumb: they render this config, the tailored copy lives here.
 * Hero photos reuse the proven seed image set (same source as the home page).
 *
 * String content has moved to the i18n messages (`m.landing.*`).
 * Use `getLandingContent(m, intent)` to build the content object for rendering.
 */

export type LandingStep = { n: string; title: string; body: string };

export type LandingHook = {
  eyebrow: string;
  title: string;
  text: string;
  points: readonly string[];
  /** Which illustrative visual the forest band renders. */
  visual: "cost" | "area" | "stats";
  cta?: { label: string; href: string };
};

export type LandingContent = {
  /** Hero background photo (Unsplash, cover). */
  image: string;
  eyebrow: string;
  title: string;
  lede: string;
  stepsTitle: string;
  steps: readonly LandingStep[];
  hook: LandingHook;
  closingTitle: string;
  closingText: string;
};

// auto=format lets Unsplash serve webp/avif (much smaller than the default jpeg);
// the hero photo is preloaded in LeadHero so it starts downloading immediately.
const IMG = (id: string) => `https://images.unsplash.com/${id}?w=1920&q=68&auto=format&fit=crop`;

const IMAGES: Record<Intent, string> = {
  buy: IMG("photo-1564013799919-ab600027ffc6"),
  sell: IMG("photo-1605723517503-3cadb5818a0c"),
  rent: IMG("photo-1535498730771-e735b998cd64"),
};

const VISUALS: Record<Intent, LandingHook["visual"]> = {
  buy: "cost",
  sell: "stats",
  rent: "area",
};

const HOOK_CTA_HREFS: Record<Intent, string | undefined> = {
  buy: "/search",
  sell: undefined,
  rent: "/search",
};

/**
 * Build the `LandingContent` object for a given intent from the active locale's
 * messages. Call this inside a component that has access to `useTranslation()`.
 */
export function getLandingContent(m: Messages, intent: Intent): LandingContent {
  const lm = m.landing[intent];
  const ctaHref = HOOK_CTA_HREFS[intent];

  // Collect hook points — buy has 4, sell and rent have 3; filter out missing ones
  const rawPoints: unknown[] = [lm.hookPoint0, lm.hookPoint1, lm.hookPoint2];
  // hookPoint3 only exists on buy
  if ("hookPoint3" in lm) rawPoints.push((lm as { hookPoint3: string }).hookPoint3);
  const points = rawPoints.filter((p): p is string => typeof p === "string" && p.length > 0);

  // hookCtaLabel exists on buy and rent (not sell)
  const ctaLabel = "hookCtaLabel" in lm ? (lm as { hookCtaLabel: string }).hookCtaLabel : undefined;

  return {
    image: IMAGES[intent],
    eyebrow: lm.eyebrow,
    title: lm.title,
    lede: lm.lede,
    stepsTitle: lm.stepsTitle,
    steps: [
      { n: lm.step0n, title: lm.step0title, body: lm.step0body },
      { n: lm.step1n, title: lm.step1title, body: lm.step1body },
      { n: lm.step2n, title: lm.step2title, body: lm.step2body },
    ],
    hook: {
      eyebrow: lm.hookEyebrow,
      title: lm.hookTitle,
      text: lm.hookText,
      points,
      visual: VISUALS[intent],
      ...(ctaLabel && ctaHref ? { cta: { label: ctaLabel, href: ctaHref } } : {}),
    },
    closingTitle: lm.closingTitle,
    closingText: lm.closingText,
  };
}
