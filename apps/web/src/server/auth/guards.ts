import type { GetServerSidePropsContext, NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./options";

/**
 * Page guard for getServerSideProps — returns a redirect result when unauthenticated,
 * or `null` when the admin is authenticated (the page should proceed).
 */
export async function requireAdmin(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }
  return null;
}

/** API guard — wraps an admin API handler, returning 401 when unauthenticated. */
export function withAdminApi(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    return handler(req, res);
  };
}
