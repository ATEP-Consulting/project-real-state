import Head from "next/head";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

type Props = {
  title: string;
  description?: string;
  /** Site-relative path for the canonical + og:url (e.g. "/guides/x"). */
  path?: string;
  image?: string | null;
  noindex?: boolean;
  /** One or more schema.org JSON-LD objects. */
  jsonLd?: object | object[];
};

/** Reusable document head: title, description, canonical, OpenGraph/Twitter, JSON-LD. */
export function Seo({ title, description, path, image, noindex, jsonLd }: Props) {
  const canonical = path ? absoluteUrl(path) : undefined;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </Head>
  );
}
