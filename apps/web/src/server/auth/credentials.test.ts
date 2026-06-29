import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { verifyAdminCredentials } from "./credentials";

const EMAIL = "nilyan@herrera.example";
const PASSWORD = "correct-horse-battery-staple";
const HASH = bcrypt.hashSync(PASSWORD, 10);

describe("verifyAdminCredentials", () => {
  it("accepts the correct email + password", () => {
    expect(verifyAdminCredentials({ email: EMAIL, password: PASSWORD }, EMAIL, HASH)).toBe(true);
  });

  it("is case-insensitive on the email", () => {
    expect(
      verifyAdminCredentials({ email: "Nilyan@Herrera.Example", password: PASSWORD }, EMAIL, HASH),
    ).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyAdminCredentials({ email: EMAIL, password: "wrong" }, EMAIL, HASH)).toBe(false);
  });

  it("rejects a wrong email", () => {
    expect(
      verifyAdminCredentials({ email: "intruder@x.com", password: PASSWORD }, EMAIL, HASH),
    ).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(verifyAdminCredentials({ email: null, password: null }, EMAIL, HASH)).toBe(false);
  });
});
