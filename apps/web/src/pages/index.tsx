import Link from "next/link";
import Head from "next/head";
import { Layout } from "@/components/Layout";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

const SWATCHES = [
  "--color-paper",
  "--color-forest",
  "--color-bronze",
  "--color-sage",
  "--color-stone",
  "--color-ink",
];

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Herrera — design system preview</title>
      </Head>
      <Container>
        <Section reveal={false}>
          <Eyebrow>Florida · Licensed Realtor®</Eyebrow>
          <h1 style={{ fontSize: 68, lineHeight: 1.04, margin: "12px 0 0" }}>Find your place</h1>
          <p style={{ color: "var(--color-stone)", maxWidth: 520 }}>
            F3 preview — design tokens, base theme, and motion. The real home is built in D1.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Button variant="primary" size="lg">
              Primary
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Section>

        <Section>
          <Eyebrow>Palette</Eyebrow>
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {SWATCHES.map((v) => (
              <div key={v} style={{ textAlign: "center", fontSize: 12 }}>
                <div
                  style={{
                    width: 88,
                    height: 64,
                    borderRadius: "var(--radius-md)",
                    background: `var(${v})`,
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-card)",
                  }}
                />
                <code>{v.replace("--color-", "")}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <Eyebrow>Motion</Eyebrow>
          <p style={{ color: "var(--color-stone)" }}>
            This section faded up on scroll (disabled under reduced-motion).{" "}
            <Link href="/styleguide">View route transition →</Link>
          </p>
        </Section>
      </Container>
    </Layout>
  );
}
