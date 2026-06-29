import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index";

function createDb(url: string) {
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

/** Lazily create + memoize the Neon-HTTP Drizzle client (reads DATABASE_URL at call time). */
export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = createDb(url);
  }
  return _db;
}

export type DB = ReturnType<typeof getDb>;

/** Lightweight connectivity check — used by /api/health to confirm the DB is reachable. */
export async function countListings(): Promise<number> {
  const result = (await getDb().execute(
    sql`SELECT count(*)::int AS n FROM listings`,
  )) as unknown as { rows: { n: number }[] } | { n: number }[];
  const rows = Array.isArray(result) ? result : result.rows;
  return rows[0]?.n ?? 0;
}
