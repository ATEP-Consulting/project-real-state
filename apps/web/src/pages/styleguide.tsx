import Link from "next/link";
import Head from "next/head";
import { Layout } from "@/components/Layout";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function Styleguide() {
  return (
    <Layout>
      <Head>
        <title>Herrera — styleguide</title>
      </Head>
      <Container>
        <Section reveal={false}>
          <Eyebrow>Styleguide</Eyebrow>
          <h2 style={{ fontSize: 42, margin: "12px 0 0" }}>Second page</h2>
          <p style={{ color: "var(--color-stone)" }}>
            Navigating here animated the page transition. <Link href="/">← Back</Link>
          </p>
        </Section>
      </Container>
    </Layout>
  );
}
