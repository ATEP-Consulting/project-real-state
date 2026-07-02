import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QualificationQuestionConfig } from "@herrera/db";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { REALTOR } from "@/data/realtor";
import { DURATION, EASE } from "@/theme/motion";
import { useTranslation } from "@/lib/i18n";
import {
  buildLeadPayload,
  buildSteps,
  canAdvance,
  isAnswered,
  localizedOptionLabel,
  localizedQuestionLabel,
  progressPct,
  validateContact,
  type Answers,
  type CaptureCopy,
  type ContactInput,
  type Intent,
  type LeadSource,
  type Step,
} from "@/lib/lead-capture";
import type { Locale } from "@/lib/i18n/config";
import styles from "./LeadCaptureFlow.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;
type Status = "idle" | "submitting" | "done" | "error";

function QuestionControl({
  q,
  value,
  onChange,
  onCommit,
  boolYes,
  boolNo,
  locale,
}: {
  q: QualificationQuestionConfig;
  value: unknown;
  onChange: (v: unknown) => void;
  onCommit: () => void; // advance (used by auto-advancing controls)
  boolYes: string;
  boolNo: string;
  locale: Locale;
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
              {localizedOptionLabel(o, locale)}
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
          { v: true, label: boolYes },
          { v: false, label: boolNo },
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
  source,
  viewedListingIds,
  copy,
  onSubmitted,
  onClose,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
  initialAnswers?: Answers;
  landingPath: string;
  source?: LeadSource;
  viewedListingIds?: string[];
  copy?: CaptureCopy;
  onSubmitted?: () => void;
  onClose?: () => void;
}) {
  const { m, locale } = useTranslation();
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
  const contactOnly = steps.length === 1 && step.kind === "contact";
  const isLast = step.kind === "contact";
  const setAnswer = (key: string, v: unknown) => setAnswers((a) => ({ ...a, [key]: v }));

  const HEADLINE: Record<Intent, string> = {
    buy: m.leadFlow.headlineBuy,
    sell: m.leadFlow.headlineSell,
    rent: m.leadFlow.headlineRent,
  };

  // Move forward unconditionally — used by auto-advancing controls (a value was just chosen),
  // which avoids re-reading the just-set `answers` before React has committed it.
  function advance() {
    setErr(null);
    setI((n) => Math.min(n + 1, steps.length - 1));
  }
  // The explicit Next button: gate required questions before advancing.
  function next() {
    if (!canAdvance(step, answers)) {
      setErr(m.leadFlow.errAdvance);
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
      setErr(v === "missing_contact" ? m.leadFlow.errMissingContact : m.leadFlow.errMissingConsent);
      return;
    }
    setStatus("submitting");
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          buildLeadPayload({
            intent,
            answers,
            contact,
            landingPath,
            source,
            viewedListingIds,
            locale,
          }),
        ),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      onSubmitted?.();
    } catch {
      setStatus("error");
      setErr(m.leadFlow.errGeneric);
    }
  }

  if (status === "done") {
    return (
      <div className={styles.panel}>
        {onClose && (
          <div className={styles.topbar}>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label={m.leadFlow.closeLabel}
            >
              ×
            </button>
          </div>
        )}
        <div className={styles.done}>
          <h2 className={styles.doneTitle}>{m.leadFlow.successTitle}</h2>
          <p className={styles.doneSub}>{m.leadFlow.successSub}</p>
          <a className={styles.call} href={TEL}>
            {m.leadFlow.callPrefix}
            {REALTOR.phone}
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
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={m.leadFlow.closeLabel}
          >
            ×
          </button>
        </div>
      )}
      {!contactOnly && (
        <>
          <div className={styles.progressTrack} aria-hidden="true">
            <div
              className={styles.progressBar}
              style={{ width: `${progressPct(i, steps.length)}%` }}
            />
          </div>
          <p className={styles.stepCount}>
            {HEADLINE[intent]} ·{" "}
            {m.leadFlow.stepOf
              .replace("{n}", String(i + 1))
              .replace("{total}", String(steps.length))}
          </p>
        </>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} className={styles.stepBody} {...anim}>
          {step.kind === "question" ? (
            <>
              <h2 className={styles.q}>
                {localizedQuestionLabel(step.question, locale)}
                {step.question.required && <span className={styles.req}> *</span>}
              </h2>
              <QuestionControl
                q={step.question}
                value={answers[step.question.key]}
                onChange={(v) => setAnswer(step.question.key, v)}
                onCommit={advance}
                boolYes={m.leadFlow.boolYes}
                boolNo={m.leadFlow.boolNo}
                locale={locale}
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
              <h2 className={styles.q}>{copy ? copy.headline : m.leadFlow.contactHeadline}</h2>
              {copy && <p className={styles.lede}>{copy.sub}</p>}
              <input
                className={styles.input}
                aria-label={m.leadFlow.namePlaceholder}
                placeholder={m.leadFlow.namePlaceholder}
                autoComplete="name"
                value={contact.name ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className={styles.input}
                aria-label={m.leadFlow.emailPlaceholder}
                type="email"
                placeholder={m.leadFlow.emailPlaceholder}
                autoComplete="email"
                value={contact.email ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              />
              <PhoneInput
                tone="paper"
                className={styles.phoneField}
                aria-label={m.leadFlow.phonePlaceholder}
                placeholder={m.leadFlow.phonePlaceholder}
                value={contact.phone ?? ""}
                onChange={(phone) => setContact((c) => ({ ...c, phone }))}
              />
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))}
                />
                <span>{m.leadFlow.contactConsent}</span>
              </label>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={contact.marketing ?? false}
                  onChange={(e) => setContact((c) => ({ ...c, marketing: e.target.checked }))}
                />
                <span>{m.consent.marketingLabel}</span>
              </label>
              <p className={styles.fine}>{m.leadFlow.contactFinePrint}</p>
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
          {m.leadFlow.backBtn}
        </button>
        {isLast ? (
          <Button
            type="button"
            size="lg"
            disabled={status === "submitting" || validateContact(contact) !== null}
            onClick={() => void submit()}
          >
            {status === "submitting" ? m.leadFlow.sending : m.leadFlow.sendBtn}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={next}>
            {m.leadFlow.nextBtn}
          </Button>
        )}
      </div>
    </div>
  );
}
