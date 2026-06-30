import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { monthlyMortgage } from "@/lib/listing-detail";
import { formatPrice } from "@/lib/listing";
import styles from "./MortgageCalculator.module.css";

export function MortgageCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20);
  const [term, setTerm] = useState(30);
  const [rate, setRate] = useState(6.5);
  const down = Math.round((price * downPct) / 100);
  const monthly = Math.round(monthlyMortgage(price - down, rate, term));
  return (
    <section className={styles.box}>
      <h2 className={styles.h2}>Mortgage calculator</h2>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.lab}>Down payment ({downPct}%)</span>
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
          <span className={styles.lab}>Term</span>
          <Select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
            <option value={30}>30 years</option>
            <option value={20}>20 years</option>
            <option value={15}>15 years</option>
          </Select>
        </label>
        <label className={styles.field}>
          <span className={styles.lab}>Rate (%)</span>
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
        <span className={styles.amount}>{formatPrice(monthly)}/mo</span>
        <span className={styles.note}>
          Estimated principal &amp; interest. Taxes, insurance, and HOA are not included. This is an
          estimate, not a quote or financial advice.
        </span>
      </p>
    </section>
  );
}
