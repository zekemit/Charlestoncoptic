# Content notes: what changed from the old site, and what to review

Source of truth for the migration is `SITE_AUDIT.md` (a page-by-page inventory of the Wix site as of 2026-11-23).

## Name

The brief said "St. Mark". The live site, the logo, and every page say **St. Mary & St. George (SMSG)**. St. Mark's is the sister parish in Myrtle Beach (`copticmyrtle.com`), where Fr. Antony Zaki also serves. The rebuilt site uses **St. Mary & St. George** throughout. If "St. Mark" was intended, it needs changing in `lib/site.ts`, the page titles, and the logo.

## Pages

| Old URL | New | Why |
|---|---|---|
| `/` `/about-us` `/gallery` `/donate` `/visit-us` | Same URLs | Real content, kept (existing links keep working) |
| `/general-5` ("Holy Week Schedule") | `/holy-week-2026`, archived, not indexed, not in the menu | The schedule was April 2026 and has passed; kept so nothing is lost |
| `/donate-online` | Redirects to `/donate` | The embedded payment form was broken ("does not have any accepted payment types") |
| `/events`, `/events-page`, `/events-1/*` | Redirect to `/` | Wix template filler dated July 2023 in San Francisco, with "I'm a paragraph. Click here to add your own text" |
| `/sermons` | Redirects to `/` | Empty template page, no sermons |
| `/ministries` | Redirects to `/about-us` | Template tiles with no real descriptions |
| (new) `/contact` | Dedicated contact page | Replaces the small form that was in every page's footer |
| (new) `/admin` | Popup manager | New |

When real events, sermons or ministry descriptions exist, add them as new pages; there is nothing from the old site to carry over.

## Wording changes

Body text was carried over word for word, with these corrections:

- "So he built an **alter** there" is now "**altar**" (Genesis 26:25)
- "as our **our** new church home" is now "as our new church home"
- "He **was is** aided by…" is now "He **is** aided by…"
- "Pope **Tawadrous the 2nd**" is now "Pope **Tawadros II**"
- "**Covenent** Thursday" is now "**Covenant** Thursday"
- "In addition **as** serving… may include, but **is** not limited to" is now "In addition **to** serving… but **are** not limited to"
- The page title "Visit **U**" is now "Visit **Us**"
- The footer "©2018" now shows the current year

Added (not on the old site): the Saturday liturgy time on Visit Us ("Divine Liturgy is prayed from 8:00 to 11:00 AM", from the home page), short captions under the three new-church photos, a link to the archived Holy Week schedule from the home page, "Open in Google Maps" fallback links, and alt text for all 52 gallery photos.

Removed from the home page: "Please find the 2026 Holy Week Schedule **here**" (the schedule is past); replaced with a small link to the archive.

## Please review (the church should decide)

1. **About Us is out of date.** It still says the church "has been renting a space" and "we are acquiring the necessary funding to buy a lot and build a church", yet the same page (and the home page) says the property at 2929 Bennett Charles Road was purchased on June 17, 2025. The text is kept as written (typos fixed) because it's the church's own account; someone with authority should rewrite it.
2. **Liturgy frequency.** The old About-page search description said "once a month"; the home page says every Saturday, 8:00 to 11:00 AM. The new site says every Saturday. Please confirm.
3. **Which email is public.** The site displays `charlestoncopts@gmail.com` (as before). The contact form delivers to `Kaldasms@gmail.com`. Say so if the public address should change.
4. **Fr. Antony Zaki's biography** lives on St. Mark's website, so About Us links to it instead of copying it. There are no other clergy biographies on the old site.
5. **Photos show identifiable people, including children** (cleanup day, picnic, Nativity). They were already public on the old site and were carried over. Confirm the church is comfortable continuing to publish them, and consider adding names or captions if desired. The alt text describes only what is visible.
6. **Zelle/Venmo:** the old page linked the Zelle line to the Venmo address by mistake. They are now separate (Zelle number is copyable). PayPal is noted as unavailable, as before.
7. **Map:** the old Visit Us page had a Google Map with an unverifiable pin. The new map is built from the services address (3921 St Johns Ave). Check that it shows the right spot once live.
8. **Old popup:** the Promolayer popup ("NO Liturgy this Saturday, October 31st") expired on 2026-10-31 and is replaced by the new manager. The new popup starts switched off. The Promolayer subscription can be cancelled.
9. **Third-party accounts on the old site** (Wix plan, Promolayer, MinistryForms) are no longer needed once the domain has moved.
