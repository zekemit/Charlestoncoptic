import Image from "next/image";
import Link from "next/link";
import { PopupHost } from "@/components/PopupHost";
import { IMG_ALT, img } from "@/lib/images";
import { CHURCH_MAP_LINK, SERVICE_ADDRESS, SITE, directionsUrl, oneLine } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: SITE.name,
  url: SITE.url,
  email: SITE.email,
  description: SITE.description,
  image: `${SITE.url}/opengraph-image`,
  address: {
    "@type": "PostalAddress",
    streetAddress: SERVICE_ADDRESS.line1,
    addressLocality: SERVICE_ADDRESS.city,
    addressRegion: SERVICE_ADDRESS.state,
    postalCode: SERVICE_ADDRESS.zip,
    addressCountry: "US",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "Saturday",
    opens: "08:00",
    closes: "11:00",
  },
  sameAs: [SITE.facebook],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="border-b border-gilt/50 bg-vellum">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-14 lg:py-20">
          <div>
            <h1 className="text-[clamp(1.95rem,1rem+3.6vw,4.1rem)]">
              <span className="block font-display text-2xl font-medium italic text-gilt-deep sm:text-3xl">
                Welcome to
              </span>
              <span className="mt-1 block">St. Mary &amp; St. George</span>
              <span className="block">Coptic Orthodox Church</span>
              <span className="mt-3 block text-[0.42em] font-medium text-ink-soft">Charleston, SC</span>
            </h1>

            <blockquote className="scripture mt-9 max-w-xl">
              <p>So he built an altar there and called upon the name of the Lord.</p>
              <cite>Genesis 26:25</cite>
            </blockquote>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/visit-us" className="btn btn-primary">
                Plan your visit
              </Link>
              <Link href="/donate" className="btn btn-outline">
                Support our church
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-none">
            <div className="arch-frame">
              <div className="arch relative aspect-[4/5]">
                <Image
                  src={img.hero.src}
                  alt={IMG_ALT.hero}
                  fill
                  priority
                  sizes="(min-width: 1024px) 22rem, 24rem"
                  placeholder="blur"
                  blurDataURL={img.hero.blurDataURL}
                  className="object-cover"
                  style={{ objectPosition: "40% 40%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services: what visitors came for, directly under the hero */}
      <section aria-labelledby="services-heading" className="on-dark bg-lapis text-vellum">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:py-14">
          <div>
            <h2 id="services-heading">Services</h2>
            <p className="mt-5 font-display text-3xl font-bold text-gilt-light sm:text-4xl">
              Divine Liturgy, Saturday mornings
            </p>
            <p className="mt-1 font-display text-2xl sm:text-3xl">8:00 – 11:00 AM</p>
            <p className="mt-4 text-lg">Location: {oneLine(SERVICE_ADDRESS)}</p>
            <p className="mt-5 max-w-prose text-vellum/90">
              Please note: Fr. Antony Zaki is coordinating a priest to pray liturgy for us each Saturday.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <a
              href={directionsUrl(SERVICE_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-light"
            >
              Get directions<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link href="/visit-us" className="btn btn-outline">
              What to expect
            </Link>
          </div>
        </div>
        <p className="mx-auto w-full max-w-6xl border-t border-gilt-light/30 px-5 py-4 text-sm text-vellum/80 sm:px-8">
          Looking for the Holy Week schedule?{" "}
          <Link href="/holy-week-2026" className="link">
            The 2026 schedule has been archived.
          </Link>
        </p>
      </section>

      {/* Founding + scripture */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_1fr] md:py-20">
        <p className="max-w-[60ch] font-display text-2xl leading-snug text-ink sm:text-[1.7rem]">
          St. Mary and St. George Coptic Orthodox Church of Charleston, South Carolina was founded with the
          intention of creating a place for Coptic Christians to devote themselves to the teachings of Jesus
          Christ, for fellowship, to partake of communion, and to pray.
        </p>
        <blockquote className="scripture self-center">
          <p>I have heard your prayer, and have chosen this place for Myself as a house of sacrifice.</p>
          <cite>2 Chronicles 7:12</cite>
        </blockquote>
      </section>

      {/* New church home */}
      <section aria-labelledby="new-home-heading" className="border-y border-gilt/50 bg-paper">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <h2 id="new-home-heading" className="max-w-3xl">
            By the grace of God, we have a new church home
          </h2>
          <p className="mt-5 max-w-[62ch]">
            We have successfully purchased{" "}
            <a href={CHURCH_MAP_LINK} className="link" target="_blank" rel="noopener noreferrer">
              2929 Bennett Charles Road, Mount Pleasant, SC 29466
              <span className="sr-only"> (opens map in a new tab)</span>
            </a>{" "}
            as our new church home.
          </p>

          <ul className="mt-9 grid gap-5 sm:grid-cols-3">
            {[
              { i: img.newChurch1, alt: IMG_ALT.newChurch1, cap: "The church building" },
              { i: img.newChurch2, alt: IMG_ALT.newChurch2, cap: "The property from above" },
              { i: img.newChurch3, alt: IMG_ALT.newChurch3, cap: "The hall inside" },
            ].map(({ i, alt, cap }) => (
              <li key={i.src}>
                <figure>
                  <div className="relative aspect-[3/2] overflow-hidden border border-gilt/60">
                    <Image
                      src={i.src}
                      alt={alt}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      placeholder="blur"
                      blurDataURL={i.blurDataURL}
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 text-base text-ink-soft">{cap}</figcaption>
                </figure>
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-3xl border-l-4 border-gilt bg-vellum-deep p-5 sm:p-6">
            <p className="font-bold text-oxblood">Please note</p>
            <p className="mt-1">
              While we prepare the church for worship and liturgy, we will continue to pray at{" "}
              <strong>{oneLine(SERVICE_ADDRESS)}</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Support */}
      <section aria-labelledby="support-heading" className="on-dark bg-oxblood text-vellum">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:py-16">
          <div>
            <h2 id="support-heading">Support Our Church</h2>
            <blockquote className="scripture mt-6 max-w-2xl">
              <p>Whoever is generous to the poor lends to the Lord, and he will repay him for his deed.</p>
              <cite>Proverbs 19:17</cite>
            </blockquote>
          </div>
          <Link href="/donate" className="btn btn-light self-start md:self-center">
            Donate now
          </Link>
        </div>
      </section>

      <PopupHost />
    </>
  );
}
