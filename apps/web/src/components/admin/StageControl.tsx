import { useRouter } from "next/router";
import { useState } from "react";
import { STATUS_LABEL, STATUS_ORDER } from "./StatusBadge";
import styles from "./StageControl.module.css";

export function StageControl({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function move(next: string) {
    if (next === status || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await router.replace(router.asPath, undefined, { scroll: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className={styles.stepper}>
        {STATUS_ORDER.map((s) => {
          const idx = STATUS_ORDER.indexOf(s);
          const curIdx = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
          const done = curIdx >= 0 && idx <= curIdx;
          return (
            <button
              key={s}
              type="button"
              disabled={busy}
              className={`${styles.step} ${s === status ? styles.current : ""} ${done ? styles.done : ""}`}
              onClick={() => void move(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
      {status !== "lost" ? (
        <button
          type="button"
          className={styles.lost}
          disabled={busy}
          onClick={() => void move("lost")}
        >
          Mark as lost
        </button>
      ) : (
        <button
          type="button"
          className={styles.reopen}
          disabled={busy}
          onClick={() => void move("new")}
        >
          Reopen (→ New)
        </button>
      )}
    </div>
  );
}
