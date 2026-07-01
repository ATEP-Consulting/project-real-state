import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { useTranslation } from "@/lib/i18n";

export default function Terms() {
  const { m } = useTranslation();
  const t = m.legal.terms;

  return (
    <LegalPage
      title={t.pageTitle}
      seoTitle={t.seoTitle}
      path="/terms"
      description={t.seoDesc}
      banner={m.legal.banner}
    >
      <h2>{t.h1}</h2>
      <p>{t.p1}</p>
      <h2>{t.h2}</h2>
      <p>{t.p2}</p>
      <h2>{t.h3}</h2>
      <p>
        {t.p3pre} <strong>{t.p3strong}</strong> {t.p3post}
      </p>
      <h2>{t.h4}</h2>
      <p>
        {t.p4} <Link href="/contact">{t.p4Link}</Link>.
      </p>
    </LegalPage>
  );
}
