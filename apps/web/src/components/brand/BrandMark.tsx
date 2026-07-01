import { NH_PATH } from "./nh-path";

export type BrandMarkVariant = "auto" | "onDark" | "onLight";

/**
 * Two-tone presets. `auto` is monochrome via `currentColor` so the mark inherits its
 * surroundings (e.g. the header flipping white-over-hero → forest-when-scrolled). The
 * pinned variants give the premium two-tone bronze look on fixed backgrounds.
 */
const VARIANTS: Record<BrandMarkVariant, { ring: string; letters: string }> = {
  auto: { ring: "currentColor", letters: "currentColor" },
  onDark: { ring: "var(--color-bronze)", letters: "var(--color-bronze-light)" },
  onLight: { ring: "var(--color-bronze)", letters: "var(--color-bronze-dark)" },
};

type Props = {
  size?: number;
  variant?: BrandMarkVariant;
  /**
   * When set, the mark is a standalone labelled image (`role="img"` + `aria-label`).
   * Omit it when the mark sits next to visible wordmark text (header/footer/lockup) so
   * screen readers don't announce the brand twice — then it renders decorative.
   */
  title?: string;
  className?: string;
};

/**
 * The Herrera NH monogram — a bespoke Didone mark (Playfair outlines) inside a thin ring.
 * Pure SVG paths, so it stays crisp at any size with no font dependency. Static by design
 * (no animation) — nothing here to honor for reduced-motion.
 */
export function BrandMark({ size = 36, variant = "auto", title, className }: Props) {
  const { ring, letters } = VARIANTS[variant];
  const labelled = Boolean(title);
  // Ring stroke is in viewBox units; ~2.4 renders to roughly a 1px hairline across the
  // 28–56px range the mark is used at, and scales proportionally with `size`.
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <circle cx="50" cy="50" r="46" stroke={ring} strokeWidth="2.4" />
      <path d={NH_PATH} fill={letters} />
    </svg>
  );
}
