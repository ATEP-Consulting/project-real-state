import type { GetServerSideProps } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { GuideForm } from "@/components/admin/GuideForm";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  return { props: {} };
};

export default function NewGuide() {
  return (
    <AdminLayout title="New guide">
      <Link href="/admin/content" className={f.muted} style={{ fontSize: 13 }}>
        ← All guides
      </Link>
      <h1 className={f.h1}>New guide</h1>
      <GuideForm />
    </AdminLayout>
  );
}
