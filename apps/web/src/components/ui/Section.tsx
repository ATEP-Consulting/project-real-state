import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Section.module.css";

export function Section({ children, reveal = true }: { children: ReactNode; reveal?: boolean }) {
  const inner = <div className={styles.section}>{children}</div>;
  return reveal ? <Reveal as="section">{inner}</Reveal> : <section>{inner}</section>;
}
