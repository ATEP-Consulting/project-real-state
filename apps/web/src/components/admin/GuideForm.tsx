import { useRouter } from "next/router";
import { useState } from "react";
import type { Content } from "@herrera/db";
import f from "./AdminForm.module.css";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  heroImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  body: string;
  // ES fields (ADR-018 — optional, EN is the fallback)
  titleEs: string;
  excerptEs: string;
  bodyEs: string;
  metaTitleEs: string;
  metaDescriptionEs: string;
  status: "draft" | "published";
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function fromGuide(g: Content | undefined): FormState {
  return {
    title: str(g?.title),
    slug: str(g?.slug),
    excerpt: str(g?.excerpt),
    heroImageUrl: str(g?.heroImageUrl),
    metaTitle: str(g?.metaTitle),
    metaDescription: str(g?.metaDescription),
    body: str(g?.body),
    titleEs: str(g?.titleEs),
    excerptEs: str(g?.excerptEs),
    bodyEs: str(g?.bodyEs),
    metaTitleEs: str(g?.metaTitleEs),
    metaDescriptionEs: str(g?.metaDescriptionEs),
    status: (g?.status as "draft" | "published") ?? "draft",
  };
}

export function GuideForm({ initial, guideId }: { initial?: Content; guideId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => fromGuide(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || null,
      heroImageUrl: form.heroImageUrl.trim() || null,
      metaTitle: form.metaTitle.trim() || null,
      metaDescription: form.metaDescription.trim() || null,
      body: form.body || null,
      titleEs: form.titleEs.trim() || null,
      excerptEs: form.excerptEs.trim() || null,
      bodyEs: form.bodyEs || null,
      metaTitleEs: form.metaTitleEs.trim() || null,
      metaDescriptionEs: form.metaDescriptionEs.trim() || null,
      status: form.status,
    };
    try {
      const res = await fetch(guideId ? `/api/admin/content/${guideId}` : "/api/admin/content", {
        method: guideId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError("Could not save — a title is required.");
        setBusy(false);
        return;
      }
      await router.push("/admin/content");
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <section className={f.panel}>
      <div className={`${f.grid} ${f.grid2}`}>
        <label className={f.field}>
          <span className={f.label}>Title</span>
          <input className={f.input} value={form.title} onChange={set("title")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Title (Spanish) <span className={f.hint}>optional</span>
          </span>
          <input className={f.input} value={form.titleEs} onChange={set("titleEs")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Slug <span className={f.hint}>optional — auto from the title if blank</span>
          </span>
          <input className={f.input} value={form.slug} onChange={set("slug")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>Status</span>
          <select
            className={f.select}
            value={form.status}
            onChange={(e) =>
              setForm((s) => ({ ...s, status: e.target.value as FormState["status"] }))
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Hero image URL <span className={f.hint}>optional</span>
          </span>
          <input className={f.input} value={form.heroImageUrl} onChange={set("heroImageUrl")} />
        </label>
      </div>

      <div className={`${f.grid} ${f.grid2}`} style={{ marginTop: 14 }}>
        <label className={f.field}>
          <span className={f.label}>
            Excerpt <span className={f.hint}>one-line summary shown on the guides list</span>
          </span>
          <input className={f.input} value={form.excerpt} onChange={set("excerpt")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Excerpt (Spanish) <span className={f.hint}>optional</span>
          </span>
          <input className={f.input} value={form.excerptEs} onChange={set("excerptEs")} />
        </label>
      </div>

      <label className={f.field} style={{ marginTop: 14 }}>
        <span className={f.label}>
          Body{" "}
          <span className={f.hint}>
            Markdown: {"## heading"}, {"**bold**"}, {"- list"}
          </span>
        </span>
        <textarea
          className={f.textarea}
          style={{ minHeight: 260, fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
          value={form.body}
          onChange={set("body")}
          placeholder={
            "## Section title\n\nSome text with **bold** and a list:\n\n- First\n- Second"
          }
        />
      </label>

      <label className={f.field} style={{ marginTop: 14 }}>
        <span className={f.label}>
          Body (Spanish, Markdown) <span className={f.hint}>optional</span>
        </span>
        <textarea
          className={f.textarea}
          style={{ minHeight: 260, fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
          value={form.bodyEs}
          onChange={set("bodyEs")}
          placeholder={
            "## Título de sección\n\nAlgún texto con **negrita** y una lista:\n\n- Primero\n- Segundo"
          }
        />
      </label>

      <div className={`${f.grid} ${f.grid2}`} style={{ marginTop: 14 }}>
        <label className={f.field}>
          <span className={f.label}>
            Meta title <span className={f.hint}>SEO — optional</span>
          </span>
          <input className={f.input} value={form.metaTitle} onChange={set("metaTitle")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Meta title (Spanish) <span className={f.hint}>SEO — optional</span>
          </span>
          <input className={f.input} value={form.metaTitleEs} onChange={set("metaTitleEs")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Meta description <span className={f.hint}>SEO — optional</span>
          </span>
          <input
            className={f.input}
            value={form.metaDescription}
            onChange={set("metaDescription")}
          />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Meta description (Spanish) <span className={f.hint}>SEO — optional</span>
          </span>
          <input
            className={f.input}
            value={form.metaDescriptionEs}
            onChange={set("metaDescriptionEs")}
          />
        </label>
      </div>

      {error && <p className={f.error}>{error}</p>}
      <div className={f.formActions}>
        <button
          type="button"
          className={`${f.btn} ${f.btnPrimary}`}
          disabled={busy}
          onClick={() => void submit()}
        >
          {busy ? "Saving…" : guideId ? "Save changes" : "Create guide"}
        </button>
        <button type="button" className={f.btn} onClick={() => void router.push("/admin/content")}>
          Cancel
        </button>
      </div>
    </section>
  );
}
