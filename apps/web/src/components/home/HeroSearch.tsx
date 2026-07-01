import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/lib/i18n";
import styles from "./HeroSearch.module.css";

// Enum values only — labels are resolved via m.propertyTypes at render time
const TYPE_VALUES = [
  "single_family",
  "condo",
  "townhouse",
  "villa",
  "land",
] as const;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M10 4a6 6 0 1 0 3.9 10.6l4.2 4.2 1.4-1.4-4.2-4.2A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const { m } = useTranslation();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  // The hero's Buy/Sell/Rent capture buttons now own intent; this card is the
  // "explore listings yourself" path → /search by location + property type.
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    const qs = params.toString();
    void router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} role="search">
      <div className={styles.row}>
        <span className={styles.searchIcon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          className={styles.input}
          type="search"
          aria-label={m.home.heroSearchPlaceholder}
          placeholder={m.home.heroSearchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className={styles.divider} aria-hidden="true" />
        <Select
          variant="bare"
          aria-label={m.home.heroSearchTypeAria}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">{m.home.heroSearchTypeDefault}</option>
          {TYPE_VALUES.map((v) => (
            <option key={v} value={v}>
              {m.propertyTypes[v]}
            </option>
          ))}
        </Select>
        <button type="submit" className={styles.submit}>
          {m.home.heroSearchButton}
        </button>
      </div>
    </form>
  );
}
