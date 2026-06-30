import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import styles from "./ActivityComposer.module.css";

type Kind = "note" | "call" | "reminder";
const TABS: { id: Kind; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "call", label: "Log call" },
  { id: "reminder", label: "Reminder" },
];

export function ActivityComposer({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("note");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (kind === "reminder" && !dueAt) {
      setErr("Pick a date/time for the reminder.");
      return;
    }
    if (kind !== "reminder" && !body.trim()) {
      setErr("Add a note.");
      return;
    }
    setBusy(true);
    try {
      const payload: { type: Kind; body?: string; dueAt?: string } = { type: kind };
      if (body.trim()) payload.body = body.trim();
      if (kind === "reminder") payload.dueAt = new Date(dueAt).toISOString();
      const res = await fetch(`/api/admin/leads/${leadId}/activities`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setBody("");
      setDueAt("");
      await router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setErr("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={kind === t.id}
            className={`${styles.tab} ${kind === t.id ? styles.tabOn : ""}`}
            onClick={() => setKind(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        className={styles.body}
        rows={2}
        placeholder={kind === "reminder" ? "What's the follow-up? (optional)" : "Write a note…"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Activity note"
      />
      {kind === "reminder" && (
        <input
          className={styles.due}
          type="datetime-local"
          aria-label="Reminder due date and time"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      )}
      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}
      <button type="submit" className={styles.save} disabled={busy}>
        {busy ? "Saving…" : "Add"}
      </button>
    </form>
  );
}
