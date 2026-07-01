import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import { useTranslation } from "@/lib/i18n";
import styles from "./SimilarListings.module.css";

export function SimilarListings({ listings }: { listings: ListingCardVM[] }) {
  const { m } = useTranslation();
  if (listings.length === 0) return null;
  return (
    <section className={styles.section} aria-label={m.listing.similarAriaLabel}>
      <h2 className={styles.h2}>{m.listing.similarTitle}</h2>
      <div className={styles.grid}>
        {listings.map((l) => (
          <ListingCard key={l.slug} listing={l} />
        ))}
      </div>
    </section>
  );
}
