import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/PageHeader";
import { PinIcon } from "@/components/icons";
import { CHURCH_ADDRESS, SERVICE_ADDRESS, SITE, directionsUrl, mapEmbedUrl, oneLine } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visit Us",
  description:
    "Visiting Charleston, SC? Join St. Mary and St. George Coptic Orthodox Church for Divine Liturgy on Saturday mornings at 3921 St Johns Ave. Moving to Charleston? Join us at liturgy!",
  alternates: { canonical: "/visit-us" },
};

export default function VisitPage() {
  return (
    <>
      <PageHeader title="Visit Us" lede="Visiting Charleston, SC? We'd love to meet you! Moving to Charleston, SC? Join us at liturgy!" />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-labelledby="services-heading" className="prose-church">
            <h2 id="services-heading">Services</h2>
            <p>
              We would love to have you join us on Saturdays for Liturgy! Divine Liturgy is prayed from 8:00 to
              11:00 AM. Please see the{" "}
              <Link href="/">home page</Link> for details.
            </p>
            <p>
              We are grateful to St. John&rsquo;s Catholic Church in North Charleston, SC for inviting us to use
              their space while we prepare our new church home.
            </p>
            <p>
              Please <Link href="/contact">send us a message</Link> or email{" "}
              <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Inquiry from Website")}`}>{SITE.email}</a>{" "}
              if you have any questions or if you&rsquo;re coming to visit!
            </p>
          </section>

          <section aria-labelledby="address-heading" className="space-y-8">
            <h2 id="address-heading" className="text-3xl">
              Address
            </h2>

            <div className="border-l-4 border-gilt bg-paper p-5">
              <p className="font-bold text-oxblood">Current address for services</p>
              <address className="mt-1 not-italic">
                {SERVICE_ADDRESS.line1}
                <br />
                {SERVICE_ADDRESS.city}, {SERVICE_ADDRESS.state} {SERVICE_ADDRESS.zip}
              </address>
              <a
                href={directionsUrl(SERVICE_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline mt-4 !min-h-11"
              >
                <PinIcon className="size-5" />
                Get directions<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <div className="border-l-4 border-gilt/60 bg-paper p-5">
              <p className="font-bold text-oxblood">All mail and donations</p>
              <address className="mt-1 not-italic">
                {CHURCH_ADDRESS.line1}
                <br />
                {CHURCH_ADDRESS.city}, {CHURCH_ADDRESS.state} {CHURCH_ADDRESS.zip}
              </address>
              <p className="mt-2 text-base text-ink-soft">Our new church home, still being prepared for worship.</p>
            </div>
          </section>
        </div>

        <div className="mt-14">
          <h2 className="text-3xl">Find us on the map</h2>
          <div className="mt-5 border border-gilt/70 bg-vellum-deep">
            <iframe
              title={`Map showing ${oneLine(SERVICE_ADDRESS)}`}
              src={mapEmbedUrl(SERVICE_ADDRESS)}
              className="block h-[22rem] w-full sm:h-[26rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-base">
            Map not showing?{" "}
            <a href={directionsUrl(SERVICE_ADDRESS)} target="_blank" rel="noopener noreferrer" className="link">
              Open {SERVICE_ADDRESS.line1} in Google Maps<span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </div>
      </Container>
    </>
  );
}
