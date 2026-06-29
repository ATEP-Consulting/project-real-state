import Link from "next/link";
import type { MouseEvent } from "react";
import type { ListingCardVM } from "@/lib/listing";
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 20.7 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13L12 20.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ListingCard({ listing }: { listing: ListingCardVM }) {
  const meta = [listing.bedsLabel, listing.bathsLabel, listing.sqftLabel].filter(Boolean);
  // Login-less favorites are wired in D9; here the heart is presentational only.
  const onFav = (e: MouseEvent) => e.preventDefault();
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
        <button type="button" className={styles.fav} aria-label="Save listing" onClick={onFav}>
          <HeartIcon />
        </button>
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
