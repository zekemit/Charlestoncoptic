import { describe, expect, it } from "vitest";
import { INQUIRY_TYPES, contactSchema } from "@/lib/contact";
import { buildContactEmail, escapeHtml, singleLine } from "@/lib/contact-email";
import { fieldErrors } from "@/lib/zod-errors";

const valid = {
  name: "Mina Girgis",
  email: "mina@example.com",
  phone: "",
  topic: "Planning a visit" as const,
  message: "We are moving to Charleston in January and would like to visit.",
};

describe("contactSchema", () => {
  it("accepts a normal message and defaults the honeypot to empty", () => {
    const r = contactSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.website).toBe("");
  });

  it("trims whitespace", () => {
    const r = contactSchema.safeParse({ ...valid, name: "  Mina  ", email: " mina@example.com " });
    expect(r.success && r.data.name).toBe("Mina");
    expect(r.success && r.data.email).toBe("mina@example.com");
  });

  it("rejects line breaks in the name (email header injection)", () => {
    const r = contactSchema.safeParse({ ...valid, name: "Mina\r\nBcc: attacker@evil.example" });
    expect(r.success).toBe(false);
  });

  it.each(["", "plainaddress", "a@b", "a b@c.com", "mina@example.com\nBcc: x@y.z"])("rejects email %j", (email) => {
    expect(contactSchema.safeParse({ ...valid, email }).success).toBe(false);
  });

  it("validates phone only when provided", () => {
    expect(contactSchema.safeParse({ ...valid, phone: "(843) 437-1255" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, phone: "+1 843 437 1255" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, phone: "call me maybe" }).success).toBe(false);
  });

  it("only allows the listed inquiry types", () => {
    for (const t of INQUIRY_TYPES) expect(contactSchema.safeParse({ ...valid, topic: t }).success).toBe(true);
    const r = contactSchema.safeParse({ ...valid, topic: "Something else" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).topic).toMatch(/choose/i);
  });

  it("bounds the message length", () => {
    expect(contactSchema.safeParse({ ...valid, message: "short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5000) }).success).toBe(true);
  });

  it("reports one friendly message per field", () => {
    const r = contactSchema.safeParse({ name: "", email: "", phone: "", topic: "", message: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(Object.keys(e).sort()).toEqual(["email", "message", "name", "topic"]);
      expect(e.name).toBe("Please enter your name.");
      expect(e.email).toBe("Please enter your email address.");
    }
  });
});

describe("buildContactEmail", () => {
  const at = new Date("2026-11-23T15:30:00.000Z");

  it("escapes HTML in every visitor-supplied field", () => {
    const evil = '<img src=x onerror=alert(1)> & "quotes"';
    const { html } = buildContactEmail({ ...valid, name: evil, phone: evil, message: evil }, at);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;");
  });

  it("sets a clear subject and never lets a header break out of it", () => {
    const { subject } = buildContactEmail({ ...valid, name: "Mina\r\nBcc: x@y.z" }, at);
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toMatch(/^\[SMSG website\] Planning a visit: /);
  });

  it("includes every field in the text version, with a placeholder for a missing phone", () => {
    const { text } = buildContactEmail(valid, at);
    expect(text).toContain("Mina Girgis");
    expect(text).toContain("mina@example.com");
    expect(text).toContain("Phone: Not provided");
    expect(text).toContain(valid.message);
  });

  it("stamps the time in Eastern", () => {
    expect(buildContactEmail(valid, at).text).toMatch(/10:30 AM \(Eastern\)/);
  });

  it("helpers", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
    expect(singleLine("a\r\nb c\td")).toBe("a b c d");
  });
});
