import { createManualListing, manualListingSchema } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

export default withAdminApi(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = manualListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid listing", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { id } = await createManualListing(parsed.data);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error("[api/admin/listings] create", (e as Error).message);
    res.status(500).json({ error: "Could not create the listing" });
  }
});
