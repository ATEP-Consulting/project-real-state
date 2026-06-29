// Mirrors the motion tokens in docs/visual-direction.md / tokens.css, for framer-motion (JS).
export const DURATION = { fast: 0.2, base: 0.3, reveal: 0.5 } as const;

// cubic-bezier(.4, 0, .2, 1) — matches --ease-standard.
export const EASE = [0.4, 0, 0.2, 1] as const;

// Subtle on-scroll translate distance (px).
export const REVEAL_OFFSET = 14;
