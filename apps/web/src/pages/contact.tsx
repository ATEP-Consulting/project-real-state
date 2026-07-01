import { useState, type FormEvent } from "react";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/marketing/PageHero";
import { REALTOR } from "@/data/realtor";
import { useTranslation } from "@/lib/i18n";
import styles from "./Contact.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1920&q=68&auto=format&fit=crop";

type Intent = "buy" | "sell" | "rent";
const TEL = `tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`;

export default function ContactPage() {
  const { m, locale } = useTranslation();
  const INTENTS: { id: Intent; label: string }[] = [
    { id: "buy", label: m.home.contactBuy },
    { id: "sell", label: m.home.contactSell },
    { id: "rent", label: m.home.contactRent },
  ];
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
          locale,
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
        title={m.contactPage.seoTitle}
        description={m.contactPage.seoDescription}
        path="/contact"
      />
      <PageHero
        image={HERO_IMAGE}
        eyebrow={m.home.contactEyebrow}
        title={m.home.contactTitle}
        lede={m.home.contactText}
      />

      <section className={styles.section}>
        <Container>
          <Reveal>
            <div className={styles.grid}>
              <div className={styles.left}>
                <h2 className={styles.leftTitle}>{m.contactPage.reachHeading}</h2>
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

              {status === "done" ? (
                <div className={styles.form}>
                  <h2 className={styles.formTitle}>{m.home.contactSuccess}</h2>
                </div>
              ) : (
                <form className={styles.form} onSubmit={onSubmit}>
                  <h2 className={styles.formTitle}>{m.home.contactFormTitle}</h2>
                  <p className={styles.formHelp}>{m.home.contactFormHelp}</p>

                  <span className={styles.fieldLabel}>{m.home.contactIWantTo}</span>
                  <div className={styles.tabs} role="group" aria-label={m.home.contactIWantTo}>
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
                    {m.home.contactNameLabel}
                  </label>
                  <input
                    id="ct-name"
                    className={styles.input}
                    type="text"
                    autoComplete="name"
                    placeholder={m.home.contactNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <div className={styles.two}>
                    <div>
                      <label className={styles.fieldLabel} htmlFor="ct-email">
                        {m.home.contactEmailFieldLabel}
                      </label>
                      <input
                        id="ct-email"
                        className={styles.input}
                        type="email"
                        autoComplete="email"
                        placeholder={m.home.contactEmailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={styles.fieldLabel} htmlFor="ct-phone">
                        {m.home.contactPhoneFieldLabel}
                      </label>
                      <input
                        id="ct-phone"
                        className={styles.input}
                        type="tel"
                        autoComplete="tel"
                        placeholder={m.home.contactPhonePlaceholder}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className={styles.fieldLabel} htmlFor="ct-msg">
                    {m.home.contactMsgLabel} <span className={styles.optional}>{m.home.contactMsgOptional}</span>
                  </label>
                  <textarea
                    id="ct-msg"
                    className={styles.textarea}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={m.home.contactMsgPlaceholder}
                  />

                  <label className={styles.consent}>
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>{m.home.contactConsentLabel}</span>
                  </label>
                  <label className={styles.consent}>
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                    />
                    <span>{m.consent.marketingLabel}</span>
                  </label>

                  {status === "error" && (
                    <p className={styles.errorMsg} role="alert">
                      {m.home.contactError}
                    </p>
                  )}

                  <button type="submit" className={styles.submit} disabled={!canSubmit}>
                    {status === "submitting" ? m.home.contactSubmitting : m.home.contactSubmit}
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
