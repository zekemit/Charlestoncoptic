import { z } from "zod";
import { isSafeHref } from "@/lib/rich-text";

export const FREQUENCIES = ["session", "always"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<Frequency, { title: string; help: string }> = {
  session: { title: "Once per session", help: "A visitor sees it one time, then not again until they come back later." },
  always: { title: "Every visit", help: "It appears each time someone opens the homepage." },
};

export function isSafeImageUrl(value: string): boolean {
  const v = value.trim();
  if (v.startsWith("/")) return !v.startsWith("//") && !v.includes("\\");
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const popupSchema = z
  .object({
    enabled: z.boolean(),
    title: z.string().trim().max(120, "Keep the title under 120 characters."),
    body: z.string().trim().max(2000, "Keep the message under 2,000 characters."),
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((v) => v === "" || isSafeImageUrl(v), "Use a full web address starting with https://"),
    imageAlt: z.string().trim().max(200, "Keep the image description under 200 characters."),
    ctaEnabled: z.boolean(),
    ctaLabel: z.string().trim().max(40, "Keep the button label under 40 characters."),
    ctaUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((v) => v === "" || isSafeHref(v), "Use a web address starting with https://, or a page like /donate"),
    expiresAt: z.iso.datetime().nullable(),
    frequency: z.enum(FREQUENCIES),
  })
  .superRefine((v, ctx) => {
    if (v.enabled && !v.title && !v.body && !v.imageUrl) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Add a title, a message, or an image before turning the popup on." });
    }
    if (v.ctaEnabled && !v.ctaLabel) {
      ctx.addIssue({ code: "custom", path: ["ctaLabel"], message: "Add a label for the button." });
    }
    if (v.ctaEnabled && !v.ctaUrl) {
      ctx.addIssue({ code: "custom", path: ["ctaUrl"], message: "Add the address the button should open." });
    }
  });

export type PopupInput = z.infer<typeof popupSchema>;

export type PopupConfig = PopupInput & {
  /** Bumped on every save so "once per session" starts fresh for new announcements. */
  version: number;
  updatedAt: string | null;
};

export const DEFAULT_POPUP: PopupConfig = {
  enabled: false,
  title: "",
  body: "",
  imageUrl: "",
  imageAlt: "",
  ctaEnabled: false,
  ctaLabel: "",
  ctaUrl: "",
  expiresAt: null,
  frequency: "session",
  version: 0,
  updatedAt: null,
};

/** Merge stored data over defaults so older saved shapes keep working. */
export function normalizePopup(raw: unknown): PopupConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<PopupConfig>;
  return {
    ...DEFAULT_POPUP,
    ...r,
    frequency: r.frequency === "always" ? "always" : "session",
    version: Number.isFinite(r.version) ? Number(r.version) : 0,
    expiresAt: typeof r.expiresAt === "string" && !Number.isNaN(Date.parse(r.expiresAt)) ? r.expiresAt : null,
  };
}

export type PopupStatus = "live" | "off" | "expired";

export function popupStatus(c: PopupConfig, now: number = Date.now()): PopupStatus {
  if (!c.enabled) return "off";
  if (c.expiresAt && Date.parse(c.expiresAt) <= now) return "expired";
  return "live";
}

export const isPopupActive = (c: PopupConfig, now: number = Date.now()) => popupStatus(c, now) === "live";

/** What visitors' browsers receive: no internal fields. */
export type PublicPopup = Pick<
  PopupConfig,
  "title" | "body" | "imageUrl" | "imageAlt" | "ctaEnabled" | "ctaLabel" | "ctaUrl" | "frequency" | "version" | "expiresAt"
>;

export function toPublic(c: PopupConfig): PublicPopup {
  return {
    title: c.title,
    body: c.body,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt,
    ctaEnabled: c.ctaEnabled && !!c.ctaLabel && !!c.ctaUrl,
    ctaLabel: c.ctaLabel,
    ctaUrl: c.ctaUrl,
    frequency: c.frequency,
    version: c.version,
    expiresAt: c.expiresAt,
  };
}
