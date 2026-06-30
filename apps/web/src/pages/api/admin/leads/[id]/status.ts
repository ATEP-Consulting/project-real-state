import { leadStatusUpdateSchema, updateLeadStatus } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

export default withAdminApi(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const id = String(req.query.id ?? "");
  const parsed = leadStatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status", issues: parsed.error.flatten() });
    return;
  }
  try {
    await updateLeadStatus(id, parsed.data.status);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/admin/status]", (e as Error).message);
    res.status(500).json({ error: "Could not update status" });
  }
});
