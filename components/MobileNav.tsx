"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, FacebookIcon, MenuIcon } from "@/components/icons";
import { NAV, SITE } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes and returns focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex min-h-11 items-center gap-2 border border-oxblood px-3 font-bold text-oxblood"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        <span>{open ? "Close" : "Menu"}</span>
      </button>

      <div
        id="mobile-nav-panel"
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-b border-gilt bg-paper shadow-lg"
      >
        <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-12 items-center border-l-4 px-4 text-lg font-bold no-underline ${
                  active ? "border-gilt bg-vellum text-oxblood" : "border-transparent text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-3 flex items-center gap-3 px-4 pb-2">
            <Link href="/donate" className="btn btn-primary flex-1" onClick={() => setOpen(false)}>
              Donate
            </Link>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-12 items-center justify-center border border-lapis text-lapis"
              aria-label="Follow us on Facebook (opens in a new tab)"
            >
              <FacebookIcon className="size-6" />
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
