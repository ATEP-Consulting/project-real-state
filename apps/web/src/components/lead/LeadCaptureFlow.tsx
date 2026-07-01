import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QualificationQuestionConfig } from "@herrera/db";
import { Button } from "@/components/ui/Button";
import { MARKETING_CONSENT_LABEL } from "@/lib/consent";
import { REALTOR } from "@/data/realtor";
import { DURATION, EASE } from "@/theme/motion";
import {
  buildLeadPayload,
  buildSteps,
  canAdvance,
  isAnswered,
  progressPct,
  validateContact,
  type Answers,
  type ContactInput,
  type Intent,
  type Step,
} from "@/lib/lead-capture";
import styles from "./LeadCaptureFlow.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;
const HEADLINE: Record<Intent, string> = {
  buy: "Let's find your home",
  sell: "Let's value your home",
  rent: "Let's find your rental",
};
type Status = "idle" | "submitting" | "done" | "error";

function QuestionControl({
  q,
  value,
  onChange,
  onCommit,
}: {
  q: QualificationQuestionConfig;
  value: unknown;
  onChange: (v: unknown) => void;
  onCommit: () => void; // advance (used by auto-advancing controls)
}) {
  if (q.type === "single_select" || q.type === "multi_select") {
    const multi = q.type === "multi_select";
    const selected: string[] = multi ? (Array.isArray(value) ? (value as string[]) : []) : [];
    return (
      <div className={styles.options}>
        {q.options.map((o) => {
          const active = multi ? selected.includes(o.value) : value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className={`${styles.option} ${active ? styles.optionActive : ""}`}
              aria-pressed={active}
              onClick={() => {
                if (multi) {
                  onChange(active ? selected.filter((v) => v !== o.value) : [...selected, o.value]);
                } else {
                  onChange(o.value);
                  onCommit(); // typeform: selecting a single choice advances
                }
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.type === "boolean") {
    return (
      <div className={styles.options}>
        {[
          { v: true, label: "Yes" },
          { v: false, label: "No" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            className={`${styles.option} ${value === o.v ? styles.optionActive : ""}`}
            aria-pressed={value === o.v}
            onClick={() => {
              onChange(o.v);
              onCommit();
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  if (q.type === "number") {
    return (
      <input
        className={styles.input}
        type="number"
        inputMode="numeric"
        autoFocus
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }
  // text / range (range falls back to free text in v1) — single free-text input
  return (
    <input
      className={styles.input}
      type="text"
      autoFocus
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function LeadCaptureFlow({
  intent,
  questions,
  initialAnswers = {},
  landingPath,
  onClose,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
  initialAnswers?: Answers;
  landingPath: string;
  onClose?: () => void;
}) {
  const reduce = useReducedMotion();
  // Animate only after mount: SSR + first client render stay static so the first question is
  // visible (no opacity:0) and the markup matches on both sides (reduced motion is read on the
  // client only, so gating here avoids a hydration mismatch). See ADR-016 / motion notes.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const steps = useMemo<Step[]>(() => buildSteps(questions), [questions]);
  // Start at the first question not already answered by `initialAnswers` — so the
  // "what's my home worth?" entry (sell flow with the address pre-filled) skips the
  // address screen instead of re-asking it. Computed once on mount.
  const [i, setI] = useState(() => {
    for (let k = 0; k < steps.length; k++) {
      const st = steps[k]!;
      if (st.kind === "question" && isAnswered(st.question, initialAnswers)) continue;
      return k;
    }
    return 0;
  });
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [contact, setContact] = useState<ContactInput>({ consent: false });
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const step = steps[i]!;
  const isLast = step.kind === "contact";
  const setAnswer = (key: string, v: unknown) => setAnswers((a) => ({ ...a, [key]: v }));

  // Move forward unconditionally — used by auto-advancing controls (a value was just chosen),
  // which avoids re-reading the just-set `answers` before React has committed it.
  function advance() {
    setErr(null);
    setI((n) => Math.min(n + 1, steps.length - 1));
  }
  // The explicit Next button: gate required questions before advancing.
  function next() {
    if (!canAdvance(step, answers)) {
      setErr("Please answer to continue.");
      return;
    }
    advance();
  }
  function back() {
    setErr(null);
    setI((n) => Math.max(n - 1, 0));
  }

  async function submit() {
    const v = validateContact(contact);
    if (v) {
      setErr(v);
      return;
    }
    setStatus("submitting");
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildLeadPayload({ intent, answers, contact, landingPath })),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
      setErr("Something went wrong. Please try again or call us.");
    }
  }

  if (status === "done") {
    return (
      <div className={styles.panel}>
        {onClose && (
          <div className={styles.topbar}>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        )}
        <div className={styles.done}>
          <h2 className={styles.doneTitle}>Thanks — we&rsquo;ll be in touch shortly.</h2>
          <p className={styles.doneSub}>
            Nilyan personally follows up on every request. Prefer to talk now?
          </p>
          <a className={styles.call} href={TEL}>
            Call · {REALTOR.phone}
          </a>
        </div>
      </div>
    );
  }

  const anim =
    mounted && !reduce
      ? {
          initial: { opacity: 0, x: 24 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -24 },
          transition: { duration: DURATION.base, ease: EASE },
        }
      : {};

  return (
    <div className={styles.panel}>
      {onClose && (
        <div className={styles.topbar}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      )}
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${progressPct(i, steps.length)}%` }} />
      </div>
      <p className={styles.stepCount}>
        {HEADLINE[intent]} · step {i + 1} of {steps.length}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} className={styles.stepBody} {...anim}>
          {step.kind === "question" ? (
            <>
              <h2 className={styles.q}>
                {step.question.label}
                {step.question.required && <span className={styles.req}> *</span>}
              </h2>
              <QuestionControl
                q={step.question}
                value={answers[step.question.key]}
                onChange={(v) => setAnswer(step.question.key, v)}
                onCommit={advance}
              />
            </>
          ) : (
            <form
              className={styles.contact}
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              noValidate
            >
              <h2 className={styles.q}>How should Nilyan reach you?</h2>
              <input
                className={styles.input}
                aria-label="Your name"
                placeholder="Your name"
                autoComplete="name"
                value={contact.name ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className={styles.input}
                aria-label="Email address"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={contact.email ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              />
              <input
                className={styles.input}
                aria-label="Phone number"
                type="tel"
                placeholder="Phone"
                autoComplete="tel"
                value={contact.phone ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              />
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))}
                />
                <span>
                  I agree to be contacted by Herrera about my real estate needs using the details I
                  provided.
                </span>
              </label>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={contact.marketing ?? false}
                  onChange={(e) => setContact((c) => ({ ...c, marketing: e.target.checked }))}
                />
                <span>{MARKETING_CONSENT_LABEL}</span>
              </label>
              <p className={styles.fine}>
                No obligation — phone <em>or</em> email is enough; you don&rsquo;t need both.
              </p>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.back}
          onClick={back}
          disabled={i === 0 || status === "submitting"}
        >
          ← Back
        </button>
        {isLast ? (
          <Button
            type="button"
            size="lg"
            disabled={status === "submitting"}
            onClick={() => void submit()}
          >
            {status === "submitting" ? "Sending…" : "Send to Nilyan"}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={next}>
            Next →
          </Button>
        )}
      </div>
    </div>
  );
}
