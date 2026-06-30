import type { ReactNode } from "react";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import styles from "./LegalPage.module.css";

/** Shared layout for the draft legal pages. Always noindex (drafts). */
export function LegalPage({
  title,
  path,
  description,
  children,
}: {
  title: string;
  path: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <SiteLayout>
      <Seo title={`${title} — Herrera`} description={description} path={path} noindex />
      <Container>
        <div className={styles.wrap}>
          <p className={styles.banner} role="note">
            Sample draft — not legal advice. This placeholder text must be reviewed with counsel
            before launch.
          </p>
          <h1 className={styles.h1}>{title}</h1>
          <div className={styles.body}>{children}</div>
        </div>
      </Container>
    </SiteLayout>
  );
}
