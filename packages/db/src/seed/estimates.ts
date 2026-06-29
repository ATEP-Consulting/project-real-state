import type { FloodZone } from "../schema/json";

/**
 * Florida cost-of-ownership ESTIMATES (ADR-013) — transparent, documented assumptions.
 * NOT quotes or advice. All figures are clearly labeled estimates in the UI.
 */
export function computeEstimates(price: number, floodZone: FloodZone) {
  // Effective property tax ≈ 1.1%/yr (central FL).
  const estPropertyTaxAnnual = Math.round((price * 0.011) / 10) * 10;

  // Home insurance grows with replacement cost (FL is high).
  const estHomeInsuranceAnnual =
    price < 300000 ? 2800 : price < 500000 ? 3800 : price < 800000 ? 5200 : 7200;

  // Flood insurance by FEMA zone (preferred-risk in X; rated in A/AE; highest in V/VE).
  const floodByZone: Record<FloodZone, number> = {
    X: 520,
    D: 700,
    A: Math.round(1400 + price * 0.0025),
    AE: Math.round(1600 + price * 0.003),
    AH: Math.round(1300 + price * 0.0022),
    AO: Math.round(1300 + price * 0.0022),
    AR: Math.round(1500 + price * 0.0026),
    A99: Math.round(1200 + price * 0.002),
    V: Math.round(3500 + price * 0.004),
    VE: Math.round(3800 + price * 0.0045),
  };

  return {
    estPropertyTaxAnnual,
    estHomeInsuranceAnnual,
    estFloodInsuranceAnnual: floodByZone[floodZone],
  };
}
