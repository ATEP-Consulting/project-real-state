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
const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "closed",
  "lost",
] as const;
const SOURCES = ["qualification_flow", "listing_inquiry"] as const;
const INTENTS = ["buy", "sell", "rent"] as const;

export function generateLeads(rng: Rng, listings: SeedListing[]): SeedLeadBundle {
  const leads: NewLead[] = [];
  const activities: SeedLeadBundle["activities"] = [];
  const consents: SeedLeadBundle["consents"] = [];

  const count = 12;
  for (let i = 0; i < count; i++) {
    const name = `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
    const handle = name.toLowerCase().replace(/[^a-z]+/g, ".");
    // mix of email-only, phone-only, both (never force both)
    const mode = rng.pick(["both", "email", "phone"] as const);
    const email = mode !== "phone" ? `${handle}@example.com` : null;
    const phone = mode !== "email" ? `+1407${rng.int(2000000, 9999999)}` : null;
    const intent = rng.pick(INTENTS);
    const status = rng.pick(STATUSES);

    const viewed = Array.from({ length: rng.int(0, 3) }, () => rng.pick(listings).slug);
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
      row: { type: "note", body: "Lead captured from the website.", meta: {} },
    });
    if (status !== "new")
      activities.push({
        leadIndex: i,
        row: { type: "call", body: "Left a voicemail; will follow up.", meta: {} },
      });
    if (status === "appointment" || status === "offer")
      activities.push({
        leadIndex: i,
        row: { type: "reminder", body: "Confirm showing time.", meta: {}, dueAt: null },
      });
  }

  return { leads, activities, consents };
}
