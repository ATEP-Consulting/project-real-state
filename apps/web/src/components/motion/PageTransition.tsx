import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { DURATION, EASE } from "@/theme/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  // Key on the PATH only (not the query string): /search writes the map bbox into the
  // query on every move, and keying on the full asPath would remount the whole page (and
  // the map) on each change — an infinite remount loop. Distinct routes still transition.
  const routeKey = router.asPath.split("?")[0];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
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
