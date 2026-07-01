import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import { useTranslation } from "@/lib/i18n";
import styles from "./SearchResults.module.css";

export function SearchResults({
  cards,
  total,
  loading,
  hoveredSlug,
  onHover,
  filtered = false,
  wide = false,
}: {
  cards: ListingCardVM[];
  total: number;
  loading: boolean;
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
  filtered?: boolean;
  wide?: boolean;
}) {
  const { m } = useTranslation();
  const noun = total === 1 ? m.search.seeHome : m.search.seeHomes;
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <p className={styles.count}>
          {loading
            ? m.search.searching
            : `${total} ${noun}${filtered ? "" : ` ${m.search.inThisArea}`}`}
        </p>
      </div>
      {cards.length === 0 && !loading ? (
        <p className={styles.empty}>{m.search.noResults}</p>
      ) : (
        <ul className={`${styles.list} ${wide ? styles.listWide : ""}`}>
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
