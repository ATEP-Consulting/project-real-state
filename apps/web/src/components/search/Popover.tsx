import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./Popover.module.css";

/** A minimal accessible anchored popover (Esc / outside-click closes). No dependency. */
export function Popover({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${active ? styles.active : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span aria-hidden className={styles.caret}>
          ▾
        </span>
      </button>
      {open ? (
        <div id={id} role="dialog" className={styles.panel}>
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}
