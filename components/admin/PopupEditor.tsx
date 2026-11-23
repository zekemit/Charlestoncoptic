"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PopupPreview } from "@/components/admin/PopupPreview";
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  type Frequency,
  type PopupConfig,
  type PopupInput,
  type PopupStatus,
  isSafeImageUrl,
  popupSchema,
} from "@/lib/popup";
import { applyFormat, type FormatKind } from "@/lib/rich-text-edit";
import { isSafeHref } from "@/lib/rich-text";
import {
  addDaysLocal,
  formatZoned,
  nowZonedInput,
  utcToZonedInput,
  weekdayLocal,
  zonedInputToUtc,
} from "@/lib/zoned-time";
import { fieldErrors } from "@/lib/zod-errors";

type StorageMode = "redis" | "file" | "unconfigured";

const SITE_PHOTOS = [
  { label: "The church building", url: "/images/site/new-church-1.jpg", alt: "The new church building, a white wooden chapel with a steeple" },
  { label: "The property from above", url: "/images/site/new-church-2.jpg", alt: "Aerial view of the new church property" },
  { label: "The hall inside", url: "/images/site/new-church-3.jpg", alt: "The bright, empty interior hall of the new church" },
  { label: "White church with steeple", url: "/images/site/hero-church.jpg", alt: "The white wooden church with its steeple and red doors" },
];

const toDraft = (c: PopupConfig | PopupInput): PopupInput => ({
  enabled: c.enabled,
  title: c.title,
  body: c.body,
  imageUrl: c.imageUrl,
  imageAlt: c.imageAlt,
  ctaEnabled: c.ctaEnabled,
  ctaLabel: c.ctaLabel,
  ctaUrl: c.ctaUrl,
  expiresAt: c.expiresAt,
  frequency: c.frequency,
});

function Switch({
  checked,
  onChange,
  label,
  describedBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center border transition-colors ${
        checked ? "border-oxblood bg-oxblood" : "border-ink-soft bg-vellum-deep"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-6 transition-transform ${
          checked ? "translate-x-7 bg-gilt-light" : "translate-x-1 bg-ink-soft"
        }`}
      />
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      {message}
    </p>
  );
}

function ToolButton({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center border border-ink-soft bg-paper font-bold text-ink hover:bg-vellum-deep"
    >
      {children}
    </button>
  );
}

const STATUS_COPY: Record<PopupStatus, { title: string; detail: string; tone: string }> = {
  live: { title: "Live now", detail: "Visitors to the homepage can see this popup.", tone: "border-ok text-ok" },
  off: { title: "Off", detail: "No popup is showing on the homepage.", tone: "border-ink-soft text-ink-soft" },
  expired: { title: "Expired", detail: "The stop time has passed, so no popup is showing.", tone: "border-danger text-danger" },
};

export function PopupEditor({
  initial,
  storage,
  loadError,
}: {
  initial: PopupConfig;
  storage: StorageMode;
  loadError?: string;
}) {
  const [saved, setSaved] = useState<PopupConfig>(initial);
  const [draft, setDraft] = useState<PopupInput>(() => toDraft(initial));
  const [expiryOn, setExpiryOn] = useState(!!initial.expiresAt);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved));

  // Wall-clock for the status badge, kept in state so rendering stays pure.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status: PopupStatus = !saved.enabled
    ? "off"
    : saved.expiresAt && now !== null && Date.parse(saved.expiresAt) <= now
      ? "expired"
      : "live";

  function set<K extends keyof PopupInput>(key: K, value: PopupInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
    setResult(null);
  }

  function format(kind: FormatKind, url = "") {
    const ta = bodyRef.current;
    if (!ta) return;
    const r = applyFormat(ta.value, ta.selectionStart, ta.selectionEnd, kind, url);
    set("body", r.value);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(r.start, r.end);
    });
  }

  function addLink() {
    if (!isSafeHref(linkUrl)) {
      setLinkError("Use a web address starting with https://, or a page like /donate");
      return;
    }
    format("link", linkUrl.trim());
    setLinkOpen(false);
    setLinkUrl("");
    setLinkError("");
  }

  function toggleExpiry(on: boolean) {
    setExpiryOn(on);
    if (!on) {
      set("expiresAt", null);
      return;
    }
    // Default: the end of this Saturday (Eastern), a natural stop time for a liturgy notice.
    set("expiresAt", zonedInputToUtc(endOfSaturday()));
  }

  function endOfTonight() {
    return `${nowZonedInput().slice(0, 10)}T23:59`;
  }
  function endOfSaturday() {
    const today = nowZonedInput();
    const daysAhead = (6 - weekdayLocal(today) + 7) % 7;
    return `${addDaysLocal(today, daysAhead).slice(0, 10)}T23:59`;
  }

  async function save(payload: PopupInput, offNow = false) {
    if (saving) return;
    setResult(null);

    const toSend: PopupInput = { ...payload, expiresAt: expiryOn || offNow ? payload.expiresAt : null };
    if (!offNow && expiryOn && !toSend.expiresAt) {
      setErrors({ expiresAt: "Choose when the popup should stop showing, or turn this setting off." });
      setResult({ kind: "error", text: "Please fix the highlighted fields." });
      return;
    }

    const parsed = popupSchema.safeParse(toSend);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setResult({ kind: "error", text: "Please fix the highlighted fields." });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/admin/popup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => null)) as {
        config?: PopupConfig;
        message?: string;
        errors?: Record<string, string>;
      } | null;

      if (res.ok && data?.config) {
        setSaved(data.config);
        setDraft(toDraft(data.config));
        const c = data.config;
        setResult({
          kind: "ok",
          text: !c.enabled
            ? "Saved. The popup is turned off, so visitors won't see it."
            : c.expiresAt
              ? `Saved. The popup is live on the homepage and stops showing ${formatZoned(c.expiresAt)} Eastern.`
              : "Saved. The popup is live on the homepage now.",
        });
      } else if (res.status === 401) {
        setResult({ kind: "error", text: "Your session has ended. Reload this page and sign in again. Your edits are still on screen." });
      } else {
        if (data?.errors) setErrors(data.errors);
        setResult({ kind: "error", text: data?.message ?? "Your changes couldn't be saved. Please try again." });
      }
    } catch {
      setResult({ kind: "error", text: "We couldn't reach the server. Check your connection and try again." });
    }
    setSaving(false);
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.reload();
  }

  const previewPopup = {
    title: draft.title,
    body: draft.body,
    imageUrl: draft.imageUrl && isSafeImageUrl(draft.imageUrl) ? draft.imageUrl : "",
    imageAlt: draft.imageAlt,
    ctaEnabled: draft.ctaEnabled,
    ctaLabel: draft.ctaLabel,
    ctaUrl: draft.ctaUrl && isSafeHref(draft.ctaUrl) ? draft.ctaUrl : "",
  };

  const statusCopy = STATUS_COPY[status];
  const canSave = !saving && storage !== "unconfigured";
  const expiryLocal = draft.expiresAt ? utcToZonedInput(draft.expiresAt) : "";

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">Homepage popup</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Write an announcement, check how it looks, and publish it. Changes appear on the homepage as soon as you save.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-11">
            View homepage<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button type="button" onClick={signOut} className="btn btn-outline !min-h-11">
            Sign out
          </button>
        </div>
      </div>

      {loadError ? (
        <p role="alert" className="mt-6 border-l-4 border-danger bg-paper p-4 font-bold text-danger">
          {loadError}
        </p>
      ) : null}
      {storage === "unconfigured" ? (
        <p role="alert" className="mt-6 border-l-4 border-danger bg-paper p-4 text-danger">
          <strong>Saving is turned off.</strong> This site has no storage connected yet. Connect Upstash Redis in the
          Vercel project (Storage tab), then redeploy. See the README for the three steps.
        </p>
      ) : null}
      {storage === "file" ? (
        <p className="mt-6 border-l-4 border-gilt bg-paper p-4 text-base">
          Local development: settings are saved to <code>data/popup.json</code> on this computer.
        </p>
      ) : null}

      {/* Current published state */}
      <div className={`mt-8 flex flex-wrap items-center justify-between gap-4 border-l-4 bg-paper p-4 ${statusCopy.tone}`}>
        <p>
          <span className="font-display text-2xl font-bold">{statusCopy.title}.</span>{" "}
          <span className="text-ink">{statusCopy.detail}</span>
          {status === "live" && saved.expiresAt ? (
            <span className="block text-base text-ink-soft">Stops showing {formatZoned(saved.expiresAt)} Eastern.</span>
          ) : null}
        </p>
        {status === "live" ? (
          <button
            type="button"
            className="btn btn-outline !min-h-11"
            disabled={saving || storage === "unconfigured"}
            onClick={() => save({ ...toDraft(saved), enabled: false }, true)}
          >
            Turn off now
          </button>
        ) : null}
      </div>

      <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(draft);
          }}
          className="space-y-10"
        >
          {/* 1. Master switch */}
          <fieldset className="border border-gilt bg-paper p-5">
            <legend className="px-2 font-display text-2xl font-bold text-oxblood">Show the popup</legend>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p id={id("enabled-help")} className="max-w-sm text-base text-ink-soft">
                  Turn this on to show the popup to visitors on the homepage. Turn it off to hide it without losing your text.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 text-right font-bold" aria-hidden="true">
                  {draft.enabled ? "On" : "Off"}
                </span>
                <Switch
                  checked={draft.enabled}
                  onChange={(v) => set("enabled", v)}
                  label="Show the popup on the homepage"
                  describedBy={id("enabled-help")}
                />
              </div>
            </div>
          </fieldset>

          {/* 2. Message */}
          <fieldset className="space-y-5 border border-gilt bg-paper p-5">
            <legend className="px-2 font-display text-2xl font-bold text-oxblood">Message</legend>

            <div>
              <label htmlFor={id("title")} className="field-label">
                Title
              </label>
              <input
                id={id("title")}
                className="field"
                value={draft.title}
                maxLength={120}
                placeholder="For example: No liturgy this Saturday"
                onChange={(e) => set("title", e.target.value)}
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={errors.title ? id("title-error") : undefined}
              />
              <FieldError id={id("title-error")} message={errors.title} />
            </div>

            <div>
              <label htmlFor={id("body")} className="field-label">
                Message
              </label>
              <div className="mb-2 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Text formatting">
                <ToolButton label="Bold" onClick={() => format("bold")}>
                  <span className="font-bold">B</span>
                </ToolButton>
                <ToolButton label="Italic" onClick={() => format("italic")}>
                  <span className="italic">I</span>
                </ToolButton>
                <ToolButton label="Bulleted list" onClick={() => format("bullets")}>
                  <span aria-hidden="true">•</span>
                </ToolButton>
                <button
                  type="button"
                  onClick={() => setLinkOpen((v) => !v)}
                  aria-expanded={linkOpen}
                  className="inline-flex h-10 items-center border border-ink-soft bg-paper px-3 font-bold text-ink hover:bg-vellum-deep"
                >
                  Add link
                </button>
              </div>
              {linkOpen ? (
                <div className="mb-3 border border-gilt/70 bg-vellum p-3">
                  <label htmlFor={id("link")} className="field-label">
                    Link address
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      id={id("link")}
                      className="field !w-auto min-w-0 flex-1"
                      value={linkUrl}
                      placeholder="https://… or /donate"
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        setLinkError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLink();
                        }
                      }}
                      aria-invalid={linkError ? true : undefined}
                      aria-describedby={linkError ? id("link-error") : id("link-help")}
                    />
                    <button type="button" className="btn btn-primary !min-h-12" onClick={addLink}>
                      Insert link
                    </button>
                  </div>
                  <p id={id("link-help")} className="mt-1 text-sm text-ink-soft">
                    Select some words in the message first and they become the link text.
                  </p>
                  <FieldError id={id("link-error")} message={linkError} />
                </div>
              ) : null}
              <textarea
                id={id("body")}
                ref={bodyRef}
                rows={7}
                className="field"
                value={draft.body}
                maxLength={2000}
                placeholder="Have a blessed week! We look forward to seeing you next Saturday."
                onChange={(e) => set("body", e.target.value)}
                aria-invalid={errors.body ? true : undefined}
                aria-describedby={`${id("body-count")}${errors.body ? ` ${id("body-error")}` : ""}`}
              />
              <p id={id("body-count")} className="mt-1 text-sm text-ink-soft">
                {draft.body.length} of 2,000 characters. Leave a blank line between paragraphs.
              </p>
              <FieldError id={id("body-error")} message={errors.body} />
              <details className="mt-2 text-base">
                <summary className="cursor-pointer font-bold text-lapis">Formatting help</summary>
                <ul className="mt-2 space-y-1 text-ink-soft">
                  <li>
                    <code>**bold**</code> makes <strong>bold</strong> text, <code>*italic*</code> makes <em>italic</em>.
                  </li>
                  <li>
                    <code>[words](https://example.org)</code> makes a link.
                  </li>
                  <li>
                    Start lines with <code>- </code> for a bulleted list.
                  </li>
                </ul>
              </details>
            </div>

            <div className="space-y-4 border-t border-gilt/50 pt-5">
              <div>
                <label htmlFor={id("image")} className="field-label">
                  Image or flyer <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <input
                  id={id("image")}
                  className="field"
                  type="url"
                  inputMode="url"
                  value={draft.imageUrl}
                  placeholder="https://example.org/flyer.jpg"
                  onChange={(e) => set("imageUrl", e.target.value)}
                  aria-invalid={errors.imageUrl ? true : undefined}
                  aria-describedby={`${id("image-help")}${errors.imageUrl ? ` ${id("image-error")}` : ""}`}
                />
                <p id={id("image-help")} className="mt-1 text-sm text-ink-soft">
                  Paste the web address of a picture, or choose one of the church photos below.
                </p>
                <FieldError id={id("image-error")} message={errors.imageUrl} />
              </div>
              <div>
                <label htmlFor={id("photo")} className="field-label">
                  Or choose a church photo
                </label>
                <select
                  id={id("photo")}
                  className="field"
                  value=""
                  onChange={(e) => {
                    const p = SITE_PHOTOS.find((x) => x.url === e.target.value);
                    if (!p) return;
                    set("imageUrl", p.url);
                    if (!draft.imageAlt) set("imageAlt", p.alt);
                  }}
                >
                  <option value="">Choose a photo…</option>
                  {SITE_PHOTOS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {draft.imageUrl ? (
                <div>
                  <label htmlFor={id("alt")} className="field-label">
                    Describe the image
                  </label>
                  <input
                    id={id("alt")}
                    className="field"
                    value={draft.imageAlt}
                    maxLength={200}
                    placeholder="For example: Flyer for the parish picnic on June 8"
                    onChange={(e) => set("imageAlt", e.target.value)}
                    aria-describedby={id("alt-help")}
                  />
                  <p id={id("alt-help")} className="mt-1 text-sm text-ink-soft">
                    Read aloud to visitors who can&rsquo;t see the image. If the flyer contains text, repeat it here.
                  </p>
                  <button type="button" className="link mt-2 text-base" onClick={() => { set("imageUrl", ""); set("imageAlt", ""); }}>
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>
          </fieldset>

          {/* 3. Button */}
          <fieldset className="space-y-5 border border-gilt bg-paper p-5">
            <legend className="px-2 font-display text-2xl font-bold text-oxblood">Button</legend>
            <div className="flex items-center justify-between gap-4">
              <p id={id("cta-help")} className="text-base text-ink-soft">
                Add a button that sends visitors to a page, such as Donate or Visit Us.
              </p>
              <Switch
                checked={draft.ctaEnabled}
                onChange={(v) => set("ctaEnabled", v)}
                label="Show a button in the popup"
                describedBy={id("cta-help")}
              />
            </div>
            {draft.ctaEnabled ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor={id("cta-label")} className="field-label">
                    Button label
                  </label>
                  <input
                    id={id("cta-label")}
                    className="field"
                    value={draft.ctaLabel}
                    maxLength={40}
                    placeholder="Plan your visit"
                    onChange={(e) => set("ctaLabel", e.target.value)}
                    aria-invalid={errors.ctaLabel ? true : undefined}
                    aria-describedby={errors.ctaLabel ? id("cta-label-error") : undefined}
                  />
                  <FieldError id={id("cta-label-error")} message={errors.ctaLabel} />
                </div>
                <div>
                  <label htmlFor={id("cta-url")} className="field-label">
                    Where it goes
                  </label>
                  <input
                    id={id("cta-url")}
                    className="field"
                    value={draft.ctaUrl}
                    placeholder="/visit-us or https://…"
                    onChange={(e) => set("ctaUrl", e.target.value)}
                    aria-invalid={errors.ctaUrl ? true : undefined}
                    aria-describedby={errors.ctaUrl ? id("cta-url-error") : undefined}
                  />
                  <FieldError id={id("cta-url-error")} message={errors.ctaUrl} />
                </div>
              </div>
            ) : null}
          </fieldset>

          {/* 4. Display rules */}
          <fieldset className="space-y-6 border border-gilt bg-paper p-5">
            <legend className="px-2 font-display text-2xl font-bold text-oxblood">When to show it</legend>

            <div>
              <div className="flex items-center justify-between gap-4">
                <p id={id("expiry-help")} className="text-base text-ink-soft">
                  Stop showing the popup automatically at a set time (Eastern Time, Charleston).
                </p>
                <Switch checked={expiryOn} onChange={toggleExpiry} label="Stop showing automatically" describedBy={id("expiry-help")} />
              </div>
              {expiryOn ? (
                <div className="mt-4">
                  <label htmlFor={id("expires")} className="field-label">
                    Stop showing on
                  </label>
                  <input
                    id={id("expires")}
                    type="datetime-local"
                    className="field max-w-xs"
                    value={expiryLocal}
                    onChange={(e) => set("expiresAt", e.target.value ? zonedInputToUtc(e.target.value) : null)}
                    aria-invalid={errors.expiresAt ? true : undefined}
                    aria-describedby={errors.expiresAt ? id("expires-error") : undefined}
                  />
                  <FieldError id={id("expires-error")} message={errors.expiresAt} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline !min-h-10 !px-3 !py-1 text-base" onClick={() => set("expiresAt", zonedInputToUtc(endOfTonight()))}>
                      Tonight, 11:59 PM
                    </button>
                    <button type="button" className="btn btn-outline !min-h-10 !px-3 !py-1 text-base" onClick={() => set("expiresAt", zonedInputToUtc(endOfSaturday()))}>
                      End of Saturday
                    </button>
                    <button type="button" className="btn btn-outline !min-h-10 !px-3 !py-1 text-base" onClick={() => set("expiresAt", zonedInputToUtc(`${addDaysLocal(nowZonedInput(), 7).slice(0, 10)}T23:59`))}>
                      In one week
                    </button>
                  </div>
                  {draft.expiresAt && now !== null && Date.parse(draft.expiresAt) <= now ? (
                    <p className="mt-3 border-l-4 border-danger bg-vellum p-2 text-base text-danger">
                      That time has already passed, so the popup won&rsquo;t show. Pick a later time.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <fieldset className="border-t border-gilt/50 pt-5">
              <legend className="field-label">How often visitors see it</legend>
              <div className="space-y-3">
                {FREQUENCIES.map((f: Frequency) => (
                  <label key={f} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name={id("frequency")}
                      value={f}
                      checked={draft.frequency === f}
                      onChange={() => set("frequency", f)}
                      className="mt-1.5 size-5 accent-oxblood"
                    />
                    <span>
                      <span className="font-bold">{FREQUENCY_LABELS[f].title}</span>
                      <span className="block text-base text-ink-soft">{FREQUENCY_LABELS[f].help}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </fieldset>

          {/* Actions */}
          <div className="sticky bottom-0 z-10 -mx-5 border-t border-gilt bg-vellum/95 px-5 py-4 backdrop-blur sm:mx-0 sm:px-0">
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={!canSave || (!dirty && !result)}>
                {saving ? "Saving…" : "Save and publish"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={!dirty || saving}
                onClick={() => {
                  setDraft(toDraft(saved));
                  setExpiryOn(!!saved.expiresAt);
                  setErrors({});
                  setResult(null);
                }}
              >
                Discard changes
              </button>
              {dirty ? <span className="font-bold text-gilt-deep">You have unsaved changes.</span> : null}
            </div>
            <div role="status" aria-live="polite" className="mt-3">
              {result ? (
                <p
                  className={`border-l-4 bg-paper p-3 font-bold ${
                    result.kind === "ok" ? "border-ok text-ok" : "border-danger text-danger"
                  }`}
                >
                  {result.text}
                </p>
              ) : null}
            </div>
          </div>
        </form>

        {/* On wide screens this column sticks beside the form and scrolls on its own, so it must be
            reachable by keyboard (WCAG 2.1.1). */}
        <div
          tabIndex={0}
          role="group"
          aria-label="Live preview, scrollable area"
          className="xl:sticky xl:top-6 xl:max-h-[calc(100dvh-3rem)] xl:self-start xl:overflow-y-auto xl:pr-2"
        >
          <PopupPreview popup={previewPopup} enabled={draft.enabled} />
        </div>
      </div>
    </div>
  );
}
