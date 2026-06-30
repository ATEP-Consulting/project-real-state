import styles from "./StatusBadge.module.css";

export const STATUS_ORDER = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "closed",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  appointment: "Appointment",
  offer: "Offer",
  closed: "Closed",
  lost: "Lost",
};

const INTENT_LABEL: Record<string, string> = { buy: "Buy", sell: "Sell", rent: "Rent" };

export function StatusBadge({ kind, value }: { kind: "status" | "intent"; value: string }) {
  const label = kind === "status" ? (STATUS_LABEL[value] ?? value) : (INTENT_LABEL[value] ?? value);
  return <span className={`${styles.badge} ${styles[`s_${value}`] ?? ""}`}>{label}</span>;
}
