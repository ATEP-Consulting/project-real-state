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
import { LeadBoard } from "@/components/admin/LeadBoard";
import { StatusBadge, STATUS_LABEL, STATUS_ORDER } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/server/auth/guards";
import { formatDate, parseLeadFilters, RANGE_OPTIONS } from "@/lib/admin-leads";
import styles from "./LeadInbox.module.css";

type Props = {
  leads: LeadListItem[];
  counts: Record<LeadStatus, number>;
  sources: string[];
  view: "list" | "board";
  q: { intent: string; status: string; source: string; range: string; q: string };
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  const filters = parseLeadFilters(ctx.query, new Date());
  const view: Props["view"] = ctx.query.view === "board" ? "board" : "list";
  // The board shows every stage as a column, so it ignores the status filter.
  const listFilters = view === "board" ? { ...filters, status: undefined } : filters;
  const [leads, counts, sources] = await Promise.all([
    listLeads(listFilters),
    getPipelineCounts(),
    getLeadSources(),
  ]);
  const s = (k: string) => (typeof ctx.query[k] === "string" ? (ctx.query[k] as string) : "");
  return {
    props: {
      leads,
      counts,
      sources,
      view,
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

function stripView(q: Props["q"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) if (v) out[k] = v;
  return out;
}

export default function LeadInbox({ leads, counts, sources, view, q }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(q.q);

  function apply(patch: Record<string, string>) {
    const next = { ...q, ...patch };
    const query: Record<string, string> = {};
    if (view === "board") query.view = "board";
    for (const [k, v] of Object.entries(next)) if (v) query[k] = v;
    void router.push({ pathname: "/admin/leads", query });
  }

  return (
    <AdminLayout title="Leads">
      <h1 className={styles.h1}>Leads</h1>

      <div className={styles.viewToggle}>
        <Link
          href={{ pathname: "/admin/leads", query: stripView(q) }}
          className={`${styles.viewTab} ${view === "list" ? styles.viewOn : ""}`}
          aria-current={view === "list" ? "page" : undefined}
        >
          List
        </Link>
        <Link
          href={{ pathname: "/admin/leads", query: { ...stripView(q), view: "board" } }}
          className={`${styles.viewTab} ${view === "board" ? styles.viewOn : ""}`}
          aria-current={view === "board" ? "page" : undefined}
        >
          Board
        </Link>
      </div>

      {view === "list" && (
        <div className={styles.pipeline}>
          {[...STATUS_ORDER, "lost"].map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={q.status === st}
              className={`${styles.stage} ${q.status === st ? styles.stageOn : ""}`}
              onClick={() => apply({ status: q.status === st ? "" : st })}
            >
              <span className={styles.stageN}>{counts[st as LeadStatus]}</span>
              <span className={styles.stageL}>{STATUS_LABEL[st]}</span>
            </button>
          ))}
        </div>
      )}

      <form
        className={styles.filters}
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: search.trim() });
        }}
      >
        <select
          aria-label="Filter by intent"
          value={q.intent}
          onChange={(e) => apply({ intent: e.target.value })}
        >
          <option value="">All intents</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="rent">Rent</option>
        </select>
        <select
          aria-label="Filter by source"
          value={q.source}
          onChange={(e) => apply({ source: e.target.value })}
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by date range"
          value={q.range}
          onChange={(e) => apply({ range: e.target.value })}
        >
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
          <Link
            href={view === "board" ? "/admin/leads?view=board" : "/admin/leads"}
            className={styles.clear}
          >
            Clear
          </Link>
        )}
      </form>

      {view === "board" ? (
        <LeadBoard leads={leads} />
      ) : (
        <>
          <p className={styles.count}>
            {leads.length} {leads.length === 1 ? "lead" : "leads"}
          </p>
          {leads.length === 0 ? (
            <p className={styles.empty}>No leads match these filters.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Intent</th>
                    <th scope="col">Stage</th>
                    <th scope="col">Source</th>
                    <th scope="col">Viewed</th>
                    <th scope="col">Created</th>
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
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
