import { z } from "zod";

/**
 * Server-only environment variables. Never exposed to the client bundle.
 * Keys are added as features land (DB in F2, auth in F4, Resend in D8, Twilio seam, etc.).
 * Seam keys (notifications/Twilio) are optional until the feature is activated.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // F2 — database (ADR-002/003).
  DATABASE_URL: z.string().url(),
  // F4 — admin auth (ADR-010).
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
  // D8 — notifications (ADR-009). Seam: optional until activated.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  NILYAN_ALERT_EMAIL: z.string().email().optional(),
  // Twilio seam (ADR-009) — inactive in v1.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
});

/** Client-exposed variables. MUST be prefixed NEXT_PUBLIC_ so Next.js inlines them. */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  // ADR-003 demo posture — defaults on, coerced to a boolean.
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // ADR-012 — MapLibre style URL (free default); Mapbox token is the optional alternative.
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export class EnvValidationError extends Error {
  constructor(issues: string) {
    super(`Invalid environment variables:\n${issues}`);
    this.name = "EnvValidationError";
  }
}

function parse<T extends z.ZodTypeAny>(schema: T, runtimeEnv: unknown): z.infer<T> {
  const result = schema.safeParse(runtimeEnv);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new EnvValidationError(issues);
  }
  return result.data;
}

export function parseServerEnv(runtimeEnv: NodeJS.ProcessEnv = process.env): ServerEnv {
  return parse(serverEnvSchema, runtimeEnv);
}

export function parseClientEnv(runtimeEnv: Record<string, string | undefined>): ClientEnv {
  return parse(clientEnvSchema, runtimeEnv);
}
