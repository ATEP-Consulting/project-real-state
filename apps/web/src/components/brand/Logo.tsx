import { REALTOR } from "@/data/realtor";
import { BrandMark, type BrandMarkVariant } from "./BrandMark";
import styles from "./Logo.module.css";

type Props = {
  size?: number;
  variant?: BrandMarkVariant;
  /** Show the "Real Estate · Miami" line under the name (branded/prominent surfaces). */
  tagline?: boolean;
  className?: string;
};

/**
 * Full brand lockup: the NH mark + the "Nilyan Herrera" wordmark (in the site serif,
 * Spectral) with an optional tagline. The mark is decorative here — the visible name
 * carries the label. Used on the admin sign-in; the header/footer render their own
 * wordmark and use `BrandMark` directly.
 */
export function Logo({ size = 42, variant = "onLight", tagline = false, className }: Props) {
  return (
    <span className={`${styles.logo} ${className ?? ""}`}>
      <BrandMark size={size} variant={variant} />
      <span className={styles.text}>
        <span className={styles.name}>{REALTOR.name}</span>
        {tagline && <span className={styles.tagline}>{REALTOR.tagline}</span>}
      </span>
    </span>
  );
}
