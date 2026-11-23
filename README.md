# St. Mary & St. George Coptic Orthodox Church: website

Charleston, SC. A rebuild of charlestoncoptic.org (previously on Wix) in Next.js, deployed on Vercel.

- **Public site:** Home, About Us, Gallery (52 photos, 3 albums), Visit Us, Donate, Contact, plus an archived 2026 Holy Week schedule.
- **Contact form** (`/contact`) emails every message to `Kaldasms@gmail.com`, with the visitor's address as Reply-To. Works with Resend, Gmail SMTP, or both (automatic fallback).
- **Admin** (`/admin`): password-protected manager for the homepage announcement popup, with on/off switch, rich text, image, button, expiry time, "once per session" vs "every visit", and a live desktop/phone preview.

Stack: Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4. No database server: popup settings live in Upstash Redis on Vercel and in `data/popup.json` locally.

---

## Run it locally

Requires Node 22 or newer.

```bash
npm install
cp .env.example .env.local      # then set ADMIN_PASSWORD (and mail settings if you want to send email)
npm run dev                     # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (123): sessions, validation, popup rules, time zones, mailer, storage |
| `npm run images` | Re-download and re-optimize photos from the old Wix site (one-time migration helper) |

Locally, popup edits made in `/admin` are written to `data/popup.json`. Don't commit an enabled popup there.

---

## Deploy: GitHub + Vercel

### 1. Get the code on GitHub

The repository already exists at `github.com/zekemit/Charlestoncoptic`. Its only branch right now is `claude/serene-mayer-ui807c`, so create `main` from it (Vercel deploys production from `main`):

```bash
git fetch origin
git push origin origin/claude/serene-mayer-ui807c:refs/heads/main
```

Then on GitHub: **Settings > Branches > Default branch > main**.

To publish to a brand-new repository instead:

```bash
gh repo create charlestoncoptic --private --source=. --remote=origin --push
```

### 2. Create the Vercel project

Dashboard: **Add New > Project > Import** the GitHub repository. Framework is detected as Next.js; accept the defaults and set **Production Branch** to `main`.

Or from the command line:

```bash
npm i -g vercel
vercel login
vercel link --yes
```

### 3. Connect storage for the popup (required for `/admin` to save)

Vercel dashboard > your project > **Storage** > **Create** > **Upstash** (Redis, Marketplace) > connect it to the project for Production and Preview. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. The free plan is plenty for a church site.

### 4. Environment variables checklist

Project > **Settings > Environment Variables** (Production, and Preview if you want previews to work).

| Variable | Required | Value |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | A long passphrase for `/admin`. |
| `CONTACT_RECIPIENT` | Yes | `Kaldasms@gmail.com` (this is also the default if unset). |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | One mail option | A Gmail address and a [Google App Password](https://myaccount.google.com/apppasswords) (needs 2-Step Verification). Simplest option, and it needs no DNS changes. |
| `RESEND_API_KEY` | One mail option | From resend.com. Sign up with `Kaldasms@gmail.com` (the default sender only delivers to the account owner), or verify a domain and set `RESEND_FROM_EMAIL`. |
| `RESEND_FROM_EMAIL` | No | e.g. `St. Mary & St. George <hello@charlestoncoptic.org>` (verified domain only). |
| `EMAIL_PROVIDER` | No | `resend` or `gmail` to force one. Empty means auto, with failover between them. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Yes (production) | Added automatically by step 3. |
| `NEXT_PUBLIC_SITE_URL` | No | `https://www.charlestoncoptic.org` (the default). |
| `SESSION_SECRET` | No | `openssl rand -base64 32`. If unset, the admin password signs sessions. |

From the CLI, a value can be piped in:

```bash
printf '%s' 'your-long-passphrase' | vercel env add ADMIN_PASSWORD production
printf '%s' 'Kaldasms@gmail.com'   | vercel env add CONTACT_RECIPIENT production
printf '%s' 'you@gmail.com'        | vercel env add GMAIL_USER production
printf '%s' 'abcdefghijklmnop'     | vercel env add GMAIL_APP_PASSWORD production
```

Environment changes apply to **new** deployments, so redeploy after changing them.

### 5. Deploy

Pushing to `main` deploys automatically. From the CLI:

```bash
vercel --prod
```

### 6. Check it works (5 minutes)

1. Open the deployment. Click through Home, About, Gallery, Visit Us, Donate, Contact.
2. **Contact:** send yourself a test message. It should arrive at `Kaldasms@gmail.com`; pressing Reply should address the sender. If the form says it "isn't available right now", the mail variables are missing or wrong: check the function logs.
3. **Admin:** go to `/admin`, sign in, turn the popup on with a title, press **Save and publish**, then open the homepage in a private window. Press **Turn off now** when done. If saving says storage isn't set up, redo step 3 and redeploy.
4. **Old links:** `/general-5`, `/donate-online`, `/events`, `/sermons`, `/ministries` should all redirect.

### 7. Point charlestoncoptic.org at Vercel (do this carefully)

**The domain's email is hosted on Zoho Mail (MX records), and its nameservers are Wix's.** If you change the *nameservers*, church email stops working. Instead, leave the nameservers alone and edit only two DNS records in Wix:

1. In Vercel: project > **Settings > Domains** > add `www.charlestoncoptic.org` and `charlestoncoptic.org`. Make `www` the primary and let the apex redirect to it (this matches the old site's address). Vercel shows the exact records to create.
2. In Wix: **Domains > charlestoncoptic.org > Manage DNS records**. Replace the apex `A` records (currently three `185.230.63.x` Wix addresses) with the `A` record Vercel shows, and replace the `www` `CNAME` with the one Vercel shows.
3. **Do not touch** the `MX` records (`mx.zoho.com`, `mx2.zoho.com`, `mx3.zoho.com`) or the Zoho `TXT` record.
4. Wait for Vercel's domain panel to show a green check, then retire the Wix site plan.

Lowering the records' TTL a day beforehand makes the switch (and a rollback) quicker.

If you later add Resend on this domain, its SPF record must be merged into the existing Zoho SPF record, not added as a second one.

---

## How it's put together

```
app/                 Pages and API routes (App Router)
  api/contact        POST: validate, spam checks, rate limit, send email
  api/popup          GET: the live announcement (public, never cached)
  api/admin/*        login, logout, read/save popup (session-protected)
components/          UI; components/admin/* is the popup manager
lib/                 site facts, validation, mailer, popup rules, auth, storage
data/                images.json (photo manifest), popup.json (local popup + default)
public/images/       Site photos (optimized copies migrated from Wix)
scripts/             one-time photo migration
tests/               Vitest unit tests
SITE_AUDIT.md        Inventory of the old site and migration decisions
CONTENT_NOTES.md     What changed, and copy the church should review
```

**Editing content:** page text is in `app/*/page.tsx`. Addresses, email, Venmo and Zelle details are in `lib/site.ts`. The Holy Week schedule archive is in `app/holy-week-2026/page.tsx`. Photo alt text is in `lib/images.ts`.

**Security notes**
- Admin session: signed (HMAC-SHA256) cookie, `HttpOnly`, `SameSite=Strict`, `Secure` in production, 8 hours. Password compared in constant time. Cross-origin writes are rejected.
- Popup body supports only bold, italic, links and bullets and is rendered as React elements, never raw HTML. Links must be `http(s)`, `mailto:`, `tel:` or site-relative; `javascript:` and `data:` are refused on both client and server.
- Contact form: server-side validation, honeypot field, minimum-fill-time check, per-IP rate limit (5 per 10 minutes), and header-injection guards. The limiter is in-memory, so on serverless it is a best-effort brake per instance. For hard limits, add a rate-limit rule in Vercel Firewall for `/api/contact` and `/api/admin/login`.
- Security headers are set in `next.config.ts`.

**Known limits**
- The popup appears on the homepage only (as specified), not on other pages.
- Gallery photos are added by a developer (files plus `data/images.json`); there is no photo uploader in the admin.
