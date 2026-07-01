import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { listManualListings, type AdminListingRow } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

type Props = { rows: AdminListingRow[] };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  let rows: AdminListingRow[] = [];
  try {
    rows = await listManualListings();
  } catch (e) {
    console.warn("[admin/listings] unavailable:", (e as Error).message);
  }
  return { props: { rows } };
};

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function ListingsAdmin({ rows }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del(id: string, address: string) {
    if (!confirm(`Delete "${address}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      await router.replace(router.asPath, undefined, { scroll: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout title="Listings">
      <h1 className={f.h1}>Off-market listings</h1>
      <p className={f.intro}>
        Your own manually-entered listings (not MLS). Use the visibility toggle — public,
        registered-only, or a private link you share — as your Clear Cooperation call.
      </p>

      <div className={f.headRow}>
        <span className={f.muted}>
          {rows.length} listing{rows.length === 1 ? "" : "s"}
        </span>
        <Link href="/admin/listings/new" className={`${f.btn} ${f.btnPrimary}`}>
          + New listing
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className={f.empty}>No off-market listings yet. Add your first one.</p>
      ) : (
        <div className={f.tableWrap}>
          <table className={f.table}>
            <thead>
              <tr>
                <th scope="col">Address</th>
                <th scope="col">City</th>
                <th scope="col">Price</th>
                <th scope="col">Type</th>
                <th scope="col">Visibility</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.address}</td>
                  <td className={f.muted}>{r.city}</td>
                  <td>{money(r.price)}</td>
                  <td className={f.muted}>{r.propertyType}</td>
                  <td>
                    <span className={`${f.chip} ${r.visibility === "public" ? f.chipOn : ""}`}>
                      {r.visibility}
                    </span>
                  </td>
                  <td>
                    <span className={f.chip}>{r.status}</span>
                  </td>
                  <td>
                    <div className={f.rowActions}>
                      <Link href={`/admin/listings/${r.id}`} className={`${f.btn} ${f.btnSmall}`}>
                        Edit
                      </Link>
                      {r.visibility !== "registered" && (
                        <Link
                          href={`/homes/${r.slug}`}
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
                        onClick={() => void del(r.id, r.address)}
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
