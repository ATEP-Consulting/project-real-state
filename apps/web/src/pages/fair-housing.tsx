import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { useTranslation } from "@/lib/i18n";

export default function FairHousing() {
  const { m } = useTranslation();
  const t = m.legal.fairHousing;

  return (
    <LegalPage
      title={t.pageTitle}
      seoTitle={t.seoTitle}
      path="/fair-housing"
      description={t.seoDesc}
      banner={m.legal.banner}
    >
      <h2>{t.h1}</h2>
      <p>{t.p1}</p>
      <h2>{t.h2}</h2>
      <p>{t.p2}</p>
      <h2>{t.h3}</h2>
      <p>
        {t.p3} <Link href="/contact">{t.p3Link}</Link>.
      </p>
    </LegalPage>
  );
}
