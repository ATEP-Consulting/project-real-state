import { describe, expect, it } from "vitest";
import { formatSource } from "./source-label";

describe("formatSource", () => {
  it("maps known capture keys to friendly labels", () => {
    expect(formatSource("qualification_flow")).toBe("Buy/Sell/Rent form");
    expect(formatSource("listing_inquiry")).toBe("Listing inquiry");
  });
  it("prettifies unknown snake_case keys", () => {
    expect(formatSource("zillow_ads")).toBe("Zillow Ads");
  });
  it("falls back to a dash for null/empty", () => {
    expect(formatSource(null)).toBe("—");
    expect(formatSource("")).toBe("—");
  });
});
