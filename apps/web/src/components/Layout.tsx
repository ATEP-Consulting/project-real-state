import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header style={{ padding: "18px 0", borderBottom: "1px solid var(--color-border)" }}>
        <Container>
          <span
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.16em",
            }}
          >
            HERRERA
          </span>
        </Container>
      </header>
      <main>{children}</main>
    </>
  );
}
