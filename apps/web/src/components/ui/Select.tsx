import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

type Variant = "default" | "bare";
type Size = "sm" | "md";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Thin wrapper over a native <select> (same approach as Button): the native
// element keeps accessibility, keyboard, and the mobile picker; we only style
// the box and swap the OS arrow for a consistent chevron. `size` is omitted from
// the native props so it can't collide with the design-system size scale.
export function Select({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <span className={`${styles.wrap} ${styles[variant]} ${styles[size]} ${className}`}>
      <select className={styles.select} {...props}>
        {children}
      </select>
      <span className={styles.chevron} aria-hidden="true">
        <ChevronIcon />
      </span>
    </span>
  );
}
