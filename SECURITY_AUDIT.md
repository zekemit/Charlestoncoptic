# Security audit

**Application:** St. Mary & St. George Coptic Orthodox Church website (Next.js 16.4.6, React 19, Vercel)
**Date:** 2026-11-23 · **Scope:** the whole repository, its configuration, its dependencies, and the live deployment's behavior
**Method:** manual source review, git-history secret scan, `npm audit`, inspection of the production build output, and active testing against a production build (attack probes and a 140-check browser suite).

## Result

| Severity | Found | Fixed | Accepted (documented) |
|---|---|---|---|
| Critical | 0 | n/a | n/a |
| High | 0 | n/a | n/a |
| Medium | 3 | 3 | 0 |
| Low | 7 | 3 | 4 |
| Informational | 12 | n/a | n/a |

No critical or high findings. The three medium findings were all weaknesses in *abuse resistance* (rate limiting, response headers, admin password strength), not exploitable data exposure. All three are fixed and verified. Line numbers below refer to the code **before** the fix (marked "was") and **after** it (marked "now").

---

## Medium

### M-1. Rate limiting did not hold across serverless instances
- **Where (was):** `lib/rate-limit.ts:5-7` (a per-process `Map`), used by `app/api/admin/login/route.ts:16` and `app/api/contact/route.ts:33`.
- **Risk:** On Vercel every warm instance, and every cold start, kept its own counters. An attacker's allowance multiplied with the number of instances serving them, so the admin login's brute-force limit (10 per 15 min) and the contact form's flood limit (5 per 10 min) could both be exceeded. The contact form is the church's only inbox-facing endpoint, and each accepted request spends Resend/SMTP quota.
- **Fix (now):**
  - New `checkRateLimit()` in `lib/rate-limit.ts:45-71` counts in Upstash Redis with an atomic fixed window (`INCR` + `EXPIRE NX` + `TTL` in one pipeline), so every instance shares one counter.
  - Keys are SHA-256 hashed (`lib/rate-limit.ts:53`) so raw IP addresses are never stored.
  - If Redis is unreachable it falls back to the in-memory limiter (never fails open, never locks the admin out).
  - Shared Redis helper in `lib/redis.ts`; both routes now `await checkRateLimit(...)` (`login/route.ts:16`, `contact/route.ts:33`).
- **Verified:** `tests/security.test.ts` (shared count, blocking with real `Retry-After`, hashed keys, per-client isolation, Redis-down fallback); live probe: 14 rapid wrong passwords locked the attacker out from attempt 11 and the **correct** password was refused while locked out; a different client was unaffected.

### M-2. No Content-Security-Policy or HSTS header
- **Where (was):** `next.config.ts:3-8`.
- **Risk:** Without a CSP there is no second line of defense if an injection bug ever appears. Without HSTS a first visit over plain HTTP could be downgraded.
- **Fix (now):** `next.config.ts:10-37` (policy at `:10-27`, headers at `:28-37`) adds
  - `Content-Security-Policy`: `default-src 'self'`; scripts and connections first-party only; no `eval`; `frame-src` limited to `https://www.google.com` (the map); `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `img-src` allows `https:` only because the admin may point the popup at a flyer hosted anywhere; `upgrade-insecure-requests`.
  - `Strict-Transport-Security: max-age=63072000` (no `includeSubDomains`/`preload` on purpose: the domain's other subdomains, such as mail, are managed elsewhere).
  - `Cross-Origin-Opener-Policy: same-origin` and an expanded `Permissions-Policy`.
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` were already present (`next.config.ts:32-35`).
- **Verified:** header assertions in `tests/security.test.ts`; headers observed on the running production build; a browser pass over every page and interaction (home, about, donate, visit with map iframe, contact, gallery and lightbox, 404, admin, a popup with an image) produced **zero CSP violations**.
- **Residual risk:** see L-7 (`'unsafe-inline'` for scripts).

### M-3. Weak admin passwords accepted; session key derived from the password
- **Where (was):** `lib/session-token.ts:18-19` (any non-empty `ADMIN_PASSWORD` enabled sign-in) and `:13` (the session-signing key was derived from the password when `SESSION_SECRET` was unset).
- **Risk:** A short password is guessable online (rate-limited) and, worse, a stolen session cookie would let an attacker guess it **offline** by testing candidate passwords against the cookie's signature.
- **Fix (now):**
  - `lib/session-token.ts:19-28`: sign-in stays **off** unless the password is at least 12 characters; `/admin` explains why (`app/admin/page.tsx:35-45`).
  - `SESSION_SECRET` (random, 48 bytes) is now set in Vercel (sensitive, Production and Preview), so session signing no longer depends on the password. Documented in `.env.example` and `README.md`.
- **Verified:** `tests/session-token.test.ts` (policy tests); live admin sign-in on the deployment uses the 23-character generated password.

---

## Low

| ID | Finding | Where | Status |
|---|---|---|---|
| L-1 | Popup image URLs allowed `http:`. Plain-http images are blocked as mixed content on an https site, and a remote http host could track viewers. | `lib/popup.ts:12-21` (was) | **Fixed.** `isSafeImageUrl` (`lib/popup.ts:16-22`) now allows `https:` and site-relative paths only. Tests added. |
| L-2 | JSON endpoints accepted any `Content-Type`, so a cross-site "simple request" (e.g. a form post) could reach the handlers. Cookies are already `SameSite=Strict`, so this was defense in depth. | `lib/request.ts:31` (was) | **Fixed.** `readJson` requires `application/json` (`lib/request.ts:34`). Tests added. |
| L-3 | Zod's eval probe (`new Function`) is blocked by the new CSP and logged violations in the browser on `/contact` and `/admin`. Harmless functionally (it falls back) but noisy. | `lib/contact.ts`, `lib/popup.ts` (client-side use) | **Fixed.** `z.config({ jitless: true })` at `lib/contact.ts:5`, `lib/popup.ts:6`. |
| L-4 | Sessions are stateless: logout clears the cookie but a copied cookie stays valid until its 8-hour expiry. | `lib/auth.ts:26-33`, `lib/session-token.ts:8` | **Accepted.** Cookie is `HttpOnly` so scripts cannot copy it; lifetime is 8 h; **rotating `SESSION_SECRET` invalidates every session instantly** (documented). |
| L-5 | Client IP is taken from the first `x-forwarded-for` entry. Vercel overwrites this header, so it is trustworthy there; on a host that forwards client-supplied values it would be spoofable. | `lib/request.ts:2-5` | **Accepted** for the Vercel deployment; noted in README. |
| L-6 | The "too fast to be human" check uses a timing value measured in the visitor's browser, so a scripted client can forge it. | `lib/contact.ts:49`, `app/api/contact/route.ts:29` | **Accepted.** It only stops naive bots; the honeypot, validation, and (now shared) rate limit are the real controls. |
| L-7 | CSP allows `'unsafe-inline'` for scripts (needed for Next.js's inline bootstrap). A nonce-based policy would remove it but forces every page to render dynamically (per Next.js's CSP guide), losing static caching. | `next.config.ts:12` | **Accepted.** There is no user-generated HTML anywhere (see I-5), so the XSS surface this weakens is effectively absent. Revisit if user-submitted content is ever rendered. |

---

## Informational (checked, no action needed)

- **I-1. Secrets and git hygiene: clean.**
  - `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `.env*` (except `.env.example`), `.vercel`, `*.pem`, `*.key`, `*.p12` (`.gitignore:33-42`).
  - A scan of the full history (`git log -p --all`, 3 commits) and all tracked files for API-key, token, and private-key patterns, and for the literal values of the admin password, Resend key, and session secret, found **only** obvious test fixtures (`abcd efgh ijkl mnop`, `"t"`) in `tests/`.
  - The only `.env*` file ever committed is the documented `.env.example` (placeholders only).
- **I-2. `NEXT_PUBLIC_*`:** the only one is `NEXT_PUBLIC_SITE_URL` (`lib/site.ts:11`), a public URL. A search of the built client bundle for `ADMIN_PASSWORD`, `RESEND_API_KEY`, `GMAIL_APP_PASSWORD`, `KV_REST_API_TOKEN`, `SESSION_SECRET`, and the cookie name found nothing.
- **I-3. Authentication is enforced inside every protected handler; there is no middleware dependency.**

  | Route | Enforcement |
  |---|---|
  | `GET/PUT /api/admin/popup` | `isAdmin()` at `app/api/admin/popup/route.ts:8` and `:20`; `PUT` also checks same-origin (`:19`) |
  | `POST /api/admin/login` | same-origin (`:7`), shared rate limit (`:16`), constant-time password check (`:26`) |
  | `POST /api/admin/logout` | same-origin (`:5`) |
  | `GET /api/popup` | public by design; returns only the visitor-facing fields and nothing when disabled/expired |
  | `POST /api/contact` | public by design; validation, honeypot, timing, shared rate limit |
  | `/admin` page | session checked server-side per request (`app/admin/page.tsx:33`, `connection()` keeps it out of the build-time shell) |
- **I-4. Password and session handling are sound:** password compared with `crypto.timingSafeEqual` over SHA-256 digests (`lib/session-token.ts:31-37`); session is `<expiry>.<nonce>.<HMAC-SHA256>` verified with `timingSafeEqual` (`:52`); cookie is `HttpOnly`, `Secure` in production, `SameSite=Strict`, 8 h (`lib/auth.ts:17-21`). 12 tamper and forgery attempts (extended expiry, flipped signature, swapped nonce, malformed tokens) were all refused.
- **I-5. Popup content cannot inject script.** Title, body, image alt and button label are rendered as React text (`components/PopupCard.tsx`, `components/RichText.tsx`). The body's mini-markup (bold, italic, links, bullets) is parsed into typed nodes and rendered as elements, never HTML (`lib/rich-text.ts`). Link and button URLs must be `http(s)`, `mailto:`, `tel:` or a site-relative path; `javascript:`, `data:` and `//host` are refused on both client and server (`lib/rich-text.ts:17-27`, `lib/popup.ts:37` (image) and `:45` (button)). A payload containing `<script>`, `<img onerror>`, `<svg onload>`, `javascript:` and `data:` links, and a `"><script>` image description rendered as inert text with nothing executed.
- **I-6. The one `dangerouslySetInnerHTML`** (`app/page.tsx:37`) emits JSON-LD built from constants in `lib/site.ts`, with `<` escaped. No user input reaches it.
- **I-7. SSRF:** the server never fetches an admin- or visitor-supplied URL. The popup image is loaded by the visitor's browser. The image optimizer has an explicit empty `images.remotePatterns` and SVG disabled (`next.config.ts:57-58`); requests for `https://…`, `//…`, `http://169.254.169.254/…` and `file://…` through `/_next/image` were all refused.
- **I-8. Contact endpoint:** strict zod schema with length caps (name ≤ 100, email ≤ 254, phone ≤ 30, message 10-5000, inquiry type an enum) in `lib/contact.ts`; line breaks refused in the name (header injection); every field HTML-escaped and control characters stripped from subject/headers in `lib/contact-email.ts`; the recipient comes from the environment, never from the request, so the form cannot be used as an open relay; honeypot returns success silently (`app/api/contact/route.ts:26`); 32 KB body cap; same-origin and content-type checks.
- **I-9. Source maps:** `productionBrowserSourceMaps` is set to `false` explicitly (`next.config.ts:44`); the build emits 0 `.map` files and the served JS has no `sourceMappingURL`. `X-Powered-By` is removed.
- **I-10. Dependencies:** `npm audit` reports **0 vulnerabilities** (production and dev). `next` 16.4.6 and `nodemailer` 10.6.1 have no known advisories. `resend` is not a dependency (the Resend REST API is called directly with `fetch`). React and React DOM were updated 19.3.0 to 19.3.1.
- **I-11. No file exposure:** `/.env`, `/.git/config`, `/package.json`, `/data/popup.json`, `/lib/*.ts` and path-traversal variants all return 404.
- **I-12. Operational: secrets that passed through the chat transcript.** The Resend API key was pasted into the conversation, and the admin password and `SESSION_SECRET` were generated and displayed in tool output. If this transcript is stored or shared, **rotate all three**: Resend dashboard for the key (then update `RESEND_API_KEY` in Vercel); change `ADMIN_PASSWORD` and `SESSION_SECRET` in Vercel (either change signs out every admin session). Also note the Resend account is currently limited to sending to its owner's own address, so the key does not yet deliver contact messages to `Kaldasms@gmail.com`.

---

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| Unit tests (`npm test`) | **141 passed** (was 123): adds shared limiter, header, password policy, https-only image and content-type tests |
| `npm run build` | clean, 21 routes, 0 source maps |
| `npm audit` | **0 vulnerabilities** |
| Browser end-to-end suite (Chromium, production build, local SMTP sink) | **140 passed, 0 failed**, including accessibility scans (WCAG 2.2 A/AA) |
| Attack probes (`content-type`, forged/tampered sessions, stored XSS, SSRF, file/source-map exposure, brute force) | **44 passed, 0 failed** |
| CSP violation sweep (every page and interaction) | **0 violations** |
| Mutation checks (security tests fail when protection is removed: unsafe `href`, session signature, header-injection name) | each caught |

## Recommendations (not code changes)
1. Rotate the three secrets in I-12 if the transcript could be shared.
2. Add Vercel Firewall rate-limit rules for `/api/contact` and `/api/admin/login` as a second layer (the in-app limiter is the first).
3. Re-run `npm audit` before each release; Dependabot or Renovate on the GitHub repo would automate this.
4. If the site ever renders user-submitted content, replace `'unsafe-inline'` with a nonce-based CSP (cost: dynamic rendering).
