import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FOOTER_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { EqualHousingLogo } from "./EqualHousingLogo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.wordmark}>HERRERA</span>
            <p className={styles.tagline}>{REALTOR.bioShort}</p>
            <p className={styles.contact}>
              <a href={`mailto:${REALTOR.email}`}>{REALTOR.email}</a>
              <span aria-hidden="true"> · </span>
              <a href={`tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`}>{REALTOR.phone}</a>
            </p>
          </div>

          <nav className={styles.cols} aria-label="Footer">
            {FOOTER_NAV.map((col) => (
              <div key={col.heading} className={styles.col}>
                <h2 className={styles.colHeading}>{col.heading}</h2>
                <ul className={styles.colList}>
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.colLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.legal}>
          <div className={styles.eho}>
            <EqualHousingLogo />
            <span>Equal Housing Opportunity</span>
          </div>
          <div className={styles.legalText}>
            <p>
              {REALTOR.name}, {REALTOR.title} · {REALTOR.license}
            </p>
            <p className={styles.sample}>
              Sample data — demonstration site. Listings, figures, and reviews shown are
              illustrative.
            </p>
            <p>© {REALTOR.copyrightYear} Herrera. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
