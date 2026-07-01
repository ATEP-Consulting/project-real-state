import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import { favoritesCaptureCopy } from "@/lib/favorites";
import {
  EMPTY_FAVORITES,
  FAVORITES_KEY,
  isFavorite as isFav,
  markCaptured,
  markPromptSeen,
  parseFavorites,
  pruneFavorites,
  removeFavorite,
  serializeFavorites,
  shouldPromptCapture,
  toggleFavorite,
  type FavoritesState,
} from "@/lib/favorites-store";

// Let the heart render "saved ✓" before the capture popup opens, so it never feels like the
// popup hijacks the save (D9 Refinement 1).
const PROMPT_DELAY_MS = 450;

type Ctx = {
  slugs: string[];
  count: number;
  ready: boolean; // true after localStorage hydration (SSR renders empty)
  captured: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  prune: (liveSlugs: string[]) => void;
  openFavoritesCapture: () => void;
};

const FavoritesContext = createContext<Ctx | null>(null);

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { openCapture } = useLeadCapture();
  const [state, setState] = useState<FavoritesState>(EMPTY_FAVORITES);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);

  // Write-through: update memory, the ref (so event handlers read the latest), and storage.
  const commit = useCallback((next: FavoritesState) => {
    stateRef.current = next;
    setState(next);
    try {
      window.localStorage.setItem(FAVORITES_KEY, serializeFavorites(next));
    } catch {
      /* private mode / storage disabled — favorites are best-effort */
    }
  }, []);

  // Hydrate AFTER mount (SSR + first client render stay empty ⇒ no hydration mismatch).
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(FAVORITES_KEY);
    } catch {
      /* private mode / storage disabled — start empty */
    }
    const initial = parseFavorites(raw);
    stateRef.current = initial;
    setState(initial);
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FAVORITES_KEY) return;
      const next = parseFavorites(e.newValue);
      stateRef.current = next;
      setState(next); // cross-tab sync (does NOT re-fire the capture)
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markCapturedNow = useCallback(() => commit(markCaptured(stateRef.current)), [commit]);

  const openFavoritesCapture = useCallback(() => {
    const s = stateRef.current;
    openCapture("buy", {
      contactOnly: true,
      source: "favorites",
      viewedListingIds: s.slugs,
      copy: favoritesCaptureCopy(s.slugs.length),
      onSubmitted: markCapturedNow,
    });
  }, [openCapture, markCapturedNow]);

  const toggle = useCallback(
    (slug: string) => {
      const prev = stateRef.current;
      const { state: base, added } = toggleFavorite(prev, slug);
      const doPrompt = shouldPromptCapture({
        added,
        promptSeen: prev.promptSeen,
        captured: prev.captured,
      });
      const next = doPrompt ? markPromptSeen(base) : base;
      commit(next); // heart flips to saved NOW
      if (doPrompt) {
        window.setTimeout(() => {
          openCapture("buy", {
            contactOnly: true,
            source: "favorites",
            viewedListingIds: next.slugs,
            copy: favoritesCaptureCopy(1), // first save ⇒ "this home"
            onSubmitted: markCapturedNow,
          });
        }, PROMPT_DELAY_MS);
      }
    },
    [commit, openCapture, markCapturedNow],
  );

  const remove = useCallback((slug: string) => commit(removeFavorite(stateRef.current, slug)), [commit]);
  const prune = useCallback((live: string[]) => commit(pruneFavorites(stateRef.current, live)), [commit]);

  const value = useMemo<Ctx>(
    () => ({
      slugs: state.slugs,
      count: state.slugs.length,
      ready,
      captured: state.captured,
      isFavorite: (slug) => isFav(state, slug),
      toggle,
      remove,
      prune,
      openFavoritesCapture,
    }),
    [state, ready, toggle, remove, prune, openFavoritesCapture],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
