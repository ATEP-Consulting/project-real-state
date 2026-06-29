import type { NextApiRequest, NextApiResponse } from "next";
import { countListings } from "@herrera/db";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const listings = await countListings();
    res.status(200).json({ ok: true, listings });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
}
