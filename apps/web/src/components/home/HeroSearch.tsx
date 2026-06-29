import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import styles from "./HeroSearch.module.css";

type Intent = "buy" | "rent" | "sell";

const TABS: { id: Intent; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "rent", label: "Rent" },
];

const TYPES = [
  { value: "", label: "Type" },
  { value: "single_family", label: "Single-family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
];

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
  const [intent, setIntent] = useState<Intent>("buy");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  // D2/D3/D7 refine this; for now the controls just shape the /search query string.
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ intent });
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    void router.push(`/search?${params.toString()}`);
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} role="search">
      <div className={styles.tabs} role="tablist" aria-label="Search intent">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={intent === t.id}
            className={`${styles.tab} ${intent === t.id ? styles.tabActive : ""}`}
            onClick={() => setIntent(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <span className={styles.searchIcon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          className={styles.input}
          type="search"
          aria-label="Where do you want to live?"
          placeholder="Where do you want to live?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className={styles.divider} aria-hidden="true" />
        <select
          className={styles.type}
          aria-label="Property type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.submit}>
          Search
        </button>
      </div>
    </form>
  );
}
