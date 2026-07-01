import { z } from "zod";
import {
  deleteQuestion,
  questionUpsertSchema,
  setQuestionActive,
  updateQuestion,
} from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

const toggleSchema = z.object({ isActive: z.boolean() });

export default withAdminApi(async (req, res) => {
  const id = String(req.query.id ?? "");
  try {
    if (req.method === "PATCH") {
      const parsed = questionUpsertSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid question", issues: parsed.error.flatten() });
        return;
      }
      await updateQuestion(id, parsed.data);
      res.status(200).json({ ok: true });
      return;
    }
    if (req.method === "POST") {
      // lightweight activate/deactivate toggle
      const parsed = toggleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid toggle" });
        return;
      }
      await setQuestionActive(id, parsed.data.isActive);
      res.status(200).json({ ok: true });
      return;
    }
    if (req.method === "DELETE") {
      await deleteQuestion(id);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "PATCH, POST, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[api/admin/questions/[id]]", (e as Error).message);
    res.status(500).json({ error: "Could not update the question" });
  }
});
