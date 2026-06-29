import Head from "next/head";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";

export default function About() {
  return (
    <SiteLayout>
      <Head>
        <title>About Nilyan Herrera — Licensed Florida Realtor®</title>
        <meta
          name="description"
          content="Meet Nilyan Herrera, a licensed Florida Realtor® helping buyers, sellers, and renters across the state."
        />
      </Head>
      <Container>
        <div style={{ maxWidth: 760, paddingBlock: "96px 48px" }}>
          <Reveal>
            <Eyebrow>{REALTOR.title}</Eyebrow>
            <h1
              style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.05, margin: "12px 0 0" }}
            >
              {REALTOR.name}
            </h1>
            {REALTOR.bioLong.map((p) => (
              <p
                key={p.slice(0, 24)}
                style={{
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "var(--color-ink-soft)",
                  marginTop: 18,
                }}
              >
                {p}
              </p>
            ))}
            <p style={{ marginTop: 18, color: "var(--color-stone)" }}>
              {REALTOR.license} · <a href={`mailto:${REALTOR.email}`}>{REALTOR.email}</a> ·{" "}
              <a href={`tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`}>{REALTOR.phone}</a>
            </p>
          </Reveal>
        </div>
      </Container>
      <section style={{ background: "var(--color-sand-100)", paddingBlock: 72 }}>
        <Container>
          <Reveal>
            <Eyebrow>What clients say</Eyebrow>
            <ul
              style={{
                listStyle: "none",
                margin: "24px 0 0",
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {TESTIMONIALS.map((t) => (
                <li
                  key={t.author}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 24,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: 18,
                      lineHeight: 1.5,
                      margin: "0 0 16px",
                    }}
                  >
                    “{t.quote}”
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {t.author} ·{" "}
                    <span style={{ fontWeight: 400, color: "var(--color-stone)" }}>
                      {t.context}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>
    </SiteLayout>
  );
}
