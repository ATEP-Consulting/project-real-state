import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      description="How Herrera collects, uses, and protects the information you share."
    >
      <h2>What we collect</h2>
      <p>
        When you submit a form on this site (a contact request, an enquiry about a listing, or a
        buy/sell/rent request) we collect the contact details and answers you provide — typically
        your name, email and/or phone, and what you&apos;re looking for.
      </p>
      <h2>How we use it</h2>
      <p>
        We use your information solely to respond to your request and help you buy, sell, or rent a
        home. We record the consent you give for each channel (email or phone) at the time you
        submit a form, and we honour any request to stop contacting you.
      </p>
      <h2>Sharing</h2>
      <p>
        We do not sell your information. We share it only with service providers needed to operate
        the site and respond to you, and where required by law.
      </p>
      <h2>Your choices</h2>
      <p>
        You can ask us to access, correct, or delete your information, or to stop contacting you, at
        any time by getting in touch through our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
