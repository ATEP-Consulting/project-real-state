import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export default function FairHousing() {
  return (
    <LegalPage
      title="Fair Housing Commitment"
      path="/fair-housing"
      description="Herrera supports equal housing opportunity and does not discriminate or steer."
    >
      <h2>Equal opportunity</h2>
      <p>
        We are committed to the principles of the Fair Housing Act and equal opportunity in housing.
        We do not discriminate on the basis of race, color, religion, sex, disability, familial
        status, national origin, or any other class protected by federal, state, or local law.
      </p>
      <h2>No steering</h2>
      <p>
        We describe homes and areas using facts — price, size, features, location, and the estimated
        cost of ownership. We do not characterize neighborhoods by the protected-class makeup of
        their residents, and we will not steer you toward or away from any area on that basis. Where
        you choose to look and buy is entirely your decision.
      </p>
      <h2>Questions</h2>
      <p>
        If you have any concern about fair housing, please <Link href="/contact">contact us</Link>.
      </p>
    </LegalPage>
  );
}
