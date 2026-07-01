// Copy for the favorites capture (popup on first save, and the /favorites nudge). Singular
// on the first save ("this home"); plural once several are saved ("these homes"). See D9 plan.
export function favoritesCaptureCopy(count: number): { headline: string; sub: string } {
  const noun = count <= 1 ? "this home" : "these homes";
  return {
    headline: "Get alerts on your saved homes",
    sub: `Want Nilyan to alert you about ${noun} — price drops and new listings like them? Leave your details and she'll take it from here.`,
  };
}
