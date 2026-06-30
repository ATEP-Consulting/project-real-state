import type { NewActivity } from "../schema/activities";
import type { NewConsentRecord } from "../schema/consent";
import type { NewLead } from "../schema/leads";
import type { Rng } from "./prng";
import type { SeedListing } from "./listings";

// activities/consents reference a lead by its array index (the runner maps to real UUIDs after insert).
export type SeedLeadBundle = {
  leads: NewLead[];
  activities: { leadIndex: number; row: Omit<NewActivity, "leadId"> }[];
  consents: { leadIndex: number; row: Omit<NewConsentRecord, "leadId"> }[];
};

const FIRST = [
  "Maria",
  "James",
  "Sofia",
  "David",
  "Lucia",
  "Robert",
  "Elena",
  "Carlos",
  "Anna",
  "Michael",
];
const LAST = ["Garcia", "Smith", "Rodriguez", "Johnson", "Martinez", "Brown", "Lopez", "Davis"];
const SOURCES = ["qualification_flow", "listing_inquiry"] as const;
const INTENTS = ["buy", "sell", "rent"] as const;

// Curated so the demo dashboard is meaningful: 3 uncontacted (incl. one "hot"),
// a full pipeline, and both closed + lost so the win rate isn't 0/0.
const STATUS_PLAN = [
  "new",
  "new",
  "new",
  "contacted",
  "contacted",
  "contacted",
  "qualified",
  "qualified",
  "appointment",
  "offer",
  "closed",
  "lost",
] as const;
// Hours-ago for each lead's createdAt (the 3 "new" ones are recent so they read as fresh).
const HOURS_AGO = [2, 7, 26, 50, 74, 120, 170, 240, 360, 170, 300, 420];
// Hours from creation to the first logged call (only used for contacted+; mixes fast/slow
// so the median speed-to-contact is realistic). Indices 0–2 (new) are unused.
const DELAY_H = [0, 0, 0, 0.5, 1, 3, 2, 30, 1.5, 18, 4, 48];

export function generateLeads(rng: Rng, listings: SeedListing[], now: Date): SeedLeadBundle {
  const leads: NewLead[] = [];
  const activities: SeedLeadBundle["activities"] = [];
  const consents: SeedLeadBundle["consents"] = [];

  const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000);
  const ahead = (hours: number) => new Date(now.getTime() + hours * 3_600_000);

  const count = STATUS_PLAN.length;
  for (let i = 0; i < count; i++) {
    const name = `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
    const handle = name.toLowerCase().replace(/[^a-z]+/g, ".");
    // mix of email-only, phone-only, both (never force both)
    const mode = rng.pick(["both", "email", "phone"] as const);
    const email = mode !== "phone" ? `${handle}@example.com` : null;
    const phone = mode !== "email" ? `+1407${rng.int(2000000, 9999999)}` : null;
    const intent = rng.pick(INTENTS);
    const status = STATUS_PLAN[i]!;
    const createdAt = ago(HOURS_AGO[i]!);

    // Lead 0 is the "hot" uncontacted lead — viewed several homes; the rest view 0–3.
    const viewedN = i === 0 ? 4 : rng.int(0, 3);
    const viewed = Array.from({ length: viewedN }, () => rng.pick(listings).slug);
    const answers =
      intent === "buy"
        ? {
            timeline: rng.pick(["0_3", "3_6", "6_12"]),
            budget: rng.pick(["300_500", "500_800"]),
            preapproved: rng.chance(0.5),
          }
        : intent === "sell"
          ? { address: "Provided privately", timeline: rng.pick(["asap", "3_6"]) }
          : { movein: rng.pick(["0_1", "1_3"]), budget: rng.pick(["u2000", "2000_3000"]) };

    leads.push({
      intent,
      status,
      name,
      email,
      phone,
      answers,
      source: rng.pick(SOURCES),
      attribution: { utmSource: rng.pick(["google", "facebook", "direct"]), landingPath: "/" },
      // viewedListingIds stores slugs here as a stand-in; D-tasks may switch to ids. Schema is string[].
      viewedListingIds: viewed,
      createdAt,
    });

    // consent: a record for each channel the lead provided
    if (email)
      consents.push({
        leadIndex: i,
        row: {
          channel: "email",
          granted: true,
          wording: "I agree to be contacted by email.",
          source: "seed",
        },
      });
    if (phone)
      consents.push({
        leadIndex: i,
        row: {
          channel: "phone",
          granted: true,
          wording: "I agree to be contacted by phone.",
          source: "seed",
        },
      });

    // activities so the timeline looks alive
    activities.push({
      leadIndex: i,
      row: { type: "note", body: "Lead captured from the website.", meta: {}, createdAt },
    });
    if (status !== "new")
      activities.push({
        leadIndex: i,
        row: {
          type: "call",
          body: "Left a voicemail; will follow up.",
          meta: {},
          createdAt: new Date(createdAt.getTime() + DELAY_H[i]! * 3_600_000),
        },
      });
  }

  // Follow-up reminders with real due dates so the dashboard's "overdue / today" lists
  // have data. Indices map to STATUS_PLAN: 8=appointment, 9=offer, 3/4=contacted, 6=qualified.
  const reminder = (
    leadIndex: number,
    body: string,
    dueAt: Date,
    completedAt: Date | null = null,
  ) =>
    activities.push({ leadIndex, row: { type: "reminder", body, meta: {}, dueAt, completedAt } });

  reminder(8, "Confirm the showing time", ahead(3)); // due today
  reminder(6, "Send a shortlist of listings", ahead(1)); // due today
  reminder(9, "Follow up on the offer", ago(24)); // overdue ~1d
  reminder(3, "Call back about financing", ago(48)); // overdue ~2d
  reminder(4, "Sent docs — confirmed", ago(48), ago(24)); // completed (history)
  reminder(7, "Quarterly check-in", ahead(72)); // upcoming (lives on the lead, off-dashboard)

  return { leads, activities, consents };
}
