import type { ReactNode } from "react";
import styles from "./IconFacts.module.css";

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M3 18v-9M21 18v-2M3 13h18M7 11V9a1 1 0 0 1 1-1h3v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BathIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M4 12h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2ZM6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2M7 20l-1 1M18 20l1 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function AreaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M4 4h16v16H4zM4 9h3M4 14h3M9 4v3M14 4v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function YearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Fact({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export function IconFacts({
  beds,
  baths,
  sqft,
  yearBuilt,
}: {
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
}) {
  return (
    <div className={styles.strip}>
      <Fact icon={<BedIcon />} value={beds == null ? "—" : String(beds)} label="Beds" />
      <Fact icon={<BathIcon />} value={baths == null ? "—" : String(baths)} label="Baths" />
      <Fact
        icon={<AreaIcon />}
        value={sqft == null ? "—" : sqft.toLocaleString("en-US")}
        label="Sq ft"
      />
      <Fact
        icon={<YearIcon />}
        value={yearBuilt == null ? "—" : String(yearBuilt)}
        label="Year built"
      />
    </div>
  );
}
