import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./InquiryForm.module.css";

type Status = "idle" | "submitting" | "done" | "error";

export function InquiryForm({ slug, title }: { slug: string; title: string }) {
  const [requestType, setRequestType] = useState<"info" | "tour">("info");
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
          requestType,
          name: String(fd.get("name") ?? "").trim() || undefined,
          email: email || undefined,
          phone: phone || undefined,
          message: String(fd.get("message") ?? "").trim() || undefined,
          preferredDate: String(fd.get("preferredDate") ?? "").trim() || undefined,
          consentEmail: Boolean(email),
          consentPhone: Boolean(phone),
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
        <h2 className={styles.h2}>Thanks — we&rsquo;ll be in touch shortly.</h2>
        <p className={styles.sub}>Nilyan personally follows up on every inquiry about {title}.</p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h2 className={styles.h2}>Interested in this home?</h2>
      <div className={styles.tabs} role="tablist" aria-label="Request type">
        <button
          type="button"
          role="tab"
          aria-selected={requestType === "info"}
          className={requestType === "info" ? styles.tabOn : styles.tab}
          onClick={() => setRequestType("info")}
        >
          Request info
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={requestType === "tour"}
          className={requestType === "tour" ? styles.tabOn : styles.tab}
          onClick={() => setRequestType("tour")}
        >
          Schedule a tour
        </button>
      </div>
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
      {requestType === "tour" && (
        <input
          className={styles.input}
          name="preferredDate"
          placeholder="Preferred day/time (e.g. Sat AM)"
        />
      )}
      <textarea
        className={styles.textarea}
        name="message"
        rows={3}
        placeholder={
          requestType === "tour"
            ? "Anything we should know?"
            : "I'd like more information about this home."
        }
      />
      <label className={styles.consent}>
        <input type="checkbox" name="consent" />
        <span>
          I agree to be contacted by Herrera about this property using the details I provided.
        </span>
      </label>
      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}
      <Button type="submit" size="lg" disabled={status === "submitting"}>
        {status === "submitting"
          ? "Sending…"
          : requestType === "tour"
            ? "Request tour"
            : "Request info"}
      </Button>
      <p className={styles.fine}>
        Phone <em>or</em> email is enough — we never require both.
      </p>
    </form>
  );
}
