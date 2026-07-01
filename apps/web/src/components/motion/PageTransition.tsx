import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { DURATION, EASE } from "@/theme/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  // Key on the PATH only (not the query string): /search writes the map bbox into the
  // query on every move, and keying on the full asPath would remount the whole page (and
  // the map) on each change — an infinite remount loop. Distinct routes still transition.
  const routeKey = router.asPath.split("?")[0];

  // Honor reduced motion by zeroing the duration — NOT by early-returning a fragment.
  // `useReducedMotion` is false during SSR and only flips to true on the client, so an
  // early fragment return would change the DOM structure between server and client and
  // throw a hydration mismatch on every page. Keeping the same wrapper (with
  // `initial={false}` suppressing the SSR entrance) makes both sides render identically.
  //
  // Enter-only, deliberately NO `mode="wait"` and NO `exit`: with `mode="wait"` the
  // outgoing page had to fade fully to opacity 0 *before* the incoming page mounted,
  // leaving a blank paper trough between every route. Locally that gap is ~0ms (chunks
  // load instantly) so it's invisible; in production the network fill (esp. the heavy
  // /search view + its ssr:false map) stretched the blank screen and read as a FOUC-like
  // flash. Dropping the exit lets the new page fade/slide in the instant it mounts, over
  // the outgoing one — same premium entrance, no blank gap. `initial={false}` still keeps
  // the very first load static (animate on navigation, not on hard load).
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
