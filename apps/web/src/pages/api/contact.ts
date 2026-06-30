import type { NextApiRequest, NextApiResponse } from "next";
import { contactLeadSchema, createContactLead } from "@herrera/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = contactLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid contact request", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { leadId } = await createContactLead(parsed.data);
    res.status(201).json({ ok: true, leadId });
  } catch (e) {
    console.error("[api/contact] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not submit your message" });
  }
}
