import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Container, PageHeader } from "@/components/PageHeader";
import { CHURCH_ADDRESS, SERVICE_ADDRESS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Write to St. Mary and St. George Coptic Orthodox Church of Charleston, SC. Ask about visiting, send a prayer request, or find out how to get involved.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        lede="Questions about visiting, a prayer request, or ways to get involved? Send us a message and someone from the church will write back."
      />
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <ContactForm />

          <aside aria-label="Other ways to reach us" className="space-y-8 text-base lg:pt-1">
            <div>
              <h2 className="text-2xl">Email</h2>
              <p className="mt-2">
                <a className="link text-lg" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </p>
            </div>
            <div>
              <h2 className="text-2xl">Join us for liturgy</h2>
              <p className="mt-2">Saturdays, 8:00 – 11:00 AM</p>
              <address className="mt-1 not-italic">
                {SERVICE_ADDRESS.line1}
                <br />
                {SERVICE_ADDRESS.city}, {SERVICE_ADDRESS.state} {SERVICE_ADDRESS.zip}
              </address>
              <p className="mt-2">
                <Link href="/visit-us" className="link">
                  Plan your visit
                </Link>
              </p>
            </div>
            <div>
              <h2 className="text-2xl">Mail and donations</h2>
              <address className="mt-2 not-italic">
                {CHURCH_ADDRESS.line1}
                <br />
                {CHURCH_ADDRESS.city}, {CHURCH_ADDRESS.state} {CHURCH_ADDRESS.zip}
              </address>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
