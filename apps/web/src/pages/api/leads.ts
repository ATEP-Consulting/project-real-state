import type { NextApiRequest, NextApiResponse } from "next";
import { createListingInquiry, listingInquirySchema } from "@herrera/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = listingInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid inquiry", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { leadId } = await createListingInquiry(parsed.data);
    res.status(201).json({ ok: true, leadId });
  } catch (e) {
    console.error("[api/leads] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not submit inquiry" });
  }
}
