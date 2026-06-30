import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getQualificationQuestions } from "@herrera/db";

const intentSchema = z.enum(["buy", "sell", "rent"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = intentSchema.safeParse(req.query.intent);
  if (!parsed.success) {
    res.status(400).json({ error: "Unknown intent" });
    return;
  }
  try {
    const questions = await getQualificationQuestions(parsed.data);
    res.status(200).json({ questions });
  } catch (e) {
    console.error("[api/questions] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not load questions" });
  }
}
