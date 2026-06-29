import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { PRIMARY_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { useScrolled } from "./useScrolled";
import styles from "./Header.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export function Header() {
  const scrolled = useScrolled(8);
  const [open, setOpen] = useState(false);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <Container>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand} aria-label="Herrera — home">
            <span className={styles.monogram} aria-hidden="true">
              {REALTOR.monogram}
            </span>
            <span className={styles.wordmark}>HERRERA</span>
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
              <span className={styles.langMuted}>🇪🇸 ES</span>
              <span className={styles.langSep}>·</span>
              <span className={styles.langOn}>🇺🇸 EN</span>
            </span>
            <a className={styles.phone} href={TEL}>
              {REALTOR.phone}
            </a>
            <Link href="/contact" className={styles.contactBtn}>
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
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a className={styles.mobileLink} href={TEL} onClick={() => setOpen(false)}>
            {REALTOR.phone}
          </a>
          <Link href="/contact" className={styles.mobileContact} onClick={() => setOpen(false)}>
            Contact
          </Link>
        </nav>
      )}
    </header>
  );
}
