import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const smtp = vi.hoisted(() => {
  const sendMail = vi.fn();
  const close = vi.fn();
  const createTransport = vi.fn(() => ({ sendMail, close }));
  return { sendMail, close, createTransport };
});
vi.mock("nodemailer", () => ({ default: { createTransport: smtp.createTransport } }));

import {
  DEFAULT_RECIPIENT,
  MailNotConfiguredError,
  availableProviders,
  getRecipients,
  providerOrder,
  sendMail,
  type Mail,
} from "@/lib/mailer";

const mail: Mail = {
  to: ["Kaldasms@gmail.com"],
  subject: "[SMSG website] General question: Mina",
  html: "<p>Hello</p>",
  text: "Hello",
  replyTo: { name: "Mina Girgis", email: "mina@example.com" },
};

const RESEND = { RESEND_API_KEY: "re_test_123" };
const GMAIL = { GMAIL_USER: "church@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" };

const okFetch = () => vi.fn(async () => new Response(JSON.stringify({ id: "1" }), { status: 200 }));

beforeEach(() => {
  smtp.sendMail.mockReset().mockResolvedValue({});
  smtp.close.mockReset();
  smtp.createTransport.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("recipients", () => {
  it("defaults to the church contact inbox", () => {
    expect(getRecipients({})).toEqual([DEFAULT_RECIPIENT]);
    expect(DEFAULT_RECIPIENT).toBe("Kaldasms@gmail.com");
  });
  it("accepts a comma-separated override", () => {
    expect(getRecipients({ CONTACT_RECIPIENT: "a@x.org, b@y.org ," })).toEqual(["a@x.org", "b@y.org"]);
  });
});

describe("provider selection", () => {
  it("detects what is configured", () => {
    expect(availableProviders({})).toEqual([]);
    expect(availableProviders(RESEND)).toEqual(["resend"]);
    expect(availableProviders(GMAIL)).toEqual(["smtp"]);
    expect(availableProviders({ GMAIL_USER: "x@gmail.com" })).toEqual([]);
    expect(availableProviders({ ...RESEND, ...GMAIL })).toEqual(["resend", "smtp"]);
  });
  it("prefers Resend, falling back to Gmail", () => {
    expect(providerOrder({ ...RESEND, ...GMAIL })).toEqual(["resend", "smtp"]);
  });
  it("EMAIL_PROVIDER forces a single provider, and none if that one isn't configured", () => {
    expect(providerOrder({ ...RESEND, ...GMAIL, EMAIL_PROVIDER: "gmail" })).toEqual(["smtp"]);
    expect(providerOrder({ ...RESEND, ...GMAIL, EMAIL_PROVIDER: "resend" })).toEqual(["resend"]);
    expect(providerOrder({ ...RESEND, EMAIL_PROVIDER: "gmail" })).toEqual([]);
  });
});

describe("sendMail via Resend", () => {
  it("posts the message with auth, recipient and Reply-To set to the visitor", async () => {
    const f = okFetch();
    const r = await sendMail(mail, RESEND, f as unknown as typeof fetch);
    expect(r.provider).toBe("resend");
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_123");
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["Kaldasms@gmail.com"]);
    expect(body.subject).toBe(mail.subject);
    expect(body.reply_to).toBe('"Mina Girgis" <mina@example.com>');
    expect(body.html).toBe("<p>Hello</p>");
    expect(body.text).toBe("Hello");
    expect(body.from).toMatch(/onboarding@resend\.dev/);
  });

  it("uses RESEND_FROM_EMAIL when set", async () => {
    const f = okFetch();
    await sendMail(mail, { ...RESEND, RESEND_FROM_EMAIL: "Church <hello@charlestoncoptic.org>" }, f as unknown as typeof fetch);
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).from).toBe(
      "Church <hello@charlestoncoptic.org>",
    );
  });

  it("strips quotes and line breaks from the display name in Reply-To", async () => {
    const f = okFetch();
    await sendMail(
      { ...mail, replyTo: { name: 'Mina "The\r\nBcc: x@y.z" Girgis', email: "mina@example.com" } },
      RESEND,
      f as unknown as typeof fetch,
    );
    const replyTo = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).reply_to as string;
    expect(replyTo).not.toMatch(/[\r\n]/);
    expect(replyTo.match(/"/g)).toHaveLength(2);
  });

  it("throws on a failed response when there is no fallback", async () => {
    const f = vi.fn(async () => new Response("domain not verified", { status: 403 }));
    await expect(sendMail(mail, RESEND, f as unknown as typeof fetch)).rejects.toThrow(/403/);
    expect(smtp.createTransport).not.toHaveBeenCalled();
  });
});

describe("sendMail via Gmail SMTP", () => {
  it("sends with the app password (spaces removed) and the visitor as Reply-To", async () => {
    const r = await sendMail(mail, GMAIL);
    expect(r.provider).toBe("smtp");
    expect(smtp.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: "church@gmail.com", pass: "abcdefghijklmnop" },
      }),
    );
    const sent = smtp.sendMail.mock.calls[0][0];
    expect(sent.to).toEqual(["Kaldasms@gmail.com"]);
    expect(sent.replyTo).toEqual({ name: "Mina Girgis", address: "mina@example.com" });
    expect(sent.from).toEqual({ name: "St. Mary & St. George Website", address: "church@gmail.com" });
    expect(smtp.close).toHaveBeenCalled();
  });

  it("honours SMTP_HOST / SMTP_PORT overrides (STARTTLS on 587)", async () => {
    await sendMail(mail, { ...GMAIL, SMTP_HOST: "smtp.example.org", SMTP_PORT: "587" });
    expect(smtp.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.example.org", port: 587, secure: false }),
    );
  });
});

describe("failover", () => {
  it("falls back to Gmail when Resend fails, so no message is lost", async () => {
    const f = vi.fn(async () => new Response("boom", { status: 500 }));
    const r = await sendMail(mail, { ...RESEND, ...GMAIL }, f as unknown as typeof fetch);
    expect(r.provider).toBe("smtp");
    expect(f).toHaveBeenCalledTimes(1);
    expect(smtp.sendMail).toHaveBeenCalledTimes(1);
  });

  it("does not fail over when a provider is forced", async () => {
    const f = vi.fn(async () => new Response("boom", { status: 500 }));
    await expect(
      sendMail(mail, { ...RESEND, ...GMAIL, EMAIL_PROVIDER: "resend" }, f as unknown as typeof fetch),
    ).rejects.toThrow();
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });

  it("throws the last error when every provider fails", async () => {
    smtp.sendMail.mockRejectedValueOnce(new Error("535 bad credentials"));
    const f = vi.fn(async () => new Response("boom", { status: 500 }));
    await expect(sendMail(mail, { ...RESEND, ...GMAIL }, f as unknown as typeof fetch)).rejects.toThrow(/535/);
  });
});

describe("not configured", () => {
  it("throws a recognisable error and sends nothing", async () => {
    const f = okFetch();
    await expect(sendMail(mail, {}, f as unknown as typeof fetch)).rejects.toBeInstanceOf(MailNotConfiguredError);
    expect(f).not.toHaveBeenCalled();
    expect(smtp.createTransport).not.toHaveBeenCalled();
  });
});
