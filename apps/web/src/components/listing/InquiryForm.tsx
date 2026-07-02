import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { StarRating } from "@/components/ui/StarRating";
import { REALTOR } from "@/data/realtor";
import { validateContact } from "@/lib/lead-capture";
import { useTranslation } from "@/lib/i18n";
import styles from "./InquiryForm.module.css";

type Status = "idle" | "submitting" | "done" | "error";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;

function AgentHeader() {
  const { m } = useTranslation();
  return (
    <div className={styles.agent}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={REALTOR.photo} alt={REALTOR.name} className={styles.avatar} loading="lazy" />
      <div className={styles.agentMeta}>
        <p className={styles.agentName}>{REALTOR.name}</p>
        <p className={styles.agentRole}>
          {m.realtor.title} · {m.listing.inquiryAgentRole}
        </p>
        <p className={styles.reviews}>
          <StarRating value={REALTOR.rating} /> <span>{REALTOR.reviews} reviews</span>
        </p>
      </div>
    </div>
  );
}

export function InquiryForm({ slug, title }: { slug: string; title: string }) {
  const { m, locale } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  // Gate the submit button: at least one contact channel + the consent box (name stays optional).
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const canSubmit = validateContact({ email, phone, consent }) === null && status !== "submitting";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return; // button is disabled until this holds — defense in depth
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    setStatus("submitting");
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingSlug: slug,
          requestType: "tour",
          name: String(fd.get("name") ?? "").trim() || undefined,
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
          message: String(fd.get("message") ?? "").trim() || undefined,
          consentEmail: Boolean(trimmedEmail),
          consentPhone: Boolean(trimmedPhone),
          consentMarketing: fd.get("marketing") === "on",
          attribution: { landingPath: `/homes/${slug}` },
          locale,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
      setErr(m.listing.inquiryErrorGeneric);
    }
  }

  if (status === "done") {
    return (
      <div className={styles.card}>
        <AgentHeader />
        <h2 className={styles.h2}>{m.listing.inquirySuccessTitle}</h2>
        <p className={styles.sub}>
          {m.listing.inquirySuccessBody} {title}.
        </p>
        <a className={styles.call} href={TEL}>
          {m.listing.inquiryCallPrefix}
          {REALTOR.phone}
        </a>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <AgentHeader />
      <h2 className={styles.h2}>{m.listing.inquiryTitle}</h2>
      <input
        className={styles.input}
        name="name"
        placeholder={m.listing.inquiryNamePlaceholder}
        autoComplete="name"
      />
      <input
        className={styles.input}
        name="email"
        type="email"
        placeholder={m.listing.inquiryEmailPlaceholder}
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PhoneInput
        tone="paper"
        aria-label={m.listing.inquiryPhonePlaceholder}
        placeholder={m.listing.inquiryPhonePlaceholder}
        value={phone}
        onChange={setPhone}
      />
      <textarea
        className={styles.textarea}
        name="message"
        rows={3}
        placeholder={m.listing.inquiryMessagePlaceholder}
      />
      <label className={styles.consent}>
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>{m.listing.inquiryContactConsent}</span>
      </label>
      <label className={styles.consent}>
        <input type="checkbox" name="marketing" />
        <span>{m.consent.marketingLabel}</span>
      </label>
      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!canSubmit}>
        {status === "submitting" ? m.listing.inquirySubmitting : m.listing.inquirySubmit}
      </Button>
      <a className={styles.call} href={TEL}>
        {m.listing.inquiryCallPrefix}
        {REALTOR.phone}
      </a>
      <p className={styles.fine}>{m.listing.inquiryFinePrint}</p>
    </form>
  );
}
