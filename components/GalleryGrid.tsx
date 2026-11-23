"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import type { Album } from "@/lib/images";

type Active = { a: number; i: number } | null;

export function GalleryGrid({ albums }: { albums: Album[] }) {
  const [active, setActive] = useState<Active>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (active && d && !d.open) d.showModal();
  }, [active]);

  const step = useCallback(
    (dir: 1 | -1) => {
      setActive((cur) => {
        if (!cur) return cur;
        const n = albums[cur.a].photos.length;
        return { a: cur.a, i: (cur.i + dir + n) % n };
      });
    },
    [albums],
  );

  const current = active ? albums[active.a].photos[active.i] : null;
  const album = active ? albums[active.a] : null;

  return (
    <>
      {albums.map((al, a) => (
        <section key={al.slug} id={al.slug} aria-labelledby={`${al.slug}-heading`} className="scroll-mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id={`${al.slug}-heading`} className="text-3xl">
              {al.title}
            </h2>
            <p className="font-display text-xl italic text-gilt-deep">
              {al.dateLabel} <span className="not-italic text-ink-soft">({al.photos.length} photos)</span>
            </p>
          </div>

          <ul className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
            {al.photos.map((p, i) => (
              <li key={p.src} className="mb-3 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setActive({ a, i })}
                  className="group relative block w-full overflow-hidden border border-gilt/50 bg-vellum-deep"
                  aria-label={`Open photo ${i + 1} of ${al.photos.length}: ${p.alt}`}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
                    placeholder="blur"
                    blurDataURL={p.blurDataURL}
                    priority={a === 0 && i < 4}
                    className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {active && current && album ? (
        <dialog
          ref={dialogRef}
          aria-label={`${album.title}, photo ${active.i + 1} of ${album.photos.length}`}
          className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-oxblood-deep p-0 text-vellum"
          onClose={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <div className="on-dark flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <p className="font-display text-lg leading-tight sm:text-xl">
                {album.title}
                <span className="block text-base text-gilt-light">
                  {album.dateLabel}, photo {active.i + 1} of {album.photos.length}
                </span>
              </p>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="inline-flex size-12 shrink-0 items-center justify-center border border-gilt-light/60 text-vellum hover:bg-gilt-light hover:text-oxblood-deep"
                aria-label="Close photo viewer"
              >
                <CloseIcon className="size-6" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                placeholder="blur"
                blurDataURL={current.blurDataURL}
                priority
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-oxblood-deep/80 text-vellum hover:bg-gilt-light hover:text-oxblood-deep sm:left-4"
              >
                <ChevronIcon direction="left" className="size-7" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-oxblood-deep/80 text-vellum hover:bg-gilt-light hover:text-oxblood-deep sm:right-4"
              >
                <ChevronIcon className="size-7" />
              </button>
            </div>

            <p className="px-4 py-3 text-center text-base text-vellum/90 sm:px-6">{current.alt}</p>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
