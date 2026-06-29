import type { NextApiRequest, NextApiResponse } from "next";
import { parseSearchParams } from "@/lib/search-params";
import { runSearch } from "@/server/run-search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const params = parseSearchParams(req.query);
    const result = await runSearch(params);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
