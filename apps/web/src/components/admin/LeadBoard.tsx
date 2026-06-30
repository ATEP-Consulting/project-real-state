import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { LeadListItem } from "@herrera/db";
import { StatusBadge, STATUS_LABEL, STATUS_ORDER } from "./StatusBadge";
import { formatDate } from "@/lib/admin-leads";
import styles from "./LeadBoard.module.css";

const COLUMNS = [...STATUS_ORDER, "lost"] as const;

export function LeadBoard({ leads }: { leads: LeadListItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function move(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await router.replace(router.asPath, undefined, { scroll: false });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map((col) => {
        const items = leads.filter((l) => l.status === col);
        return (
          <section key={col} className={styles.column}>
            <div className={styles.colHead}>
              <span className={styles.colLabel}>{STATUS_LABEL[col]}</span>
              <span className={styles.colCount}>{items.length}</span>
            </div>
            <div className={styles.cards}>
              {items.map((l) => (
                <article key={l.id} className={styles.card}>
                  <Link href={`/admin/leads/${l.id}`} className={styles.cardName}>
                    {l.name ?? "Unnamed lead"}
                  </Link>
                  <div className={styles.cardMeta}>
                    <StatusBadge kind="intent" value={l.intent} />
                    <span className={styles.cardContact}>{l.email ?? l.phone ?? "—"}</span>
                  </div>
                  <div className={styles.cardFoot}>
                    <span className={styles.cardDate}>{formatDate(l.createdAt)}</span>
                    <select
                      className={styles.move}
                      aria-label={`Move ${l.name ?? "lead"} to another stage`}
                      value={l.status}
                      disabled={busyId === l.id}
                      onChange={(e) => void move(l.id, e.target.value)}
                    >
                      {COLUMNS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
              {items.length === 0 && <p className={styles.colEmpty}>—</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
