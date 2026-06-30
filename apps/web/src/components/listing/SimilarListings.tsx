import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./SimilarListings.module.css";

export function SimilarListings({ listings }: { listings: ListingCardVM[] }) {
  if (listings.length === 0) return null;
  return (
    <section className={styles.section} aria-label="Similar homes">
      <h2 className={styles.h2}>Similar homes nearby</h2>
      <div className={styles.grid}>
        {listings.map((l) => (
          <ListingCard key={l.slug} listing={l} />
        ))}
      </div>
    </section>
  );
}
