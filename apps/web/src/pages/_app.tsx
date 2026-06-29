import type { AppProps } from "next/app";
import { Spectral, Hanken_Grotesk } from "next/font/google";
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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <PageTransition>
        <Component {...pageProps} />
      </PageTransition>
    </div>
  );
}
