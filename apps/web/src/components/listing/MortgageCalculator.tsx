import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { monthlyMortgage } from "@/lib/listing-detail";
import { formatPrice } from "@/lib/listing";
import { useTranslation } from "@/lib/i18n";
import styles from "./MortgageCalculator.module.css";

export function MortgageCalculator({ price }: { price: number }) {
  const { m } = useTranslation();
  const [downPct, setDownPct] = useState(20);
  const [term, setTerm] = useState(30);
  const [rate, setRate] = useState(6.5);
  const down = Math.round((price * downPct) / 100);
  const monthly = Math.round(monthlyMortgage(price - down, rate, term));
  return (
    <section className={styles.box}>
      <h2 className={styles.h2}>{m.listing.mortgageTitle}</h2>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.lab}>{m.listing.mortgageDownPayment} ({downPct}%)</span>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
          />
          <span className={styles.sub}>{formatPrice(down)}</span>
        </label>
        <label className={styles.field}>
          <span className={styles.lab}>{m.listing.mortgageTerm}</span>
          <Select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
            <option value={30}>{m.listing.mortgageTerm30}</option>
            <option value={20}>{m.listing.mortgageTerm20}</option>
            <option value={15}>{m.listing.mortgageTerm15}</option>
          </Select>
        </label>
        <label className={styles.field}>
          <span className={styles.lab}>{m.listing.mortgageRate}</span>
          <input
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
      </div>
      <p className={styles.result}>
        <span className={styles.amount}>{formatPrice(monthly)}{m.listing.mortgagePerMonth}</span>
        <span className={styles.note}>{m.listing.mortgageDisclaimer}</span>
      </p>
    </section>
  );
}
