import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      path="/terms"
      description="The terms that govern your use of the Herrera website."
    >
      <h2>Using this site</h2>
      <p>
        This website provides information about real estate in Florida for general informational
        purposes. By using it you agree to use it lawfully and not to misuse the forms or content.
      </p>
      <h2>Listings &amp; data</h2>
      <p>
        Property information is provided for convenience and may not reflect the most current
        status. Listings should be independently verified. Availability, price, and details can
        change without notice.
      </p>
      <h2>Estimates, not advice</h2>
      <p>
        Any cost figures shown — including mortgage, property tax, insurance, HOA, CDD, and total
        monthly cost — are <strong>estimates</strong> for general guidance only. They are not
        quotes, financial, legal, or tax advice. Always confirm with the relevant provider before
        relying on them.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? Reach us via the <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
