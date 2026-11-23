import type { Metadata, Viewport } from "next";
import "@fontsource-variable/alegreya";
import "@fontsource-variable/alegreya/wght-italic.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.locality}`,
    template: `%s | ${SITE.shortName} Coptic Orthodox Church`,
  },
  description: SITE.description,
  applicationName: SITE.shortName,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    title: `${SITE.name} | ${SITE.locality}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
};

export const viewport: Viewport = {
  themeColor: "#f6eedb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-oxblood px-4 py-3 font-bold text-vellum focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
