# ADR-014 — AI features (v2, NOT in the demo)

- **Status:** Accepted (deferred → v2). Built later, on real MLS data. v1 keeps only the seams.
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

AI can power two high-value features: **natural-language search** (free-text → structured filters
→ DB query) and a **concierge chat** that answers questions grounded in our listings, captures and
qualifies leads, and hands off to Nilyan. But these are most valuable on **real MLS data**, carry
guardrail risk (hallucination, Fair Housing steering, insurance/legal advice), and add an LLM
dependency. The demo must stand on its own without AI.

## Decision

- **Defer all AI to v2.** **No LLM dependency in the demo.**
- **v1 leaves only seams so adding AI later is plug-in, not rebuild:**
  - **Search resolves to structured filters** — the search layer takes a typed filter object;
    today the UI produces it, tomorrow an NL→filters step produces the same object. No query-layer
    change needed to add NL search.
  - **Listings and leads are well modeled** (ADR-005/007) so a future concierge has clean,
    attributed context (facts, geometry, costs, qualification answers, viewed listings).
- **When built (v2), via the Claude API**, with hard guardrails: **no hallucinated facts** (answer
  only from our DB / retrieved context), **no legal/insurance/financial advice** (estimates only,
  ADR-011/013), and **Fair Housing no-steering** (ADR-011) — never characterize areas by
  protected-class makeup, never answer "is it good for [type of people]."
- **Model:** default to the latest, most capable Claude model at build time (e.g. the current Opus
  for quality, a smaller model for cheap classification/NL-parsing) — chosen in v2.

## Consequences

- The demo is simpler, cheaper, and dependency-free; nothing blocks on AI.
- The structured-filter boundary and clean data model mean NL search and the concierge are additive
  in v2, not a rewrite.
- Guardrails are designed now (recorded here) so v2 implementation has a clear compliance contract.
- Decision recorded now to prevent accidental AI scope creep into the demo (ADR-017).

## Alternatives considered

- **A small AI feature in the demo** — rejected; adds dependency/guardrail risk for little demo
  value, and the brief explicitly defers AI to v2 on real data.
