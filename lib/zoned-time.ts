// Convert between a wall-clock time in the church's time zone and a UTC instant,
// without a date library. Used by the admin "stop showing on" field so "11:59 PM"
// always means Charleston time no matter where the admin is sitting.

export const CHURCH_TZ = "America/New_York";

const formatters = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(tz, f);
  }
  return f;
}

function partsAt(utcMs: number, tz: string) {
  const o: Record<string, number> = {};
  for (const p of dtf(tz).formatToParts(new Date(utcMs))) {
    if (p.type !== "literal") o[p.type] = Number(p.value);
  }
  return o;
}

/** Offset (zone minus UTC) in ms at the given instant. */
function offsetMs(utcMs: number, tz: string): number {
  const p = partsAt(utcMs, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO instant -> "YYYY-MM-DDTHH:mm" wall-clock in `tz` (value for <input type="datetime-local">). */
export function utcToZonedInput(iso: string, tz: string = CHURCH_TZ): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const p = partsAt(ms, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM-DDTHH:mm" wall-clock in `tz` -> ISO UTC instant. Returns null for invalid input. */
export function zonedInputToUtc(local: string, tz: string = CHURCH_TZ): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle times near a DST change.
  let utc = guess - offsetMs(guess, tz);
  utc = guess - offsetMs(utc, tz);
  const result = new Date(utc);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** "Sat, Nov 28, 11:59 PM" in `tz`. */
export function formatZoned(iso: string, tz: string = CHURCH_TZ): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** Current wall-clock "YYYY-MM-DDTHH:mm" in `tz` (for quick-pick chips). */
export function nowZonedInput(tz: string = CHURCH_TZ, now: number = Date.now()): string {
  return utcToZonedInput(new Date(now).toISOString(), tz);
}

/** Add whole days to a "YYYY-MM-DDTHH:mm" wall-clock string (calendar math, DST-safe). */
export function addDaysLocal(local: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return local;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + days, h, mi));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;
}

/** Day of week (0 = Sunday) of a "YYYY-MM-DDTHH:mm" wall-clock string. */
export function weekdayLocal(local: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(local);
  if (!m) return 0;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
}
