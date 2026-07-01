import type { AppProps } from "next/app";
import Head from "next/head";
import { Spectral, Hanken_Grotesk } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { LeadCaptureProvider } from "@/components/lead/LeadCaptureProvider";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import "@/styles/globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const serif = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// ADR-003 demo posture — noindex + marker, keyed off NEXT_PUBLIC_DEMO_MODE.
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      {isDemo && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}
      <LeadCaptureProvider>
        <FavoritesProvider>
          {/* EXPERIMENT: PageTransition temporarily disabled to isolate the client-nav
              FOUC (whole-page unstyled ~500ms on navigation). If the flash disappears in
              production with this off, framer-motion's AnimatePresence wrapper was
              desyncing Next's route-CSS swap. Re-enable by restoring <PageTransition>. */}
          <Component {...pageProps} />
        </FavoritesProvider>
      </LeadCaptureProvider>
      {isDemo && <DemoBanner />}
    </div>
  );
}
