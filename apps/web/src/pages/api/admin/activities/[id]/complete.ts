import { completeReminder } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

export default withAdminApi(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const id = String(req.query.id ?? "");
  try {
    await completeReminder(id);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/admin/complete]", (e as Error).message);
    res.status(500).json({ error: "Could not complete reminder" });
  }
});
