import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { listAdminGuides, type AdminGuideRow } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

type Props = { rows: AdminGuideRow[] };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  let rows: AdminGuideRow[] = [];
  try {
    rows = await listAdminGuides();
  } catch (e) {
    console.warn("[admin/content] unavailable:", (e as Error).message);
  }
  return { props: { rows } };
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function ContentAdmin({ rows }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(id: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      await fetch(`/api/admin/content/${id}`, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      await router.replace(router.asPath, undefined, { scroll: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout title="Guides">
      <h1 className={f.h1}>Guides</h1>
      <p className={f.intro}>
        Write and publish your own guides. They render as Markdown at <code>/guides/[slug]</code>;
        drafts stay hidden until you publish.
      </p>

      <div className={f.headRow}>
        <span className={f.muted}>
          {rows.length} guide{rows.length === 1 ? "" : "s"}
        </span>
        <Link href="/admin/content/new" className={`${f.btn} ${f.btnPrimary}`}>
          + New guide
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className={f.empty}>No guides yet. Write your first one.</p>
      ) : (
        <div className={f.tableWrap}>
          <table className={f.table}>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Slug</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const published = r.status === "published";
                return (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td className={f.muted}>{r.slug}</td>
                    <td>
                      <span className={`${f.chip} ${published ? f.chipOn : ""}`}>{r.status}</span>
                    </td>
                    <td className={f.muted}>{day(r.updatedAt)}</td>
                    <td>
                      <div className={f.rowActions}>
                        <Link href={`/admin/content/${r.id}`} className={`${f.btn} ${f.btnSmall}`}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          className={`${f.btn} ${f.btnSmall}`}
                          disabled={busy}
                          onClick={() => void act(r.id, "POST", { published: !published })}
                        >
                          {published ? "Unpublish" : "Publish"}
                        </button>
                        {published && (
                          <Link
                            href={`/guides/${r.slug}`}
                            className={`${f.btn} ${f.btnSmall}`}
                            target="_blank"
                          >
                            View
                          </Link>
                        )}
                        <button
                          type="button"
                          className={`${f.btn} ${f.btnSmall} ${f.btnDanger}`}
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`Delete "${r.title}"? This can't be undone.`))
                              void act(r.id, "DELETE");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
