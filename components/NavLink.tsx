"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  className = "",
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center border-b-2 px-3 font-bold text-ink no-underline transition-colors hover:text-oxblood ${
        active ? "border-gilt" : "border-transparent"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
