import Link from "next/link";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useTranslation } from "@/lib/i18n";
import styles from "./FavoritesNavButton.module.css";

export function FavoritesNavButton() {
  const { m } = useTranslation();
  const { count, ready } = useFavorites();
  const showCount = ready && count > 0;
  const ariaLabel = showCount
    ? m.favorites.navAriaWithCount.replace("{count}", String(count))
    : m.favorites.navAriaEmpty;
  return (
    <Link
      href="/favorites"
      className={styles.link}
      aria-label={ariaLabel}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 20.7 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13L12 20.7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      {showCount && <span className={styles.badge}>{count}</span>}
    </Link>
  );
}
