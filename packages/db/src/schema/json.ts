import { z } from "zod";

/** Ordered listing photo (ADR-005 media). */
export const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
});
export type Photo = z.infer<typeof photoSchema>;

/** Lead source/attribution (ADR-007). */
export const attributionSchema = z.object({
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  referrer: z.string().optional(),
  landingPath: z.string().optional(),
});
export type Attribution = z.infer<typeof attributionSchema>;

/** Lead qualification answers — keyed by qualification_questions.key (ADR-007). */
export const qualificationAnswersSchema = z.record(z.string(), z.unknown());
export type QualificationAnswers = z.infer<typeof qualificationAnswersSchema>;

/** Option for a single/multi-select question, localized EN/ES (ADR-007/018). */
export const questionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  labelEs: z.string().optional(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

/** FEMA flood-zone designations (ADR-013) — labeled estimates downstream. */
export const floodZoneSchema = z.enum(["X", "A", "AE", "AH", "AO", "AR", "A99", "V", "VE", "D"]);
export type FloodZone = z.infer<typeof floodZoneSchema>;
