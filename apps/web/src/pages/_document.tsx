import { Html, Head, Main, NextScript, type DocumentProps } from "next/document";

export default function Document(props: DocumentProps) {
  // Next injects the active locale into __NEXT_DATA__ when i18n routing is on.
  const lang = props.__NEXT_DATA__.locale ?? "en";
  return (
<<<<<<< HEAD
    <Html lang="en">
      <Head>
        {/* NH monogram favicon — SVG for modern browsers, PNG fallbacks. */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>
=======
    <Html lang={lang}>
      <Head />
>>>>>>> feat/d13-i18n
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
