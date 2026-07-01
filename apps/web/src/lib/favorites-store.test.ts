import { describe, expect, it } from "vitest";
import {
  addFavorite,
  EMPTY_FAVORITES,
  MAX_FAVORITES,
  markCaptured,
  markPromptSeen,
  parseFavorites,
  pruneFavorites,
  removeFavorite,
  serializeFavorites,
  shouldPromptCapture,
  toggleFavorite,
} from "./favorites-store";

describe("favorites-store", () => {
  it("parses an empty/malformed blob to EMPTY", () => {
    expect(parseFavorites(null)).toEqual(EMPTY_FAVORITES);
    expect(parseFavorites("not json")).toEqual(EMPTY_FAVORITES);
    expect(parseFavorites('{"slugs":"nope"}').slugs).toEqual([]);
  });

  it("round-trips a valid state and coerces flags", () => {
    const s = { slugs: ["a", "b"], promptSeen: true, captured: false };
    expect(parseFavorites(serializeFavorites(s))).toEqual(s);
    expect(parseFavorites('{"slugs":["a"],"promptSeen":1}').promptSeen).toBe(false);
  });

  it("adds to the front, dedupes, and caps at MAX_FAVORITES", () => {
    const once = addFavorite(EMPTY_FAVORITES, "a");
    expect(once.slugs).toEqual(["a"]);
    expect(addFavorite(once, "a").slugs).toEqual(["a"]); // dedupe
    expect(addFavorite(once, "b").slugs).toEqual(["b", "a"]); // newest first
    const many = { ...EMPTY_FAVORITES, slugs: Array.from({ length: MAX_FAVORITES }, (_, i) => `s${i}`) };
    expect(addFavorite(many, "new").slugs).toHaveLength(MAX_FAVORITES);
    expect(addFavorite(many, "new").slugs[0]).toBe("new");
  });

  it("toggles and reports whether it was an add", () => {
    const add = toggleFavorite(EMPTY_FAVORITES, "a");
    expect(add.added).toBe(true);
    expect(add.state.slugs).toEqual(["a"]);
    const remove = toggleFavorite(add.state, "a");
    expect(remove.added).toBe(false);
    expect(remove.state.slugs).toEqual([]);
  });

  it("removeFavorite drops the slug", () => {
    const s = { ...EMPTY_FAVORITES, slugs: ["a", "b"] };
    expect(removeFavorite(s, "a").slugs).toEqual(["b"]);
  });

  it("shouldPromptCapture only fires on the first add, never after seen/captured", () => {
    expect(shouldPromptCapture({ added: true, promptSeen: false, captured: false })).toBe(true);
    expect(shouldPromptCapture({ added: false, promptSeen: false, captured: false })).toBe(false);
    expect(shouldPromptCapture({ added: true, promptSeen: true, captured: false })).toBe(false);
    expect(shouldPromptCapture({ added: true, promptSeen: false, captured: true })).toBe(false);
  });

  it("markPromptSeen / markCaptured set their flags", () => {
    expect(markPromptSeen(EMPTY_FAVORITES).promptSeen).toBe(true);
    expect(markCaptured(EMPTY_FAVORITES).captured).toBe(true);
  });

  it("pruneFavorites keeps only live slugs", () => {
    const s = { ...EMPTY_FAVORITES, slugs: ["a", "b", "c"] };
    expect(pruneFavorites(s, ["a", "c"]).slugs).toEqual(["a", "c"]);
    expect(pruneFavorites(s, ["a", "b", "c"])).toBe(s); // unchanged ⇒ same reference
  });
});
