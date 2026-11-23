// Pure crypto for the admin session cookie. No framework imports so it is unit-testable.
//
// A session is "<expiry>.<nonce>.<signature>" where the signature is an HMAC-SHA256 over
// "<expiry>.<nonce>". The key is derived from SESSION_SECRET if set, otherwise from
// ADMIN_PASSWORD, so rotating the password signs everyone out. There is no user table.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_SECONDS = 60 * 60 * 8;

type Env = Record<string, string | undefined>;

function signingKey(env: Env): Buffer | null {
  const base = env.SESSION_SECRET?.trim() || env.ADMIN_PASSWORD;
  if (!base || (!env.SESSION_SECRET?.trim() && !isAdminConfigured(env))) return null;
  return createHash("sha256").update(`smsg-admin-session:${base}`).digest();
}

/** The admin password must be long enough that guessing it (online or from a stolen cookie) is impractical. */
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function isAdminConfigured(env: Env = process.env): boolean {
  return !!env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length >= MIN_ADMIN_PASSWORD_LENGTH;
}

/** True when a password is set but too short, so the admin screen can say exactly what's wrong. */
export function isAdminPasswordTooShort(env: Env = process.env): boolean {
  return !!env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < MIN_ADMIN_PASSWORD_LENGTH;
}

/** Constant-time password comparison (hashing first makes the lengths equal). */
export function verifyPassword(input: string, env: Env = process.env): boolean {
  const expected = env.ADMIN_PASSWORD;
  if (!expected || !isAdminConfigured(env)) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function sign(key: Buffer, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createSessionToken(env: Env = process.env, nowMs: number = Date.now()): string | null {
  const key = signingKey(env);
  if (!key) return null;
  const exp = Math.floor(nowMs / 1000) + SESSION_SECONDS;
  const payload = `${exp}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(key, payload)}`;
}

export function verifySessionToken(token: string, env: Env = process.env, nowMs: number = Date.now()): boolean {
  const key = signingKey(env);
  if (!key) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  const expected = sign(key, `${exp}.${nonce}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expSeconds = Number(exp);
  return Number.isFinite(expSeconds) && expSeconds > Math.floor(nowMs / 1000);
}
