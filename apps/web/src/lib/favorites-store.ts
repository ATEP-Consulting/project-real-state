// Login-less, browser-stored favorites (D9). Per-BROWSER, not per-person — the accepted
// v1 limitation; Phase 2 passwordless accounts add real cross-device sync. Pure module:
// no DOM/localStorage here so it unit-tests cleanly. FavoritesProvider owns the I/O.

export const FAVORITES_KEY = "herrera:favorites:v1";
export const MAX_FAVORITES = 100;

export type FavoritesState = {
  slugs: string[]; // most-recently-saved first
  promptSeen: boolean; // the first-save capture popup has fired once (never re-nag)
  captured: boolean; // the visitor submitted the favorites lead (hide the nudge)
};

export const EMPTY_FAVORITES: FavoritesState = { slugs: [], promptSeen: false, captured: false };

/** Tolerant parse of the persisted blob — any malformed value falls back to empty. */
export function parseFavorites(raw: string | null): FavoritesState {
  if (!raw) return EMPTY_FAVORITES;
  try {
    const v = JSON.parse(raw) as Partial<FavoritesState>;
    const slugs = Array.isArray(v.slugs)
      ? v.slugs.filter((s): s is string => typeof s === "string").slice(0, MAX_FAVORITES)
      : [];
    return { slugs, promptSeen: v.promptSeen === true, captured: v.captured === true };
  } catch {
    return EMPTY_FAVORITES;
  }
}

export function serializeFavorites(s: FavoritesState): string {
  return JSON.stringify(s);
}

export function isFavorite(s: FavoritesState, slug: string): boolean {
  return s.slugs.includes(slug);
}

/** Add to the front (most-recent first), dedupe, cap at MAX_FAVORITES. */
export function addFavorite(s: FavoritesState, slug: string): FavoritesState {
  if (s.slugs.includes(slug)) return s;
  return { ...s, slugs: [slug, ...s.slugs].slice(0, MAX_FAVORITES) };
}

export function removeFavorite(s: FavoritesState, slug: string): FavoritesState {
  if (!s.slugs.includes(slug)) return s;
  return { ...s, slugs: s.slugs.filter((x) => x !== slug) };
}

/** Toggle; report whether this was an add (drives the first-save prompt). */
export function toggleFavorite(
  s: FavoritesState,
  slug: string,
): { state: FavoritesState; added: boolean } {
  if (s.slugs.includes(slug)) return { state: removeFavorite(s, slug), added: false };
  return { state: addFavorite(s, slug), added: true };
}

export function markPromptSeen(s: FavoritesState): FavoritesState {
  return s.promptSeen ? s : { ...s, promptSeen: true };
}

export function markCaptured(s: FavoritesState): FavoritesState {
  return s.captured ? s : { ...s, captured: true };
}

/** Fire the capture popup once, on the first save, and never again (or after capture). */
export function shouldPromptCapture(args: {
  added: boolean;
  promptSeen: boolean;
  captured: boolean;
}): boolean {
  return args.added && !args.promptSeen && !args.captured;
}

/** Drop slugs the DB no longer returns as public (off-market/deleted) — keeps storage clean. */
export function pruneFavorites(s: FavoritesState, liveSlugs: string[]): FavoritesState {
  const live = new Set(liveSlugs);
  const slugs = s.slugs.filter((x) => live.has(x));
  return slugs.length === s.slugs.length ? s : { ...s, slugs };
}
