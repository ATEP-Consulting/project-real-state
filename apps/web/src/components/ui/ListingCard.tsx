import Link from "next/link";
import type { ListingCardVM } from "@/lib/listing";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import styles from "./ListingCard.module.css";

function PinIcon() {
  return (
    <svg className={styles.pin} viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
        {listing.isNew && <span className={styles.badge}>NEW</span>}
        <FavoriteButton slug={listing.slug} />
      </div>
      <div className={styles.body}>
        <p className={styles.price}>{listing.priceLabel}</p>
        {meta.length > 0 && <p className={styles.meta}>{meta.join(" · ")}</p>}
        <p className={styles.title}>{listing.address}</p>
        <p className={styles.loc}>
          <PinIcon />
          {listing.cityLine}
        </p>
      </div>
    </Link>
  );
}
