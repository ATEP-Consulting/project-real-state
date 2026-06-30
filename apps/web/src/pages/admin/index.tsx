import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getPipelineCounts, type LeadStatus } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { STATUS_LABEL, STATUS_ORDER } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/server/auth/guards";
import styles from "@/components/admin/AdminLayout.module.css";

type Props = { counts: Record<LeadStatus, number> | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  let counts: Props["counts"] = null;
  try {
    counts = await getPipelineCounts();
  } catch (e) {
    console.warn("[admin] counts unavailable:", (e as Error).message);
  }
  return { props: { counts } };
};

export default function AdminHome({ counts }: Props) {
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  return (
    <AdminLayout title="Dashboard">
      <h1 className={styles.h1}>Welcome, Nilyan</h1>
      <p className={styles.sub}>
        {total} {total === 1 ? "lead" : "leads"} in your pipeline.{" "}
        <Link href="/admin/leads">Open the lead inbox →</Link>
      </p>
      {counts && (
        <div className={styles.counts}>
          {[...STATUS_ORDER, "lost"].map((s) => (
            <div key={s} className={styles.countCard}>
              <span className={styles.countN}>{counts[s as LeadStatus]}</span>
              <span className={styles.countL}>{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
