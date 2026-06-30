import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import styles from "./ContactSection.module.css";

type Intent = "buy" | "sell" | "rent";
const INTENTS: { id: Intent; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "rent", label: "Rent" },
];

const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export function ContactSection() {
  const [intent, setIntent] = useState<Intent>("buy");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const consent = fd.get("consent") === "on";
    if ((!email && !phone) || !consent) {
      setStatus("error");
      return;
    }
    const zone = String(fd.get("zone") ?? "").trim();
    const note = String(fd.get("message") ?? "").trim();
    const message = [zone && `Area of interest: ${zone}.`, note].filter(Boolean).join(" ");
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent,
          name: String(fd.get("name") ?? "").trim() || undefined,
          email: email || undefined,
          phone: phone || undefined,
          message: message || undefined,
          consentEmail: consent && Boolean(email),
          consentPhone: consent && Boolean(phone),
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.left}>
              <Eyebrow>Contact</Eyebrow>
              <h2 className={styles.title}>Let&apos;s talk about your next home</h2>
              <p className={styles.text}>
                Tell me what you&apos;re looking for or what you want to sell. I reply personally
                within 24 hours, no obligation.
              </p>

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

            <form className={styles.form} onSubmit={onSubmit}>
              <h3 className={styles.formTitle}>Send a message</h3>
              <p className={styles.formHelp}>All fields required except the message.</p>

              <span className={styles.fieldLabel}>I want to</span>
              <div className={styles.tabs}>
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

              <label className={styles.fieldLabel} htmlFor="c-name">
                Full name
              </label>
              <input
                id="c-name"
                name="name"
                className={styles.input}
                type="text"
                autoComplete="name"
                placeholder="Your name"
              />

              <div className={styles.two}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="c-email">
                    Email
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    className={styles.input}
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="c-phone">
                    Phone
                  </label>
                  <input
                    id="c-phone"
                    name="phone"
                    className={styles.input}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (305) …"
                  />
                </div>
              </div>

              <label className={styles.fieldLabel} htmlFor="c-zone">
                Area of interest
              </label>
              <input
                id="c-zone"
                name="zone"
                className={styles.input}
                type="text"
                placeholder="Coral Gables, Miami Beach, Brickell…"
              />

              <label className={styles.fieldLabel} htmlFor="c-msg">
                Message <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="c-msg"
                name="message"
                className={styles.textarea}
                rows={3}
                placeholder="Tell me what you're looking for…"
              />

              <label className={styles.consent}>
                <input type="checkbox" name="consent" />
                <span>I agree to the privacy policy and to be contacted about my enquiry.</span>
              </label>

              {status === "done" ? (
                <p className={styles.formStatus} role="status">
                  Thank you — your message is on its way. I&apos;ll reply within 24 hours.
                </p>
              ) : (
                <>
                  {status === "error" && (
                    <p className={styles.formError} role="alert">
                      Please add an email or phone and accept the consent, then try again.
                    </p>
                  )}
                  <button
                    type="submit"
                    className={styles.submit}
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? "Sending…" : "Send message"}
                  </button>
                </>
              )}
            </form>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
