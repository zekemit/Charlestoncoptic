# SITE_AUDIT.md — charlestoncoptic.org

**Audited:** 2026-11-23 · **Method:** raw HTTP fetch of every URL in `sitemap.xml`, static-HTML text extraction, plus full headless-Chromium render of all 13 URLs (to catch JS-only content: hidden menu, iframes, popups, lazy-loaded gallery) · **Platform:** Wix (Thunderbolt) · **Last sitemap change:** 2026-04-07

---

## 0. Read this first — 8 findings that change the build

| # | Finding | Evidence | Impact | Recommended default |
|---|---|---|---|---|
| 1 | **Church name mismatch.** Brief says *St. Mark*. The live site is **St. Mary & St. George (SMSG)** Coptic Orthodox Church. "St. Mark" is the sister parish in **Myrtle Beach** (`copticmyrtle.com`, where Fr. Antony Zaki also serves). | Page `<title>`, og:site_name, logo, footer, every page of body copy. | Wrong name on a rebuilt church site is a trust-destroying error. | **Build as St. Mary & St. George.** Confirm below. |
| 2 | **6 of 13 URLs are unedited Wix template boilerplate** — `/events`, `/events-page`, `/events-1/easter-warm-up-sermon`, `/events-1/community-day`, `/sermons`, `/ministries`. Body text is literally *"I'm a paragraph. Click here to add your own text and edit me."* Events are dated **Jul 2023 in San Francisco, CA** (`500 Terry A Francois Blvd`). None are linked from the nav. | §4.7–4.10 below | "Zero content loss" does not apply to lorem-ipsum. Rebuilding them would publish fake events. | **DROP.** 301-redirect them. Add real Events/Ministries later when copy exists. |
| 3 | **`/donate-online` is broken today.** Embeds a MinistryForms form that renders *"Sorry, the payment form does not have any accepted payment types."* The `/donate` page already says *"(PayPal is no longer available.)"* | Live render + screenshot; MinistryForms formId `e2105a54-6fc6-47d8-8f49-35a6f4cfec8e` | Dead donation path linked from the "Online" tab on `/donate`. | **DROP the embed**; fold Venmo / Zelle / check into one `/donate` page; 301 `/donate-online → /donate`. |
| 4 | **"2026 Holy Week Schedule" (nav item #2) is past** — Apr 3–11, 2026; today is Nov 23, 2026. Home page also links to it ("Please find the 2026 Holy Week Schedule here"). | §4.3 | Stale content occupying prime nav real estate. | **Keep the content (zero loss) but archive** at `/holy-week-2026`, labelled "Past", removed from top nav. |
| 5 | **Existing popup is Promolayer (3rd-party), `published: true`, but expired.** Headline *"NO Liturgy this Saturday, October 31st"*, window `2026-10-25 → 2026-10-31`. | §6 | Confirms the Admin Popup feature replaces a real, in-use workflow (church posts "no liturgy this week" notices). | New admin popup **seeded disabled** (don't resurrect an expired notice). |
| 6 | **Conflicting liturgy frequency.** Home: *"each Saturday… 8:00–11:00am"*. About-page meta description: *"celebrating liturgy **once a month**"*. | §4.1, §4.2 | Visitors may show up on the wrong week. | Use the home-page wording (it's the operative, recently edited copy); drop the "once a month" meta description. Confirm below. |
| 7 | **DNS/email risk for cutover.** Nameservers: `ns6/ns7.wixdns.net`. **MX → Zoho Mail** (`mx.zoho.com`, `mx2`, `mx3`) + a Zoho verification TXT. Domain email is live. | DNS-over-HTTPS lookup 2026-11-23 | **Pointing nameservers at Vercel would silently kill church email.** | At cutover, **do not change nameservers.** Edit only the `A @` and `CNAME www` records inside Wix DNS (checklist in Phase 3). |
| 8 | **Two different contact emails.** Public site shows `charlestoncopts@gmail.com` (footer on every page + Visit/Donate). Brief routes form to `Kaldasms@gmail.com`. | §3.2 | Not a conflict if intentional, but visitors currently email a different inbox. | Route the **form** to `Kaldasms@gmail.com` (env `CONTACT_RECIPIENT`); **keep displaying** `charlestoncopts@gmail.com` as the public church address unless told otherwise. |

---

## 1. Site facts

| | |
|---|---|
| Official name | St. Mary & St. George Coptic Orthodox Church (SMSG) — Charleston, SC |
| Diocese | Diocese of North Carolina, South Carolina & Kentucky — H.G. Bishop Peter |
| Services location (current) | 3921 St Johns Ave, Charleston, SC 29405 (hosted by St. John's Catholic Church, North Charleston) |
| New church property | 2929 Bennett Charles Road, Mount Pleasant, SC 29466 — purchase signed **June 17, 2025** by H.G. Bishop Peter; Google Maps pin ≈ `32.8832136, -79.8095302` |
| Mail & donations address | 2929 Bennett Charles Rd, Mt Pleasant, SC 29466 |
| Public email | charlestoncopts@gmail.com |
| Facebook | `https://www.facebook.com/pages/category/Nonprofit-Organization/St-Mary-St-George-Coptic-Orthodox-Church-Of-CharlestonSC-1490500207745656/` |
| Tax status | Registered 501(c)(3) — "all donations are tax deductible" |
| Zelle | phone **843-437-1255** (TD Bank) |
| Venmo | `https://venmo.com/StMaryandStGeorge-CHSCopticChu` |
| Clergy named | Fr. Antony Zaki (coordinating priest, link → sister-parish bio page); Fr. Joseph Tawfik (Archangel Michael Church, Greenville SC); H.G. Bishop Peter; H.G. Bishop Archilids El-Antony (formerly Fr. Archilids; now Auxiliary Bishop, Toronto) |
| Social / analytics | Facebook only. Wix Tag Manager API present (tag contents not inspectable); Sentry (Wix-internal). No Google Analytics / GTM / Meta Pixel ID found in the page source (verified by grep). |

> **Clergy bios:** this site contains **no standalone clergy bios**. Fr. Antony Zaki's name links to `https://www.copticmyrtle.com/our-preist` (sister parish; HTTP 200). That bio is another parish's content, so I will **link to it, not copy it**. The only clergy photo on the site is H.G. Bishop Peter (§4.2).

---

## 2. Sitemap — existing vs. proposed

### 2.1 Existing (13 URLs, from `sitemap.xml` + `event-pages-sitemap.xml`)

| URL | In nav? | Real content? | Notes |
|---|---|---|---|
| `/` | Home | ✅ | Hero, welcome, new-church announcement, services, donate CTA |
| `/general-5` | **Holy Week Schedule** (top-level) | ✅ (expired) | Opaque slug; 2026 schedule |
| `/about-us` | More… → About Us | ✅ | Mission, diocese, acknowledgements |
| `/gallery` | More… → Gallery | ✅ | 3 albums, **52 photos** |
| `/donate` | More… → Donate | ✅ | Check / Venmo / Zelle / get involved |
| `/visit-us` | More… → Visit Us | ✅ | Services, contact, addresses, map |
| `/donate-online` | ❌ (linked from "Online" on /donate) | ❌ **broken** | MinistryForms embed, no payment types |
| `/events` | ❌ | ❌ template | Wix Events demo, 2023, San Francisco |
| `/events-page` | ❌ | ❌ empty | Blank page |
| `/events-1/easter-warm-up-sermon` | ❌ | ❌ template | Dated Jul 20, 2023, "Registration is Closed" |
| `/events-1/community-day` | ❌ | ❌ template | Dated Jul 13, 2023, "Registration is Closed" |
| `/sermons` | ❌ | ❌ template | Empty Wix Music widget |
| `/ministries` | ❌ | ❌ template | Placeholder tiles: Marriage Preparations, Women's Ministry, Volunteer Groups, Kid's, College, Pastoral Support — **no real descriptions** |

Navigation as rendered: **Home · Holy Week Schedule · More… ▾ (About Us · Gallery · Donate · Visit Us)** + Facebook icon. Footer (all pages): church name, `charlestoncopts@gmail.com`, Facebook icon, "Write Us" form (Name\*, Email\*, Message → "Send Us"), `©2018 by St. Mary & St. George Coptic Orthodox Church of Charleston, SC`.

### 2.2 Proposed (Next.js App Router)

| New route | Replaces | Action | Content source |
|---|---|---|---|
| `/` | `/` | Rebuild | §4.1 verbatim; adds popup host |
| `/about-us` | `/about-us` | Rebuild, **same URL** (keeps inbound links/SEO) | §4.2 verbatim |
| `/gallery` | `/gallery` | Rebuild: 3 albums, lazy-loaded grid + lightbox, **all 52 photos** | §4.4 |
| `/donate` | `/donate`, `/donate-online` | Merge; `/donate-online` → 301 | §4.5 |
| `/visit-us` | `/visit-us` | Rebuild, same URL; real map embed | §4.6 |
| `/contact` | footer form (every page) | **New** dedicated page + keep footer CTA | §3.3 |
| `/holy-week-2026` | `/general-5` | Rebuild as **archived**; `/general-5` → 301; off the top nav | §4.3 verbatim |
| `/admin`, `/admin/login` | — | **New** — password-gated popup manager | brief |
| `/api/contact`, `/api/popup`, `/api/admin/*` | — | **New** | brief |
| `/events`, `/events-page`, `/events-1/*`, `/sermons`, `/ministries` | — | **DROP → 301 to `/`** (`/ministries` → `/about-us`) | placeholder only |
| `/sitemap.xml`, `/robots.txt`, `opengraph-image` | Wix-generated | Generate | — |

Proposed nav: **Home · About · Gallery · Visit Us · Donate · Contact** (+ Facebook). Six items, no dropdown — the current "More…" menu hides 4 of the 6 real pages.

---

## 3. Global elements

### 3.1 Branding & observed design tokens
- **Logo:** circular crest — Virgin Mary (blue robe) with St. George on horseback, ring text *"Coptic Orthodox Diocese of North, South Carolina & Kentucky — St. Mary & St. George"*. 552×534 JPG. Colors: burgundy-brown `#4d201d`, bright gold `#f9cf7b`, bronze `#a78051`.
- **Favicon:** 2000×2000 PNG (Wix-resized to 32/180/192).
- **Current palette (sampled from live render):** heading gold `#aa9055`, "Services" panel royal blue `#173981`, footer grey `#505050`, white page body. Fonts: Playfair-style serif nav, Libre-Baskerville-style italic body, Avenir-style sans headings.
- **Hero imagery:** white wooden church with steeple (`f0da2d_af95956c…`) used as banner on Home, Holy Week, Visit Us; hands/prayer photo on Donate; separate banner on About.
- **Observed issues:** `©2018` stale; light-grey nav text on a pale hero image is low-contrast; 4 of 6 real pages hidden inside a hover dropdown.

### 3.2 Global links
`mailto:charlestoncopts@gmail.com` · Facebook (above) · logo → `/` · nav links (above).

### 3.3 Existing contact form (footer, every page)
Wix form. Fields: **Name\*** (text), **Email\*** (email), **Message** (textarea). Submit "Send Us". Success text: *"Success! Message received."* Destination = Wix inbox (not inspectable). **Rebuild adds:** optional Phone, Inquiry Type, honeypot, server validation, delivery to `Kaldasms@gmail.com` with Reply-To = visitor.

---

## 4. Page-by-page extraction (verbatim)

Image URLs below are the **original, un-transformed** Wix asset URLs (`static.wixstatic.com/media/<id>`); all **76** unique URLs (59 in the static HTML + 17 lazy-loaded gallery photos) returned HTTP 200. Plan: download into `/public/images` and serve via `next/image` (Wix hot-linking would break if the Wix subscription lapses).

### 4.1 `/` — Home
**Title:** SMSG Coptic Church of Charleston, SC · **Meta:** *Welcome to St. Mary and St. George (SMSG) Coptic Orthodox Church of Charleston, SC!*

**Hero (H1/H3):**
> Welcome to
> **St. Mary & St. George**
> **Coptic Orthodox Church**
> Charleston, SC
>
> *So he built an alter there*
> *and called upon the name of the Lord.*
> *Genesis 26:25*

**Intro:**
> St. Mary and St. George Coptic Orthodox Church of Charleston, South Carolina was founded with the intention of creating a place for Coptic Christians to devote themselves to the teachings of Jesus Christ, for fellowship, to partake of communion, and to pray.
>
> *I have heard your prayer, and have chosen this place for Myself as a house of sacrifice.* 2 Chronicles 7:12

**New-church announcement:**
> By the grace of God, we have successfully purchased **2929 Bennett Charles Road, Mount Pleasant, SC 29466** as our our new church home.
>
> **PLEASE NOTE:** While we prepare the church for worship and liturgy, we will continue to pray at **3921 St Johns Ave, Charleston, SC 29405**

**Photos (3):** exterior of white church, aerial view, bright empty interior hall (alts: "2929 Bennet Charles 1/2/3.jpg").

**SERVICES (blue panel):**
> **Saturday Mornings**
> Please note: Fr. Antony Zaki is coordinating a priest to pray liturgy for us each Saturday. Please find the 2026 Holy Week Schedule **here** *(→ `/general-5`)*.
> **Divine Liturgy: 8:00 – 11:00am**
> Location: 3921 St Johns Ave, Charleston, SC 29405

**Support Our Church:**
> *"Whoever is generous to the poor lends to the Lord, and he will repay him for his deed."* Proverbs 19:17
> **[Donate Now!]** *(→ `/donate`)*

**Interactive:** footer contact form (§3.3). **Embeds:** none.
**Images:**
- `https://static.wixstatic.com/media/f0da2d_af95956cdb3748a4b8f2957db23b6e9f~mv2.jpg` — banner — white church with steeple (shared: Home, Holy Week, Visit Us)
- `https://static.wixstatic.com/media/f0da2d_6184da00ead04f98918854b9b4aebf49~mv2.jpg` — alt: "2929 Bennet Charles 3.jpg"
- `https://static.wixstatic.com/media/f0da2d_c2bd0ea7464b46ca8343c9a7ffa2c349~mv2.jpg` — alt: "2929 Bennet Charles 1.jpg"
- `https://static.wixstatic.com/media/f0da2d_b67bd7143d3f4159b1b04dc117ee1f86~mv2.jpg` — alt: "2929 Bennet Charles 2.jpg"

### 4.2 `/about-us` — About Us
**Title:** SMSG Coptic Church of Charleston, SC | About Us · **Meta:** *St. Mary and St. George Coptic Orthodox Church is currently celebrating liturgy once a month in Charleston, SC. We're raising funds to build a church and would love your support!* ⚠ conflicts with Home (finding #6) and is outdated (the church is now bought, not "raising funds to build").

> ## About Us
> St. Mary and St. George Coptic Orthodox Church was founded with the intention of creating a place for Coptic Christians to devote themselves to the teachings of Jesus Christ, to fellowship, to take communion, and to pray. Currently, St. Mary and St. George Coptic Orthodox Church has been renting a space at a local Church; however, due to the expanding congregation and in order to accommodate future believers, we are acquiring the necessary funding to buy a lot and build a church.
>
> **Mission**
> St. Mary and St. George Coptic Orthodox Church's main mission is to serve as a place where believers can observe the Lord's Supper. It will serve as the main place in and around Charleston, South Carolina where believers can come together to remember Christ's death and resurrection. The concept of communion carries the idea of gathering together. The Church will serve as a place that promotes and teaches prayer.
>
> St. Mary and St. George Coptic Orthodox Church will also serve as a location where biblical doctrine is taught (Sunday school). We hope, with additional funding, to set up self-contained classrooms for children of different ages. The Church will serve as a place of fellowship where Christians can be devoted to learning various Biblical doctrine. The Coptic Orthodox Church is structured so that Sunday school teachers with the guidance of the appointed priest will oversee the educational content. The priest is supervised by Bishop Peter who also has to report back to Pope Tawadrous the 2nd. The main Sunday school teacher oversees other teachers. As soon as a building is provided, the diocese will send a priest who will largely oversee these affairs along with the founders of the Church, with the supervision of Bishop Peter and approval by the Pope Tawadrous the 2nd. *(source splits this sentence across two paragraphs)*
>
> In addition as serving as a convenient place for believers to come together, St. Mary and St. George Coptic Orthodox Church plans to engage in certain community development activities. Such activities may include, but is not limited to a clothing/food bank, and after-school and college/graduate faith based retreats. We hope that the Church could serve as a place where believers from other regions can gather and listen to lectures from priests and bishops on various topics of Biblical doctrine.
>
> By the grace of God and through your prayers, on June 17, 2025, His Grace Bishop Peter signed the purchase of **2929 Bennett Charles Road, Mount Pleasant, SC 29466** *(→ Google Maps pin)* to be our new church home.
>
> **St. Mary & St. George Coptic Orthodox Church belongs to the Diocese of North Carolina, South Carolina, & Kentucky under the supervision and guidance of His Grace Bishop Peter.**
>
> ## Acknowledgements
> **Fr Antony Zaki** *(→ copticmyrtle.com/our-preist)* continues to bless us with his relentless service to fulfill the needs of our growing congregation. He was is aided by Fr. Joseph Tawfik from Archangel Michael Church in Greenville SC as well as several other priests in the area.
>
> His Grace Archilids El-Antony (formerly Fr. Archilids) served us for two years and we congratulate him on his ordination as an Auxiliary Bishop for Toronto, Canada.
>
> There are no words to express our appreciation and thanks to H. G. Bishop Peter for continuing to support our church.
>
> May God bless them all and keep them all for us for many years to come.

**Interactive:** footer form; 2 outbound links. **Images:**
- `https://static.wixstatic.com/media/f0da2d_2c3a4637904644ec898f89b891af09a3~mv2.jpg` — About-page banner
- `https://static.wixstatic.com/media/f0da2d_8711eb8dc77d4183bfb0707515442894~mv2.jpg` — portrait — H.G. Bishop Peter (alt: "Bishop Peter.jpg")

### 4.3 `/general-5` — 2026 Holy Week Service Schedule (EXPIRED)
**Title:** Holy Week Schedule | SMSG Coptic Church · **Meta:** *(none)*

> # 2026 Holy Week Service Schedule
> ✥ **Friday April 3** — Conclusion of Holy Lent
> ⌲ 8:00–9:00 AM Morning incense
> ⌲ 9:00–10:30 AM Kandeel (unction of the sick)
> ⌲ 10:30–12:30 Divine Liturgy
>
> ✥ **Saturday April 4** — Lazarus Saturday
> ⌲ 8:00–10:30 AM Divine Liturgy
> ⌲ 6:00–8:00 PM Vespers for Palm Sunday, Midnight Praises
>
> ✥ **Palm Sunday April 5**
> ⌲ 7:00–8:30 AM Morning incense & Cross procession
> ⌲ 8:30–11:00 AM Divine Liturgy
> ⌲ 11:00AM–12:00PM General Funeral Prayers
> ⌲ 6:00–8:00 PM Evening Pascha
>
> ✥ **Monday April 6**
> ⌲ 6:00–9:00 AM Morning Pascha
> ⌲ 5:00–8:00 PM Evening Pascha
>
> ✥ **Tuesday April 7 and Wednesday April 8**
> ⌲ 8:00 AM – 11:00 AM Morning Pascha
> ⌲ 6:00–9:00 PM Evening Pascha
>
> ✥ **Thursday April 9** — Covenent Thursday
> ⌲ 8:00–10:00 AM Morning Pascha
> ⌲ 10:00–11:00 AM Laqan
> ⌲ 11:00AM–12:30PM Divine Liturgy
>
> ✥ **Friday April 10** — Good Friday
> ⌲ 8:00 AM–5:00 PM Pascha prayers
>
> ✥ **Friday night April 10 – Saturday morning April 11**
> ⌲ 11:00 PM–4:00AM Apocalypse night
>
> ✥ **Joyful Saturday April 11**
> ⌲ 6:00PM–10:00PM Resurrection Liturgy

*(No location is stated on the page itself; it is implicitly 3921 St Johns Ave.)* **Images:** banner only (`af95956c…`, same as Home).

### 4.4 `/gallery` — Gallery (3 albums · 52 photos)
**Title:** SMSG Coptic Church of Charleston, SC | Gallery. Wix Pro Gallery; the browser-rendered DOM (after scroll) contains **11 + 29 + 12 = 52** photos — the static HTML only contains 35 (middle album truncated at 12). No captions, alt text, or "load more".

**Album 1 — Cleaning the new Church building — June 26, 2025** (11 photos)

1. `https://static.wixstatic.com/media/f0da2d_6bf4369c66ea4896898c657c3a8de749~mv2.png`
2. `https://static.wixstatic.com/media/f0da2d_9bde404662364a02b63d8c0184fc1077~mv2.png`
3. `https://static.wixstatic.com/media/f0da2d_41da0a5314584507bb146e99792155d9~mv2.png`
4. `https://static.wixstatic.com/media/f0da2d_2fbd2b1aba20420bb38bef753ce174ea~mv2.png`
5. `https://static.wixstatic.com/media/f0da2d_a0f05a12cd744b4c9879895460f6d63c~mv2.png`
6. `https://static.wixstatic.com/media/f0da2d_0a1720e9c2c5453d95fb146962b6c4c8~mv2.png`
7. `https://static.wixstatic.com/media/f0da2d_8f8e35e10f3b4b0dbb87ef3ad44e2e67~mv2.png`
8. `https://static.wixstatic.com/media/f0da2d_2518e0ad661a4db49bb11ea5d3d8c7c2~mv2.png`
9. `https://static.wixstatic.com/media/f0da2d_f38cbae750404fb080d9f699f7ccbc79~mv2.png`
10. `https://static.wixstatic.com/media/f0da2d_a42795a8550f4f34ba42270485d7cdb5~mv2.png`
11. `https://static.wixstatic.com/media/f0da2d_4caf48c1821c420690c6307a0a47cd1f~mv2.png`

**Album 2 — Good Friday, Feast of the Resurrection Liturgy and Easter Picnic — May 1–2, 2021** (29 photos)

1. `https://static.wixstatic.com/media/f0da2d_189de53a42d74d03bac2dacc27a6c3ef~mv2.jpg`
2. `https://static.wixstatic.com/media/f0da2d_335faedb3164448aa1cc6718cb2fc175~mv2.jpg`
3. `https://static.wixstatic.com/media/f0da2d_38e9ae44d8b84a3e8252f4e4065d3ea9~mv2.jpg`
4. `https://static.wixstatic.com/media/f0da2d_1fe354e3ac724262a314af580789e5a4~mv2.jpg`
5. `https://static.wixstatic.com/media/f0da2d_15f9ee3ac7a049ffa3ca10a2579330e2~mv2.jpg`
6. `https://static.wixstatic.com/media/f0da2d_8c9fc1aaaf50482aa9591cac9c21c5be~mv2.jpg`
7. `https://static.wixstatic.com/media/f0da2d_231c3c4f9ff64a5b92c7d3f06d4bb692~mv2.jpg`
8. `https://static.wixstatic.com/media/f0da2d_8f199dd3d2f447f5ba3bd8bf7c106284~mv2.jpg`
9. `https://static.wixstatic.com/media/f0da2d_5ab159ed07e14c26a721876c9ebd1da1~mv2.jpg`
10. `https://static.wixstatic.com/media/f0da2d_9fa17a8dce6946bf8fa9c8ecd16e0c36~mv2.jpg`
11. `https://static.wixstatic.com/media/f0da2d_c631e739d2f14775bb1e301e8e10babf~mv2.jpg`
12. `https://static.wixstatic.com/media/f0da2d_970fd487273d405d872e804e177aa40d~mv2.jpg`
13. `https://static.wixstatic.com/media/f0da2d_33f32e71d94144ada26a0f12bac47d3f~mv2.jpg`
14. `https://static.wixstatic.com/media/f0da2d_093aef82cad04d2897eb1a99947a77d2~mv2.jpg`
15. `https://static.wixstatic.com/media/f0da2d_1c497b04301244e0a6c853d30160d5b9~mv2.jpg`
16. `https://static.wixstatic.com/media/f0da2d_a331cad9d9d2424aad6e9eb4ca6bfb99~mv2.jpg`
17. `https://static.wixstatic.com/media/f0da2d_9df4a1e698f74ad1a8417d16a15aecb3~mv2.jpg`
18. `https://static.wixstatic.com/media/f0da2d_af7f7250ee504586926b084b0710e1f8~mv2.jpg`
19. `https://static.wixstatic.com/media/f0da2d_55f39fdfc02f4b38b658d731b788c47d~mv2.jpg`
20. `https://static.wixstatic.com/media/f0da2d_b7feec7e5b6c4002a61be164c56b6a71~mv2.jpg`
21. `https://static.wixstatic.com/media/f0da2d_d7f69199abda423980838b84605f8ec9~mv2.jpg`
22. `https://static.wixstatic.com/media/f0da2d_632cbf66e7584f64af4753a0748be2c2~mv2.jpg`
23. `https://static.wixstatic.com/media/f0da2d_f2501a4edbd1479aa5fed08714a55f52~mv2.jpg`
24. `https://static.wixstatic.com/media/f0da2d_0b958837409a44ada826bb5c38f624c5~mv2.jpg`
25. `https://static.wixstatic.com/media/f0da2d_2db658480a0d4f519705c3fa581fb578~mv2.jpg`
26. `https://static.wixstatic.com/media/f0da2d_42e8d707e99f4ed78bcae32402ce5ef1~mv2.jpg`
27. `https://static.wixstatic.com/media/f0da2d_d36099e8cfc64ab7ac703caa78164c4a~mv2.jpg`
28. `https://static.wixstatic.com/media/f0da2d_a9957a04c1544db8801da8ea459b9560~mv2.jpg`
29. `https://static.wixstatic.com/media/f0da2d_ec263f6998b148c18ce5df4b0a1ec8cc~mv2.jpg`

**Album 3 — Feast of the Holy Nativity — January 6, 2021** (12 photos)

1. `https://static.wixstatic.com/media/f0da2d_e2f42381595540479e6806e58af000bd~mv2.jpg`
2. `https://static.wixstatic.com/media/f0da2d_2f95859d0aa04131bd4918bd9bb1dd44~mv2.jpg`
3. `https://static.wixstatic.com/media/f0da2d_97e5c25b35ff497296cb8ec414c98afd~mv2.jpg`
4. `https://static.wixstatic.com/media/f0da2d_8d578f4a20624baa978e6e2ba84d077d~mv2.jpg`
5. `https://static.wixstatic.com/media/f0da2d_99058e4f0974489ba8ede514fa6acb8f~mv2.jpg`
6. `https://static.wixstatic.com/media/f0da2d_c0ae8a307f654c8fbf8478e621c9410f~mv2.jpg`
7. `https://static.wixstatic.com/media/f0da2d_d3763ad9113a40d6b1daff88145be45f~mv2.jpg`
8. `https://static.wixstatic.com/media/f0da2d_fb17bf7b45d642e6898791cad83f07f1~mv2.jpg`
9. `https://static.wixstatic.com/media/f0da2d_dd257d764e1b41e8bb2695dd5b8d9518~mv2.jpg`
10. `https://static.wixstatic.com/media/f0da2d_3c128403d3ce4226a986ab933555ab85~mv2.jpg`
11. `https://static.wixstatic.com/media/f0da2d_40f4794024ff404982d93a3b0a0c564d~mv2.jpg`
12. `https://static.wixstatic.com/media/f0da2d_cf4c168203e74180b8188dd828e43ce3~mv2.jpeg`


### 4.5 `/donate` — Donate
**Title:** SMSG Coptic Church of Charleston, SC | Donate · **Meta:** *Help St. Mary and St. George Coptic Orthodox Church of Charleston, SC build our church!*

> ## Help Us Grow Our Church!
> *"Each man should give what he has decided in his heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."* 2 Corinthians 9:7
>
> **Ways you can support:**
> **Online** *(→ `/donate-online`, BROKEN)* · **By Mail** · **Get Involved** · **Come Visit**
>
> **By Mail** — Send a check to:
> St. Mary & St. George
> Coptic Orthodox Church
> 2929 Bennett Charles Rd
> Mt Pleasant, SC 29466
>
> **Online** — Donate online via:
> + **Venmo** *(→ `https://venmo.com/StMaryandStGeorge-CHSCopticChu?via=searchbox`)*
> + **Zelle:** Use phone # **843-437-1255** (TD Bank) ⚠ *this line is hyperlinked to the **Venmo** URL — a bug*
> + (PayPal is no longer available.)
>
> **Get Involved** — Ready to get involved with us? Send us an email at `charlestoncopts@gmail.com` *(mailto with subject "Interested in Getting Involved!")*
>
> **Come Visit** — Moving to Charleston, SC or here for a visit? We'd love to have you join us! Check out our upcoming liturgy date and time on the **Home Page**.
>
> Please consider a monthly donation!
> All donations are tax deductible as the church is a registered 501(c)3 organization.

**Images:** banner (hands/prayer photo) —
- `https://static.wixstatic.com/media/1cd9eba76a294db7befc9b890490d7f6.jpg` — Donate / Donate-Online banner

**`/donate-online`** — Title *Donate Online*, meta *Donate online now to support St. Mary and St. George Coptic Orthodox Church of Charleston, SC.* Contents: one iframe → `https://www-charlestoncoptic-org.filesusr.com/html/f0da2d_fb4b076557f059843ce8735d1876fdc0.html` → `<script src="https://forms.ministryforms.net/embed.aspx?formId=e2105a54-6fc6-47d8-8f49-35a6f4cfec8e">` ("Donate Online Now"). **Renders as an error box today.** Banner: `1cd9eba76a294db7befc9b890490d7f6.jpg`.

### 4.6 `/visit-us` — Visit Us
**Title:** SMSG Coptic Church of Charleston, SC | Visit U *(truncated "Us")* · **Meta:** *Visiting Charleston, SC? We'd love to meet you! Moving to Charleston, SC? Join us at liturgy!*

> ## Visit Us
> **Services**
> We would love to have you join us on Saturdays for Liturgy! Please see the **home page** for details.
>
> We are grateful to St. John's Catholic Church in North Charleston, SC for inviting us to use their space while we prepare our new church home.
>
> Please send us an **email** if you have any questions or if you're coming to visit! *(mailto `charlestoncopts@gmail.com?subject=Inquiry from Website`)*
>
> **Contact Us** — charlestoncopts@gmail.com
>
> **Address**
> *Current Address for Services:*
> 3921 St Johns Ave
> Charleston, SC 29405
>
> *All mail and donations:*
> 2929 Bennett Charles Rd
> Mt Pleasant, SC 29466

**Embeds:** Google Map (Wix widget; zoom, map-type and street-view controls on; pin location is set inside the Wix editor and **could not be verified** — map tiles are blocked in the audit sandbox). Rebuild uses the two street addresses explicitly. **Images:** banner `af95956c…` only.

### 4.7 `/events` — *template, DROP*
H2 "What's Happening?" · lorem paragraph · "Don't Miss Our Coming Events:" · two demo events (**Easter Warm Up Sermon**, Thu Jul 20; **Community Day**, Thu Jul 13; both at 500 Terry A Francois Blvd, San Francisco) · "More Events Coming Up:" tiles *Evening Course / Good Friday Service / Easter Sunday / AC BC* · "Be Inspired — Subscribe" newsletter block. Not a single real church event.
**Images (Wix template stock):**
- `https://static.wixstatic.com/media/fc7570_0b789d3f7dc44a528460881076f55941~mv2.jpg`
- `https://static.wixstatic.com/media/b662156d8ca44e459901fef8533807f8.jpg` — alt: "Easter Warm Up Sermon"
- `https://static.wixstatic.com/media/6104e283aa254b54ac609d7dd3c0c9ca.jpg` — alt: "Community Day"
- `https://static.wixstatic.com/media/fc7570_6e8f14b194f747288824185ae9deb835~mv2_d_1920_1280_s_2.jpg`
- `https://static.wixstatic.com/media/fc7570_d92a445f76c040aabfd72b6bd351dd25~mv2_d_4928_4017_s_4_2.jpeg`
- `https://static.wixstatic.com/media/fc7570_cf03c1f3b73d46ab801ba73544d57f17~mv2_d_2389_3000_s_2.jpeg`
- `https://static.wixstatic.com/media/fc7570_d11186eeb5a74cffbd5b44919c98cef3~mv2_d_2365_1774_s_2.jpg`

### 4.8 `/events-page` — *empty, DROP*
No body content. Hidden iframe only.

### 4.9 `/events-1/easter-warm-up-sermon`, `/events-1/community-day` — *template, DROP*
Each: title, date (Jul 2023), "500 Terry A Francois Blvd, San Francisco, CA 94158, USA", lorem paragraph, "Registration is Closed", Share (Facebook / X / LinkedIn).

### 4.10 `/sermons`, `/ministries` — *template, DROP*
- `/sermons`: H2 "Our Sermons" · lorem paragraph · **empty Wix Music widget** (iframe `tpa.wixapps.net/music-server/music-widget`) · "Be Inspired / Subscribe". **Zero sermons exist.**
- `/ministries`: H2 "Our Ministries" · two lorem paragraphs · tile titles only (*Marriage Preparations · Women's Ministry · Volunteer Groups · Kid's · College · Pastoral Support*) with a lorem blurb and "Join Now" button on the first. **No real ministry descriptions.**

---

## 5. Interactive features & integrations inventory

| Feature | Where | Status | Rebuild |
|---|---|---|---|
| Contact form (Name, Email, Message) | Footer, every page | Working (Wix inbox) | **Replace** → `/api/contact` → `Kaldasms@gmail.com`, Reply-To visitor, honeypot, validation; Resend **or** Gmail SMTP |
| Dropdown nav ("More…") | Header | Works, hides 4 pages, overlaps hero | **Replace** with flat 6-item nav + mobile drawer |
| Promolayer popup | All pages (script `displayscdn.promolayer.io/displays/7d6490de-…`) | Published but **window expired** | **Replace** → Admin Popup Manager (§6) |
| Wix Pro Gallery ×3 | `/gallery` | Working; lazy-loads | **Replace** with `next/image` grid + accessible lightbox |
| Google Map | `/visit-us` | Working (pin unverified) | **Replace** with Google Maps embed by address + "Get directions" links |
| MinistryForms donate form | `/donate-online` | ❌ **Broken** | **DROP** |
| Venmo link / Zelle number | `/donate` | Working (Zelle link is wrong) | Keep; Zelle as copy-to-clipboard phone, Venmo as button |
| Facebook link | Header + footer | Working | Keep |
| Wix Events, Wix Music, "Subscribe" newsletter | `/events`, `/sermons`, `/ministries` | Template/empty | **DROP** |
| Social share (FB/X/LinkedIn) | Event pages | Template | **DROP** |

**Not present on current site:** calendar embed, livestream, newsletter, donation processor, member login, analytics ID, blog, bulletins, multi-language/Arabic/Coptic toggle.

## 6. Current popup / announcement (Promolayer)

| Field | Value |
|---|---|
| Provider / ID | Promolayer display `NIkwzzZDfdy0pV45ATet` (script ID `7d6490de-467c-45de-bf7d-2fdc2df67609`) |
| Type / state | `popup`, `published: true` |
| Headline | **NO Liturgy this Saturday, October 31st** |
| Body | *Have a blessed week!* |
| CTA button | none |
| Image | uploaded banner 960×550 (`imagePosition: none` → not displayed) |
| Schedule | start `2026-10-25 21:15Z` → end `2026-10-31 21:15Z` (America/New_York) — **expired** |
| Trigger | immediately, on every page view |
| Size | 450×200 desktop, 200 mobile · fade-in · close button visible |
| Last edited | 2026-10-26 |

**Mapping to the new Admin Popup Manager** — every setting the church already uses has a direct field: master toggle ↔ `published`; title/body ↔ heading/text; expiry ↔ `whenToShow.end`; frequency ↔ `shouldTheDisplayRecur` (*every-page-view* → "Every visit"). New additions: optional CTA button, image/flyer URL, "once per session" mode, split-screen live preview. The popup is non-technical-user driven: the editor today is a SaaS dashboard; the replacement removes that dependency and monthly cost.

## 7. External links inventory

| Link | Used on | Status |
|---|---|---|
| `https://www.facebook.com/pages/category/Nonprofit-Organization/St-Mary-St-George-Coptic-Orthodox-Church-Of-CharlestonSC-1490500207745656/` | header+footer | keep |
| `https://venmo.com/StMaryandStGeorge-CHSCopticChu?via=searchbox` | /donate | keep (drop `?via=searchbox`) |
| `https://www.copticmyrtle.com/our-preist` | /about-us (Fr. Antony Zaki) | HTTP 200; link only |
| Google Maps place link for 2929 Bennett Charles Rd (`@32.8832136,-79.8095302`) | /about-us | keep |
| `mailto:charlestoncopts@gmail.com` (+ 2 pre-filled subjects) | global, /visit-us, /donate | keep |
| `forms.ministryforms.net` (formId `e2105a54-…`) | /donate-online | dead → drop |
| Facebook/X/LinkedIn share URLs | event pages | drop |

## 8. Copy corrections to apply during rebuild (typos found in source)

| Source | Fix |
|---|---|
| "So he built an **alter** there" (Genesis 26:25) | **altar** |
| "as our **our** new church home" | "as our new church home" |
| "He **was is** aided by Fr. Joseph Tawfik" | "He is aided by…" |
| "Pope **Tawadrous the 2nd**" (×2) | "Pope Tawadros II" |
| "**Covenent** Thursday" | "Covenant Thursday" |
| "In addition **as** serving… activities may include, but **is** not limited to" | "In addition to serving… include, but are not limited to" |
| Visit-Us `<title>` "Visit **U**" | "Visit Us" |
| Footer "©**2018**" | dynamic current year |
| Zelle text linked to Venmo URL | separate Zelle (copy number) and Venmo (link) |
| About: "we are acquiring the necessary funding to buy a lot and build a church" + meta "raising funds to build" | Outdated — property already purchased (June 17, 2025). **Rebuild keeps the original text verbatim in the page body, flagged for your edit**; I will not silently rewrite church doctrine/history. |

## 9. Complete media inventory
**76 unique images, all HTTP 200** (64 JPEG, 12 PNG): 59 present in static HTML + 17 gallery photos that only load in a real browser. Per-page lists are in §4; shared across all pages: logo `f0da2d_f61c2da4ae3b4bd287e77138c2a9eb87~mv2.jpg` (552×534), Facebook icon `e316f544f9094143b9eac01f1f19e697.png`, favicon `f0da2d_e6c6c51b4713464dae1e19669ec03fb7~mv2_d_2000_2000_s_2.png`.
**Excluded (template stock, not church-owned):** the 7 `fc7570_*` images on `/events` & `/ministries` plus `84770f_8c97…` on `/sermons` and `cf80a746…`, `83adcadb…`, `b662156d…`, `6104e283…` template thumbnails. 
**Kept for rebuild:** logo, favicon, 3 hero/banner photos, 3 new-church photos, Bishop Peter portrait, hands/prayer banner, **52 gallery photos**.

---

## 10. Proposed build (Phase 2) — summary

- **Stack (locked per brief):** Next.js App Router + TypeScript + Tailwind; Vercel.
- **Popup persistence:** Upstash Redis via Vercel Marketplace (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, with Upstash-native names also accepted) → fallback to `data/popup.json` on local dev only. *(Vercel KV has been folded into the Marketplace Upstash Redis integration with the same REST API; exact env-var names get verified at scaffold time.)*
- **Admin auth:** `ADMIN_PASSWORD` env; HMAC-signed, `HttpOnly`/`Secure`/`SameSite=Strict` session cookie; constant-time compare; login rate-limit. No user table.
- **Email:** `/api/contact` — provider auto-selected: `RESEND_API_KEY` → Resend; else `GMAIL_USER`+`GMAIL_APP_PASSWORD` → Nodemailer; else clear 503. Recipient `CONTACT_RECIPIENT` (default `Kaldasms@gmail.com`). HTML + text bodies, escaped input, honeypot + min-fill-time, zod validation on client and server.
- **Aesthetic:** warm ivory `#FBF6EA` ground; liturgical gold from the crest (`#A78051` / `#C9A24B`); deep burgundy `#5A1A22` (crest ring) and navy `#173981` (current Services panel) accents; serif display (Cormorant/Playfair class) + clean sans body; AA contrast verified; mobile-first.
- **Perf:** all 52+ photos downloaded, converted to optimized AVIF/WebP at build via `next/image`; static pages ISR/SSG; popup fetched client-side with `no-store` so edits go live instantly.

### Open questions (defaults in **bold**; reply "go" to accept all)
1. **Church name → St. Mary & St. George** (not "St. Mark"). ✔ / change?
2. Drop the 6 template pages & broken `/donate-online` with 301s → **yes**.
3. Holy Week 2026 → **archive at `/holy-week-2026`, off top nav** (vs. delete).
4. Liturgy frequency → **"each Saturday, 8:00–11:00 AM"** (Home wording).
5. Public email on site → **keep `charlestoncopts@gmail.com` displayed; form routes to `Kaldasms@gmail.com`**.
6. Popup seed → **disabled**, no stale content.
7. About-page text → **verbatim (typos fixed), flagged outdated** for the church to rewrite.
8. Domain cutover → **edit A/CNAME only; leave Wix nameservers + Zoho MX alone.**
