import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { DURATION, EASE } from "@/theme/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={router.asPath}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: DURATION.base, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
