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

          {listings.length > 0 ? (
            <div className={styles.grid}>
              {listings.map((l) => (
                <ListingCard key={l.slug} listing={l} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Listings are loading — please check back shortly.</p>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
