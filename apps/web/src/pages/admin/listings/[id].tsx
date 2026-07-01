import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getManualListing, type Listing } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ListingForm } from "@/components/admin/ListingForm";
import { requireAdmin } from "@/server/auth/guards";
import f from "@/components/admin/AdminForm.module.css";

type Props = { listing: Listing };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  const id = String(ctx.params?.id ?? "");
  const listing = await getManualListing(id);
  if (!listing) return { notFound: true };
  // Dates aren't serializable through getServerSideProps — strip to ISO for the client.
  return { props: { listing: JSON.parse(JSON.stringify(listing)) as Listing } };
};

export default function EditListing({ listing }: Props) {
  return (
    <AdminLayout title="Edit listing">
      <Link href="/admin/listings" className={f.muted} style={{ fontSize: 13 }}>
        ← All listings
      </Link>
      <h1 className={f.h1}>Edit listing</h1>
      <ListingForm initial={listing} listingId={listing.id} />
    </AdminLayout>
  );
}
