import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { PageHeader, Container } from "@/components/PageHeader";
import { IMG_ALT, img } from "@/lib/images";
import { CHURCH_ADDRESS, SITE, oneLine } from "@/lib/site";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Help St. Mary and St. George Coptic Orthodox Church of Charleston, SC build our church. Give by Venmo, Zelle or check. All gifts are tax deductible.",
  alternates: { canonical: "/donate" },
};

export default function DonatePage() {
  return (
    <>
      <PageHeader title="Help Us Grow Our Church!">
        <blockquote className="scripture mt-7 max-w-2xl">
          <p>
            Each man should give what he has decided in his heart to give, not reluctantly or under compulsion,
            for God loves a cheerful giver.
          </p>
          <cite>2 Corinthians 9:7</cite>
        </blockquote>
      </PageHeader>

      <Container>
        <h2 className="text-3xl">Ways you can support</h2>

        <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10">
            <section aria-labelledby="online-heading">
              <h3 id="online-heading">Online</h3>
              <p className="mt-2 max-w-prose">Donate online via Venmo or Zelle.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a href={SITE.venmo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Give with Venmo<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
              <div className="mt-6 max-w-prose border-l-4 border-gilt bg-paper p-4">
                <p className="font-bold">Zelle</p>
                <p className="mt-1">
                  Send to the phone number{" "}
                  <strong className="whitespace-nowrap font-display text-2xl text-oxblood">{SITE.zellePhone}</strong>{" "}
                  ({SITE.zelleBank}).
                </p>
                <div className="mt-3">
                  <CopyButton text={SITE.zellePhone} label="Copy Zelle phone number" />
                </div>
              </div>
              <p className="mt-4 text-base text-ink-soft">PayPal is no longer available.</p>
            </section>

            <section aria-labelledby="mail-heading">
              <h3 id="mail-heading">By mail</h3>
              <p className="mt-2">Send a check to:</p>
              <address className="mt-2 not-italic">
                <p className="font-bold">St. Mary &amp; St. George</p>
                <p className="font-bold">Coptic Orthodox Church</p>
                <p>{CHURCH_ADDRESS.line1}</p>
                <p>
                  {CHURCH_ADDRESS.city}, {CHURCH_ADDRESS.state} {CHURCH_ADDRESS.zip}
                </p>
              </address>
              <div className="mt-3">
                <CopyButton
                  text={`St. Mary & St. George Coptic Orthodox Church, ${oneLine(CHURCH_ADDRESS)}`}
                  label="Copy mailing address"
                />
              </div>
            </section>

            <section aria-labelledby="involved-heading">
              <h3 id="involved-heading">Get involved</h3>
              <p className="mt-2 max-w-prose">
                Ready to get involved with us?{" "}
                <Link href="/contact" className="link">
                  Send us a message
                </Link>{" "}
                or email{" "}
                <a className="link" href={`mailto:${SITE.email}?subject=${encodeURIComponent("Interested in Getting Involved!")}`}>
                  {SITE.email}
                </a>
                .
              </p>
            </section>

            <section aria-labelledby="visit-heading">
              <h3 id="visit-heading">Come visit</h3>
              <p className="mt-2 max-w-prose">
                Moving to Charleston, SC or here for a visit? We&rsquo;d love to have you join us! Check out our
                upcoming liturgy date and time on the{" "}
                <Link href="/" className="link">
                  home page
                </Link>
                .
              </p>
            </section>

            <div className="max-w-prose border-t border-gilt/60 pt-6">
              <p className="font-display text-2xl text-oxblood">Please consider a monthly donation!</p>
              <p className="mt-2">
                All donations are tax deductible as the church is a registered 501(c)(3) organization.
              </p>
            </div>
          </div>

          <div className="lg:pt-1">
            <div className="relative aspect-[4/3] overflow-hidden border border-gilt/60 lg:aspect-[3/4]">
              <Image
                src={img.donateBanner.src}
                alt={IMG_ALT.donateBanner}
                fill
                sizes="(min-width: 1024px) 22rem, 100vw"
                placeholder="blur"
                blurDataURL={img.donateBanner.blurDataURL}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
