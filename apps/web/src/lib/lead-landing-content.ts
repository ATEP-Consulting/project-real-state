import type { Intent } from "./lead-capture";

/**
 * Per-intent content for the buy/sell/rent landing pages. Keeps the section
 * components dumb: they render this config, the tailored copy lives here.
 * Hero photos reuse the proven seed image set (same source as the home page).
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

export const LANDING_CONTENT: Record<Intent, LandingContent> = {
  buy: {
    image: IMG("photo-1564013799919-ab600027ffc6"),
    eyebrow: "Buy · Florida · Licensed Realtor®",
    title: "Find your place in Florida",
    lede: "Answer a few quick questions and Nilyan curates homes that fit, often before they reach the open market.",
    stepsTitle: "How buying with Nilyan works",
    steps: [
      { n: "01", title: "Tell us what you want", body: "Neighborhoods, budget, must-haves. A minute, tops." },
      { n: "02", title: "Nilyan curates matches", body: "A shortlist that fits, including quiet off-market listings." },
      { n: "03", title: "Tour, offer, close", body: "Local guidance through every showing, offer and signature." },
    ],
    hook: {
      eyebrow: "Florida cost intelligence",
      title: "Know the true cost before you fall in love.",
      text: "List price is only the start. Nilyan shows the full monthly picture on every home, so there are no surprises at closing.",
      points: [
        "FEMA flood zone and flood insurance estimate",
        "Home insurance and property taxes",
        "HOA and CDD fees",
        "A realistic monthly cost, all clearly labeled estimates",
      ],
      visual: "cost",
      cta: { label: "See the cost breakdown on any listing", href: "/search" },
    },
    closingTitle: "Ready when you are.",
    closingText: "Prefer to talk it through? Nilyan answers personally.",
  },

  sell: {
    image: IMG("photo-1605723517503-3cadb5818a0c"),
    eyebrow: "Sell · Florida · Licensed Realtor®",
    title: "What's your home worth?",
    lede: "Tell us about your property and get a free, no-obligation valuation from a licensed local realtor.",
    stepsTitle: "How selling with Nilyan works",
    steps: [
      { n: "01", title: "Share your property", body: "The address and a few details about the home." },
      { n: "02", title: "Get a real valuation", body: "A price backed by recent local comparable sales, not a guess." },
      { n: "03", title: "List and sell", body: "Staging, marketing and negotiation handled end to end." },
    ],
    hook: {
      eyebrow: "A track record, not a promise",
      title: "Priced right, sold faster.",
      text: "Twelve years working the Florida coast, with a network that brings the right buyers to your door.",
      points: [
        "Pricing from live local comparables",
        "Professional listing and marketing",
        "Hands-on negotiation through to closing",
      ],
      visual: "stats",
    },
    closingTitle: "Curious what it's worth?",
    closingText: "Want a no-obligation read on your home? Nilyan answers personally.",
  },

  rent: {
    image: IMG("photo-1535498730771-e735b998cd64"),
    eyebrow: "Rent · Florida · Licensed Realtor®",
    title: "Find your next rental",
    lede: "Share what you need and Nilyan sends rentals that match your timeline and budget.",
    stepsTitle: "How renting with Nilyan works",
    steps: [
      { n: "01", title: "Tell us your must-haves", body: "Area, budget, move-in date and dealbreakers." },
      { n: "02", title: "Get matched rentals", body: "Options that fit, sent as they come available." },
      { n: "03", title: "Tour and sign", body: "See the ones you like and sign with confidence." },
    ],
    hook: {
      eyebrow: "Neighborhood intelligence",
      title: "Rent in the right neighborhood.",
      text: "Where you live shapes the day to day. Nilyan reads each area on the things that actually affect your routine.",
      points: [
        "Schools and commute times",
        "Transit and walkability",
        "Shops, parks and everyday amenities",
      ],
      visual: "area",
      cta: { label: "Explore rentals on the map", href: "/search" },
    },
    closingTitle: "Let's find your next place.",
    closingText: "Prefer to talk? Nilyan answers personally.",
  },
};
