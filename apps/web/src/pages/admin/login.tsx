import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import type { FormEvent } from "react";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { authOptions } from "@/server/auth/options";
import styles from "./login.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.ok) {
      void router.push("/admin");
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className={styles.wrap}>
      <Head>
        <title>Herrera — admin sign in</title>
      </Head>
      <form className={styles.card} onSubmit={onSubmit}>
        <Logo tagline className={styles.brand} />
        <h1 style={{ fontSize: 28, margin: "8px 0 4px" }}>Sign in</h1>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div style={{ marginTop: 20 }}>
          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Already authenticated → go to the dashboard.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) return { redirect: { destination: "/admin", permanent: false } };
  return { props: {} };
};
