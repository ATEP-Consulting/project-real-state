import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import styles from "./AdminLayout.module.css";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/content", label: "Guides" },
];

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className={styles.shell}>
      <Head>
        <title>{`${title} · Herrera admin`}</title>
      </Head>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.monogram}>NH</span>
            <span className={styles.word}>HERRERA</span>
            <span className={styles.tag}>admin</span>
          </div>
          <nav className={styles.nav}>
            {NAV.map((n) => {
              const active =
                n.href === "/admin"
                  ? router.pathname === "/admin"
                  : router.pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className={styles.signout}
            onClick={() => void signOut({ callbackUrl: "/admin/login" })}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
