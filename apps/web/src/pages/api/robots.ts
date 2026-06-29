import type { NextApiRequest, NextApiResponse } from "next";
import { robotsBody } from "@/server/robots";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(robotsBody(isDemo));
}
