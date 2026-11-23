"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

/** Copies text to the clipboard and announces the result to screen readers. */
export function CopyButton({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button type="button" onClick={copy} className={`btn btn-outline !min-h-11 !px-4 ${className}`}>
      {state === "copied" ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" />}
      <span>{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}</span>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Could not copy. Select the text and copy it manually." : ""}
      </span>
    </button>
  );
}
