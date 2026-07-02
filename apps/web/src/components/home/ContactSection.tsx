import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import { validateContact } from "@/lib/lead-capture";
import { useTranslation } from "@/lib/i18n";
import styles from "./ContactSection.module.css";

type Intent = "buy" | "sell" | "rent";

const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export function ContactSection() {
  const [intent, setIntent] = useState<Intent>("buy");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const { m, locale } = useTranslation();
  // Gate the submit button: at least one contact channel + the consent box (name stays optional).
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const canSubmit = validateContact({ email, phone, consent }) === null && status !== "submitting";

  const INTENTS: { id: Intent; label: string }[] = [
    { id: "buy", label: m.home.contactBuy },
    { id: "sell", label: m.home.contactSell },
    { id: "rent", label: m.home.contactRent },
  ];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return; // button is disabled until this holds — defense in depth
    const fd = new FormData(e.currentTarget);
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const zone = String(fd.get("zone") ?? "").trim();
    const note = String(fd.get("message") ?? "").trim();
    const message = [zone && `${m.home.contactAreaPrefix} ${zone}`, note].filter(Boolean).join(" ");
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent,
          name: String(fd.get("name") ?? "").trim() || undefined,
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
          message: message || undefined,
          consentEmail: consent && Boolean(trimmedEmail),
          consentPhone: consent && Boolean(trimmedPhone),
          consentMarketing: fd.get("marketing") === "on",
          locale,
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
          <div className={styles.panel}>
            <div className={styles.grid}>
              <div className={styles.left}>
                <p className={styles.eyebrow}>{m.home.contactEyebrow}</p>
                <h2 className={styles.title}>{m.home.contactTitle}</h2>
                <p className={styles.text}>{m.home.contactText}</p>

                <ul className={styles.details}>
                  <li className={styles.detail}>
                    <span className={styles.dIcon} aria-hidden="true">
                      ✆
                    </span>
                    <span>
                      <span className={styles.dLabel}>{m.home.contactPhoneLabel}</span>
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
                      <span className={styles.dLabel}>{m.home.contactEmailLabel}</span>
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
                      <span className={styles.dLabel}>{m.home.contactOfficeLabel}</span>
                      <span className={styles.dValue}>{REALTOR.office}</span>
                    </span>
                  </li>
                  <li className={styles.detail}>
                    <span className={styles.dIcon} aria-hidden="true">
                      <InstagramIcon size={16} />
                    </span>
                    <span>
                      <span className={styles.dLabel}>{m.home.contactInstagramLabel}</span>
                      <a
                        className={styles.dValue}
                        href={REALTOR.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {REALTOR.instagramHandle}
                      </a>
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
                      {m.realtor.title} · {REALTOR.license} · {m.realtor.hours}
                    </span>
                  </span>
                </div>
              </div>

              <form className={styles.form} onSubmit={onSubmit}>
                <h3 className={styles.formTitle}>{m.home.contactFormTitle}</h3>
                <p className={styles.formHelp}>{m.home.contactFormHelp}</p>

                <span className={styles.fieldLabel}>{m.home.contactIWantTo}</span>
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
                  {m.home.contactNameLabel}
                </label>
                <input
                  id="c-name"
                  name="name"
                  className={styles.input}
                  type="text"
                  autoComplete="name"
                  placeholder={m.home.contactNamePlaceholder}
                />

                <div className={styles.two}>
                  <div>
                    <label className={styles.fieldLabel} htmlFor="c-email">
                      {m.home.contactEmailFieldLabel}
                    </label>
                    <input
                      id="c-email"
                      name="email"
                      className={styles.input}
                      type="email"
                      autoComplete="email"
                      placeholder={m.home.contactEmailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.fieldLabel} htmlFor="c-phone">
                      {m.home.contactPhoneFieldLabel}
                    </label>
                    <PhoneInput
                      id="c-phone"
                      tone="surface"
                      placeholder={m.home.contactPhonePlaceholder}
                      value={phone}
                      onChange={setPhone}
                    />
                  </div>
                </div>

                <label className={styles.fieldLabel} htmlFor="c-zone">
                  {m.home.contactZoneLabel}
                </label>
                <input
                  id="c-zone"
                  name="zone"
                  className={styles.input}
                  type="text"
                  placeholder={m.home.contactZonePlaceholder}
                />

                <label className={styles.fieldLabel} htmlFor="c-msg">
                  {m.home.contactMsgLabel}{" "}
                  <span className={styles.optional}>{m.home.contactMsgOptional}</span>
                </label>
                <textarea
                  id="c-msg"
                  name="message"
                  className={styles.textarea}
                  rows={3}
                  placeholder={m.home.contactMsgPlaceholder}
                />

                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    name="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>{m.home.contactConsentLabel}</span>
                </label>
                <label className={styles.consent}>
                  <input type="checkbox" name="marketing" />
                  <span>{m.home.contactMarketingLabel}</span>
                </label>

                {status === "done" ? (
                  <p className={styles.formStatus} role="status">
                    {m.home.contactSuccess}
                  </p>
                ) : (
                  <>
                    {status === "error" && (
                      <p className={styles.formError} role="alert">
                        {m.home.contactError}
                      </p>
                    )}
                    <button type="submit" className={styles.submit} disabled={!canSubmit}>
                      {status === "submitting" ? m.home.contactSubmitting : m.home.contactSubmit}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
