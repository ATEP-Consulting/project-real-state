import { useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { useTranslation } from "@/lib/i18n";
import styles from "./ListingTopBar.module.css";

export function ListingTopBar({ title, slug }: { title: string; slug: string }) {
  const { m } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed / unsupported — no-op */
    }
  }

  return (
    <div className={styles.bar}>
      <Link href="/search" className={styles.back}>
        <span aria-hidden>‹</span> {m.listing.backToResults}
      </Link>
      <span className={styles.crumb}>{title}</span>
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={onShare}>
          {copied ? m.listing.linkCopied : m.listing.share}
        </button>
        <FavoriteButton slug={slug} variant="bar" />
      </div>
    </div>
  );
}
