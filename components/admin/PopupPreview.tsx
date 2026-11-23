"use client";

import { useEffect, useRef, useState } from "react";
import { PopupCard, type PopupCardData } from "@/components/PopupCard";

/**
 * Renders children at a fixed "virtual" screen size and scales the whole thing down to fit
 * the available width, so a 1280px laptop and a 390px phone both show true proportions.
 */
function ScaledScreen({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={box} className="w-full">
      <div style={{ height: height * scale }} className="overflow-hidden">
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  );
}

function MockHomepage({ device, popup }: { device: "desktop" | "mobile"; popup: PopupCardData }) {
  const mobile = device === "mobile";
  return (
    <div className="relative h-full w-full overflow-hidden bg-vellum">
      <div className="flex items-center gap-3 border-b border-gilt/60 bg-paper px-5" style={{ height: mobile ? 56 : 72 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/crest-seal.png" alt="" width={mobile ? 32 : 44} height={mobile ? 32 : 44} />
        <span className="font-display font-bold text-oxblood" style={{ fontSize: mobile ? 17 : 24 }}>
          St. Mary &amp; St. George
        </span>
      </div>
      <div className="relative" style={{ height: mobile ? 360 : 520 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/site/hero-church.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative px-6 pt-10 sm:px-12" style={{ paddingLeft: mobile ? 24 : 80, paddingTop: mobile ? 36 : 80 }}>
          <p className="font-display italic text-gilt-deep" style={{ fontSize: mobile ? 20 : 30 }}>
            Welcome to
          </p>
          <p className="font-display font-bold leading-tight text-oxblood" style={{ fontSize: mobile ? 36 : 68 }}>
            St. Mary &amp; St. George
            <br />
            Coptic Orthodox Church
          </p>
        </div>
      </div>
      <div className="absolute inset-0 bg-[rgb(26_12_14/0.62)]" />
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ padding: mobile ? 16 : 40 }}>
        <PopupCard popup={popup} preview />
      </div>
    </div>
  );
}

export function PopupPreview({ popup, enabled }: { popup: PopupCardData; enabled: boolean }) {
  const empty = !popup.title && !popup.body && !popup.imageUrl;
  return (
    <section aria-labelledby="preview-heading">
      <h2 id="preview-heading" className="text-3xl">
        Live preview
      </h2>
      <p className="mt-1 text-base text-ink-soft">
        {enabled
          ? "This is how the popup looks on screens of different sizes. It updates as you type."
          : "The popup is turned off, so visitors won't see it. This preview shows your draft."}
      </p>
      {empty ? (
        <p className="mt-3 border-l-4 border-gilt bg-paper p-3 text-base">
          Add a title, a message, or an image to see the preview.
        </p>
      ) : null}

      {/* The frames are a picture of the popup, not controls: keep them out of the tab order. */}
      <div inert className="mt-5 space-y-8">
        <figure>
          <figcaption className="mb-2 font-bold text-ink">Computer screen</figcaption>
          <div className="border border-ink/40 bg-ink/90 p-1.5">
            <div className="mb-1.5 flex items-center gap-1.5 px-1">
              <span className="size-2 rounded-full bg-vellum/50" />
              <span className="size-2 rounded-full bg-vellum/50" />
              <span className="size-2 rounded-full bg-vellum/50" />
              <span className="ml-3 h-3.5 flex-1 bg-vellum/20" />
            </div>
            <ScaledScreen width={1280} height={720}>
              <MockHomepage device="desktop" popup={popup} />
            </ScaledScreen>
          </div>
        </figure>

        <figure>
          <figcaption className="mb-2 font-bold text-ink">Phone screen</figcaption>
          <div className="mx-auto max-w-[15rem] rounded-[1.75rem] border-[6px] border-ink/90 bg-ink/90">
            <div className="overflow-hidden rounded-[1.25rem]">
              <ScaledScreen width={390} height={760}>
                <MockHomepage device="mobile" popup={popup} />
              </ScaledScreen>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
