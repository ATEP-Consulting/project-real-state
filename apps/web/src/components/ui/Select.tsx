import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Select.module.css";

type Variant = "default" | "bare";
type Size = "sm" | "md";
type Option = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  value?: string | number;
  // Native-like signature so existing `onChange={(e) => e.target.value}` call
  // sites keep working unchanged after the rollout.
  onChange?: (e: { target: { value: string } }) => void;
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3.5 8.5l3 3 6-6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Read the <option> children into a plain list so the public API stays the
// native one (drop-in), while the UI is fully ours.
function parseOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const p = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = typeof p.children === "string" ? p.children : String(p.children ?? "");
    out.push({ value: String(p.value ?? ""), label, disabled: p.disabled });
  });
  return out;
}

const ITEM_H = 38; // estimate for flip placement before the menu is measured

/**
 * Fully custom select: a button trigger + a portaled listbox panel, so both the
 * box AND the dropdown carry the design system (a native panel can't be styled).
 * Keyboard + ARIA listbox semantics, click-outside, reduced-motion (via the
 * global backstop). Portaled to <body> so an ancestor `overflow:hidden` (hero
 * card, board scroller) never clips it.
 */
export function Select({
  value,
  onChange,
  children,
  variant = "default",
  size = "md",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
}: SelectProps) {
  const options = parseOptions(children);
  const current = String(value ?? "");
  const selectedIndex = options.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  const reactId = useId();
  const baseId = id ?? reactId;
  const listId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setMounted(true), []);

  function firstEnabled(): number {
    return options.findIndex((o) => !o.disabled);
  }
  // Move from `from` in `dir`, skipping disabled options and clamping at the ends.
  function step(from: number, dir: 1 | -1): number {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      const next = i + dir;
      if (next < 0 || next > options.length - 1) break;
      i = next;
      if (!options[i]?.disabled) return i;
    }
    return from >= 0 && from < options.length && !options[from]?.disabled ? from : firstEnabled();
  }

  function place() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estH = Math.min(options.length * ITEM_H + 8, 288);
    const below = window.innerHeight - r.bottom;
    const openUp = below < estH && r.top > below;
    setCoords({
      top: openUp ? Math.max(8, r.top - estH - 4) : r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  }

  function openMenu(toIndex?: number) {
    if (disabled || options.length === 0) return;
    place();
    setActiveIndex(toIndex ?? (selectedIndex >= 0 ? selectedIndex : firstEnabled()));
    setOpen(true);
  }
  function closeMenu(refocus = true) {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) triggerRef.current?.focus();
  }
  function choose(i: number) {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    if (opt.value !== current) onChange?.({ target: { value: opt.value } });
    closeMenu();
  }

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const reposition = () => place();
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      closeMenu(false);
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    }
  }
  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => step(i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => step(i < 0 ? options.length : i, -1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(firstEnabled());
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(step(options.length, -1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu(false);
        break;
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`${styles.trigger} ${styles[variant]} ${styles[size]} ${open ? styles.open : ""} ${className}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={styles.value}>{selected?.label ?? ""}</span>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {open &&
        mounted &&
        coords &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            className={styles.menu}
            style={{ position: "fixed", top: coords.top, left: coords.left, minWidth: coords.width }}
            onKeyDown={onListKeyDown}
          >
            {options.map((o, i) => {
              const isSelected = o.value === current;
              return (
                <li
                  key={`${o.value}-${i}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={o.disabled || undefined}
                  className={`${styles.option} ${i === activeIndex ? styles.active : ""} ${isSelected ? styles.selected : ""}`}
                  onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                  onClick={() => choose(i)}
                >
                  <span>{o.label}</span>
                  <span className={styles.check} aria-hidden="true">
                    {isSelected ? <CheckIcon /> : null}
                  </span>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
