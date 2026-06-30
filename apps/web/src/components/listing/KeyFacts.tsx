import type { KeyFact } from "@/lib/listing-detail";
import styles from "./KeyFacts.module.css";

export function KeyFacts({ facts }: { facts: KeyFact[] }) {
  return (
    <dl className={styles.strip}>
      {facts.map((f) => (
        <div key={f.label} className={styles.cell}>
          <dt className={styles.label}>{f.label}</dt>
          <dd className={styles.value}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
