// Single source of truth for church facts shown across the site.
// Content migrated from the previous Wix site (see SITE_AUDIT.md).

export const SITE = {
  name: "St. Mary & St. George Coptic Orthodox Church",
  shortName: "St. Mary & St. George",
  locality: "Charleston, SC",
  tagline: "Coptic Orthodox Church of Charleston, South Carolina",
  description:
    "Welcome to St. Mary and St. George (SMSG) Coptic Orthodox Church of Charleston, SC! Divine Liturgy every Saturday morning in Charleston.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.charlestoncoptic.org").replace(/\/$/, ""),
  email: "charlestoncopts@gmail.com",
  facebook:
    "https://www.facebook.com/pages/category/Nonprofit-Organization/St-Mary-St-George-Coptic-Orthodox-Church-Of-CharlestonSC-1490500207745656/",
  venmo: "https://venmo.com/StMaryandStGeorge-CHSCopticChu",
  zellePhone: "843-437-1255",
  zelleBank: "TD Bank",
  frFatherUrl: "https://www.copticmyrtle.com/our-preist",
} as const;

export type Address = {
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
};

/** Where Divine Liturgy is prayed today (hosted by St. John's Catholic Church). */
export const SERVICE_ADDRESS: Address = {
  label: "Current address for services",
  line1: "3921 St Johns Ave",
  city: "Charleston",
  state: "SC",
  zip: "29405",
};

/** The purchased church property. Also the address for all mail and donations. */
export const CHURCH_ADDRESS: Address = {
  label: "All mail and donations",
  line1: "2929 Bennett Charles Rd",
  city: "Mt Pleasant",
  state: "SC",
  zip: "29466",
};

export function oneLine(a: Address): string {
  return `${a.line1}, ${a.city}, ${a.state} ${a.zip}`;
}

export function directionsUrl(a: Address): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(oneLine(a))}`;
}

export function mapEmbedUrl(a: Address): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(oneLine(a))}&output=embed`;
}

/** Pin published by the previous site for the new property. */
export const CHURCH_MAP_LINK =
  "https://www.google.com/maps/place/St.+Mary+%26+St.+George+Coptic+Orthodox+Church/@32.8832136,-79.8095302,17z";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/visit-us", label: "Visit Us" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LINKS = [
  ...NAV,
  { href: "/donate", label: "Donate" },
  { href: "/holy-week-2026", label: "2026 Holy Week schedule (past)" },
] as const;
