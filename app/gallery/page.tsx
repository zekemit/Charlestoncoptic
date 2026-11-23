import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Container, PageHeader } from "@/components/PageHeader";
import { albums } from "@/lib/images";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos from St. Mary and St. George Coptic Orthodox Church of Charleston, SC: cleaning the new church building, Good Friday and the Feast of the Resurrection, and the Feast of the Holy Nativity.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const total = albums.reduce((n, a) => n + a.photos.length, 0);
  return (
    <>
      <PageHeader title="Gallery">
        <nav aria-label="Photo albums" className="mt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {albums.map((a) => (
              <li key={a.slug}>
                <a href={`#${a.slug}`} className="link">
                  {a.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-base text-ink-soft">
            {total} photos in {albums.length} albums. Select a photo to see it larger.
          </p>
        </nav>
      </PageHeader>
      <Container className="space-y-16">
        <GalleryGrid albums={albums} />
      </Container>
    </>
  );
}
