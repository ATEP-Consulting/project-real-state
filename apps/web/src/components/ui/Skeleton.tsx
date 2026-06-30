import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

type Props = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
  className?: string;
};

/**
 * Reusable shimmer placeholder shown while content loads. Honors
 * prefers-reduced-motion (no shimmer) and is aria-hidden (announce loading on
 * the surrounding container with aria-busy). Use anywhere the app is fetching.
 */
export function Skeleton({ width, height = 16, radius, circle = false, className = "" }: Props) {
  const style: CSSProperties = {
    width,
    height,
    ...(circle ? { borderRadius: "9999px" } : radius !== undefined ? { borderRadius: radius } : {}),
  };
  return <span aria-hidden="true" className={`${styles.skeleton} ${className}`} style={style} />;
}
