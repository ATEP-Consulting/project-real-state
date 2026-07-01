import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingCard } from "@/components/ui/ListingCard";
import { FavoritesNudge } from "@/components/favorites/FavoritesNudge";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./Favorites.module.css";

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

  return (
    <SiteLayout>
      <Head>
        {/* A personal shortlist — keep it out of the index regardless of demo mode. */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Seo
        title="Saved homes · Nilyan Herrera"
        description="The Florida homes you've saved. Login-less — saved on this device."
        path="/favorites"
      />
      <section className={styles.head}>
        <Container>
          <Eyebrow>Your shortlist</Eyebrow>
          <h1 className={styles.title}>Saved homes</h1>
          <p className={styles.sub}>
            Saved on this device{count > 0 ? ` · ${count} ${count === 1 ? "home" : "homes"}` : ""}. No
            account needed.
          </p>
        </Container>
      </section>

      <FavoritesNudge />

      <section className={styles.body}>
        <Container>
          {error ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Couldn&rsquo;t load your saved homes</p>
              <p className={styles.emptyText}>Please refresh the page to try again — your saved homes are safe on this device.</p>
            </div>
          ) : listings === null ? (
            <div className={styles.grid}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className={styles.cardSkeleton} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No saved homes yet</p>
              <p className={styles.emptyText}>Tap the heart on any listing to save it here.</p>
              <Link href="/search" className={styles.emptyCta}>
                Browse listings →
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {listings.map((l) => (
                <ListingCard key={l.slug} listing={l} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
}
