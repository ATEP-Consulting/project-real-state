import Link from "next/link";
import { Fragment, useState } from "react";
import { useRouter } from "next/router";
import { Container } from "@/components/ui/Container";
import { PRIMARY_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { useScrolled } from "./useScrolled";
import { FavoritesNavButton } from "@/components/favorites/FavoritesNavButton";
<<<<<<< HEAD
import { BrandMark } from "@/components/brand/BrandMark";
=======
import { useTranslation } from "@/lib/i18n";
import { LOCALES, asLocale } from "@/lib/i18n/config";
>>>>>>> feat/d13-i18n
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

// Working EN/ES toggle: switches the current page to the other language,
// preserving route + query. Active locale marked with aria-current.
function LangToggle() {
  const router = useRouter();
  const current = asLocale(router.locale);
  const { m } = useTranslation();
  return (
    <span className={styles.lang} role="group" aria-label={m.common.language}>
      <GlobeIcon />
      {LOCALES.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && <span className={styles.langDivider} aria-hidden="true" />}
          <Link
            href={{ pathname: router.pathname, query: router.query }}
            as={router.asPath}
            locale={l}
            scroll={false}
            className={l === current ? styles.langOn : styles.langMuted}
            aria-current={l === current ? "true" : undefined}
          >
            {l.toUpperCase()}
          </Link>
        </Fragment>
      ))}
    </span>
  );
}

export function Header({ transparentOverHero = false }: { transparentOverHero?: boolean }) {
  const scrolled = useScrolled(8);
  const [open, setOpen] = useState(false);
  const { m } = useTranslation();
  // Transparent over the hero at the very top; fades to a solid white bar once scrolled
  // (or when the mobile menu is open, so the panel stays legible).
  const solid = !transparentOverHero || scrolled || open;

  const NAV_LABEL: Record<string, string> = {
    "/buy": m.nav.buy,
    "/sell": m.nav.sell,
    "/rent": m.nav.rent,
    "/guides": m.nav.guides,
    "/about": m.nav.about,
  };

  return (
    <header className={`${styles.header} ${solid ? styles.solid : styles.overlay}`}>
      <Container>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand} aria-label={`${REALTOR.name} — home`}>
            <BrandMark size={36} className={styles.mark} />
            <span className={styles.wordmark}>{REALTOR.name}</span>
          </Link>

          <nav className={styles.nav} aria-label={m.common.primaryNavLabel}>
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {NAV_LABEL[item.href] ?? item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <FavoritesNavButton />
            <LangToggle />
            <a className={styles.phone} href={TEL}>
              {REALTOR.phone}
            </a>
            <Link href="/contact" className={styles.contactBtn}>
              {m.common.contact}
            </Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? m.common.closeMenu : m.common.openMenu}
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
        <nav id="mobile-nav" className={styles.mobileNav} aria-label={m.common.primaryNavLabel}>
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {NAV_LABEL[item.href] ?? item.label}
            </Link>
          ))}
          <Link href="/favorites" className={styles.mobileLink} onClick={() => setOpen(false)}>
            {m.common.savedHomes}
          </Link>
          <a className={styles.mobileLink} href={TEL} onClick={() => setOpen(false)}>
            {REALTOR.phone}
          </a>
          <div className={styles.mobileLang}>
            <LangToggle />
          </div>
          <Link href="/contact" className={styles.mobileContact} onClick={() => setOpen(false)}>
            {m.common.contact}
          </Link>
        </nav>
      )}
    </header>
  );
}
