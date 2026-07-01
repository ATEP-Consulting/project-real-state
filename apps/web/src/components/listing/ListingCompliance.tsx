import { EqualHousingLogo } from "@/components/layout/EqualHousingLogo";
import type { ListingDetailVM } from "@/lib/listing-detail";
import { useTranslation } from "@/lib/i18n";
import styles from "./ListingCompliance.module.css";

export function ListingCompliance({
  compliance,
  source,
}: {
  compliance: ListingDetailVM["compliance"];
  source: "mls" | "demo";
}) {
  const { m } = useTranslation();
  const brokerage = compliance.brokerageName ?? "the listing brokerage";
  const agent = compliance.agentName ? ` · ${compliance.agentName}` : "";
  const mls = compliance.originatingMls ?? "the originating MLS";
  const mlsText = m.listing.complianceMls
    .replace("{brokerage}", brokerage)
    .replace("{agent}", agent)
    .replace("{mls}", mls);

  return (
    <section className={styles.box} aria-label="Listing disclosures">
      <div className={styles.eh}>
        <EqualHousingLogo size={24} />
        <span>{m.listing.complianceEqualHousing}</span>
      </div>
      {source === "mls" ? (
        <p className={styles.disclaimer}>{mlsText}</p>
      ) : (
        <p className={styles.disclaimer}>{m.listing.complianceDemo}</p>
      )}
    </section>
  );
}
