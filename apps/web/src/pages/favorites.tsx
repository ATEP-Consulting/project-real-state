import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingCard } from "@/components/ui/ListingCard";
import { FavoritesNudge } from "@/components/favorites/FavoritesNudge";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./Favorites.module.css";

// Same editorial hero language as /about · /contact · /guides — a scrimmed photo
// under the transparent header. Forest fallback if the photo is slow/unavailable.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=68&auto=format&fit=crop";

// Same outlined heart as the save control, reused for the empty state.
function HeartGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M12 20.7 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13L12 20.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function FavoritesPage() {
  const { slugs, count, ready, prune } = useFavorites();
  // null = loading, [] = none (empty state), else the fetched cards in saved order.
  const [listings, setListings] = useState<ListingCardVM[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (slugs.length === 0) {
      setError(false);
      setListings([]);
      return;
    }
    let alive = true;
    setError(false);
    setListings(null);
    fetch("/api/listings/by-slugs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { listings: ListingCardVM[] }) => {
        if (!alive) return;
        // Preserve the visitor's most-recent-first order; drop slugs the DB no longer returns.
        const bySlug = new Map(d.listings.map((l) => [l.slug, l]));
        const ordered = slugs
          .map((s) => bySlug.get(s))
          .filter((l): l is ListingCardVM => Boolean(l));
        setListings(ordered);
        if (d.listings.length !== slugs.length) prune(d.listings.map((l) => l.slug));
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [ready, slugs, prune]);

  const lede =
    ready && count > 0
      ? `${count} ${count === 1 ? "home" : "homes"} saved on this device — come back any time, no account needed.`
      : "The Florida homes you save live here, ready when you are. No account — they stay on this device.";

  return (
    <SiteLayout transparentHeader>
      <Head>
        {/* A personal shortlist — keep it out of the index regardless of demo mode. */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Seo
        title="Saved homes · Nilyan Herrera"
        description="The Florida homes you've saved. Login-less — saved on this device."
        path="/favorites"
      />

      <PageHero image={HERO_IMAGE} eyebrow="Your shortlist" title="Saved homes" lede={lede} />

      <section className={styles.body}>
        <Container>
          {error ? (
            <Reveal>
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <HeartGlyph />
                </span>
                <h2 className={styles.emptyTitle}>We couldn&rsquo;t load your saved homes</h2>
                <p className={styles.emptyText}>
                  Your shortlist is safe on this device. Please refresh to try again.
                </p>
                <div className={styles.emptyActions}>
                  <button
                    type="button"
                    className={styles.retry}
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </Reveal>
          ) : listings === null ? (
            <div className={styles.grid} aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className={styles.cardSkeleton} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Reveal>
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <HeartGlyph />
                </span>
                <h2 className={styles.emptyTitle}>Your shortlist is empty</h2>
                <p className={styles.emptyText}>
                  Tap the heart on any home to keep it here. Nilyan can then alert you to price drops
                  and new listings that match.
                </p>
                <Link href="/search" className={styles.emptyCta}>
                  Browse listings
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className={styles.grid}>
              {listings.map((l, i) => (
                // Staggered cascade — same easing/rhythm as the home Featured strip.
                <Reveal key={l.slug} delay={Math.min(i, 5) * 0.06}>
                  <ListingCard listing={l} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>

      <FavoritesNudge />
    </SiteLayout>
  );
}
