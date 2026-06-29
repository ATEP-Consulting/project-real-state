import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { PRIMARY_NAV } from "@/lib/nav";
import { useScrolled } from "./useScrolled";
import styles from "./Header.module.css";

export function Header({ transparentOverHero = false }: { transparentOverHero?: boolean }) {
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);
  const solid = !transparentOverHero || scrolled;

  return (
    <header className={`${styles.header} ${solid ? styles.solid : styles.overlay}`}>
      <Container>
        <div className={styles.bar}>
          <Link href="/" className={styles.wordmark} aria-label="Herrera — home">
            HERRERA
          </Link>

          <nav className={styles.nav} aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <span className={styles.lang} title="Español — coming in D13">
              <span className={styles.langActive}>EN</span>
              <span className={styles.langSep}>·</span>
              <span className={styles.langMuted}>ES</span>
            </span>
            <Link href="/contact" className={styles.cta}>
              Contact
            </Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span
                className={`${styles.bars} ${open ? styles.barsOpen : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </Container>

      {open && (
        <nav id="mobile-nav" className={styles.mobileNav} aria-label="Primary">
          {[...PRIMARY_NAV, { label: "Contact", href: "/contact" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
