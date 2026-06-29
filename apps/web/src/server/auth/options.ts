import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { parseServerEnv } from "@herrera/config/env";
import { verifyAdminCredentials } from "./credentials";

export const authOptions: NextAuthOptions = {
  // Read directly (build-safe): undefined at build, present at runtime.
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        // parseServerEnv() runs at request time (env present), not at build.
        const env = parseServerEnv();
        const ok = verifyAdminCredentials(
          { email: credentials?.email, password: credentials?.password },
          env.ADMIN_EMAIL,
          env.ADMIN_PASSWORD_HASH,
        );
        return ok ? { id: "admin", email: env.ADMIN_EMAIL, name: "Nilyan Herrera" } : null;
      },
    }),
  ],
};
