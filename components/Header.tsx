import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { NavLink } from "@/components/NavLink";
import { FacebookIcon } from "@/components/icons";
import { img } from "@/lib/images";
import { NAV, SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="relative z-30 border-b border-gilt/60 bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src={img.crest.src}
            width={56}
            height={56}
            alt=""
            priority
            className="size-12 shrink-0 sm:size-14"
            aria-hidden="true"
          />
          <span className="leading-tight">
            <span className="block whitespace-nowrap font-display text-lg font-bold text-oxblood min-[400px]:text-xl sm:text-2xl">
              {SITE.shortName}
            </span>
            <span className="hidden text-sm text-ink-soft sm:block">Coptic Orthodox Church, Charleston, SC</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
          <Link href="/donate" className="btn btn-primary ml-3 !min-h-11 !px-5">
            Donate
          </Link>
          <a
            href={SITE.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex size-11 items-center justify-center text-lapis hover:text-oxblood"
            aria-label="Follow us on Facebook (opens in a new tab)"
          >
            <FacebookIcon className="size-6" />
          </a>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
