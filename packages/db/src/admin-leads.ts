import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { activities } from "./schema/activities";
import { consentRecords } from "./schema/consent";
import { leads } from "./schema/leads";
import { listings } from "./schema/listings";
import type { LeadIntent } from "./leads-create";

export type LeadStatus =
  "new" | "contacted" | "qualified" | "appointment" | "offer" | "closed" | "lost";

export type LeadFilters = {
  intent?: LeadIntent;
  status?: LeadStatus;
  source?: string;
  since?: Date;
  q?: string;
};

export type LeadListItem = {
  id: string;
  intent: LeadIntent;
  status: LeadStatus;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  createdAt: string;
  viewedCount: number;
};

export type LeadActivity = {
  id: string;
  type: string;
  body: string | null;
  meta: Record<string, unknown>;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type LeadConsent = {
  id: string;
  channel: string;
  granted: boolean;
  wording: string;
  source: string | null;
  createdAt: string;
};

export type ViewedListing = { slug: string; title: string };

export type LeadDetail = {
  id: string;
  intent: LeadIntent;
  status: LeadStatus;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  createdAt: string;
  attribution: Record<string, unknown> | null;
  answers: Record<string, unknown>;
  viewedListings: ViewedListing[];
  consents: LeadConsent[];
  activities: LeadActivity[];
};

/** Inbox list with filters, newest first. */
export async function listLeads(f: LeadFilters): Promise<LeadListItem[]> {
  const db = getDb();
  const conds = [];
  if (f.intent) conds.push(eq(leads.intent, f.intent));
  if (f.status) conds.push(eq(leads.status, f.status));
  if (f.source) conds.push(eq(leads.source, f.source));
  if (f.since) conds.push(gte(leads.createdAt, f.since));
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(or(ilike(leads.name, like), ilike(leads.email, like), ilike(leads.phone, like)));
  }
  const rows = await db
    .select({
      id: leads.id,
      intent: leads.intent,
      status: leads.status,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      source: leads.source,
      createdAt: leads.createdAt,
      viewed: leads.viewedListingIds,
    })
    .from(leads)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(leads.createdAt));
  return rows.map((r) => ({
    id: r.id,
    intent: r.intent as LeadIntent,
    status: r.status as LeadStatus,
    name: r.name,
    email: r.email,
    phone: r.phone,
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    viewedCount: Array.isArray(r.viewed) ? r.viewed.length : 0,
  }));
}

/** Count of leads in each pipeline stage (zero-filled). */
export async function getPipelineCounts(): Promise<Record<LeadStatus, number>> {
  const db = getDb();
  const rows = await db
    .select({ status: leads.status, n: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.status);
  const base: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    appointment: 0,
    offer: 0,
    closed: 0,
    lost: 0,
  };
  for (const r of rows) base[r.status as LeadStatus] = Number(r.n);
  return base;
}

/** Distinct non-null lead sources present in the data (drives the inbox filter). */
export async function getLeadSources(): Promise<string[]> {
  const db = getDb();
  const rows = await db.selectDistinct({ source: leads.source }).from(leads);
  return rows
    .map((r) => r.source)
    .filter((s): s is string => Boolean(s))
    .sort();
}

/** A lead + its activity timeline (newest first), consent records, and viewed-listing titles. */
export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const db = getDb();
  const leadRows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const lead = leadRows[0];
  if (!lead) return null;

  const acts = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.createdAt));
  const cons = await db
    .select()
    .from(consentRecords)
    .where(eq(consentRecords.leadId, id))
    .orderBy(desc(consentRecords.createdAt));

  const slugs = [...new Set(Array.isArray(lead.viewedListingIds) ? lead.viewedListingIds : [])];
  const titles = slugs.length
    ? await db
        .select({ slug: listings.slug, addr: listings.addressLine1, city: listings.city })
        .from(listings)
        .where(inArray(listings.slug, slugs))
    : [];
  const titleBySlug = new Map(titles.map((t) => [t.slug, `${t.addr}, ${t.city}`]));

  return {
    id: lead.id,
    intent: lead.intent as LeadIntent,
    status: lead.status as LeadStatus,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    createdAt: lead.createdAt.toISOString(),
    attribution: (lead.attribution as Record<string, unknown> | null) ?? null,
    answers: (lead.answers as Record<string, unknown>) ?? {},
    viewedListings: slugs.map((s) => ({ slug: s, title: titleBySlug.get(s) ?? s })),
    consents: cons.map((c) => ({
      id: c.id,
      channel: c.channel,
      granted: c.granted,
      wording: c.wording,
      source: c.source,
      createdAt: c.createdAt.toISOString(),
    })),
    activities: acts.map((a) => ({
      id: a.id,
      type: a.type,
      body: a.body,
      meta: a.meta,
      dueAt: a.dueAt ? a.dueAt.toISOString() : null,
      completedAt: a.completedAt ? a.completedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export const leadStatusUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "appointment", "offer", "closed", "lost"]),
});

export const activityCreateSchema = z
  .object({
    type: z.enum(["call", "note", "reminder"]),
    body: z.string().trim().max(2000).optional(),
    dueAt: z.string().datetime().optional(),
  })
  .refine((d) => d.type !== "reminder" || Boolean(d.dueAt), {
    message: "A reminder needs a due date.",
    path: ["dueAt"],
  })
  .refine((d) => d.type === "reminder" || Boolean(d.body), {
    message: "Add a note.",
    path: ["body"],
  });

export type ActivityCreate = z.infer<typeof activityCreateSchema>;

/** Move a lead to a new pipeline stage and log a status_change activity (no-op if unchanged). */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const db = getDb();
  const cur = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);
  const current = cur[0];
  if (!current) throw new Error("Lead not found");
  if (current.status === status) return;
  await db.update(leads).set({ status, updatedAt: new Date() }).where(eq(leads.id, id));
  await db.insert(activities).values({
    leadId: id,
    type: "status_change",
    body: null,
    meta: { from: current.status, to: status },
  });
  // ADR-008 webhook seam: emit an outbound lead-updated webhook here for a future external CRM. Not in v1.
}

/** Add a call / note / reminder to a lead's timeline. */
export async function addActivity(leadId: string, input: ActivityCreate): Promise<void> {
  const db = getDb();
  await db.insert(activities).values({
    leadId,
    type: input.type,
    body: input.body ?? null,
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    meta: {},
  });
  // ADR-008 webhook seam (lead-updated). Not in v1.
}

/** Mark a reminder activity as done (scoped to reminders so a stray id can't stamp other rows). */
export async function completeReminder(activityId: string): Promise<void> {
  const db = getDb();
  await db
    .update(activities)
    .set({ completedAt: new Date() })
    .where(and(eq(activities.id, activityId), eq(activities.type, "reminder")));
}

// ─── Dashboard analytics (ADR-008) — all derived from the same lead/listing data ───

export type LeadSourceCount = { source: string; count: number };
export type MostViewedListing = { slug: string; title: string; count: number };
export type DashboardData = {
  counts: Record<LeadStatus, number>;
  total: number;
  newThisWeek: number;
  bySource: LeadSourceCount[];
  mostViewed: MostViewedListing[];
};

/** Lead counts grouped by capture source (e.g. qualification_flow vs listing_inquiry). */
export async function getLeadsBySource(): Promise<LeadSourceCount[]> {
  const db = getDb();
  const rows = await db
    .select({ source: leads.source, n: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.source)
    .orderBy(desc(sql`count(*)`));
  return rows
    .filter((r) => r.source)
    .map((r) => ({ source: r.source as string, count: Number(r.n) }));
}

/** How many leads were created on/after `since`. */
export async function getNewLeadsSince(since: Date): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(leads)
    .where(gte(leads.createdAt, since));
  return Number(rows[0]?.n ?? 0);
}

/** Top listings by how often they appear in leads' viewed-listing history, with titles. */
export async function getMostViewedListings(limit: number): Promise<MostViewedListing[]> {
  const db = getDb();
  const res = await db.execute(sql`
    SELECT s.slug AS slug, count(*)::int AS n,
           l.address_line1 AS addr, l.city AS city
    FROM ${leads}
    CROSS JOIN LATERAL jsonb_array_elements_text(${leads.viewedListingIds}) AS s(slug)
    LEFT JOIN ${listings} l ON l.slug = s.slug
    GROUP BY s.slug, l.address_line1, l.city
    ORDER BY n DESC
    LIMIT ${limit}
  `);
  const rows = res.rows as { slug: string; n: number; addr: string | null; city: string | null }[];
  return rows.map((r) => ({
    slug: r.slug,
    title: r.addr ? `${r.addr}, ${r.city}` : r.slug,
    count: Number(r.n),
  }));
}

/** Everything the admin dashboard needs, in parallel. */
export async function getDashboardData(): Promise<DashboardData> {
  const since = new Date(Date.now() - 7 * 86400000);
  const [counts, bySource, newThisWeek, mostViewed] = await Promise.all([
    getPipelineCounts(),
    getLeadsBySource(),
    getNewLeadsSince(since),
    getMostViewedListings(5),
  ]);
  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  return { counts, total, newThisWeek, bySource, mostViewed };
}
