import { describe, expect, it } from "vitest";
import { en } from "./messages/en";
import { es } from "./messages/es";

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

describe("message dictionaries", () => {
  it("es has exactly the same keys as en (no gaps, no extras)", () => {
    expect(keyPaths(es).sort()).toEqual(keyPaths(en).sort());
  });
  it("no es value is an empty string", () => {
    const empties = keyPaths(es).filter((p) => getByPath(es, p) === "");
    expect(empties).toEqual([]);
  });
});
