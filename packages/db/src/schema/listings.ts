import { sql } from "drizzle-orm";
import {
  boolean,
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

    // searchable features (ADR-012 D3 filters). NOTE: booleans modeled on our mock data; the real
    // MLS feed may name these differently — reconcile field names when the MLS schema is known.
    waterfront: boolean("waterfront").notNull().default(false),
    pool: boolean("pool").notNull().default(false),
    ageRestricted: boolean("age_restricted").notNull().default(false), // 55+ community

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
    photos: jsonb("photos")
      .$type<Photo[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
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
