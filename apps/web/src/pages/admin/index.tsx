import type { GetServerSideProps } from "next";
import Head from "next/head";
import { signOut } from "next-auth/react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/server/auth/guards";

export default function AdminHome() {
  return (
    <Container>
      <Head>
        <title>Herrera — admin</title>
      </Head>
      <Section reveal={false}>
        <Eyebrow>Admin · protected</Eyebrow>
        <h1 style={{ fontSize: 42, margin: "12px 0 8px" }}>Welcome, Nilyan</h1>
        <p style={{ color: "var(--color-stone)", marginBottom: 20 }}>
          The CRM (leads, pipeline, analytics) is built in D10/D11. This page is gated.
        </p>
        <Button variant="ghost" onClick={() => void signOut({ callbackUrl: "/admin/login" })}>
          Sign out
        </Button>
      </Section>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  return { props: {} };
};
