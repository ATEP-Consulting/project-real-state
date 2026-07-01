import type { MouseEvent } from "react";
import { useFavorites } from "./FavoritesProvider";
import { useTranslation } from "@/lib/i18n";
import styles from "./FavoriteButton.module.css";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 20.7 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13L12 20.7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function FavoriteButton({
  slug,
  variant = "card",
}: {
  slug: string;
  variant?: "card" | "bar";
}) {
  const { m } = useTranslation();
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(slug);
  const onClick = (e: MouseEvent) => {
    e.preventDefault(); // the card is a <Link> — don't navigate
    e.stopPropagation();
    toggle(slug);
  };
  const label = saved ? m.favorites.buttonRemoveLabel : m.favorites.buttonSaveLabel;

  if (variant === "bar") {
    return (
      <button
        type="button"
        className={`${styles.bar} ${saved ? styles.barSaved : ""}`}
        aria-pressed={saved}
        aria-label={label}
        onClick={onClick}
      >
        <Heart filled={saved} /> {saved ? m.favorites.buttonSaved : m.favorites.buttonSave}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`${styles.card} ${saved ? styles.cardSaved : ""}`}
      aria-pressed={saved}
      aria-label={label}
      onClick={onClick}
    >
      <Heart filled={saved} />
    </button>
  );
}
