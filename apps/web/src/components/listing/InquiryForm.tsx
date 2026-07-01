import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { MARKETING_CONSENT_LABEL } from "@/lib/consent";
import { REALTOR } from "@/data/realtor";
import styles from "./InquiryForm.module.css";

type Status = "idle" | "submitting" | "done" | "error";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;

function AgentHeader() {
  return (
    <div className={styles.agent}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={REALTOR.photo} alt={REALTOR.name} className={styles.avatar} loading="lazy" />
      <div className={styles.agentMeta}>
        <p className={styles.agentName}>{REALTOR.name}</p>
        <p className={styles.agentRole}>{REALTOR.title} · Your agent</p>
        <p className={styles.reviews}>
          <StarRating value={REALTOR.rating} /> <span>{REALTOR.reviews} reviews</span>
        </p>
      </div>
    </div>
  );
}

export function InquiryForm({ slug, title }: { slug: string; title: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    if (!email && !phone) {
      setErr("Please add an email or a phone so Nilyan can reach you.");
      return;
    }
    if (!fd.get("consent")) {
      setErr("Please agree to be contacted.");
      return;
    }
    setStatus("submitting");
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingSlug: slug,
          requestType: "tour",
          name: String(fd.get("name") ?? "").trim() || undefined,
          email: email || undefined,
          phone: phone || undefined,
          message: String(fd.get("message") ?? "").trim() || undefined,
          consentEmail: Boolean(email),
          consentPhone: Boolean(phone),
          consentMarketing: fd.get("marketing") === "on",
          attribution: { landingPath: `/homes/${slug}` },
        }),
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
      <div className={styles.card}>
        <AgentHeader />
        <h2 className={styles.h2}>Thanks — we&rsquo;ll be in touch shortly.</h2>
        <p className={styles.sub}>Nilyan personally follows up on every inquiry about {title}.</p>
        <a className={styles.call} href={TEL}>
          Call · {REALTOR.phone}
        </a>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <AgentHeader />
      <h2 className={styles.h2}>Request a visit</h2>
      <input className={styles.input} name="name" placeholder="Your name" autoComplete="name" />
      <input
        className={styles.input}
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
      />
      <input
        className={styles.input}
        name="phone"
        type="tel"
        placeholder="Phone"
        autoComplete="tel"
      />
      <textarea
        className={styles.textarea}
        name="message"
        rows={3}
        placeholder="I'd like more information about this home."
      />
      <label className={styles.consent}>
        <input type="checkbox" name="consent" />
        <span>
          I agree to be contacted by Herrera about this property using the details I provided.
        </span>
      </label>
      <label className={styles.consent}>
        <input type="checkbox" name="marketing" />
        <span>{MARKETING_CONSENT_LABEL}</span>
      </label>
      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}
      <Button type="submit" size="lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Contact Nilyan"}
      </Button>
      <a className={styles.call} href={TEL}>
        Call · {REALTOR.phone}
      </a>
      <p className={styles.fine}>
        By sending you accept the privacy policy. No obligation — phone <em>or</em> email is enough.
      </p>
    </form>
  );
}
