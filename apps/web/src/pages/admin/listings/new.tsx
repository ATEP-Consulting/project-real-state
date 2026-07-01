import type { GetServerSideProps } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ListingForm } from "@/components/admin/ListingForm";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  return { props: {} };
};

export default function NewListing() {
  return (
    <AdminLayout title="New listing">
      <Link href="/admin/listings" className={f.muted} style={{ fontSize: 13 }}>
        ← All listings
      </Link>
      <h1 className={f.h1}>New off-market listing</h1>
      <ListingForm />
    </AdminLayout>
  );
}
