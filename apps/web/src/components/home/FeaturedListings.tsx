import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./FeaturedListings.module.css";

export function FeaturedListings({ listings }: { listings: ListingCardVM[] }) {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.head}>
            <div>
              <Eyebrow>Featured</Eyebrow>
              <h2 className={styles.title}>Handpicked Florida homes</h2>
            </div>
            <Link href="/search" className={styles.viewAll}>
              View all listings →
            </Link>
          </div>
        </Reveal>

        {listings.length > 0 ? (
          <div className={styles.grid}>
            {listings.map((l, i) => (
              // Staggered cascade: each card eases in just after the previous one.
              // Delay is capped so the last cards don't lag noticeably behind.
              <Reveal key={l.slug} delay={Math.min(i, 5) * 0.06}>
                <ListingCard listing={l} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <p className={styles.empty}>Listings are loading — please check back shortly.</p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
