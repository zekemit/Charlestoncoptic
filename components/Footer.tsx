import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { FacebookIcon } from "@/components/icons";
import { img } from "@/lib/images";
import { CHURCH_ADDRESS, FOOTER_LINKS, SERVICE_ADDRESS, SITE } from "@/lib/site";

// The current year must be read inside a cache scope when Cache Components is on.
async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await currentYear();
  return (
    <footer className="on-dark mt-auto bg-oxblood-deep text-vellum">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src={img.crest.src} width={56} height={56} alt="" aria-hidden="true" className="size-14 shrink-0" />
            <p className="font-display text-2xl font-bold leading-tight text-gilt-light">
              {SITE.shortName}
              <span className="block text-lg font-normal text-vellum">Coptic Orthodox Church, Charleston, SC</span>
            </p>
          </div>
          <p className="mt-5 max-w-sm text-base text-vellum/90">
            Part of the Diocese of North Carolina, South Carolina &amp; Kentucky under His Grace Bishop Peter.
          </p>
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
            <a href={`mailto:${SITE.email}`} className="link">
              {SITE.email}
            </a>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="link inline-flex items-center gap-2"
            >
              <FacebookIcon className="size-5" />
              <span>Facebook</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </div>

        <div className="text-base">
          <h2 className="!text-xl !text-gilt-light">Find us</h2>
          <address className="mt-3 not-italic">
            <p className="font-bold">Services</p>
            <p>{SERVICE_ADDRESS.line1}</p>
            <p>
              {SERVICE_ADDRESS.city}, {SERVICE_ADDRESS.state} {SERVICE_ADDRESS.zip}
            </p>
            <p className="mt-4 font-bold">Mail and donations</p>
            <p>{CHURCH_ADDRESS.line1}</p>
            <p>
              {CHURCH_ADDRESS.city}, {CHURCH_ADDRESS.state} {CHURCH_ADDRESS.zip}
            </p>
          </address>
        </div>

        <nav aria-label="Footer" className="text-base">
          <h2 className="!text-xl !text-gilt-light">Pages</h2>
          <ul className="mt-3 space-y-1">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link inline-flex min-h-9 items-center">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-gilt/40">
        <p className="mx-auto w-full max-w-6xl px-5 py-5 text-sm text-vellum/80 sm:px-8">
          &copy; {year} St. Mary &amp; St. George Coptic Orthodox Church of Charleston, SC. A registered 501(c)(3)
          organization.
        </p>
      </div>
    </footer>
  );
}
