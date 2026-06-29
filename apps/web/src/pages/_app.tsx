import type { AppProps } from "next/app";
import Head from "next/head";
import { Spectral, Hanken_Grotesk } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { PageTransition } from "@/components/motion/PageTransition";
import "@/styles/globals.css";

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
      <PageTransition>
        <Component {...pageProps} />
      </PageTransition>
      {isDemo && <DemoBanner />}
    </div>
  );
}
