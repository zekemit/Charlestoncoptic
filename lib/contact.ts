import { z } from "zod";

// Zod normally probes for eval ("new Function") to compile faster validators. A Content-Security-Policy
// without 'unsafe-eval' correctly blocks that probe and reports a violation, so turn the probe off.
z.config({ jitless: true });

export const INQUIRY_TYPES = [
  "General question",
  "Planning a visit",
  "Prayer request",
  "Giving and donations",
  "Volunteering and getting involved",
  "Website feedback",
  "Other",
] as const;

/** A real person needs more than this to fill in the form; instant POSTs are bots. */
export const MIN_FILL_MS = 2000;

const noLineBreaks = (v: string) => !/[\r\n]/.test(v);

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Please keep your name under 100 characters.")
    .refine(noLineBreaks, "Your name can't contain line breaks."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(254, "That email address is too long.")
    .pipe(z.email("Enter a valid email address, like name@example.com.")),
  phone: z
    .string()
    .trim()
    .max(30, "That phone number is too long.")
    .refine((v) => v === "" || /^[0-9+().\-\s]{7,30}$/.test(v), "Use digits, spaces and + ( ) - only, or leave this blank."),
  topic: z.enum(INQUIRY_TYPES, { error: "Choose what your message is about." }),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence (10 characters).")
    .max(5000, "Please keep your message under 5,000 characters."),
  // Spam trap: real visitors never see or fill this field.
  website: z.string().max(500).optional().default(""),
  // Milliseconds the visitor spent on the form (measured in their browser).
  elapsedMs: z.number().finite().nonnegative().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResponse =
  | { ok: true }
  | { ok: false; message: string; errors?: Record<string, string>; fallbackEmail?: string };
