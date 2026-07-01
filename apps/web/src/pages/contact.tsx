import { useState, type FormEvent } from "react";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/marketing/PageHero";
import { MARKETING_CONSENT_LABEL } from "@/lib/consent";
import { REALTOR } from "@/data/realtor";
import styles from "./Contact.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1920&q=68&auto=format&fit=crop";

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
    <SiteLayout transparentHeader>
      <Seo
        title="Contact Nilyan Herrera · Florida real estate"
        description="Get in touch with Nilyan Herrera, a licensed Florida Realtor®. Tell her what you're looking to buy, sell or rent. She replies personally within 24 hours."
        path="/contact"
      />
      <PageHero
        image={HERO_IMAGE}
        eyebrow="Contact"
        title="Let's talk about your next move"
        lede="Tell me what you're looking for or what you want to sell. I reply personally within 24 hours, no obligation."
      />

      <section className={styles.section}>
        <Container>
          <Reveal>
            <div className={styles.grid}>
              <div className={styles.left}>
                <h2 className={styles.leftTitle}>Reach Nilyan directly</h2>
                <ul className={styles.details}>
                  <li className={styles.detail}>
                    <span className={styles.dIcon} aria-hidden="true">
                      ✆
                    </span>
                    <span>
                      <span className={styles.dLabel}>Phone</span>
                      <a className={styles.dValue} href={TEL}>
                        {REALTOR.phone}
                      </a>
                    </span>
                  </li>
                  <li className={styles.detail}>
                    <span className={styles.dIcon} aria-hidden="true">
                      ✉
                    </span>
                    <span>
                      <span className={styles.dLabel}>Email</span>
                      <a className={styles.dValue} href={`mailto:${REALTOR.email}`}>
                        {REALTOR.email}
                      </a>
                    </span>
                  </li>
                  <li className={styles.detail}>
                    <span className={styles.dIcon} aria-hidden="true">
                      ⌖
                    </span>
                    <span>
                      <span className={styles.dLabel}>Office</span>
                      <span className={styles.dValue}>{REALTOR.office}</span>
                    </span>
                  </li>
                </ul>

                <div className={styles.agentCard}>
                  <span className={styles.monogram} aria-hidden="true">
                    {REALTOR.monogram}
                  </span>
                  <span>
                    <span className={styles.agentName}>{REALTOR.name}</span>
                    <span className={styles.agentMeta}>
                      {REALTOR.title} · {REALTOR.license} · {REALTOR.hours}
                    </span>
                  </span>
                </div>
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
                    An email or phone is required, give whichever you prefer.
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
                    placeholder="Your name"
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
                        placeholder="you@email.com"
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
                        placeholder="+1 (305) …"
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
                    <span>I agree to the privacy policy and to be contacted about my enquiry.</span>
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
          </Reveal>
        </Container>
      </section>
    </SiteLayout>
  );
}
