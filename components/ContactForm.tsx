"use client";

import { useEffect, useRef, useState } from "react";
import { INQUIRY_TYPES, type ContactResponse, contactSchema } from "@/lib/contact";
import { SITE } from "@/lib/site";
import { fieldErrors } from "@/lib/zod-errors";

type Field = "name" | "email" | "phone" | "topic" | "message";
const ORDER: Field[] = ["name", "email", "phone", "topic", "message"];
type Status = "idle" | "sending" | "sent" | "error";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export function ContactForm() {
  const startedAt = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState("");
  const [fallbackEmail, setFallbackEmail] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState({ name: "", email: "" });

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const fd = new FormData(e.currentTarget);
    const values = {
      name: str(fd, "name"),
      email: str(fd, "email"),
      phone: str(fd, "phone"),
      topic: str(fd, "topic"),
      message: str(fd, "message"),
      website: str(fd, "website"),
      elapsedMs: Math.round(performance.now() - startedAt.current),
    };

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error) as Partial<Record<Field, string>>;
      setErrors(errs);
      setNotice("Please fix the highlighted fields.");
      setStatus("error");
      const first = ORDER.find((f) => errs[f]);
      if (first) document.getElementById(`cf-${first}`)?.focus();
      return;
    }

    setErrors({});
    setNotice("");
    setFallbackEmail(undefined);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => null)) as ContactResponse | null;
      if (res.ok && data?.ok) {
        setSentTo({ name: parsed.data.name, email: parsed.data.email });
        setStatus("sent");
        return;
      }
      if (data && !data.ok) {
        if (data.errors) {
          setErrors(data.errors as Partial<Record<Field, string>>);
          const first = ORDER.find((f) => data.errors?.[f]);
          if (first) document.getElementById(`cf-${first}`)?.focus();
        }
        setNotice(data.message);
        setFallbackEmail(data.fallbackEmail);
      } else {
        setNotice("Something went wrong. Please try again.");
        setFallbackEmail(SITE.email);
      }
      setStatus("error");
    } catch {
      setNotice("We couldn't reach the server. Check your connection and try again.");
      setFallbackEmail(SITE.email);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="border border-gilt bg-paper p-7">
        <h2 className="text-3xl">Message sent</h2>
        <p className="mt-3 max-w-prose">
          Thank you, {sentTo.name}. Your message is on its way to the church, and we&rsquo;ll reply to{" "}
          <strong>{sentTo.email}</strong> as soon as we can.
        </p>
        <button
          type="button"
          className="btn btn-outline mt-6"
          onClick={() => {
            startedAt.current = performance.now();
            setStatus("idle");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const describedBy = (f: Field) => (errors[f] ? `cf-${f}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-describedby={notice ? "cf-notice" : undefined}>
      {notice ? (
        <div
          id="cf-notice"
          role="alert"
          className="border-l-4 border-danger bg-paper p-4 font-bold text-danger"
        >
          <p>{notice}</p>
          {fallbackEmail ? (
            <p className="mt-1 font-normal text-ink">
              You can also write to{" "}
              <a className="link" href={`mailto:${fallbackEmail}`}>
                {fallbackEmail}
              </a>
              .
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="cf-name" className="field-label">
          Your name
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          className="field"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
        />
        {errors.name ? (
          <p id="cf-name-error" className="field-error">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className="field-label">
            Email address
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="field"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          {errors.email ? (
            <p id="cf-email-error" className="field-error">
              {errors.email}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="cf-phone" className="field-label">
            Phone <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            className="field"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone")}
          />
          {errors.phone ? (
            <p id="cf-phone-error" className="field-error">
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="cf-topic" className="field-label">
          What is your message about?
        </label>
        <select
          id="cf-topic"
          name="topic"
          required
          defaultValue=""
          className="field"
          aria-invalid={errors.topic ? true : undefined}
          aria-describedby={describedBy("topic")}
        >
          <option value="" disabled>
            Choose one
          </option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.topic ? (
          <p id="cf-topic-error" className="field-error">
            {errors.topic}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cf-message" className="field-label">
          Your message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={7}
          required
          maxLength={5000}
          className="field"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message")}
        />
        {errors.message ? (
          <p id="cf-message-error" className="field-error">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Spam trap: invisible to people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        <p className="text-base text-ink-soft">Your message goes to the church&rsquo;s inbox. We never share your details.</p>
      </div>
    </form>
  );
}
