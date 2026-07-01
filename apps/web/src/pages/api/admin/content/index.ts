import { createGuide, guideUpsertSchema } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

export default withAdminApi(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = guideUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid guide", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { id } = await createGuide(parsed.data);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error("[api/admin/content] create", (e as Error).message);
    res.status(500).json({ error: "Could not create the guide" });
  }
});
