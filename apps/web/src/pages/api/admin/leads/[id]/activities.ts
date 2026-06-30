import { activityCreateSchema, addActivity } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

export default withAdminApi(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const id = String(req.query.id ?? "");
  const parsed = activityCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid activity", issues: parsed.error.flatten() });
    return;
  }
  try {
    await addActivity(id, parsed.data);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("[api/admin/activities]", (e as Error).message);
    res.status(500).json({ error: "Could not add activity" });
  }
});
