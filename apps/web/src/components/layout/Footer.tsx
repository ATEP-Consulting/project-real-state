import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FOOTER_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { BrandMark } from "@/components/brand/BrandMark";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { EqualHousingLogo } from "./EqualHousingLogo";
import { useTranslation } from "@/lib/i18n";
import styles from "./Footer.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export function Footer() {
  const { m } = useTranslation();

  // Map footer headings to message keys (by heading value from FOOTER_NAV)
  const HEADING_LABEL: Record<string, string> = {
    Explore: m.footer.explore,
    Learn: m.footer.learn,
    Contact: m.footer.contact,
  };

  // Map item labels to message keys (by label value from FOOTER_NAV)
  const ITEM_LABEL: Record<string, string> = {
    Buy: m.nav.buy,
    Sell: m.nav.sell,
    Rent: m.nav.rent,
    "Map search": m.footer.mapSearch,
    "Saved homes": m.common.savedHomes,
    Guides: m.nav.guides,
    "About Nilyan": m.footer.aboutNilyan,
    "Explore areas": m.footer.exploreAreas,
    "Book a visit": m.footer.bookVisit,
    "Contact Nilyan": m.footer.contactNilyan,
  };

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.brandRow}>
              <BrandMark size={34} variant="onDark" className={styles.mark} />
              <span className={styles.nameCol}>
                <span className={styles.wordmark}>HERRERA</span>
                <span className={styles.kicker}>{REALTOR.tagline}</span>
              </span>
            </span>
            <p className={styles.tagline}>{m.realtor.bioShort}</p>
            <a className={styles.phone} href={TEL}>
              {REALTOR.phone}
            </a>
            <a
              className={styles.social}
              href={REALTOR.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon size={17} />
              <span>{REALTOR.instagramHandle}</span>
            </a>
          </div>

          <nav className={styles.cols} aria-label={m.common.footerNavLabel}>
            {FOOTER_NAV.map((col) => (
              <div key={col.heading} className={styles.col}>
                <h2 className={styles.colHeading}>{HEADING_LABEL[col.heading] ?? col.heading}</h2>
                <ul className={styles.colList}>
                  {col.items.map((item) => (
                    <li key={`${col.heading}-${item.label}`}>
                      {item.href.startsWith("mailto:") ? (
                        <a href={item.href} className={styles.colLink}>
                          {item.label}
                        </a>
                      ) : (
                        <Link href={item.href} className={styles.colLink}>
                          {ITEM_LABEL[item.label] ?? item.label}
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
            <span className={styles.sample}> · {m.footer.sampleData}</span>
          </p>
          <div className={styles.legal}>
            <span className={styles.eho}>
              <EqualHousingLogo size={20} />
              {m.footer.equalHousing}
            </span>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className={styles.legalLink}>
              {m.footer.privacy}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className={styles.legalLink}>
              {m.footer.terms}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/fair-housing" className={styles.legalLink}>
              {m.footer.fairHousing}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
