import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import styles from "./SellCta.module.css";

export function SellCta({ city }: { city: string }) {
  const { m } = useTranslation();
  const body = m.listing.sellCtaBody.replace("{city}", city);
  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>{m.listing.sellCtaTitle}</h2>
      <p className={styles.body}>{body}</p>
      {/* Targets the seller magnet (/home-value) once it ships; the home page hosts it today. */}
      <Link href="/" className={styles.cta}>
        {m.listing.sellCtaLink}
      </Link>
    </section>
  );
}
