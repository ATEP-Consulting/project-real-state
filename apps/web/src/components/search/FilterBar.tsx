import { useState } from "react";
import type { SearchParams } from "@/lib/search-params";
import { FILTER_BINDINGS, activeFilterCount, type FilterConfig } from "@/lib/filters";
import { Popover } from "./Popover";
import { FilterControl } from "./FilterControl";
import { MoreFiltersPanel } from "./MoreFiltersPanel";
import styles from "./FilterBar.module.css";

const usd = (n: number) => `$${Math.round(n / 1000)}k`;

/** Pill label reflecting the active value (Idealista-style), or the plain label when unset. */
function pillLabel(config: FilterConfig, p: SearchParams): string {
  if (config.control === "range") {
    const lo = p.minPrice;
    const hi = p.maxPrice;
    if (lo == null && hi == null) return config.label;
    if (lo != null && hi != null) return `${usd(lo)}–${usd(hi)}`;
    if (lo != null) return `${usd(lo)}+`;
    return `Up to ${usd(hi!)}`;
  }
  if (config.control === "min_select") {
    const v = config.key === "baths" ? p.minBaths : p.minBeds;
    return v != null ? `${config.label}: ${v}+` : config.label;
  }
  if (config.control === "enum_select") {
    const n = p.types?.length ?? 0;
    if (!n) return config.label;
    if (n === 1) return config.options.find((o) => o.value === p.types![0])?.label ?? config.label;
    return `${config.label}: ${n}`;
  }
  return config.label;
}

export function FilterBar({
  filters,
  params,
  total,
  onApply,
  onClear,
  layout,
  onLayoutChange,
}: {
  filters: FilterConfig[];
  params: SearchParams;
  total: number;
  onApply: (patch: SearchParams) => void;
  onClear: () => void;
  layout: "split" | "list";
  onLayoutChange: (l: "split" | "list") => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const primary = filters.filter((f) => !f.advanced && FILTER_BINDINGS[f.key]);
  const advanced = filters.filter((f) => f.advanced && FILTER_BINDINGS[f.key]);
  const advActive = activeFilterCount(params, advanced);
  const anyActive = activeFilterCount(params, filters) > 0;

  return (
    <div className={styles.bar}>
      <div className={styles.pills}>
        {primary.map((f) => (
          <Popover
            key={f.key}
            label={pillLabel(f, params)}
            active={FILTER_BINDINGS[f.key]!.isSet(params)}
          >
            {(close) =>
              f.control === "range" ? (
                <RangeEditor
                  config={f}
                  params={params}
                  total={total}
                  onApply={onApply}
                  close={close}
                />
              ) : (
                // pills (beds / baths / type) apply immediately on select
                <FilterControl config={f} value={params} onChange={onApply} />
              )
            }
          </Popover>
        ))}
        {advanced.length ? (
          <button type="button" className={styles.more} onClick={() => setPanelOpen(true)}>
            More filters{advActive ? ` · ${advActive}` : ""}
          </button>
        ) : null}
        {anyActive ? (
          <button type="button" className={styles.clear} onClick={onClear}>
            Clear all
          </button>
        ) : null}
      </div>

      <div className={styles.layout} role="tablist" aria-label="Layout">
        <button
          type="button"
          role="tab"
          aria-selected={layout === "split"}
          className={layout === "split" ? styles.layoutOn : ""}
          onClick={() => onLayoutChange("split")}
        >
          Map
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={layout === "list"}
          className={layout === "list" ? styles.layoutOn : ""}
          onClick={() => onLayoutChange("list")}
        >
          List
        </button>
      </div>

      <MoreFiltersPanel
        filters={advanced}
        params={params}
        open={panelOpen}
        total={total}
        onClose={() => setPanelOpen(false)}
        onApply={onApply}
      />
    </div>
  );
}

// Price range buffers into a draft and applies on the "See N homes" button (no refetch per keystroke).
function RangeEditor({
  config,
  params,
  total,
  onApply,
  close,
}: {
  config: FilterConfig;
  params: SearchParams;
  total: number;
  onApply: (patch: SearchParams) => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState<SearchParams>({
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });
  return (
    <div className={styles.rangeWrap}>
      <FilterControl
        config={config}
        value={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />
      <div className={styles.rangeActions}>
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => {
            onApply({ minPrice: draft.minPrice, maxPrice: draft.maxPrice });
            close();
          }}
        >
          See {total} {total === 1 ? "home" : "homes"}
        </button>
      </div>
    </div>
  );
}
