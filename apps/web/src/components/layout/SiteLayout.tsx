import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteLayout({
  children,
  transparentHeader = false,
}: {
  children: ReactNode;
  transparentHeader?: boolean;
}) {
  return (
    <>
      <Header transparentOverHero={transparentHeader} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
