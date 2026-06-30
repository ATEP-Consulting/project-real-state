import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
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
