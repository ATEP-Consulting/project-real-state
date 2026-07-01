import type { ReactNode } from "react";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import styles from "./LegalPage.module.css";

/** Shared layout for the draft legal pages. Always noindex (drafts). */
export function LegalPage({
  title,
  seoTitle,
  path,
  description,
  banner,
  children,
}: {
  title: string;
  seoTitle: string;
  path: string;
  description: string;
  banner: string;
  children: ReactNode;
}) {
  return (
    <SiteLayout>
      <Seo title={seoTitle} description={description} path={path} noindex />
      <Container>
        <div className={styles.wrap}>
          <p className={styles.banner} role="note">
            {banner}
          </p>
          <h1 className={styles.h1}>{title}</h1>
          <div className={styles.body}>{children}</div>
        </div>
      </Container>
    </SiteLayout>
  );
}
