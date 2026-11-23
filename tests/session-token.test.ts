import { describe, expect, it } from "vitest";
import {
  SESSION_SECONDS,
  createSessionToken,
  isAdminConfigured,
  verifyPassword,
  verifySessionToken,
} from "@/lib/session-token";

const ENV = { ADMIN_PASSWORD: "correct horse battery staple" };
const NOW = Date.parse("2026-11-23T12:00:00.000Z");

describe("admin password", () => {
  it("accepts only the exact password", () => {
    expect(verifyPassword("correct horse battery staple", ENV)).toBe(true);
    expect(verifyPassword("correct horse battery stapl", ENV)).toBe(false);
    expect(verifyPassword("", ENV)).toBe(false);
    expect(verifyPassword("CORRECT HORSE BATTERY STAPLE", ENV)).toBe(false);
  });

  it("fails closed when no password is configured", () => {
    expect(verifyPassword("anything", {})).toBe(false);
    expect(verifyPassword("", {})).toBe(false);
    expect(isAdminConfigured({})).toBe(false);
    expect(isAdminConfigured({ ADMIN_PASSWORD: "" })).toBe(false);
    expect(isAdminConfigured(ENV)).toBe(true);
  });
});

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const t = createSessionToken(ENV, NOW)!;
    expect(verifySessionToken(t, ENV, NOW + 1000)).toBe(true);
  });

  it("expires after the session lifetime", () => {
    const t = createSessionToken(ENV, NOW)!;
    expect(verifySessionToken(t, ENV, NOW + (SESSION_SECONDS - 5) * 1000)).toBe(true);
    expect(verifySessionToken(t, ENV, NOW + (SESSION_SECONDS + 5) * 1000)).toBe(false);
  });

  it("rejects a tampered expiry, nonce or signature", () => {
    const [exp, nonce, sig] = createSessionToken(ENV, NOW)!.split(".");
    expect(verifySessionToken(`${Number(exp) + 99999}.${nonce}.${sig}`, ENV, NOW)).toBe(false);
    expect(verifySessionToken(`${exp}.x${nonce}.${sig}`, ENV, NOW)).toBe(false);
    expect(verifySessionToken(`${exp}.${nonce}.${sig.slice(0, -2)}AA`, ENV, NOW)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    for (const bad of ["", "abc", "a.b", "a.b.c.d", "....", "9999999999.x.y"]) {
      expect(verifySessionToken(bad, ENV, NOW)).toBe(false);
    }
  });

  it("signing out everyone is as simple as changing the password", () => {
    const t = createSessionToken(ENV, NOW)!;
    expect(verifySessionToken(t, { ADMIN_PASSWORD: "a different password" }, NOW)).toBe(false);
  });

  it("SESSION_SECRET takes over signing when set", () => {
    const withSecret = { ...ENV, SESSION_SECRET: "s3cret" };
    const t = createSessionToken(withSecret, NOW)!;
    expect(verifySessionToken(t, withSecret, NOW)).toBe(true);
    expect(verifySessionToken(t, ENV, NOW)).toBe(false);
  });

  it("issues nothing without configuration, and verifies nothing", () => {
    expect(createSessionToken({}, NOW)).toBeNull();
    expect(verifySessionToken("1.2.3", {}, NOW)).toBe(false);
  });

  it("every token is unique", () => {
    expect(createSessionToken(ENV, NOW)).not.toBe(createSessionToken(ENV, NOW));
  });
});
