import { withAdminApi } from "@/server/auth/guards";

// Sample protected admin endpoint — real admin mutations arrive in D10/D11.
export default withAdminApi((_req, res) => {
  res.status(200).json({ ok: true, scope: "admin" });
});
