import { describe, expect, it } from "vitest";
import { EnvValidationError, parseClientEnv, parseServerEnv } from "./env";

const validServer = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://user:pass@localhost:5432/herrera",
  AUTH_SECRET: "a-very-long-test-secret-value",
} as NodeJS.ProcessEnv;

describe("parseServerEnv", () => {
  it("parses a valid server environment", () => {
    const env = parseServerEnv(validServer);
    expect(env.DATABASE_URL).toBe("postgres://user:pass@localhost:5432/herrera");
    expect(env.NODE_ENV).toBe("test");
  });

  it("throws EnvValidationError when DATABASE_URL is not a URL", () => {
    expect(() => parseServerEnv({ ...validServer, DATABASE_URL: "not-a-url" })).toThrow(
      EnvValidationError,
    );
  });

  it("throws when AUTH_SECRET is too short", () => {
    expect(() => parseServerEnv({ ...validServer, AUTH_SECRET: "short" })).toThrow(
      EnvValidationError,
    );
  });
});

describe("parseClientEnv", () => {
  it("defaults NEXT_PUBLIC_DEMO_MODE to true and coerces to boolean", () => {
    const env = parseClientEnv({ NEXT_PUBLIC_SITE_URL: "https://demo.example.com" });
    expect(env.NEXT_PUBLIC_DEMO_MODE).toBe(true);
  });

  it("throws when NEXT_PUBLIC_SITE_URL is missing", () => {
    expect(() => parseClientEnv({})).toThrow(EnvValidationError);
  });
});
