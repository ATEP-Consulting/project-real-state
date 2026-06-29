import styles from "./StarRating.module.css";

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? styles.on : styles.off} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
