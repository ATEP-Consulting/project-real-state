import type { NewContent } from "../schema/content";

// Factual, geography-neutral lead-magnet guides (work for Miami or anywhere in FL).
// Facts only — no steering. Cost/insurance figures are described as ESTIMATES that vary.
// Body is plain text; blank lines separate paragraphs (the page renders them as <p>).
const CTA = "\n\nHave questions about your situation? Get in touch — Nilyan replies personally.";

export const GUIDES: NewContent[] = [
  {
    type: "guide",
    status: "published",
    slug: "florida-flood-zones-and-insurance",
    title: "Florida flood zones & insurance, explained",
    excerpt:
      "What FEMA flood zones mean for a Florida home, and how flood insurance is priced — in plain English.",
    heroImageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&q=70",
    metaTitle: "Florida flood zones & flood insurance, explained — Herrera",
    metaDescription:
      "A plain-English guide to FEMA flood zones in Florida and how flood insurance is estimated, so you can budget before you buy.",
    publishedAt: new Date("2026-05-10T12:00:00Z"),
    body:
      "Every property in Florida sits in a FEMA flood zone. The zone is a factual designation based on FEMA flood maps — it is not a judgement about a neighborhood, only about flood risk for that location.\n\n" +
      "Zones beginning with A or V are Special Flood Hazard Areas: if you have a federally backed mortgage there, flood insurance is generally required. Zones labelled X are outside the high-risk area, where flood insurance is optional but often still worth considering.\n\n" +
      "Flood insurance premiums are an ESTIMATE until a carrier quotes your specific property. They depend on the zone, the home's elevation, its construction, and coverage limits. Two homes on the same street can differ. Always treat any number you see online — including ours — as a starting estimate, not a quote.\n\n" +
      "Before you make an offer, it's worth knowing the zone, asking for an elevation certificate if one exists, and getting a real quote. That way the monthly cost of ownership holds no surprises." +
      CTA,
  },
  {
    type: "guide",
    status: "published",
    slug: "hoa-vs-cdd-in-florida",
    title: "HOA vs CDD fees in Florida",
    excerpt:
      "Two very different line items on a Florida home's monthly cost — what each one pays for, and why it matters.",
    heroImageUrl: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&q=70",
    metaTitle: "HOA vs CDD fees in Florida — what's the difference? — Herrera",
    metaDescription:
      "HOA and CDD fees both add to a Florida home's monthly cost but work very differently. Here's what each pays for.",
    publishedAt: new Date("2026-05-20T12:00:00Z"),
    body:
      "Many Florida communities carry an HOA fee, a CDD assessment, or both. They sound similar but are not the same thing.\n\n" +
      "An HOA (Homeowners Association) fee is paid to a private association that maintains shared amenities and common areas — think landscaping, a pool, or a clubhouse — and enforces community rules. It's ongoing for as long as you own the home.\n\n" +
      "A CDD (Community Development District) assessment repays the bonds that funded a community's core infrastructure — roads, water, and drainage — usually collected on your annual property tax bill. CDD debt is typically for a fixed term and can eventually be paid off, after which only a smaller operations-and-maintenance portion remains.\n\n" +
      "When you compare two homes, compare the FULL monthly picture: mortgage, taxes, insurance, HOA, and any CDD. A lower sticker price with high HOA + CDD can cost more month to month than a higher price with neither. The figures on a listing are estimates — confirm current amounts with the association and county before you commit." +
      CTA,
  },
  {
    type: "guide",
    status: "published",
    slug: "first-time-buyer-guide-florida",
    title: "A first-time buyer's guide to Florida",
    excerpt:
      "The steps from 'thinking about it' to keys in hand, and what to budget for beyond the purchase price.",
    heroImageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=70",
    metaTitle: "A first-time buyer's guide to Florida — Herrera",
    metaDescription:
      "A clear, step-by-step guide for first-time buyers in Florida: getting pre-approved, making an offer, and the real cost of ownership.",
    publishedAt: new Date("2026-06-01T12:00:00Z"),
    body:
      "Buying your first home is mostly about removing surprises. Here's the shape of the process in Florida.\n\n" +
      "Start with financing. A mortgage pre-approval tells you a realistic budget and makes your offer stronger. It's worth doing before you fall for a home.\n\n" +
      "Then search with the full cost in mind. In Florida the purchase price is only part of the monthly picture: property taxes, home insurance, possible flood insurance, and any HOA or CDD all add up. A home that fits the price but not the monthly budget isn't a fit. Every such figure is an estimate until quoted.\n\n" +
      "When you find the one, you'll make an offer, agree on terms, and move into inspections and the appraisal. An inspection protects you from expensive unknowns; an appraisal protects the lender. Once those clear and financing is final, you close and get the keys.\n\n" +
      "A good agent's job is to keep each step calm and on schedule, and to make sure the numbers — including the ongoing cost of ownership — are clear before you sign." +
      CTA,
  },
];
