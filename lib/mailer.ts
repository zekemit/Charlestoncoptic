import nodemailer from "nodemailer";
import { singleLine } from "@/lib/contact-email";

export type Provider = "resend" | "smtp";

export type Mail = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo: { name: string; email: string };
};

type Env = Record<string, string | undefined>;

export const DEFAULT_RECIPIENT = "Kaldasms@gmail.com";

export function getRecipients(env: Env = process.env): string[] {
  const raw = env.CONTACT_RECIPIENT?.trim() || DEFAULT_RECIPIENT;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const has = (v: string | undefined) => !!v && v.trim().length > 0;

export function availableProviders(env: Env = process.env): Provider[] {
  const out: Provider[] = [];
  if (has(env.RESEND_API_KEY)) out.push("resend");
  if (has(env.GMAIL_USER) && has(env.GMAIL_APP_PASSWORD)) out.push("smtp");
  return out;
}

/**
 * Which providers to try, in order.
 *  - EMAIL_PROVIDER=resend | gmail forces one provider (no failover).
 *  - Otherwise Resend is preferred when its key exists, with Gmail SMTP as a fallback
 *    (and vice versa), so one provider having an outage does not lose a visitor's message.
 */
export function providerOrder(env: Env = process.env): Provider[] {
  const available = availableProviders(env);
  const forced = env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (forced === "resend") return available.includes("resend") ? ["resend"] : [];
  if (forced === "gmail" || forced === "smtp") return available.includes("smtp") ? ["smtp"] : [];
  return available;
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("No email provider is configured (set RESEND_API_KEY, or GMAIL_USER and GMAIL_APP_PASSWORD).");
    this.name = "MailNotConfiguredError";
  }
}

function formatAddress(name: string, email: string): string {
  const safe = singleLine(name).replace(/["\\]/g, "");
  return `"${safe}" <${email}>`;
}

async function sendWithResend(mail: Mail, env: Env, fetchImpl: typeof fetch): Promise<void> {
  const from = env.RESEND_FROM_EMAIL?.trim() || "St. Mary & St. George Website <onboarding@resend.dev>";
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      reply_to: formatAddress(mail.replyTo.name, mail.replyTo.email),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(`Resend responded ${res.status}: ${detail}`);
  }
}

async function sendWithSmtp(mail: Mail, env: Env): Promise<void> {
  const user = env.GMAIL_USER!.trim();
  // Google shows app passwords in groups of four separated by spaces; they must be removed.
  const pass = env.GMAIL_APP_PASSWORD!.replace(/\s+/g, "");
  const port = Number(env.SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    await transport.sendMail({
      from: { name: "St. Mary & St. George Website", address: user },
      to: mail.to,
      replyTo: { name: singleLine(mail.replyTo.name), address: mail.replyTo.email },
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } finally {
    transport.close();
  }
}

/** Sends through the first provider that works. Throws MailNotConfiguredError if none is set up. */
export async function sendMail(
  mail: Mail,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ provider: Provider }> {
  const order = providerOrder(env);
  if (order.length === 0) throw new MailNotConfiguredError();

  let lastError: unknown;
  for (const provider of order) {
    try {
      if (provider === "resend") await sendWithResend(mail, env, fetchImpl);
      else await sendWithSmtp(mail, env);
      return { provider };
    } catch (err) {
      lastError = err;
      console.error(`[contact] ${provider} delivery failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Email delivery failed");
}
