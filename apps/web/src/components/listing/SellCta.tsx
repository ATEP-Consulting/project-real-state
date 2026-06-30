import Link from "next/link";
import styles from "./SellCta.module.css";

export function SellCta({ city }: { city: string }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Selling something similar?</h2>
      <p className={styles.body}>
        Find out what your home in {city} could be worth with a free, no-obligation valuation.
      </p>
      {/* Targets the seller magnet (/home-value) once it ships; the home page hosts it today. */}
      <Link href="/" className={styles.cta}>
        Value my home →
      </Link>
    </section>
  );
}
