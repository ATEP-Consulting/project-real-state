import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  activities,
  consentRecords,
  content,
  leads,
  listings,
  qualificationQuestions,
} from "../schema/index";
import { generateLeads } from "./leads";
import { generateListings, generateOffMarket, type SeedListing } from "./listings";
import { makeRng } from "./prng";
import { QUESTIONS } from "./questions";

type DB = ReturnType<typeof drizzle>;

function insertValues(rows: SeedListing[]) {
  // Convert geom tuple → ST_SetSRID(ST_MakePoint(lng,lat),4326) to satisfy geometry(Point,4326).
  return rows.map(({ geom, ...rest }) => ({
    ...rest,
    geom: sql`ST_SetSRID(ST_MakePoint(${geom[0]}, ${geom[1]}), 4326)`,
  }));
}

export async function clearSeed(db: DB) {
  // FK-safe order; cascades from leads cover activities/consent, but be explicit.
  await db.delete(activities);
  await db.delete(consentRecords);
  await db.delete(leads);
  await db.delete(qualificationQuestions);
  await db.delete(content);
  await db.delete(listings).where(sql`${listings.source} in ('mock','manual')`);
}

export async function runSeed(databaseUrl: string) {
  const db = drizzle(neon(databaseUrl));
  const rng = makeRng(20260629);

  const market = generateListings(rng);
  const offMarket = generateOffMarket(rng);
  const { leads: leadRows, activities: acts, consents } = generateLeads(makeRng(42), market);

  await clearSeed(db);

  await db.insert(listings).values(insertValues([...market, ...offMarket]));
  await db.insert(qualificationQuestions).values(QUESTIONS);

  const inserted = await db.insert(leads).values(leadRows).returning({ id: leads.id });
  const leadId = (i: number) => inserted[i]!.id;
  if (acts.length)
    await db
      .insert(activities)
      .values(acts.map((a) => ({ ...a.row, leadId: leadId(a.leadIndex) })));
  if (consents.length)
    await db
      .insert(consentRecords)
      .values(consents.map((c) => ({ ...c.row, leadId: leadId(c.leadIndex) })));

  return verify(db);
}

export async function purgeMock(databaseUrl: string) {
  const db = drizzle(neon(databaseUrl));
  return db.execute(sql`DELETE FROM listings WHERE source = 'mock'`);
}

async function verify(db: DB) {
  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM listings) AS listings,
      (SELECT count(*)::int FROM listings WHERE source='mock') AS mock,
      (SELECT count(*)::int FROM listings WHERE source='manual') AS manual,
      (SELECT count(*)::int FROM leads) AS leads,
      (SELECT count(*)::int FROM activities) AS activities,
      (SELECT count(*)::int FROM consent_records) AS consents,
      (SELECT count(*)::int FROM qualification_questions) AS questions
  `);
  // PostGIS end-to-end: count listings whose point falls inside a central-FL bbox.
  const geo = await db.execute(sql`
    SELECT count(*)::int AS in_bbox
    FROM listings
    WHERE ST_Within(geom, ST_MakeEnvelope(-82.1, 27.8, -80.9, 29.0, 4326))
  `);
  const sample = await db.execute(sql`
    SELECT slug, ST_X(geom)::float8 AS lng, ST_Y(geom)::float8 AS lat, ST_SRID(geom) AS srid
    FROM listings
    LIMIT 1
  `);
  const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? r));
  return { counts: rows(counts), geo: rows(geo), sample: rows(sample) };
}
