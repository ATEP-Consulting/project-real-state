import bcrypt from "bcryptjs";

export function verifyAdminCredentials(
  input: { email?: string | null; password?: string | null },
  adminEmail: string,
  adminPasswordHash: string,
): boolean {
  if (!input.email || !input.password) return false;
  if (input.email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) return false;
  return bcrypt.compareSync(input.password, adminPasswordHash);
}
