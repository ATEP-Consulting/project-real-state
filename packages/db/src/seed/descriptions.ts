import type { Rng } from "./prng";

// PROPERTY FACTS ONLY — never steering/demographic language (ADR-011 Fair Housing).
const FEATURES = [
  "updated kitchen with quartz countertops",
  "tile flooring throughout the main level",
  "a screened lanai",
  "a two-car garage",
  "vaulted ceilings",
  "a primary suite with a walk-in closet",
  "stainless steel appliances",
  "a fenced backyard",
  "energy-efficient windows",
  "a newer roof (2021)",
  "a covered front porch",
  "an open-concept living area",
];

export function buildDescription(
  rng: Rng,
  facts: { beds: number; baths: number; sqft: number; neighborhood: string; yearBuilt: number },
): string {
  const picks = new Set<string>();
  while (picks.size < 3) picks.add(rng.pick(FEATURES));
  const list = [...picks];
  return (
    `${facts.beds}-bedroom, ${facts.baths}-bath home in ${facts.neighborhood} ` +
    `offering ${facts.sqft.toLocaleString()} sq ft, built in ${facts.yearBuilt}. ` +
    `Features include ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}. ` +
    `Contact us to schedule a tour.`
  );
}
