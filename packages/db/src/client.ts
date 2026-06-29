import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { parseServerEnv } from "@herrera/config/env";
import * as schema from "./schema/index";

// Neon HTTP driver — Vercel-friendly; no WebSocket setup. Migrations use drizzle-kit, not this client.
const env = parseServerEnv();
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export type DB = typeof db;
