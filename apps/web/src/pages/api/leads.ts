import type { NextApiRequest, NextApiResponse } from "next";
import {
  createListingInquiry,
  createQualificationLead,
  listingInquirySchema,
  qualificationLeadSchema,
} from "@herrera/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body: unknown = req.body;
  const isInquiry =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { listingSlug?: unknown }).listingSlug === "string";

  if (isInquiry) {
    const parsed = listingInquirySchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid inquiry", issues: parsed.error.flatten() });
      return;
    }
    try {
      const { leadId } = await createListingInquiry(parsed.data);
      res.status(201).json({ ok: true, leadId });
    } catch (e) {
      console.error("[api/leads] inquiry failed:", (e as Error).message);
      res.status(500).json({ error: "Could not submit inquiry" });
    }
    return;
  }

  const parsed = qualificationLeadSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lead", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { leadId } = await createQualificationLead(parsed.data);
    res.status(201).json({ ok: true, leadId });
  } catch (e) {
    console.error("[api/leads] qualification failed:", (e as Error).message);
    res.status(500).json({ error: "Could not submit lead" });
  }
}
