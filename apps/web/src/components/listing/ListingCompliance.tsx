import { EqualHousingLogo } from "@/components/layout/EqualHousingLogo";
import type { ListingDetailVM } from "@/lib/listing-detail";
import styles from "./ListingCompliance.module.css";

export function ListingCompliance({
  compliance,
  source,
}: {
  compliance: ListingDetailVM["compliance"];
  source: "mls" | "demo";
}) {
  return (
    <section className={styles.box} aria-label="Listing disclosures">
      <div className={styles.eh}>
        <EqualHousingLogo size={24} />
        <span>Equal Housing Opportunity</span>
      </div>
      {source === "mls" ? (
        <p className={styles.disclaimer}>
          Listing courtesy of {compliance.brokerageName ?? "the listing brokerage"}
          {compliance.agentName ? ` · ${compliance.agentName}` : ""}. Data provided by{" "}
          {compliance.originatingMls ?? "the originating MLS"} and deemed reliable but not
          guaranteed. Information is for consumers&rsquo; personal, non-commercial use.
        </p>
      ) : (
        <p className={styles.disclaimer}>
          Presented by Nilyan Herrera, Licensed Florida Real Estate Agent.{" "}
          <strong>Sample data — demo.</strong> Figures shown are illustrative estimates, not quotes
          or advice.
        </p>
      )}
    </section>
  );
}
