import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FOOTER_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { EqualHousingLogo } from "./EqualHousingLogo";
import styles from "./Footer.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.brandRow}>
              <span className={styles.monogram} aria-hidden="true">
                {REALTOR.monogram}
              </span>
              <span className={styles.wordmark}>HERRERA</span>
            </span>
            <p className={styles.tagline}>{REALTOR.bioShort}</p>
            <a className={styles.phone} href={TEL}>
              {REALTOR.phone}
            </a>
          </div>

          <nav className={styles.cols} aria-label="Footer">
            {FOOTER_NAV.map((col) => (
              <div key={col.heading} className={styles.col}>
                <h2 className={styles.colHeading}>{col.heading}</h2>
                <ul className={styles.colList}>
                  {col.items.map((item) => (
                    <li key={`${col.heading}-${item.label}`}>
                      {item.href.startsWith("mailto:") ? (
                        <a href={item.href} className={styles.colLink}>
                          {item.label}
                        </a>
                      ) : (
                        <Link href={item.href} className={styles.colLink}>
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {REALTOR.copyrightYear} Nilyan Herrera Real Estate · {REALTOR.license}
            <span className={styles.sample}> · Sample data — demo</span>
          </p>
          <div className={styles.legal}>
            <span className={styles.eho}>
              <EqualHousingLogo size={20} />
              Equal Housing Opportunity
            </span>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className={styles.legalLink}>
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className={styles.legalLink}>
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/fair-housing" className={styles.legalLink}>
              Fair Housing
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
