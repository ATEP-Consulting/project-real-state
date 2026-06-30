import { useState } from "react";
import Link from "next/link";
import styles from "./ListingTopBar.module.css";

export function ListingTopBar({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
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
        <span aria-hidden>‹</span> Back to results
      </Link>
      <span className={styles.crumb}>{title}</span>
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={onShare}>
          {copied ? "Link copied" : "Share"}
        </button>
        {/* Login-less favorites land in D9; here Save is presentational. */}
        <button
          type="button"
          className={`${styles.action} ${saved ? styles.saved : ""}`}
          aria-pressed={saved}
          onClick={() => setSaved((s) => !s)}
        >
          <span aria-hidden>{saved ? "♥" : "♡"}</span> {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
