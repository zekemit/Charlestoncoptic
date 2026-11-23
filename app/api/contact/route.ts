import { MIN_FILL_MS, contactSchema } from "@/lib/contact";
import { buildContactEmail } from "@/lib/contact-email";
import { MailNotConfiguredError, getRecipients, sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, isSameOrigin, json, readJson } from "@/lib/request";
import { SITE } from "@/lib/site";
import { fieldErrors } from "@/lib/zod-errors";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, message: "This request was blocked." }, 403);
  }

  const body = await readJson(request);
  if (body === undefined) {
    return json({ ok: false, message: "We couldn't read that message. Please try again." }, 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) }, 400);
  }
  const input = parsed.data;

  // Spam trap: the hidden field is only ever filled by bots. Pretend it worked.
  if (input.website) return json({ ok: true });

  // Real people take longer than two seconds to write a message.
  if (input.elapsedMs === undefined || input.elapsedMs < MIN_FILL_MS) {
    return json({ ok: false, message: "That was quick. Please check your message and send it again." }, 400);
  }

  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return json(
      { ok: false, message: "You've sent several messages in a short time. Please wait a few minutes and try again." },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const { subject, html, text } = buildContactEmail(input, new Date());
  try {
    await sendMail({
      to: getRecipients(),
      subject,
      html,
      text,
      replyTo: { name: input.name, email: input.email },
    });
    return json({ ok: true });
  } catch (err) {
    if (err instanceof MailNotConfiguredError) {
      console.error("[contact]", err.message);
      return json(
        {
          ok: false,
          message: "The contact form isn't available right now. Please email us directly.",
          fallbackEmail: SITE.email,
        },
        503,
      );
    }
    console.error("[contact] send failed:", err instanceof Error ? err.message : err);
    return json(
      {
        ok: false,
        message: "We couldn't send your message. Please try again in a moment, or email us directly.",
        fallbackEmail: SITE.email,
      },
      502,
    );
  }
}
