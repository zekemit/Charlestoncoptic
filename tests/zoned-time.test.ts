import { describe, expect, it } from "vitest";
import { addDaysLocal, formatZoned, nowZonedInput, utcToZonedInput, weekdayLocal, zonedInputToUtc } from "@/lib/zoned-time";

describe("Eastern time conversion", () => {
  it("converts winter wall-clock time (EST, UTC-5)", () => {
    expect(zonedInputToUtc("2026-11-28T23:59")).toBe("2026-11-29T04:59:00.000Z");
  });

  it("converts summer wall-clock time (EDT, UTC-4)", () => {
    expect(zonedInputToUtc("2026-07-04T12:00")).toBe("2026-07-04T16:00:00.000Z");
  });

  it("handles the spring-forward boundary", () => {
    // 2026-03-08: clocks jump 2:00 -> 3:00. 01:30 is still EST, 03:30 is EDT.
    expect(zonedInputToUtc("2026-03-08T01:30")).toBe("2026-03-08T06:30:00.000Z");
    expect(zonedInputToUtc("2026-03-08T03:30")).toBe("2026-03-08T07:30:00.000Z");
  });

  it("handles the fall-back boundary", () => {
    // 2026-11-01: 02:00 EDT falls back to 01:00 EST. 00:30 is EDT, 03:30 is EST.
    expect(zonedInputToUtc("2026-11-01T00:30")).toBe("2026-11-01T04:30:00.000Z");
    expect(zonedInputToUtc("2026-11-01T03:30")).toBe("2026-11-01T08:30:00.000Z");
  });

  it("round-trips through the input format", () => {
    for (const local of ["2026-01-15T08:05", "2026-06-20T23:59", "2026-12-31T00:00"]) {
      expect(utcToZonedInput(zonedInputToUtc(local)!)).toBe(local);
    }
  });

  it("rejects malformed input", () => {
    expect(zonedInputToUtc("")).toBeNull();
    expect(zonedInputToUtc("2026-11-28")).toBeNull();
    expect(zonedInputToUtc("not a date")).toBeNull();
  });

  it("formats in Eastern time", () => {
    expect(formatZoned("2026-11-29T04:59:00.000Z")).toBe("Sat, Nov 28, 2026, 11:59 PM");
  });

  it("knows the current Eastern wall-clock", () => {
    expect(nowZonedInput("America/New_York", Date.parse("2026-11-29T04:59:00.000Z"))).toBe("2026-11-28T23:59");
  });
});

describe("calendar helpers", () => {
  it("adds days across month ends", () => {
    expect(addDaysLocal("2026-11-28T23:59", 7)).toBe("2026-12-05T23:59");
    expect(addDaysLocal("2026-12-30T10:00", 3)).toBe("2027-01-02T10:00");
  });

  it("finds the weekday of a wall-clock date", () => {
    expect(weekdayLocal("2026-11-28T09:00")).toBe(6); // Saturday
    expect(weekdayLocal("2026-11-29T09:00")).toBe(0); // Sunday
  });
});
