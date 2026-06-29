import Head from "next/head";
import type { GetStaticProps } from "next";
import { getFeaturedListings } from "@herrera/db";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Hero } from "@/components/home/Hero";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { MapPreview } from "@/components/home/MapPreview";
import { ExploreAreas } from "@/components/home/ExploreAreas";
import { CaptureInvite } from "@/components/home/CaptureInvite";
import { Trust } from "@/components/home/Trust";
import { ContactSection } from "@/components/home/ContactSection";
import { toListingCardVM, type ListingCardVM } from "@/lib/listing";

type HomeProps = { featured: ListingCardVM[] };

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let featured: ListingCardVM[] = [];
  try {
    const rows = await getFeaturedListings(8);
    featured = rows.map(toListingCardVM);
  } catch (err) {
    // Resilient: keep the build green without DATABASE_URL; ISR refills after deploy.
    console.warn("[home] featured listings unavailable:", (err as Error).message);
  }
  return { props: { featured }, revalidate: 300 };
};

export default function Home({ featured }: HomeProps) {
  return (
    <SiteLayout transparentHeader>
      <Head>
        <title>Herrera — Find your place in Florida</title>
        <meta
          name="description"
          content="Premium real estate guidance in Florida. Browse listings and buy, sell or rent with confidence."
        />
      </Head>
      <Hero />
      <FeaturedListings listings={featured} />
      <MapPreview />
      <ExploreAreas />
      <CaptureInvite />
      <Trust />
      <ContactSection />
    </SiteLayout>
  );
}
