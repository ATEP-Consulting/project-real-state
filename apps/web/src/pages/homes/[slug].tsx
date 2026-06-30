import Head from "next/head";
import dynamic from "next/dynamic";
import type { GetStaticPaths, GetStaticProps } from "next";
import { getListingBySlug, getPublishedListingSlugs, getSimilarListings } from "@herrera/db";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { KeyFacts } from "@/components/listing/KeyFacts";
import { PhotoGallery } from "@/components/listing/PhotoGallery";
import { MortgageCalculator } from "@/components/listing/MortgageCalculator";
import { InquiryForm } from "@/components/listing/InquiryForm";
import { SimilarListings } from "@/components/listing/SimilarListings";
import { ListingCompliance } from "@/components/listing/ListingCompliance";
import { toListingDetailVM, toListingJsonLd, type ListingDetailVM } from "@/lib/listing-detail";
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
        jsonLd: toListingJsonLd(vm, `https://herrera.example${canonicalPath}`),
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
      <Head>
        <title>{`${vm.title}, ${vm.cityLine} — Herrera`}</title>
        <meta
          name="description"
          content={`${vm.priceLabel} · ${vm.propertyTypeLabel} at ${vm.title}, ${vm.cityLine}.`}
        />
        <link rel="canonical" href={`https://herrera.example${canonicalPath}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <Container>
        <div className={styles.layout}>
          <div className={styles.main}>
            <PhotoGallery
              gallery={vm.gallery}
              video={vm.video}
              virtualTourUrl={vm.virtualTourUrl}
            />
            <header className={styles.head}>
              <p className={styles.price}>{vm.priceLabel}</p>
              <h1 className={styles.title}>{vm.title}</h1>
              <p className={styles.cityLine}>{vm.cityLine}</p>
            </header>

            <KeyFacts facts={vm.keyFacts} />

            {vm.features.length > 0 && (
              <ul className={styles.features}>
                {vm.features.map((f) => (
                  <li key={f} className={styles.feature}>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {vm.description && (
              <section className={styles.section}>
                <h2 className={styles.h2}>About this home</h2>
                <p className={styles.body}>{vm.description}</p>
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
          </aside>
        </div>

        <SimilarListings listings={similar} />
      </Container>
    </SiteLayout>
  );
}
