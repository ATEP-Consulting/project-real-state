import { useEffect, useState } from "react";
import { serializeSearchQuery, type SearchParams } from "@/lib/search-params";
import { clearKeysPatch, pickKeys, type FilterConfig } from "@/lib/filters";
import { FilterControl } from "./FilterControl";
import styles from "./MoreFiltersPanel.module.css";

/**
 * Advanced filters in a panel (desktop right sheet / mobile bottom sheet) with a live "See N homes"
 * count. Edits a draft of just the panel's param keys; previews against the full current params so
 * the count reflects viewport + primary filters too; applies the draft as a patch.
 */
export function MoreFiltersPanel({
  filters,
  params,
  open,
  total,
  onClose,
  onApply,
  title = "More filters",
}: {
  filters: FilterConfig[];
  params: SearchParams;
  open: boolean;
  total: number;
  onClose: () => void;
  onApply: (patch: SearchParams) => void;
  title?: string;
}) {
  const [draft, setDraft] = useState<SearchParams>({});
  const [preview, setPreview] = useState<number>(total);

  // Seed the draft from current params each time the panel opens.
  useEffect(() => {
    if (open) {
      setDraft(pickKeys(params, filters));
      setPreview(total);
    }
  }, [open, params, filters, total]);

  // Live count preview as the user toggles (debounced count-only fetch reusing /api/search).
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams(serializeSearchQuery({ ...params, ...draft })).toString();
        const res = await fetch(`/api/search?${qs}`, { signal: ctrl.signal });
        const data: { total?: number } = await res.json();
        setPreview(data.total ?? 0);
      } catch {
        /* aborted / network — keep the last preview */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [draft, open, params]);

  if (!open) return null;
  const view: SearchParams = { ...params, ...draft };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className={styles.scrim} aria-label="Close filters" onClick={onClose} />
      <div className={styles.sheet}>
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.x} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className={styles.body}>
          {filters.map((f) => (
            <section key={f.key} className={styles.row}>
              <h3 className={styles.rowLabel}>{f.label}</h3>
              <FilterControl
                config={f}
                value={view}
                onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              />
            </section>
          ))}
        </div>
        <footer className={styles.foot}>
          <button
            type="button"
            className={styles.reset}
            onClick={() => setDraft(clearKeysPatch(filters))}
          >
            Reset
          </button>
          <button
            type="button"
            className={styles.apply}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            See {preview} {preview === 1 ? "home" : "homes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
