import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { getAdminQuestions, type QualificationQuestion } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

type Intent = "buy" | "sell" | "rent";
const INTENTS: Intent[] = ["buy", "sell", "rent"];
const TYPES = ["single_select", "multi_select", "text", "number", "boolean", "range"] as const;

type Props = { intent: Intent; questions: QualificationQuestion[] };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  const q = ctx.query.intent;
  const intent: Intent = q === "sell" || q === "rent" ? q : "buy";
  let questions: QualificationQuestion[] = [];
  try {
    questions = await getAdminQuestions(intent);
  } catch (e) {
    console.warn("[admin/questions] unavailable:", (e as Error).message);
  }
  return { props: { intent, questions } };
};

type Opt = { value: string; label: string; labelEs?: string };
function serializeOptions(opts: Opt[]): string {
  return opts.map((o) => [o.value, o.label, o.labelEs].filter(Boolean).join(" | ")).join("\n");
}
function parseOptions(text: string): Opt[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [value = "", label = "", labelEs] = l.split("|").map((s) => s.trim());
      return labelEs ? { value, label, labelEs } : { value, label };
    })
    .filter((o) => o.value && o.label);
}

type Form = {
  key: string;
  label: string;
  labelEs: string;
  type: (typeof TYPES)[number];
  options: string;
  required: boolean;
  isActive: boolean;
};
const EMPTY: Form = {
  key: "",
  label: "",
  labelEs: "",
  type: "single_select",
  options: "",
  required: false,
  isActive: true,
};

export default function QuestionsAdmin({ intent, questions }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });

  function openNew() {
    setForm(EMPTY);
    setEditing("new");
    setError(null);
  }
  function openEdit(q: QualificationQuestion) {
    setForm({
      key: q.key,
      label: q.label,
      labelEs: q.labelEs ?? "",
      type: q.type as Form["type"],
      options: serializeOptions((q.options ?? []) as Opt[]),
      required: q.required,
      isActive: q.isActive,
    });
    setEditing(q.id);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const body = {
      intent,
      key: form.key.trim(),
      label: form.label.trim(),
      labelEs: form.labelEs.trim() || null,
      type: form.type,
      options: parseOptions(form.options),
      required: form.required,
      isActive: form.isActive,
    };
    const url = editing === "new" ? "/api/admin/questions" : `/api/admin/questions/${editing}`;
    const method = editing === "new" ? "POST" : "PATCH";
    try {
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Could not save — check the key (lowercase, no spaces) and label.");
        setBusy(false);
        return;
      }
      setEditing(null);
      await refresh();
    } catch {
      setError("Network error — please try again.");
    }
    setBusy(false);
  }

  async function act(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reorder(from: number, to: number) {
    if (to < 0 || to >= questions.length) return;
    const ids = questions.map((q) => q.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    await act("/api/admin/questions/reorder", "POST", { intent, orderedIds: ids });
  }

  return (
    <AdminLayout title="Questions">
      <h1 className={f.h1}>Qualification questions</h1>
      <p className={f.intro}>
        These power the Buy / Sell / Rent capture flow — changes go live immediately for new
        visitors. Reorder, activate/deactivate, or edit the wording and options per intent.
      </p>

      <div className={f.tabs}>
        {INTENTS.map((it) => (
          <Link
            key={it}
            href={`/admin/questions?intent=${it}`}
            className={`${f.tab} ${it === intent ? f.tabOn : ""}`}
            aria-current={it === intent ? "page" : undefined}
          >
            {it[0]!.toUpperCase() + it.slice(1)}
          </Link>
        ))}
      </div>

      {editing !== null && (
        <section className={f.panel}>
          <h2 className={f.panelTitle}>{editing === "new" ? "New question" : "Edit question"}</h2>
          <div className={`${f.grid} ${f.grid2}`}>
            <label className={f.field}>
              <span className={f.label}>
                Key <span className={f.hint}>(stable id — lowercase_with_underscores)</span>
              </span>
              <input
                className={f.input}
                value={form.key}
                onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
              />
            </label>
            <label className={f.field}>
              <span className={f.label}>Type</span>
              <select
                className={f.select}
                value={form.type}
                onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as Form["type"] }))}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={f.field}>
              <span className={f.label}>Label (EN)</span>
              <input
                className={f.input}
                value={form.label}
                onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
              />
            </label>
            <label className={f.field}>
              <span className={f.label}>
                Label (ES) <span className={f.hint}>optional</span>
              </span>
              <input
                className={f.input}
                value={form.labelEs}
                onChange={(e) => setForm((s) => ({ ...s, labelEs: e.target.value }))}
              />
            </label>
          </div>
          <label className={f.field} style={{ marginTop: 14 }}>
            <span className={f.label}>
              Options{" "}
              <span className={f.hint}>one per line: value | label | labelEs (optional)</span>
            </span>
            <textarea
              className={f.textarea}
              value={form.options}
              placeholder={"0_3 | 0–3 months\n3_6 | 3–6 months"}
              onChange={(e) => setForm((s) => ({ ...s, options: e.target.value }))}
            />
          </label>
          <div className={f.formActions}>
            <label className={f.check}>
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm((s) => ({ ...s, required: e.target.checked }))}
              />
              Required
            </label>
            <label className={f.check}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>
          {error && <p className={f.error}>{error}</p>}
          <div className={f.formActions}>
            <button
              type="button"
              className={`${f.btn} ${f.btnPrimary}`}
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" className={f.btn} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </section>
      )}

      <div className={f.headRow}>
        <span className={f.muted}>
          {questions.length} question{questions.length === 1 ? "" : "s"} for {intent}
        </span>
        <button type="button" className={`${f.btn} ${f.btnPrimary}`} onClick={openNew}>
          + New question
        </button>
      </div>

      {questions.length === 0 ? (
        <p className={f.empty}>No questions yet for {intent}. Add the first one.</p>
      ) : (
        <div className={f.tableWrap}>
          <table className={f.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Label</th>
                <th scope="col">Key</th>
                <th scope="col">Type</th>
                <th scope="col">Flags</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td>
                    <div className={f.rowActions}>
                      <button
                        type="button"
                        className={`${f.btn} ${f.btnSmall}`}
                        disabled={busy || i === 0}
                        aria-label="Move up"
                        onClick={() => void reorder(i, i - 1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={`${f.btn} ${f.btnSmall}`}
                        disabled={busy || i === questions.length - 1}
                        aria-label="Move down"
                        onClick={() => void reorder(i, i + 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>{q.label}</td>
                  <td className={f.muted}>{q.key}</td>
                  <td className={f.muted}>{q.type}</td>
                  <td>
                    <div className={f.rowActions}>
                      {q.required && <span className={f.chip}>Required</span>}
                      <span className={`${f.chip} ${q.isActive ? f.chipOn : f.chipOff}`}>
                        {q.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={f.rowActions}>
                      <button
                        type="button"
                        className={`${f.btn} ${f.btnSmall}`}
                        onClick={() => openEdit(q)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${f.btn} ${f.btnSmall}`}
                        disabled={busy}
                        onClick={() =>
                          void act(`/api/admin/questions/${q.id}`, "POST", {
                            isActive: !q.isActive,
                          })
                        }
                      >
                        {q.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className={`${f.btn} ${f.btnSmall} ${f.btnDanger}`}
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Delete "${q.label}"? This can't be undone.`))
                            void act(`/api/admin/questions/${q.id}`, "DELETE");
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
