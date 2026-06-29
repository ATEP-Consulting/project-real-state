# F2 — Database & Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `@herrera/db` — the shared Drizzle schema (PostgreSQL + PostGIS), the generated initial migration (with `CREATE EXTENSION postgis` and the `geometry(Point,4326)` + GiST index on `listings`), and Zod types derived from the schema — with no seed data, no API, no UI.

**Architecture:** A new `packages/db` workspace owns all tables. Each table lives in its own file under `src/schema/` and co-locates its `drizzle-zod`-derived Zod insert/select schemas (and the Zod shapes for its JSONB columns). One initial migration is generated after all tables exist. A thin `client.ts` wires a Neon (HTTP) Drizzle client for downstream phases; F2 never executes it. Compliance/lead-gen invariants that the DB can enforce are enforced (`leads` contact CHECK), the rest live in the Zod layer.

**Tech Stack:** Drizzle ORM + drizzle-kit + drizzle-zod · PostgreSQL 16 + PostGIS · Zod · Neon serverless (`neon-http`). Toolchain (TS strict, ESLint, Prettier, Vitest) from F1.

## Global Constraints

- **Schema + migrations + Zod types only.** No seed (that's F5), no API routes, no UI, no `apps/*` changes.
- **ADRs:** ADR-002 (PostGIS/Drizzle/Zod), ADR-005 (listings model), ADR-006 (one table, all sources, `mock` purgeable), ADR-007 (leads/consent), ADR-008 (activities/questions/content/CRM), ADR-011 (per-channel consent + suppression seam; compliance fields), ADR-017 (seams only for v2 — saved-search shape).
- **`listings` carries `source ('mls'|'manual'|'mock')`** and `visibility ('public'|'registered'|'private_link')`; `mock` rows are one-query purgeable; `mls` attribution fields travel with the row.
- **`leads`: phone and/or email — at least one, never both required.** Enforced by a DB CHECK *and* the Zod insert schema.
- **PostGIS:** migration runs `CREATE EXTENSION IF NOT EXISTS postgis;` before any geometry DDL; `listings.geom` is `geometry(Point,4326)` with a **GiST** index.
- **i18n (ADR-018):** localized content carries paired EN/ES columns (English is the default).
- **Estimates (ADR-013):** Florida cost fields are named `est_*` to signal they are estimates, never quotes.
- **Quality gate:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm db:generate` (clean, validated SQL) all green. Applying migrations to a live DB (`pnpm db:migrate`) is an **open question** — see end of plan.
- **Package scope:** `@herrera/db`, consumed via `workspace:*`.

## File Structure

```
packages/db/
  package.json            # @herrera/db — drizzle-orm, drizzle-zod, @neondatabase/serverless, zod; devDep drizzle-kit
  tsconfig.json           # extends @herrera/config node preset (reference only; root tsconfig does the checking)
  drizzle.config.ts       # drizzle-kit config (schema glob, out=./drizzle, dialect=postgresql)
  drizzle/                # generated migrations (created by db:generate in Task 5)
  src/
    index.ts              # re-exports schema + client types
    client.ts             # Neon-HTTP Drizzle client (not executed in F2)
    schema/
      index.ts            # re-exports every table + enums
      enums.ts            # all pgEnums
      json.ts             # Zod shapes for JSONB columns (Photo, Attribution, etc.)
      listings.ts         # listings table + zod  (+ .test.ts)
      leads.ts            # leads table + zod      (+ .test.ts)
      consent.ts          # consent_records table + zod
      suppressions.ts     # suppressions table (seam) + zod
      saved-searches.ts   # saved_searches table (v2 seam) + zod
      activities.ts       # activities table + zod
      qualification-questions.ts  # qualification_questions + zod
      content.ts          # content table + zod
```

Root changes: add `db:generate`/`db:migrate`/`db:studio` scripts; extend the root `tsconfig.json` `include` to cover `packages/db`.

---

### Task 1: `@herrera/db` scaffold — package, config, enums, client, root wiring

Creates the package, the Drizzle config + Neon client, all shared enums and JSONB Zod shapes, and wires root scripts + typecheck. No tables yet → `index.ts` re-exports only enums/json.

**Files:**
- Create: `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/drizzle.config.ts`
- Create: `packages/db/src/index.ts`, `packages/db/src/client.ts`
- Create: `packages/db/src/schema/index.ts`, `packages/db/src/schema/enums.ts`, `packages/db/src/schema/json.ts`
- Modify: `package.json` (root — add `db:*` scripts), `tsconfig.json` (root — extend `include`)

**Interfaces:**
- Produces (consumed by Tasks 2–5):
  - Enums: `listingSource`, `listingVisibility`, `listingStatus`, `propertyType`, `leadIntent`, `leadStatus`, `contactChannel`, `activityType`, `questionType`, `contentType`, `contentStatus` (all `pgEnum`).
  - Zod JSONB shapes: `photoSchema`/`Photo`, `attributionSchema`/`Attribution`, `qualificationAnswersSchema`, `questionOptionSchema`/`QuestionOption`.
  - `db` (Neon-HTTP Drizzle client), `DB` type.

- [ ] **Step 1: Create the package manifest**

`packages/db/package.json`:

```json
{
  "name": "@herrera/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@herrera/config": "workspace:*",
    "@neondatabase/serverless": "^0.10.0",
    "drizzle-orm": "^0.38.0",
    "drizzle-zod": "^0.6.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0"
  }
}
```

> Versions are floors; `pnpm` resolves latest matching. Drizzle moves fast — if the installed `drizzle-orm`/`drizzle-zod` API differs (e.g. `geometry`, `check`, `createInsertSchema` signatures), adjust to the installed version; `pnpm typecheck` + `db:generate` will surface mismatches.

- [ ] **Step 2: Create the package tsconfig (reference) and Drizzle config**

`packages/db/tsconfig.json`:

```json
{
  "extends": "../config/tsconfig.node.json",
  "include": ["src/**/*", "drizzle.config.ts"]
}
```

`packages/db/drizzle.config.ts` (note: `generate` needs no DB; `migrate`/`studio` read `DATABASE_URL`):

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 3: Create the enums**

`packages/db/src/schema/enums.ts`:

```ts
import { pgEnum } from "drizzle-orm/pg-core";

// ADR-005 — provenance + visibility + status
export const listingSource = pgEnum("listing_source", ["mls", "manual", "mock"]);
export const listingVisibility = pgEnum("listing_visibility", [
  "public",
  "registered",
  "private_link",
]);
export const listingStatus = pgEnum("listing_status", [
  "active",
  "pending",
  "sold",
  "off_market",
]);
export const propertyType = pgEnum("property_type", [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
  "villa",
  "co_op",
  "land",
  "mobile",
  "other",
]);

// ADR-007/008 — leads + pipeline
export const leadIntent = pgEnum("lead_intent", ["buy", "sell", "rent"]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "closed",
  "lost",
]);

// ADR-011 — per-channel consent + suppression share one channel enum
export const contactChannel = pgEnum("contact_channel", ["email", "phone", "sms", "whatsapp"]);

// ADR-008 — CRM activities
export const activityType = pgEnum("activity_type", [
  "call",
  "note",
  "status_change",
  "reminder",
  "email",
  "meeting",
]);

// ADR-007 — configurable questions
export const questionType = pgEnum("question_type", [
  "single_select",
  "multi_select",
  "text",
  "number",
  "boolean",
  "range",
]);

// ADR-008/015 — editable content
export const contentType = pgEnum("content_type", ["area", "neighborhood", "guide", "page"]);
export const contentStatus = pgEnum("content_status", ["draft", "published"]);
```

- [ ] **Step 4: Create the JSONB Zod shapes**

`packages/db/src/schema/json.ts`:

```ts
import { z } from "zod";

/** Ordered listing photo (ADR-005 media). */
export const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
});
export type Photo = z.infer<typeof photoSchema>;

/** Lead source/attribution (ADR-007). */
export const attributionSchema = z.object({
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  referrer: z.string().optional(),
  landingPath: z.string().optional(),
});
export type Attribution = z.infer<typeof attributionSchema>;

/** Lead qualification answers — keyed by qualification_questions.key (ADR-007). */
export const qualificationAnswersSchema = z.record(z.string(), z.unknown());
export type QualificationAnswers = z.infer<typeof qualificationAnswersSchema>;

/** Option for a single/multi-select question, localized EN/ES (ADR-007/018). */
export const questionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  labelEs: z.string().optional(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

/** FEMA flood-zone designations (ADR-013) — labeled estimates downstream. */
export const floodZoneSchema = z.enum([
  "X",
  "A",
  "AE",
  "AH",
  "AO",
  "AR",
  "A99",
  "V",
  "VE",
  "D",
]);
export type FloodZone = z.infer<typeof floodZoneSchema>;
```

- [ ] **Step 5: Create the schema barrel, package barrel, and client**

`packages/db/src/schema/index.ts`:

```ts
export * from "./enums";
export * from "./json";
// tables are added here in Tasks 2–4
```

`packages/db/src/client.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { parseServerEnv } from "@herrera/config/env";
import * as schema from "./schema/index";

// Neon HTTP driver — Vercel-friendly; no WebSocket setup. Migrations use drizzle-kit, not this client.
const env = parseServerEnv();
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

`packages/db/src/index.ts`:

```ts
export * as schema from "./schema/index";
export { db, type DB } from "./client";
```

- [ ] **Step 6: Wire root scripts and typecheck**

In root `package.json` `scripts`, add (keep existing F1 scripts):

```json
    "db:generate": "pnpm --filter @herrera/db generate",
    "db:migrate": "pnpm --filter @herrera/db migrate",
    "db:studio": "pnpm --filter @herrera/db studio"
```

Replace root `tsconfig.json` `include` so both packages are checked:

```json
{
  "extends": "./packages/config/tsconfig.base.json",
  "include": ["packages/*/src/**/*", "packages/db/drizzle.config.ts"]
}
```

- [ ] **Step 7: Install and verify the scaffold**

Run: `pnpm install`
Expected: links `@herrera/db`; installs drizzle-orm, drizzle-kit, drizzle-zod, @neondatabase/serverless.

Run: `pnpm typecheck`
Expected: exits 0 (enums, json shapes, client all compile; `client.ts` imports resolve even though it is never called).

Run: `pnpm lint && pnpm format`
Then: `pnpm format:check`
Expected: lint exits 0; `All matched files use Prettier code style!`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(db): scaffold @herrera/db (drizzle config, neon client, enums, jsonb zod shapes)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `listings` table (PostGIS geometry, Florida fields, media, attribution) + Zod

**Files:**
- Create: `packages/db/src/schema/listings.ts`, `packages/db/src/schema/listings.test.ts`
- Modify: `packages/db/src/schema/index.ts` (export listings)

**Interfaces:**
- Consumes: enums + `photoSchema`/`floodZoneSchema` (Task 1).
- Produces: `listings` table; `listingInsertSchema`, `listingSelectSchema`; types `Listing`, `NewListing`.

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema/listings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { listingInsertSchema } from "./listings";

const base = {
  source: "mock",
  status: "active",
  slug: "123-main-st-orlando-fl",
  propertyType: "single_family",
  price: 450000,
  bedrooms: 3,
  bathrooms: "2.5",
  addressLine1: "123 Main St",
  city: "Orlando",
  zip: "32801",
  latitude: "28.5383",
  longitude: "-81.3792",
  geom: [-81.3792, 28.5383] as [number, number],
};

describe("listingInsertSchema", () => {
  it("accepts a valid mock listing", () => {
    const parsed = listingInsertSchema.parse(base);
    expect(parsed.source).toBe("mock");
    expect(parsed.geom).toEqual([-81.3792, 28.5383]);
  });

  it("rejects an invalid source", () => {
    expect(() => listingInsertSchema.parse({ ...base, source: "zillow" })).toThrow();
  });

  it("rejects an invalid flood zone", () => {
    expect(() => listingInsertSchema.parse({ ...base, floodZone: "ZZ" })).toThrow();
  });

  it("validates photo objects", () => {
    expect(() =>
      listingInsertSchema.parse({ ...base, photos: [{ url: "not-a-url" }] }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./listings`.

- [ ] **Step 3: Write the implementation**

`packages/db/src/schema/listings.ts`:

```ts
import { sql } from "drizzle-orm";
import {
  geometry,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { listingSource, listingStatus, listingVisibility, propertyType } from "./enums";
import { floodZoneSchema, photoSchema, type Photo } from "./json";

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // ADR-005/006 — provenance, visibility, lifecycle
    source: listingSource("source").notNull(),
    visibility: listingVisibility("visibility").notNull().default("public"),
    status: listingStatus("status").notNull().default("active"),
    slug: text("slug").notNull(),
    mlsNumber: text("mls_number"),

    // facts
    propertyType: propertyType("property_type").notNull(),
    price: integer("price").notNull(), // whole USD
    bedrooms: integer("bedrooms"),
    bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
    sqft: integer("sqft"),
    lotSizeSqft: integer("lot_size_sqft"),
    yearBuilt: integer("year_built"),
    description: text("description"),

    // address + geo (ADR-012)
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull().default("FL"),
    zip: text("zip").notNull(),
    county: text("county"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    geom: geometry("geom", { type: "point", mode: "tuple", srid: 4326 }),

    // Florida cost-of-ownership (ADR-013) — all ESTIMATES
    floodZone: text("flood_zone"),
    hoaFeeMonthly: integer("hoa_fee_monthly"),
    cddFeeAnnual: integer("cdd_fee_annual"),
    estPropertyTaxAnnual: integer("est_property_tax_annual"),
    estHomeInsuranceAnnual: integer("est_home_insurance_annual"),
    estFloodInsuranceAnnual: integer("est_flood_insurance_annual"),

    // media (ADR-005)
    photos: jsonb("photos").$type<Photo[]>().notNull().default(sql`'[]'::jsonb`),
    videoUrl: text("video_url"),
    virtualTourUrl: text("virtual_tour_url"),

    // compliance/attribution (ADR-011) — render disclaimer + Equal Housing on mls rows
    listingBrokerageName: text("listing_brokerage_name"),
    listingAgentName: text("listing_agent_name"),
    originatingMls: text("originating_mls"),

    // bookkeeping
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("listings_slug_uq").on(t.slug),
    index("listings_geom_gix").using("gist", t.geom),
    index("listings_source_ix").on(t.source),
    index("listings_status_ix").on(t.status),
    index("listings_city_ix").on(t.city),
    index("listings_price_ix").on(t.price),
  ],
);

export const listingInsertSchema = createInsertSchema(listings, {
  geom: z.tuple([z.number(), z.number()]).optional(),
  photos: z.array(photoSchema).optional(),
  floodZone: floodZoneSchema.optional(),
});
export const listingSelectSchema = createSelectSchema(listings);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
```

- [ ] **Step 4: Export from the schema barrel**

Add to `packages/db/src/schema/index.ts`:

```ts
export * from "./listings";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (listings suite green).

- [ ] **Step 6: Typecheck + lint, then commit**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

```bash
git add -A
git commit -m "feat(db): add listings table (PostGIS geometry, Florida cost fields, media, attribution) + zod

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `leads` + `consent_records` + `suppressions` + `saved_searches` (seam) + Zod

**Files:**
- Create: `packages/db/src/schema/leads.ts`, `packages/db/src/schema/leads.test.ts`
- Create: `packages/db/src/schema/consent.ts`, `packages/db/src/schema/suppressions.ts`, `packages/db/src/schema/saved-searches.ts`
- Modify: `packages/db/src/schema/index.ts`

**Interfaces:**
- Consumes: enums, `attributionSchema`, `qualificationAnswersSchema` (Task 1).
- Produces: `leads`, `consentRecords`, `suppressions`, `savedSearches` tables; `leadInsertSchema` (with phone-or-email refinement), `consentInsertSchema`; types `Lead`, `NewLead`, `ConsentRecord`.

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema/leads.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { leadInsertSchema } from "./leads";

const base = { intent: "buy" as const };

describe("leadInsertSchema (ADR-007: phone and/or email, at least one)", () => {
  it("accepts a lead with only an email", () => {
    expect(() => leadInsertSchema.parse({ ...base, email: "a@b.com" })).not.toThrow();
  });

  it("accepts a lead with only a phone", () => {
    expect(() => leadInsertSchema.parse({ ...base, phone: "+13055551234" })).not.toThrow();
  });

  it("rejects a lead with neither phone nor email", () => {
    expect(() => leadInsertSchema.parse({ ...base })).toThrow(/email or phone/i);
  });

  it("rejects an invalid email", () => {
    expect(() => leadInsertSchema.parse({ ...base, email: "nope" })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./leads`.

- [ ] **Step 3: Write the implementations**

`packages/db/src/schema/leads.ts`:

```ts
import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { leadIntent, leadStatus } from "./enums";
import {
  attributionSchema,
  qualificationAnswersSchema,
  type Attribution,
  type QualificationAnswers,
} from "./json";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    intent: leadIntent("intent").notNull(),
    status: leadStatus("status").notNull().default("new"),

    // contact — at least one of email/phone (CHECK below + zod refinement)
    name: text("name"),
    email: text("email"),
    phone: text("phone"),

    // qualification + attribution (ADR-007)
    answers: jsonb("answers").$type<QualificationAnswers>().notNull().default(sql`'{}'::jsonb`),
    source: text("source"),
    attribution: jsonb("attribution").$type<Attribution>(),
    viewedListingIds: jsonb("viewed_listing_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("leads_contact_present", sql`${t.email} is not null or ${t.phone} is not null`),
    index("leads_status_ix").on(t.status),
    index("leads_intent_ix").on(t.intent),
  ],
);

export const leadInsertSchema = createInsertSchema(leads, {
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  answers: qualificationAnswersSchema.optional(),
  attribution: attributionSchema.optional(),
  viewedListingIds: z.array(z.string().uuid()).optional(),
}).refine((d) => Boolean(d.email) || Boolean(d.phone), {
  message: "A lead requires an email or phone (at least one).",
  path: ["email"],
});
export const leadSelectSchema = createSelectSchema(leads);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
```

`packages/db/src/schema/consent.ts`:

```ts
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contactChannel } from "./enums";
import { leads } from "./leads";

// ADR-011 — immutable per-channel consent record (what was agreed, when, the wording shown, source)
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    channel: contactChannel("channel").notNull(),
    granted: boolean("granted").notNull(),
    wording: text("wording").notNull(),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("consent_lead_ix").on(t.leadId)],
);

export const consentInsertSchema = createInsertSchema(consentRecords);
export const consentSelectSchema = createSelectSchema(consentRecords);
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type NewConsentRecord = typeof consentRecords.$inferInsert;
```

`packages/db/src/schema/suppressions.ts`:

```ts
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contactChannel } from "./enums";

// ADR-011/017 — suppression-list SEAM. Modeled now; no send/suppress logic in v1.
export const suppressions = pgTable(
  "suppressions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: contactChannel("channel").notNull(),
    value: text("value").notNull(), // the suppressed email / phone
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("suppressions_channel_value_uq").on(t.channel, t.value)],
);

export const suppressionInsertSchema = createInsertSchema(suppressions);
export const suppressionSelectSchema = createSelectSchema(suppressions);
export type Suppression = typeof suppressions.$inferSelect;
```

`packages/db/src/schema/saved-searches.ts`:

```ts
import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ADR-017 — saved-search SHAPE seam for v2 (saved searches + alerts). No UI/logic in v1.
// `criteria` mirrors the structured search-filter object the search layer will consume (ADR-014 seam).
export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id"), // nullable — passwordless client accounts are v2
  label: text("label"),
  criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedSearchInsertSchema = createInsertSchema(savedSearches);
export const savedSearchSelectSchema = createSelectSchema(savedSearches);
export type SavedSearch = typeof savedSearches.$inferSelect;
```

- [ ] **Step 4: Export from the schema barrel**

Add to `packages/db/src/schema/index.ts`:

```ts
export * from "./leads";
export * from "./consent";
export * from "./suppressions";
export * from "./saved-searches";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (leads suite green; both `listings` and `leads` suites pass).

- [ ] **Step 6: Typecheck + lint, then commit**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

```bash
git add -A
git commit -m "feat(db): add leads (phone/email CHECK), consent records, suppression + saved-search seams

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `activities`, `qualification_questions`, `content` + Zod

**Files:**
- Create: `packages/db/src/schema/activities.ts`, `packages/db/src/schema/qualification-questions.ts`, `packages/db/src/schema/content.ts`
- Create: `packages/db/src/schema/content.test.ts`
- Modify: `packages/db/src/schema/index.ts`

**Interfaces:**
- Consumes: enums, `questionOptionSchema` (Task 1), `leads` (Task 3).
- Produces: `activities`, `qualificationQuestions`, `content` tables + Zod insert/select schemas + row types.

- [ ] **Step 1: Write the failing test**

`packages/db/src/schema/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contentInsertSchema } from "./content";

const base = {
  type: "neighborhood" as const,
  slug: "winter-park",
  title: "Winter Park",
};

describe("contentInsertSchema", () => {
  it("accepts a valid neighborhood page", () => {
    expect(() => contentInsertSchema.parse(base)).not.toThrow();
  });

  it("rejects an invalid content type", () => {
    expect(() => contentInsertSchema.parse({ ...base, type: "wiki" })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 3: Write the implementations**

`packages/db/src/schema/activities.ts`:

```ts
import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { activityType } from "./enums";
import { leads } from "./leads";

// ADR-008 — calls, notes, status changes, follow-up reminders tied to a lead
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: activityType("type").notNull(),
    body: text("body"),
    // status_change → { from, to }; other types may carry small structured extras
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    // reminders
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_lead_ix").on(t.leadId), index("activities_due_ix").on(t.dueAt)],
);

export const activityInsertSchema = createInsertSchema(activities);
export const activitySelectSchema = createSelectSchema(activities);
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
```

`packages/db/src/schema/qualification-questions.ts`:

```ts
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { leadIntent, questionType } from "./enums";
import { questionOptionSchema, type QuestionOption } from "./json";

// ADR-007 — admin-editable questions per intent (Nilyan configures); answers keyed by `key`
export const qualificationQuestions = pgTable(
  "qualification_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    intent: leadIntent("intent").notNull(),
    key: text("key").notNull(), // stable key referenced by leads.answers
    sortOrder: integer("sort_order").notNull().default(0),
    type: questionType("type").notNull(),
    label: text("label").notNull(),
    labelEs: text("label_es"),
    options: jsonb("options").$type<QuestionOption[]>().notNull().default(sql`'[]'::jsonb`),
    required: boolean("required").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("questions_intent_key_uq").on(t.intent, t.key),
    index("questions_intent_order_ix").on(t.intent, t.sortOrder),
  ],
);

export const questionInsertSchema = createInsertSchema(qualificationQuestions, {
  options: z.array(questionOptionSchema).optional(),
});
export const questionSelectSchema = createSelectSchema(qualificationQuestions);
export type QualificationQuestion = typeof qualificationQuestions.$inferSelect;
export type NewQualificationQuestion = typeof qualificationQuestions.$inferInsert;
```

`packages/db/src/schema/content.ts`:

```ts
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contentStatus, contentType } from "./enums";

// ADR-008/015/018 — admin-editable area/neighborhood/guide pages, localized EN/ES (English default)
export const content = pgTable(
  "content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: contentType("type").notNull(),
    status: contentStatus("status").notNull().default("draft"),
    slug: text("slug").notNull(),

    // area/neighborhood mapping for /areas/[city]/[neighborhood]
    city: text("city"),
    neighborhood: text("neighborhood"),

    // localized fields (EN default + ES)
    title: text("title").notNull(),
    titleEs: text("title_es"),
    excerpt: text("excerpt"),
    excerptEs: text("excerpt_es"),
    body: text("body"),
    bodyEs: text("body_es"),
    heroImageUrl: text("hero_image_url"),

    // SEO (ADR-015)
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("content_type_slug_uq").on(t.type, t.slug),
    index("content_status_ix").on(t.status),
  ],
);

export const contentInsertSchema = createInsertSchema(content);
export const contentSelectSchema = createSelectSchema(content);
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
```

- [ ] **Step 4: Export from the schema barrel**

Add to `packages/db/src/schema/index.ts`:

```ts
export * from "./activities";
export * from "./qualification-questions";
export * from "./content";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (content suite green; all suites pass).

- [ ] **Step 6: Typecheck + lint, then commit**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

```bash
git add -A
git commit -m "feat(db): add activities, qualification_questions, content tables + zod

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Generate the initial migration, enable PostGIS, validate the SQL

Generates one initial migration from the full schema, prepends the PostGIS extension, and validates the SQL contains the critical DDL. (Applying it to a live DB is the open question below.)

**Files:**
- Create: `packages/db/drizzle/0000_*.sql` + `packages/db/drizzle/meta/*` (generated)
- Modify: the generated `0000_*.sql` (prepend `CREATE EXTENSION`)

- [ ] **Step 1: Generate the migration**

Run: `pnpm db:generate`
Expected: drizzle-kit writes `packages/db/drizzle/0000_<name>.sql` + `meta/_journal.json` with all enums + 8 tables.

- [ ] **Step 2: Enable PostGIS at the top of the generated migration**

Open the generated `packages/db/drizzle/0000_*.sql` and insert as the **first** line:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

This must precede the `listings` table DDL (which uses `geometry(Point,4326)`). drizzle-kit applies files top-to-bottom, so the extension is created before any geometry column.

- [ ] **Step 3: Validate the generated SQL contains the critical DDL**

Run:

```bash
SQL=packages/db/drizzle/0000_*.sql
grep -qi "CREATE EXTENSION IF NOT EXISTS postgis" $SQL && echo "✓ postgis extension"
grep -qi 'geometry(point,4326)\|geometry("point",4326)\|geometry(Point,4326)' $SQL && echo "✓ geometry(Point,4326)"
grep -qi "using gist" $SQL && echo "✓ gist index"
grep -qi "leads_contact_present" $SQL && echo "✓ leads contact CHECK"
for tbl in listings leads consent_records suppressions saved_searches activities qualification_questions content; do
  grep -qi "CREATE TABLE \"$tbl\"" $SQL && echo "✓ table $tbl" || echo "✗ MISSING table $tbl"
done
```

Expected: every line prints a ✓ (no `✗ MISSING`). If the geometry/gist grep misses due to drizzle's exact casing/spacing, inspect the SQL and confirm the geometry column + GiST index are present, then adjust the grep.

- [ ] **Step 4: Run the full quality gate**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): generate initial migration; enable PostGIS; validate geometry + CHECK DDL

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Open question — applying migrations to a database

`pnpm db:generate` and all gates above run **without a database**. Actually *applying* the migration (`pnpm db:migrate`) and verifying PostGIS end-to-end needs a Postgres+PostGIS instance and a `DATABASE_URL`. Options to resolve before/at execution:

1. **Stop at generated + validated migrations (no apply).** F2 ships the schema + migration; applying happens in F5 (seed) once a DB exists. ← simplest, fully self-verified.
2. **Apply to your Neon dev branch.** Provide a `DATABASE_URL` (Neon, with PostGIS available) and I run `pnpm db:migrate` + a smoke check (insert a listing with a point, query by bbox).
3. **Apply to a local PostGIS via Docker.** I stand up `postgis/postgis` in Docker, point `DATABASE_URL` at it, run `db:migrate`, and verify — needs Docker available on your machine.

**Recommendation:** Option 1 for F2 (keeps F2 hermetic), then apply during F5 when we seed. Tell me if you'd rather do 2 or 3.

## Self-Review

**1. Spec coverage (your F2 checklist):**
- PostGIS via migration + `geometry(Point,4326)` + spatial (GiST) index on `listings` → Task 2 (column/index) + Task 5 (extension). ✅
- `listings` source/visibility + Florida fields (flood_zone, hoa, cdd, est. taxes/insurance) + media (photos/video/tour) + attribution → Task 2. ✅
- `leads` (phone and/or email, intent, JSONB answers, source, viewed listings) + per-channel consent + suppression seam → Task 3 (CHECK + zod refinement; consent_records; suppressions). ✅
- `activities`, `qualification_questions`, `content` → Task 4. ✅
- Schema + migrations + Zod types only; no seed/API/UI → enforced in Global Constraints; Task 5 generates migration, no apply. ✅
- (Bonus per ADR-017: saved-search shape seam → Task 3, flagged for your call.)

**2. Placeholder scan:** every file step has complete code; every run step has an expected result. No TODO/TBD. ✅

**3. Type consistency:** `leadInsertSchema`/`listingInsertSchema`/`contentInsertSchema` names used in tests match exports; `Photo`/`Attribution`/`QualificationAnswers`/`QuestionOption` defined in `json.ts` (Task 1) and consumed in Tasks 2–4; `leads` imported by `consent.ts`/`activities.ts` exists from Task 3. ✅

## Risks / notes for the executor
- **Drizzle API drift:** `geometry`, `check`, `createInsertSchema` signatures can change between versions. If install pulls a newer major, verify against its docs; `typecheck` + `db:generate` will fail loudly on mismatch. The likely touch points: `geometry({ type, mode, srid })`, the array-form table extra-config `(t) => [...]`, and `createInsertSchema(table, refinements)`.
- **`numeric` columns return strings** in JS (`bathrooms`, `latitude`, `longitude`) — intentional (no float precision loss); the tests pass strings accordingly.
- **`createInsertSchema` + `.refine`:** the refined `leadInsertSchema` is a `ZodEffects`; that's fine for `.parse`. If a later task needs `.extend()` on it, call `.innerType()` or refine last.
- **PostGIS on Neon:** Neon supports the `postgis` extension; `CREATE EXTENSION IF NOT EXISTS postgis;` works on a Neon branch. Confirmed only when Option 2 is chosen.
- **`client.ts` is never run in F2** — it only needs to typecheck. First real use (with a live `DATABASE_URL`) is F5.
