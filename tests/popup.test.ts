import { describe, expect, it } from "vitest";
import {
  DEFAULT_POPUP,
  type PopupConfig,
  isPopupActive,
  normalizePopup,
  popupSchema,
  popupStatus,
  toPublic,
} from "@/lib/popup";
import { fieldErrors } from "@/lib/zod-errors";

const valid = {
  enabled: true,
  title: "No liturgy this Saturday",
  body: "Have a blessed week!",
  imageUrl: "",
  imageAlt: "",
  ctaEnabled: false,
  ctaLabel: "",
  ctaUrl: "",
  expiresAt: null,
  frequency: "session" as const,
};

const NOW = Date.parse("2026-11-23T12:00:00.000Z");
const cfg = (over: Partial<PopupConfig>): PopupConfig => ({ ...DEFAULT_POPUP, ...valid, version: 3, ...over });

describe("popupSchema", () => {
  it("accepts a normal announcement", () => {
    expect(popupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires some content before the popup can be turned on", () => {
    const r = popupSchema.safeParse({ ...valid, title: "", body: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).title).toMatch(/title, a message, or an image/i);
  });

  it("allows an empty draft while the popup is off", () => {
    expect(popupSchema.safeParse({ ...valid, enabled: false, title: "", body: "" }).success).toBe(true);
  });

  it("requires a label and address when the button is on", () => {
    const r = popupSchema.safeParse({ ...valid, ctaEnabled: true });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.ctaLabel).toBeTruthy();
    }
    expect(popupSchema.safeParse({ ...valid, ctaEnabled: true, ctaLabel: "Donate", ctaUrl: "/donate" }).success).toBe(true);
  });

  it.each(["javascript:alert(1)", "data:text/html;base64,AAAA", "//evil.example/x"])("rejects unsafe button address %s", (ctaUrl) => {
    const r = popupSchema.safeParse({ ...valid, ctaEnabled: true, ctaLabel: "Go", ctaUrl });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).ctaUrl).toBeTruthy();
  });

  it.each(["javascript:alert(1)", "data:image/svg+xml,<svg onload=alert(1)>", "ftp://x.y/z.jpg", "not a url"])(
    "rejects unsafe image address %s",
    (imageUrl) => {
      expect(popupSchema.safeParse({ ...valid, imageUrl }).success).toBe(false);
    },
  );

  it("accepts site-relative and https images", () => {
    expect(popupSchema.safeParse({ ...valid, imageUrl: "/images/site/hero-church.jpg" }).success).toBe(true);
    expect(popupSchema.safeParse({ ...valid, imageUrl: "https://cdn.example.org/flyer.png" }).success).toBe(true);
  });

  it("requires an ISO instant for the stop time", () => {
    expect(popupSchema.safeParse({ ...valid, expiresAt: "2026-11-29T04:59:00.000Z" }).success).toBe(true);
    expect(popupSchema.safeParse({ ...valid, expiresAt: "tomorrow" }).success).toBe(false);
  });

  it("rejects unknown frequencies and oversize text", () => {
    expect(popupSchema.safeParse({ ...valid, frequency: "hourly" }).success).toBe(false);
    expect(popupSchema.safeParse({ ...valid, title: "x".repeat(121) }).success).toBe(false);
    expect(popupSchema.safeParse({ ...valid, body: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("popup status", () => {
  it("is off when disabled", () => {
    expect(popupStatus(cfg({ enabled: false }), NOW)).toBe("off");
    expect(isPopupActive(cfg({ enabled: false }), NOW)).toBe(false);
  });

  it("is live with no stop time", () => {
    expect(popupStatus(cfg({}), NOW)).toBe("live");
  });

  it("is live before the stop time and expired at or after it", () => {
    expect(popupStatus(cfg({ expiresAt: "2026-11-23T12:00:01.000Z" }), NOW)).toBe("live");
    expect(popupStatus(cfg({ expiresAt: "2026-11-23T12:00:00.000Z" }), NOW)).toBe("expired");
    expect(popupStatus(cfg({ expiresAt: "2026-11-22T00:00:00.000Z" }), NOW)).toBe("expired");
  });

  it("an expired popup is never sent to visitors' browsers", () => {
    expect(isPopupActive(cfg({ expiresAt: "2026-10-31T21:15:00.000Z" }), NOW)).toBe(false);
  });
});

describe("toPublic / normalizePopup", () => {
  it("does not leak internal fields", () => {
    const pub = toPublic(cfg({ updatedAt: "2026-11-01T00:00:00.000Z" }));
    expect(pub).not.toHaveProperty("updatedAt");
    expect(pub).not.toHaveProperty("enabled");
  });

  it("drops a half-configured button", () => {
    expect(toPublic(cfg({ ctaEnabled: true, ctaLabel: "Go", ctaUrl: "" })).ctaEnabled).toBe(false);
    expect(toPublic(cfg({ ctaEnabled: true, ctaLabel: "Go", ctaUrl: "/donate" })).ctaEnabled).toBe(true);
  });

  it("fills defaults for older or partial stored data", () => {
    const n = normalizePopup({ enabled: true, title: "Hi" });
    expect(n).toMatchObject({ enabled: true, title: "Hi", frequency: "session", version: 0, expiresAt: null, imageAlt: "" });
  });

  it("survives garbage", () => {
    expect(normalizePopup(null)).toEqual(DEFAULT_POPUP);
    expect(normalizePopup("nope")).toEqual(DEFAULT_POPUP);
    expect(normalizePopup({ expiresAt: "bogus", version: "x", frequency: "weird" })).toMatchObject({
      expiresAt: null,
      version: 0,
      frequency: "session",
    });
  });
});
