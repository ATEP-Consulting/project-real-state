import { describe, expect, it } from "vitest";
import type { QualificationQuestionConfig } from "@herrera/db";
import {
  buildLeadPayload,
  buildSteps,
  canAdvance,
  isAnswered,
  progressPct,
  validateContact,
} from "./lead-capture";

const sel: QualificationQuestionConfig = {
  key: "timeline",
  type: "single_select",
  label: "When?",
  labelEs: null,
  options: [{ value: "0_3", label: "0–3 months" }],
  required: true,
};
const optionalText: QualificationQuestionConfig = {
  key: "note",
  type: "text",
  label: "Note",
  labelEs: null,
  options: [],
  required: false,
};

describe("buildSteps", () => {
  it("appends a contact step after the questions", () => {
    const steps = buildSteps([sel, optionalText]);
    expect(steps).toHaveLength(3);
    expect(steps[2]).toEqual({ kind: "contact" });
    expect(steps[0]).toEqual({ kind: "question", question: sel });
  });
});

describe("isAnswered", () => {
  it("is false for an empty select, true once chosen", () => {
    expect(isAnswered(sel, {})).toBe(false);
    expect(isAnswered(sel, { timeline: "0_3" })).toBe(true);
  });
  it("treats a boolean answer of false as answered", () => {
    const q: QualificationQuestionConfig = { ...sel, key: "pets", type: "boolean", options: [] };
    expect(isAnswered(q, { pets: false })).toBe(true);
    expect(isAnswered(q, {})).toBe(false);
  });
  it("treats 0 as an answered number", () => {
    const q: QualificationQuestionConfig = { ...sel, key: "beds", type: "number", options: [] };
    expect(isAnswered(q, { beds: 0 })).toBe(true);
  });
});

describe("canAdvance", () => {
  it("blocks an unanswered required question but allows an optional one", () => {
    expect(canAdvance({ kind: "question", question: sel }, {})).toBe(false);
    expect(canAdvance({ kind: "question", question: optionalText }, {})).toBe(true);
  });
  it("always allows the contact step", () => {
    expect(canAdvance({ kind: "contact" }, {})).toBe(true);
  });
});

describe("progressPct", () => {
  it("maps step index over total steps", () => {
    expect(progressPct(0, 4)).toBe(0);
    expect(progressPct(2, 4)).toBe(50);
    expect(progressPct(4, 4)).toBe(100);
    expect(progressPct(1, 0)).toBe(0);
  });
});

describe("validateContact", () => {
  it("requires at least one channel", () => {
    expect(validateContact({ consent: true })).toMatch(/email or a phone/);
  });
  it("requires consent", () => {
    expect(validateContact({ email: "a@b.com", consent: false })).toMatch(/agree/);
  });
  it("passes with one channel + consent", () => {
    expect(validateContact({ phone: "3055550148", consent: true })).toBeNull();
  });
});

describe("buildLeadPayload", () => {
  it("maps consent flags from the provided channels and trims blanks to undefined", () => {
    const p = buildLeadPayload({
      intent: "sell",
      answers: { address: "1 Main St" },
      contact: { name: "  Ana ", email: " a@b.com ", phone: "", consent: true },
      landingPath: "/sell",
    });
    expect(p).toEqual({
      intent: "sell",
      answers: { address: "1 Main St" },
      name: "Ana",
      email: "a@b.com",
      phone: undefined,
      consentEmail: true,
      consentPhone: false,
      consentMarketing: false,
      attribution: { landingPath: "/sell" },
    });
  });
  it("carries the optional marketing opt-in when ticked (defaults false)", () => {
    const opted = buildLeadPayload({
      intent: "buy",
      answers: {},
      contact: { email: "a@b.com", consent: true, marketing: true },
      landingPath: "/buy",
    });
    expect(opted.consentMarketing).toBe(true);
  });
});
