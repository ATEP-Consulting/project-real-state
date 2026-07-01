import { PROPERTY_TYPES, type PropertyType, type SearchParams } from "@/lib/search-params";
import { minKeyFor, type FilterConfig } from "@/lib/filters";
import { useTranslation } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/config";
import styles from "./FilterControl.module.css";

/**
 * Renders the right control for one filter, reading from `value` and emitting a `patch` (only the
 * keys it owns; `undefined` clears a key). The parent decides whether a patch applies immediately
 * (pills) or buffers into a draft (price range — see FilterBar).
 */
export function FilterControl({
  config,
  value,
  onChange,
}: {
  config: FilterConfig;
  value: SearchParams;
  onChange: (patch: SearchParams) => void;
}) {
  const { m, locale } = useTranslation();
  const label = pickLocalized(config.label, config.labelEs, locale);

  if (config.control === "range") {
    return (
      <div className={styles.range}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{m.search.priceMin}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={25000}
            placeholder={m.search.priceNoMin}
            value={value.minPrice ?? ""}
            onChange={(e) =>
              onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </label>
        <span className={styles.dash} aria-hidden>
          –
        </span>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{m.search.priceMax}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={25000}
            placeholder={m.search.priceNoMax}
            value={value.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </label>
      </div>
    );
  }

  if (config.control === "min_select") {
    const key = minKeyFor(config.key);
    if (!key) return null;
    const current = value[key];
    return (
      <div className={styles.seg} role="group" aria-label={label}>
        {[undefined, ...config.options].map((opt) => {
          const v = opt ? Number(opt.value) : undefined;
          const selected = current === v;
          return (
            <button
              type="button"
              key={opt?.value ?? "any"}
              aria-pressed={selected}
              className={`${styles.segBtn} ${selected ? styles.segOn : ""}`}
              onClick={() => {
                const patch: SearchParams = {};
                patch[key] = v;
                onChange(patch);
              }}
            >
              {opt ? pickLocalized(opt.label, opt.labelEs, locale) : m.search.any}
            </button>
          );
        })}
      </div>
    );
  }

  if (config.control === "enum_select") {
    const selected = new Set<PropertyType>(value.types ?? []);
    return (
      <div className={styles.checks} role="group" aria-label={label}>
        {config.options.map((opt) => {
          const val = opt.value as PropertyType;
          if (!(PROPERTY_TYPES as readonly string[]).includes(val)) return null;
          const on = selected.has(val);
          return (
            <label key={opt.value} className={styles.check}>
              <input
                type="checkbox"
                checked={on}
                onChange={() => {
                  const next = new Set(selected);
                  if (on) next.delete(val);
                  else next.add(val);
                  onChange({ types: next.size ? [...next] : undefined });
                }}
              />
              <span>{pickLocalized(opt.label, opt.labelEs, locale)}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // boolean
  const bkey = config.key as "waterfront" | "pool" | "age55" | "noHoa";
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={value[bkey] === true}
        onChange={(e) => {
          const patch: SearchParams = {};
          patch[bkey] = e.target.checked ? true : undefined;
          onChange(patch);
        }}
      />
      <span>{label}</span>
    </label>
  );
}
