import Link from "next/link";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./ListingCard.module.css";

export function ListingCard({ listing }: { listing: ListingCardVM }) {
  const meta = [listing.bedsLabel, listing.bathsLabel, listing.sqftLabel].filter(Boolean);
  return (
    <Link href={listing.href} className={styles.card}>
      <div className={styles.media}>
        {listing.photo ? (
          // next/image upgrade is D14 (image CDN). Plain <img> is host-agnostic.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photo} alt={listing.photoAlt} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
        <span className={styles.type}>{listing.propertyTypeLabel}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.price}>{listing.priceLabel}</p>
        <p className={styles.address}>{listing.address}</p>
        <p className={styles.city}>{listing.cityLine}</p>
        {meta.length > 0 && (
          <ul className={styles.meta}>
            {meta.map((m) => (
              <li key={m} className={styles.metaItem}>
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
