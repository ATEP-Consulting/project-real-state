import dynamic from "next/dynamic";
import type { GetStaticPaths, GetStaticProps } from "next";
import { getListingBySlug, getPublishedListingSlugs, getSimilarListings } from "@herrera/db";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { ListingTopBar } from "@/components/listing/ListingTopBar";
import { Gallery } from "@/components/listing/Gallery";
import { IconFacts } from "@/components/listing/IconFacts";
import { MortgageCalculator } from "@/components/listing/MortgageCalculator";
import { InquiryForm } from "@/components/listing/InquiryForm";
import { SellCta } from "@/components/listing/SellCta";
import { SimilarListings } from "@/components/listing/SimilarListings";
import { ListingCompliance } from "@/components/listing/ListingCompliance";
import { toListingDetailVM, toListingJsonLd, type ListingDetailVM } from "@/lib/listing-detail";
import { Seo } from "@/components/seo/Seo";
import { absoluteUrl } from "@/lib/seo";
import { toListingCardVM, type ListingCardVM } from "@/lib/listing";
import { MAP_STYLE_URL } from "@/lib/map-style";
import styles from "@/components/listing/ListingDetail.module.css";

// Client-only (touches `window`) — never server-rendered, like D2's search map.
const LocationMap = dynamic(
  () => import("@/components/listing/LocationMap").then((m) => m.LocationMap),
  { ssr: false },
);

type DetailProps = {
  vm: ListingDetailVM;
  similar: ListingCardVM[];
  jsonLd: object;
  canonicalPath: string;
};

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: { params: { slug: string } }[] = [];
  try {
    const slugs = await getPublishedListingSlugs();
    paths = slugs.map((slug) => ({ params: { slug } }));
  } catch (e) {
    console.warn("[homes] paths unavailable:", (e as Error).message);
  }
  // Off-market/private-link + future MLS rows render on demand.
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<DetailProps> = async (ctx) => {
  const slug = String(ctx.params?.slug ?? "");
  try {
    const listing = await getListingBySlug(slug);
    if (!listing) return { notFound: true, revalidate: 300 };
    // Visibility gate (ADR-005/011): public + private-link render; registered is not public in v1.
    if (listing.visibility !== "public" && listing.visibility !== "private_link") {
      return { notFound: true, revalidate: 300 };
    }
    const vm = toListingDetailVM(listing);
    const canonicalPath = `/homes/${slug}`;
    const similarRows = await getSimilarListings({
      slug,
      city: listing.city,
      price: listing.price,
    });
    return {
      props: {
        vm,
        similar: similarRows.map(toListingCardVM),
        jsonLd: toListingJsonLd(vm, absoluteUrl(canonicalPath)),
        canonicalPath,
      },
      revalidate: 300,
    };
  } catch (e) {
    // No DB at build / transient: 404 now, ISR retries soon (keeps the build green).
    console.warn("[homes] props unavailable:", (e as Error).message);
    return { notFound: true, revalidate: 30 };
  }
};

export default function ListingDetailPage({ vm, similar, jsonLd, canonicalPath }: DetailProps) {
  return (
    <SiteLayout>
      <Seo
        title={`${vm.title}, ${vm.cityLine} — Herrera`}
        description={`${vm.priceLabel} · ${vm.propertyTypeLabel} at ${vm.title}, ${vm.cityLine}.`}
        path={canonicalPath}
        jsonLd={jsonLd}
      />

      <Container>
        <ListingTopBar title={vm.title} />
        <Gallery gallery={vm.gallery} video={vm.video} virtualTourUrl={vm.virtualTourUrl} />

        <div className={styles.layout}>
          <div className={styles.main}>
            <header className={styles.head}>
              <div className={styles.headMain}>
                <span className={styles.badge}>{vm.statusLabel}</span>
                <h1 className={styles.title}>{vm.title}</h1>
                <p className={styles.cityLine}>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path
                      d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
                      fill="currentColor"
                    />
                  </svg>
                  {vm.cityLine}
                </p>
              </div>
              <div className={styles.headPrice}>
                <p className={styles.price}>{vm.priceLabel}</p>
                {vm.pricePerSqftLabel && <p className={styles.perSqft}>{vm.pricePerSqftLabel}</p>}
              </div>
            </header>

            <IconFacts beds={vm.beds} baths={vm.baths} sqft={vm.sqft} yearBuilt={vm.yearBuilt} />

            {vm.description && (
              <section className={styles.section}>
                <h2 className={styles.h2}>About this home</h2>
                <p className={styles.body}>{vm.description}</p>
              </section>
            )}

            {vm.features.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.h2}>Features</h2>
                <ul className={styles.features}>
                  {vm.features.map((f) => (
                    <li key={f} className={styles.feature}>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* D5 SEAM: Florida cost-of-ownership panel (FEMA flood / insurance / HOA / CDD →
                monthly cost) mounts here — built in D5 on real MLS numbers. Not in D4. */}

            {vm.location && (
              <section className={styles.section}>
                <h2 className={styles.h2}>Location</h2>
                <LocationMap lng={vm.location.lng} lat={vm.location.lat} styleUrl={MAP_STYLE_URL} />
              </section>
            )}

            <MortgageCalculator price={vm.price} />

            <ListingCompliance
              compliance={vm.compliance}
              source={vm.compliance.isMls ? "mls" : "demo"}
            />
          </div>

          <aside className={styles.aside}>
            <InquiryForm slug={vm.slug} title={vm.title} />
            <SellCta city={vm.cityLine.split(",")[0] ?? vm.cityLine} />
          </aside>
        </div>

        <SimilarListings listings={similar} />
      </Container>
    </SiteLayout>
  );
}
