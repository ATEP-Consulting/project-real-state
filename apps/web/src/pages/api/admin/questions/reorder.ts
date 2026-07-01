import { z } from "zod";
import { reorderQuestions } from "@herrera/db";
import { withAdminApi } from "@/server/auth/guards";

const reorderSchema = z.object({
  intent: z.enum(["buy", "sell", "rent"]),
  orderedIds: z.array(z.string()),
});

export default withAdminApi(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder" });
    return;
  }
  try {
    await reorderQuestions(parsed.data.intent, parsed.data.orderedIds);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/admin/questions/reorder]", (e as Error).message);
    res.status(500).json({ error: "Could not reorder" });
  }
});
