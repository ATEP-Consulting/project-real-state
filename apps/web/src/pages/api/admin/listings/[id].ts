import { deleteManualListing, manualListingSchema, updateManualListing } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

export default withAdminApi(async (req, res) => {
  const id = String(req.query.id ?? "");
  try {
    if (req.method === "PATCH") {
      const parsed = manualListingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid listing", issues: parsed.error.flatten() });
        return;
      }
      await updateManualListing(id, parsed.data);
      res.status(200).json({ ok: true });
      return;
    }
    if (req.method === "DELETE") {
      await deleteManualListing(id);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "PATCH, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[api/admin/listings/[id]]", (e as Error).message);
    res.status(500).json({ error: "Could not update the listing" });
  }
});
