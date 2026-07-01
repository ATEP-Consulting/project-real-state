import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getAdminGuide, type Content } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { GuideForm } from "@/components/admin/GuideForm";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

type Props = { guide: Content };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  const id = String(ctx.params?.id ?? "");
  const guide = await getAdminGuide(id);
  if (!guide) return { notFound: true };
  // Dates aren't serializable through getServerSideProps — normalize to ISO strings.
  return { props: { guide: JSON.parse(JSON.stringify(guide)) as Content } };
};

export default function EditGuide({ guide }: Props) {
  return (
    <AdminLayout title="Edit guide">
      <Link href="/admin/content" className={f.muted} style={{ fontSize: 13 }}>
        ← All guides
      </Link>
      <h1 className={f.h1}>Edit guide</h1>
      <GuideForm initial={guide} guideId={guide.id} />
    </AdminLayout>
  );
}
