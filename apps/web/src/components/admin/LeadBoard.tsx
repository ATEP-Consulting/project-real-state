import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { LeadListItem } from "@herrera/db";
import { StatusBadge, STATUS_LABEL, STATUS_ORDER } from "./StatusBadge";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/admin-leads";
import styles from "./LeadBoard.module.css";

const COLUMNS = [...STATUS_ORDER, "lost"] as const;

export function LeadBoard({ leads }: { leads: LeadListItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

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

  function dropOn(col: string) {
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    const cur = leads.find((l) => l.id === id);
    if (!cur || cur.status === col) return; // no-op when dropped on the same column
    void move(id, col);
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map((col) => {
        const items = leads.filter((l) => l.status === col);
        const isTarget =
          dragId !== null && overCol === col && leads.find((l) => l.id === dragId)?.status !== col;
        return (
          <section
            key={col}
            className={`${styles.column} ${isTarget ? styles.colTarget : ""}`}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overCol !== col) setOverCol(col);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setOverCol((c) => (c === col ? null : c));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              dropOn(col);
            }}
          >
            <div className={styles.colHead}>
              <span className={styles.colLabel}>{STATUS_LABEL[col]}</span>
              <span className={styles.colCount}>{items.length}</span>
            </div>
            <div className={styles.cards}>
              {items.map((l) => (
                <article
                  key={l.id}
                  className={`${styles.card} ${dragId === l.id ? styles.dragging : ""}`}
                  draggable={busyId === null}
                  onDragStart={(e) => {
                    setDragId(l.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", l.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                >
                  <Link href={`/admin/leads/${l.id}`} className={styles.cardName} draggable={false}>
                    {l.name ?? "Unnamed lead"}
                  </Link>
                  <div className={styles.cardMeta}>
                    <StatusBadge kind="intent" value={l.intent} />
                    <span className={styles.cardContact}>{l.email ?? l.phone ?? "—"}</span>
                  </div>
                  <div className={styles.cardFoot}>
                    <span className={styles.cardDate}>{formatDate(l.createdAt)}</span>
                    <Select
                      size="sm"
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
                    </Select>
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
