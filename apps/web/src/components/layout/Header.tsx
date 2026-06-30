import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { PRIMARY_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { useScrolled } from "./useScrolled";
import styles from "./Header.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

// Universal language affordance — a thin-stroke globe matching the app's icon set
// (currentColor so it inherits the header's white-over-hero / forest-when-scrolled state).
function GlobeIcon() {
  return (
    <svg
      className={styles.globe}
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.4 2.6 2.4 15.4 0 18M12 3c-2.4 2.6-2.4 15.4 0 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header({ transparentOverHero = false }: { transparentOverHero?: boolean }) {
  const scrolled = useScrolled(8);
  const [open, setOpen] = useState(false);
  // Transparent over the hero at the very top; fades to a solid white bar once scrolled
  // (or when the mobile menu is open, so the panel stays legible).
  const solid = !transparentOverHero || scrolled || open;

  return (
    <header className={`${styles.header} ${solid ? styles.solid : styles.overlay}`}>
      <Container>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand} aria-label={`${REALTOR.name} — home`}>
            <span className={styles.monogram} aria-hidden="true">
              {REALTOR.monogram}
            </span>
            <span className={styles.wordmark}>{REALTOR.name}</span>
          </Link>

          <nav className={styles.nav} aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <span className={styles.lang} role="group" aria-label="Language">
              <GlobeIcon />
              <span className={styles.langOn} aria-current="true">
                EN
              </span>
              <span className={styles.langDivider} aria-hidden="true" />
              <span className={styles.langMuted} title="Español — próximamente">
                ES
              </span>
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
