import { RichText } from "@/components/RichText";
import { CloseIcon } from "@/components/icons";
import type { PublicPopup } from "@/lib/popup";

export type PopupCardData = Pick<
  PublicPopup,
  "title" | "body" | "imageUrl" | "imageAlt" | "ctaEnabled" | "ctaLabel" | "ctaUrl"
>;

/**
 * The announcement card. Used on the live homepage (inside a <dialog>) and, with
 * `preview`, inside the admin screen's desktop/mobile frames. Its width depends only
 * on its container, so the preview frames show what a phone or a laptop will show.
 */
export function PopupCard({
  popup,
  onClose,
  preview = false,
  titleId,
}: {
  popup: PopupCardData;
  onClose?: () => void;
  preview?: boolean;
  titleId?: string;
}) {
  const showCta = popup.ctaEnabled && !!popup.ctaLabel && !!popup.ctaUrl;
  const external = /^https?:/i.test(popup.ctaUrl);

  return (
    <div className="relative w-full max-w-[28rem] border border-gilt bg-paper text-ink shadow-2xl">
      {popup.imageUrl ? (
        // Admin-supplied URL on any host, so next/image's remotePatterns can't apply.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popup.imageUrl}
          alt={popup.imageAlt}
          className="block max-h-[22rem] w-full bg-vellum-deep object-contain"
          referrerPolicy="no-referrer"
        />
      ) : null}

      <div className="p-6 sm:p-7">
        {popup.title ? (
          <h2 id={titleId} className="pr-8 text-[1.9rem] leading-tight">
            {popup.title}
          </h2>
        ) : null}
        {popup.body ? <RichText source={popup.body} className={`text-[1.05rem] ${popup.title ? "mt-3" : ""}`} /> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {showCta ? (
            preview ? (
              <span className="btn btn-primary">{popup.ctaLabel}</span>
            ) : (
              <a
                href={popup.ctaUrl}
                className="btn btn-primary"
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {popup.ctaLabel}
              </a>
            )
          ) : null}
          <button type="button" className="btn btn-outline" onClick={onClose} tabIndex={preview ? -1 : 0}>
            Close
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        tabIndex={preview ? -1 : 0}
        aria-label="Close announcement"
        data-popup-close
        className="absolute right-2 top-2 inline-flex size-11 items-center justify-center bg-paper/90 text-oxblood hover:bg-vellum-deep"
      >
        <CloseIcon className="size-6" />
      </button>
    </div>
  );
}
