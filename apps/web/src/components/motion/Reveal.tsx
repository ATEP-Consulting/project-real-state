import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE, REVEAL_OFFSET } from "@/theme/motion";

export function Reveal({
  children,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section";
}) {
  const reduce = useReducedMotion();
  const MotionTag = as === "section" ? motion.section : motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag>{children}</Tag>;
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DURATION.reveal, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}
