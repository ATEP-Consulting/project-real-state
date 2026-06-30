import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QualificationQuestionConfig } from "@herrera/db";
import { DURATION, EASE } from "@/theme/motion";
import { LeadCaptureFlow } from "./LeadCaptureFlow";
import { FlowSkeleton } from "./FlowSkeleton";
import type { Answers, Intent } from "@/lib/lead-capture";
import styles from "./LeadCaptureProvider.module.css";

type Ctx = { openCapture: (intent: Intent, opts?: { initialAnswers?: Answers }) => void };
const LeadCaptureContext = createContext<Ctx | null>(null);

export function useLeadCapture(): Ctx {
  const ctx = useContext(LeadCaptureContext);
  if (!ctx) throw new Error("useLeadCapture must be used inside <LeadCaptureProvider>");
  return ctx;
}

type Loaded =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; questions: QualificationQuestionConfig[] };

export function LeadCaptureProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });

  const sheetRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const openCapture = useCallback<Ctx["openCapture"]>((i, opts) => {
    setIntent(i);
    setInitialAnswers(opts?.initialAnswers ?? {});
    setLoaded({ state: "loading" });
  }, []);
  const close = useCallback(() => setIntent(null), []);

  // Fetch the question set for the chosen intent when the overlay opens.
  useEffect(() => {
    if (!intent) return;
    let alive = true;
    fetch(`/api/questions?intent=${intent}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { questions: QualificationQuestionConfig[] }) => {
        if (alive) setLoaded({ state: "ready", questions: d.questions });
      })
      .catch(() => {
        if (alive) setLoaded({ state: "error" });
      });
    return () => {
      alive = false;
    };
  }, [intent]);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!intent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [intent, close]);

  // Remember what was focused when the overlay opened; restore it on close.
  useEffect(() => {
    if (intent) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current.focus?.();
      restoreFocusRef.current = null;
    }
  }, [intent]);

  // Move focus into the sheet on open / content change, and trap Tab inside it.
  useEffect(() => {
    if (!intent) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const focusable = () =>
      Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    // Respect an autoFocused field; otherwise focus the first control (or the sheet).
    if (!sheet.contains(document.activeElement)) {
      const f = focusable();
      (f[0] ?? sheet).focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusable();
      if (f.length === 0) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    sheet.addEventListener("keydown", onKey);
    return () => sheet.removeEventListener("keydown", onKey);
  }, [intent, loaded.state]);

  const value = useMemo<Ctx>(() => ({ openCapture }), [openCapture]);

  const overlayAnim = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: DURATION.fast, ease: EASE },
      };
  const sheetAnim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 24 },
        transition: { duration: DURATION.base, ease: EASE },
      };

  return (
    <LeadCaptureContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {intent && (
          <motion.div
            className={styles.backdrop}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Lead capture"
            {...overlayAnim}
          >
            <motion.div
              ref={sheetRef}
              tabIndex={-1}
              className={styles.sheet}
              onClick={(e) => e.stopPropagation()}
              {...sheetAnim}
            >
              {loaded.state === "loading" && <FlowSkeleton />}
              {loaded.state === "error" && (
                <div className={styles.note}>
                  <p>We couldn&rsquo;t load the form. Please try again.</p>
                  <button
                    type="button"
                    className={styles.retry}
                    onClick={() => openCapture(intent)}
                  >
                    Retry
                  </button>
                </div>
              )}
              {loaded.state === "ready" && (
                <LeadCaptureFlow
                  intent={intent}
                  questions={loaded.questions}
                  initialAnswers={initialAnswers}
                  landingPath={`/${intent}`}
                  onClose={close}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LeadCaptureContext.Provider>
  );
}
