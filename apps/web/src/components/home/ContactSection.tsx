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

  // Presentational only — submission, per-channel consent storage, and notifications are wired in D7.
  function onSubmit(e: FormEvent) {
    e.preventDefault();
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
              <input id="c-name" className={styles.input} type="text" placeholder="Your name" />

              <div className={styles.two}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="c-email">
                    Email
                  </label>
                  <input
                    id="c-email"
                    className={styles.input}
                    type="email"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="c-phone">
                    Phone
                  </label>
                  <input
                    id="c-phone"
                    className={styles.input}
                    type="tel"
                    placeholder="+1 (305) …"
                  />
                </div>
              </div>

              <label className={styles.fieldLabel} htmlFor="c-zone">
                Area of interest
              </label>
              <input
                id="c-zone"
                className={styles.input}
                type="text"
                placeholder="Coral Gables, Miami Beach, Brickell…"
              />

              <label className={styles.fieldLabel} htmlFor="c-msg">
                Message <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="c-msg"
                className={styles.textarea}
                rows={3}
                placeholder="Tell me what you're looking for…"
              />

              <label className={styles.consent}>
                <input type="checkbox" />
                <span>I agree to the privacy policy and to be contacted about my enquiry.</span>
              </label>

              <button type="submit" className={styles.submit}>
                Send message
              </button>
            </form>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
