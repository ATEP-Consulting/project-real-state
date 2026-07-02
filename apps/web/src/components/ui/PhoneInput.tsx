import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_COUNTRY_ISO,
  countryByIso,
  countryName,
  normalizePhone,
  searchCountries,
  type Country,
} from "@/lib/phone";
import { useTranslation } from "@/lib/i18n";
import styles from "./PhoneInput.module.css";

type Tone = "surface" | "paper";

type PhoneInputProps = {
  /** Emitted value: "+<dial><digits>" or "" while the number box is empty. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  autoComplete?: string;
  /** Match the host form's input background (white forms vs cream cards). */
  tone?: Tone;
  className?: string;
};

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
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

function Flag({ iso }: { iso: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.flag} src={`/flags/${iso}.svg`} alt="" loading="lazy" />;
}

const PANEL_H = 320; // fixed panel height estimate for flip-up placement

/**
 * Phone input with a country dial-code selector (SVG flags — OS emoji flags
 * render as letters on Windows). Same custom-dropdown mechanics as ui/Select
 * (portaled branded panel, keyboard, click-outside, flip-up), plus a search
 * box — 200+ countries need filtering. Emits a loosely-normalized
 * "+<dial><digits>" (see lib/phone.ts) so the phone-or-email gate and the
 * payload both read one string. Defaults to the US and stays out of the way.
 */
export function PhoneInput({
  value,
  onChange,
  id,
  placeholder,
  "aria-label": ariaLabel,
  autoComplete = "tel-national",
  tone = "surface",
  className = "",
}: PhoneInputProps) {
  const { m, locale } = useTranslation();
  const [iso, setIso] = useState(DEFAULT_COUNTRY_ISO);
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const telRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const reactId = useId();
  const listId = `${id ?? reactId}-countries`;
  const optionId = (i: number) => `${listId}-${i}`;

  const country = countryByIso(iso) ?? { iso: DEFAULT_COUNTRY_ISO, dial: "1" };
  const results = useMemo(() => searchCountries(query, locale), [query, locale]);

  useEffect(() => setMounted(true), []);

  // Parent reset (e.g. form cleared): empty value with local digits → clear them.
  useEffect(() => {
    if (value === "" && national !== "") setNational("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(nextIso: string, nextNational: string) {
    const c = countryByIso(nextIso) ?? country;
    onChange(normalizePhone(c.dial, nextNational));
  }

  function place() {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const openUp = below < PANEL_H && r.top > below;
    setCoords({
      top: openUp ? Math.max(8, r.top - PANEL_H - 4) : r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 260),
    });
  }

  function openPanel() {
    place();
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }
  function closePanel(refocus: "trigger" | "tel" | "none" = "trigger") {
    setOpen(false);
    if (refocus === "trigger") triggerRef.current?.focus();
    if (refocus === "tel") telRef.current?.focus();
  }
  function choose(c: Country) {
    setIso(c.iso);
    emit(c.iso, national);
    closePanel("tel"); // straight into the number box
  }

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const reposition = () => place();
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      closePanel("none");
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

  // Keep the active option visible while arrowing through the list.
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPanel();
    }
  }
  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const c = results[activeIndex];
        if (c) choose(c);
        break;
      }
      case "Escape":
        // Close only the country panel — never the lead-capture overlay behind it.
        e.preventDefault();
        e.stopPropagation();
        closePanel();
        break;
      case "Tab":
        closePanel("none");
        break;
    }
  }

  return (
    <div ref={rootRef} className={`${styles.field} ${styles[tone]} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${m.phoneInput.countryAria}: ${countryName(country.iso, locale)} +${country.dial}`}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={onTriggerKeyDown}
      >
        <Flag iso={country.iso} />
        <span className={styles.dial}>+{country.dial}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>
      <span className={styles.divider} aria-hidden="true" />
      <input
        ref={telRef}
        id={id}
        className={styles.tel}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={national}
        onChange={(e) => {
          setNational(e.target.value);
          emit(iso, e.target.value);
        }}
      />

      {open &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
          >
            <input
              ref={searchRef}
              className={styles.search}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results[activeIndex] ? optionId(activeIndex) : undefined}
              aria-label={m.phoneInput.searchAria}
              placeholder={m.phoneInput.searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onSearchKeyDown}
            />
            <ul
              id={listId}
              role="listbox"
              aria-label={m.phoneInput.countryAria}
              className={styles.list}
            >
              {results.length === 0 && <li className={styles.empty}>{m.phoneInput.noResults}</li>}
              {results.map((c, i) => (
                <li
                  key={c.iso}
                  id={optionId(i)}
                  role="option"
                  aria-selected={c.iso === iso}
                  className={`${styles.option} ${i === activeIndex ? styles.active : ""} ${c.iso === iso ? styles.selected : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(c)}
                >
                  <Flag iso={c.iso} />
                  <span className={styles.optionName}>{countryName(c.iso, locale)}</span>
                  <span className={styles.optionDial}>+{c.dial}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
