import { useState, type FormEvent } from "react";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MARKETING_CONSENT_LABEL } from "@/lib/consent";
import { REALTOR } from "@/data/realtor";
import styles from "./Contact.module.css";

type Intent = "buy" | "sell" | "rent";
const INTENTS: { id: Intent; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "rent", label: "Rent" },
];
const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export default function ContactPage() {
  const [intent, setIntent] = useState<Intent>("buy");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const hasContact = Boolean(email.trim() || phone.trim());
  const canSubmit = hasContact && consent && status !== "submitting";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasContact || !consent) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          consentEmail: consent && Boolean(email.trim()),
          consentPhone: consent && Boolean(phone.trim()),
          consentMarketing: marketing,
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <SiteLayout>
      <Seo
        title="Contact Nilyan Herrera — Florida real estate"
        description="Get in touch with Nilyan Herrera, a licensed Florida Realtor®. Tell her what you're looking to buy, sell, or rent — she replies personally within 24 hours."
        path="/contact"
      />
      <Container>
        <div className={styles.grid}>
          <div className={styles.left}>
            <Eyebrow>Contact</Eyebrow>
            <h1 className={styles.h1}>Let&apos;s talk about your next move</h1>
            <p className={styles.text}>
              Tell me what you&apos;re looking for or what you want to sell. I reply personally
              within 24 hours — no obligation.
            </p>
            <ul className={styles.details}>
              <li>
                <span className={styles.dLabel}>Phone</span>
                <a className={styles.dValue} href={TEL}>
                  {REALTOR.phone}
                </a>
              </li>
              <li>
                <span className={styles.dLabel}>Email</span>
                <a className={styles.dValue} href={`mailto:${REALTOR.email}`}>
                  {REALTOR.email}
                </a>
              </li>
              <li>
                <span className={styles.dLabel}>Office</span>
                <span className={styles.dValue}>{REALTOR.office}</span>
              </li>
            </ul>
            <p className={styles.agent}>
              {REALTOR.name} · {REALTOR.title} · {REALTOR.license}
            </p>
          </div>

          {status === "done" ? (
            <div className={styles.form}>
              <h2 className={styles.formTitle}>Thank you — message sent</h2>
              <p className={styles.formHelp}>
                I&apos;ve got your details and will be in touch personally within 24 hours.
              </p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit}>
              <h2 className={styles.formTitle}>Send a message</h2>
              <p className={styles.formHelp}>
                An email or phone is required — give whichever you prefer.
              </p>

              <span className={styles.fieldLabel}>I want to</span>
              <div className={styles.tabs} role="group" aria-label="Intent">
                {INTENTS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.tab} ${intent === t.id ? styles.tabActive : ""}`}
                    aria-pressed={intent === t.id}
                    onClick={() => setIntent(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <label className={styles.fieldLabel} htmlFor="ct-name">
                Full name
              </label>
              <input
                id="ct-name"
                className={styles.input}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className={styles.two}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="ct-email">
                    Email
                  </label>
                  <input
                    id="ct-email"
                    className={styles.input}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="ct-phone">
                    Phone
                  </label>
                  <input
                    id="ct-phone"
                    className={styles.input}
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <label className={styles.fieldLabel} htmlFor="ct-msg">
                Message <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="ct-msg"
                className={styles.textarea}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell me what you're looking for…"
              />

              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>I agree to be contacted about my enquiry.</span>
              </label>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                <span>{MARKETING_CONSENT_LABEL}</span>
              </label>

              {status === "error" && (
                <p className={styles.errorMsg} role="alert">
                  Please add an email or phone and accept the consent, then try again.
                </p>
              )}

              <button type="submit" className={styles.submit} disabled={!canSubmit}>
                {status === "submitting" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </Container>
    </SiteLayout>
  );
}
