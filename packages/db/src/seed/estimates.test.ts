import { describe, expect, it } from "vitest";
import { computeEstimates } from "./estimates";

describe("computeEstimates (labeled ESTIMATES, ADR-013)", () => {
  it("scales property tax ~1.1% of price", () => {
    const e = computeEstimates(400000, "X");
    expect(e.estPropertyTaxAnnual).toBeGreaterThan(3600);
    expect(e.estPropertyTaxAnnual).toBeLessThan(5200);
  });

  it("charges much higher flood insurance in AE than X", () => {
    const x = computeEstimates(400000, "X").estFloodInsuranceAnnual;
    const ae = computeEstimates(400000, "AE").estFloodInsuranceAnnual;
    expect(ae).toBeGreaterThan(x * 2);
  });

  it("produces home-insurance estimates that grow with price", () => {
    expect(computeEstimates(800000, "X").estHomeInsuranceAnnual).toBeGreaterThan(
      computeEstimates(300000, "X").estHomeInsuranceAnnual,
    );
  });
});
