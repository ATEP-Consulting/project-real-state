import { describe, expect, it } from "vitest";
import { listingInquirySchema } from "./inquiries";

describe("listingInquirySchema", () => {
  it("accepts an inquiry with just an email", () => {
    const r = listingInquirySchema.safeParse({
      listingSlug: "x",
      email: "a@b.com",
      consentEmail: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.requestType).toBe("info"); // default
  });
  it("accepts an inquiry with just a phone", () => {
    expect(listingInquirySchema.safeParse({ listingSlug: "x", phone: "3055550148" }).success).toBe(
      true,
    );
  });
  it("rejects an inquiry with neither email nor phone", () => {
    expect(listingInquirySchema.safeParse({ listingSlug: "x", message: "hi" }).success).toBe(false);
  });
  it("rejects a missing listingSlug and a bad email", () => {
    expect(listingInquirySchema.safeParse({ email: "a@b.com" }).success).toBe(false);
    expect(listingInquirySchema.safeParse({ listingSlug: "x", email: "nope" }).success).toBe(false);
  });
});
