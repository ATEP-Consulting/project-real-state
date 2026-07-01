import { z } from "zod";
import { deleteGuide, guideUpsertSchema, setGuidePublished, updateGuide } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

const publishSchema = z.object({ published: z.boolean() });

export default withAdminApi(async (req, res) => {
  const id = String(req.query.id ?? "");
  try {
    if (req.method === "PATCH") {
      const parsed = guideUpsertSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid guide", issues: parsed.error.flatten() });
        return;
      }
      await updateGuide(id, parsed.data);
      res.status(200).json({ ok: true });
      return;
    }
    if (req.method === "POST") {
      const parsed = publishSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid publish toggle" });
        return;
      }
      await setGuidePublished(id, parsed.data.published);
      res.status(200).json({ ok: true });
      return;
    }
    if (req.method === "DELETE") {
      await deleteGuide(id);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "PATCH, POST, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[api/admin/content/[id]]", (e as Error).message);
    res.status(500).json({ error: "Could not update the guide" });
  }
});
