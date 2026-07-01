import type { NextApiRequest, NextApiResponse } from "next";
import { getListingsBySlugs, listingsBySlugsInputSchema } from "@herrera/db";
import { toListingCardVM } from "@/lib/listing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = listingsBySlugsInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.flatten() });
    return;
  }
  try {
    const rows = await getListingsBySlugs(parsed.data.slugs);
    res.status(200).json({ listings: rows.map(toListingCardVM) });
  } catch (e) {
    console.error("[api/listings/by-slugs] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not load saved homes" });
  }
}
