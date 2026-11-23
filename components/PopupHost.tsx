"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PopupCard } from "@/components/PopupCard";
import type { PublicPopup } from "@/lib/popup";

const SHOW_DELAY_MS = 600;

function seenKey(version: number) {
  return `smsg-popup-seen-v${version}`;
}

/**
 * Fetches the current announcement at request time (never cached, so admin edits go
 * live immediately) and shows it in a native <dialog>: focus is trapped, Escape closes,
 * and focus returns to where it was.
 */
export function PopupHost() {
  const [popup, setPopup] = useState<PublicPopup | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const res = await fetch("/api/popup", { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { popup: PublicPopup | null };
        const p = data.popup;
        if (!p) return;

        if (p.frequency === "session") {
          try {
            if (sessionStorage.getItem(seenKey(p.version))) return;
          } catch {
            /* storage blocked: fall through and show it */
          }
        }
        timer = setTimeout(() => {
          setPopup(p);
          if (p.frequency === "session") {
            try {
              sessionStorage.setItem(seenKey(p.version), "1");
            } catch {
              /* ignore */
            }
          }
        }, SHOW_DELAY_MS);
      } catch {
        /* offline or aborted: no popup is better than a broken page */
      }
    })();

    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (popup && dialog && !dialog.open) {
      dialog.showModal();
      // Start on the close button, not on whichever link happens to come first in the message.
      dialog.querySelector<HTMLElement>("[data-popup-close]")?.focus();
    }
  }, [popup]);

  if (!popup) return null;

  return (
    <dialog
      ref={dialogRef}
      className="popup m-auto max-h-[100dvh] w-full max-w-[100vw] overflow-y-auto bg-transparent p-4 sm:w-auto"
      aria-labelledby={popup.title ? titleId : undefined}
      aria-label={popup.title ? undefined : "Announcement"}
      onClose={() => setPopup(null)}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className="flex justify-center">
        <PopupCard popup={popup} titleId={titleId} onClose={() => dialogRef.current?.close()} />
      </div>
    </dialog>
  );
}
