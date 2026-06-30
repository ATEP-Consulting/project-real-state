import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  getLeadSources,
  getPipelineCounts,
  listLeads,
  type LeadListItem,
  type LeadStatus,
} from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge, STATUS_LABEL, STATUS_ORDER } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/server/auth/guards";
import { formatDate, parseLeadFilters, RANGE_OPTIONS } from "@/lib/admin-leads";
import styles from "./LeadInbox.module.css";

type Props = {
  leads: LeadListItem[];
  counts: Record<LeadStatus, number>;
  sources: string[];
  q: { intent: string; status: string; source: string; range: string; q: string };
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  const filters = parseLeadFilters(ctx.query, new Date());
  const [leads, counts, sources] = await Promise.all([
    listLeads(filters),
    getPipelineCounts(),
    getLeadSources(),
  ]);
  const s = (k: string) => (typeof ctx.query[k] === "string" ? (ctx.query[k] as string) : "");
  return {
    props: {
      leads,
      counts,
      sources,
      q: {
        intent: s("intent"),
        status: s("status"),
        source: s("source"),
        range: s("range"),
        q: s("q"),
      },
    },
  };
};

export default function LeadInbox({ leads, counts, sources, q }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(q.q);

  function apply(patch: Record<string, string>) {
    const next = { ...q, ...patch };
    const query: Record<string, string> = {};
    for (const [k, v] of Object.entries(next)) if (v) query[k] = v;
    void router.push({ pathname: "/admin/leads", query });
  }

  return (
    <AdminLayout title="Leads">
      <h1 className={styles.h1}>Leads</h1>

      <div className={styles.pipeline}>
        {[...STATUS_ORDER, "lost"].map((st) => (
          <button
            key={st}
            type="button"
            className={`${styles.stage} ${q.status === st ? styles.stageOn : ""}`}
            onClick={() => apply({ status: q.status === st ? "" : st })}
          >
            <span className={styles.stageN}>{counts[st as LeadStatus]}</span>
            <span className={styles.stageL}>{STATUS_LABEL[st]}</span>
          </button>
        ))}
      </div>

      <form
        className={styles.filters}
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: search.trim() });
        }}
      >
        <select value={q.intent} onChange={(e) => apply({ intent: e.target.value })}>
          <option value="">All intents</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="rent">Rent</option>
        </select>
        <select value={q.source} onChange={(e) => apply({ source: e.target.value })}>
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={q.range} onChange={(e) => apply({ range: e.target.value })}>
          {RANGE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search name / email / phone"
          aria-label="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
        {(q.intent || q.status || q.source || q.range || q.q) && (
          <Link href="/admin/leads" className={styles.clear}>
            Clear
          </Link>
        )}
      </form>

      <p className={styles.count}>
        {leads.length} {leads.length === 1 ? "lead" : "leads"}
      </p>

      {leads.length === 0 ? (
        <p className={styles.empty}>No leads match these filters.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Intent</th>
              <th>Stage</th>
              <th>Source</th>
              <th>Viewed</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr
                key={l.id}
                className={styles.row}
                onClick={() => void router.push(`/admin/leads/${l.id}`)}
              >
                <td>
                  <Link href={`/admin/leads/${l.id}`}>{l.name ?? "—"}</Link>
                </td>
                <td className={styles.contact}>{l.email ?? l.phone ?? "—"}</td>
                <td>
                  <StatusBadge kind="intent" value={l.intent} />
                </td>
                <td>
                  <StatusBadge kind="status" value={l.status} />
                </td>
                <td className={styles.src}>{l.source ?? "—"}</td>
                <td>{l.viewedCount}</td>
                <td className={styles.date}>{formatDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
