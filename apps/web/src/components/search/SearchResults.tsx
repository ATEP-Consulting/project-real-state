import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./SearchResults.module.css";

export function SearchResults({
  cards,
  total,
  loading,
  hoveredSlug,
  onHover,
}: {
  cards: ListingCardVM[];
  total: number;
  loading: boolean;
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <p className={styles.count}>
          {loading ? "Searching…" : `${total} ${total === 1 ? "home" : "homes"} in this area`}
        </p>
      </div>
      {cards.length === 0 && !loading ? (
        <p className={styles.empty}>
          No homes in this area. Pan or zoom out, or clear the drawn zone.
        </p>
      ) : (
        <ul className={styles.list}>
          {cards.map((c) => (
            <li
              key={c.slug}
              className={`${styles.item} ${hoveredSlug === c.slug ? styles.active : ""}`}
              onMouseEnter={() => onHover(c.slug)}
              onMouseLeave={() => onHover(null)}
            >
              <ListingCard listing={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
