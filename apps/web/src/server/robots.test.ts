import { describe, expect, it } from "vitest";
import { robotsBody } from "./robots";

describe("robotsBody", () => {
  it("disallows everything in demo mode", () => {
    expect(robotsBody(true)).toContain("Disallow: /");
    expect(robotsBody(true)).not.toContain("Allow: /");
  });
  it("allows crawling in production mode", () => {
    expect(robotsBody(false)).toContain("Allow: /");
    expect(robotsBody(false)).not.toContain("Disallow: /");
  });
});
