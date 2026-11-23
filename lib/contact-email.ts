import type { ContactInput } from "@/lib/contact";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Strip anything that could break out of a header or subject line. */
export function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
}

export type ComposedEmail = { subject: string; html: string; text: string };

/** Only the fields that appear in the email (not the spam-trap or timing fields). */
export type ContactEmailFields = Pick<ContactInput, "name" | "email" | "phone" | "topic" | "message">;

export function buildContactEmail(input: ContactEmailFields, sentAt: Date): ComposedEmail {
  const name = singleLine(input.name);
  const email = singleLine(input.email);
  const phone = singleLine(input.phone);
  const topic = singleLine(input.topic);
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  }).format(sentAt);

  const subject = `[SMSG website] ${topic}: ${name}`.slice(0, 200);

  const row = (label: string, valueHtml: string) =>
    `<tr><td style="padding:8px 14px 8px 0;vertical-align:top;color:#5a4a43;font-weight:bold;white-space:nowrap">${label}</td>` +
    `<td style="padding:8px 0;vertical-align:top;color:#2a1e1b">${valueHtml}</td></tr>`;

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f6eedb;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fcf8ee;border:1px solid #b8892d">
    <tr><td style="background:#5b1522;padding:18px 24px;color:#f6eedb;font-family:Georgia,serif;font-size:22px">
      New message from the church website
    </td></tr>
    <tr><td style="padding:22px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${row("From", escapeHtml(name))}
        ${row("Email", `<a href="mailto:${escapeHtml(email)}" style="color:#14295e">${escapeHtml(email)}</a>`)}
        ${row("Phone", phone ? escapeHtml(phone) : '<span style="color:#5a4a43">Not provided</span>')}
        ${row("About", escapeHtml(topic))}
      </table>
      <p style="margin:18px 0 6px;color:#5a4a43;font-weight:bold">Message</p>
      <div style="white-space:pre-wrap;border-left:3px solid #b8892d;padding:4px 0 4px 14px;color:#2a1e1b">${escapeHtml(input.message)}</div>
      <p style="margin:24px 0 0;color:#5a4a43;font-size:14px">
        Press <strong>Reply</strong> to answer ${escapeHtml(name)} directly; their address is set as the reply-to.<br>
        Sent ${escapeHtml(when)} (Eastern) from the contact form at charlestoncoptic.org.
      </p>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    "New message from the church website",
    "",
    `From:  ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `About: ${topic}`,
    "",
    "Message:",
    input.message,
    "",
    `Reply to this email to answer ${name} directly.`,
    `Sent ${when} (Eastern) from the contact form at charlestoncoptic.org.`,
  ].join("\n");

  return { subject, html, text };
}
