# PARITY — פרנסה׳לע: the original vs. the Orbit port (re-skin "עיצוב", 13.10.2026)

Original: the owner's single-file app `parnasale.html` (+ `PARNASSALE-SPEC.md`, `DESIGN-SPEC.md` and the 390px reference shots — scratchpad
`parnasa-design/`, not in the repo). Port: `src/components/parnasa/` on branch `claude/parnasa-skin-261013` (types in `src/types/domain.ts`,
store actions in `src/store/useApp.ts`). Port file names below are relative to `src/components/parnasa/` unless a path is given.

This file started as a copy of the design-phase PARITY (port at `ec722e5`, before any re-skin) and is kept current after every
re-skin cluster (`שדרוג · פרנסה׳לע עיצוב N`). The skin itself: `parnasa.css` (the original's stylesheet, root-scoped under `.pn`/`.pl`,
generated 1:1 — every class `pn-`, every variable `--pn-`, rem ⇒ `--pn-rem`), `svgDefs.ts` (the original's icon/coin/banner `<defs>`),
`skin.tsx`/`Shell.tsx` (primitives + the band/tab bar/colophon), `shell.ts` (pure: Hebrew month, periods, pushke, help count).

**Status** — `present` = the capability exists and behaves like the original **and** is presented in the original's visual language
(after the re-skin; before it, "present" meant behaviour only); `partial` = some of it exists, or it exists in a different form/place,
or it still looks generic; `missing` = not in the port. **Gap type** — `UI` = presentation/client logic · `DATA` = needs new
additive fields · `SERVER` = needs a server, public/authenticated access by residents or business owners, public deep links or an
LLM call — **out of scope; listed as owner decisions** (the original is a community app where residents, owners and the gabbai each act
for themselves; the port is a gabbai/staff tool inside Orbit — residents' requests are deliberately not public, decision 6, and there
is no owner login).

**Before the re-skin** (design phase, 164 capabilities in A–K): **30 present · 65 partial · 69 missing**.
**Now (after cluster 4 — העסק שלי)**: **117 present · 32 partial · 15 missing**

**Design-phase breakdown** (before the re-skin): of the 134 partial+missing rows, the main blocker is: 93 UI-only · 26 need new data fields (DATA, usually with UI) · 15 need a server or public access (SERVER, out of scope). A parenthetical "(+DATA…)"/"(+SERVER…)" marks a secondary, smaller part of the gap.

Current counts per area (recomputed from the rows after every cluster):

| area | present | partial | missing |
|---|---|---|---|
| A. Shell & brand | 12 | 2 | 3 |
| B. Home | 19 | 2 | 0 |
| C. Results | 10 | 0 | 1 |
| D. Browse | 8 | 0 | 0 |
| E. Business page | 23 | 1 | 1 |
| F. Contact | 3 | 0 | 1 |
| G. Requests | 6 | 9 | 4 |
| H. Community board | 6 | 5 | 3 |
| I. העסק שלי | 21 | 3 | 0 |
| J. Admin | 5 | 7 | 2 |
| K. Booklet | 4 | 3 | 0 |

## A. Shell, brand and chrome

| # | original (screen · control · capability) | status | port file | gap | notes |
|---|---|---|---|---|---|
| A1 | Burgundy-satin header band with lit gold seam and glow (L134–174) | present | Shell.tsx `Band` · parnasa.css (`.pn-band`) | UI | the original's satin band, gold seam and glow, root-scoped; on phones the module bleeds edge-to-edge like the original |
| A2 | Header pushke (inline SVG) that fills with this month's help count; tap → "החודש בקהילה: N פעמים עזרו אחד לשני"; coins drop into its slot | present | Shell.tsx `HeaderPushke` · shell.ts `helpCount`/`pushkeFill`/`pushkeText` | UI | gold rises with this Hebrew month's help (closed requests + answers + recommendations, in the community's time zone); tap ⇒ bump + toast with the original wording. Coins dropping into the slot = B7 |
| A3 | Wordmark "פרנסה◆לע" (gold gradient, glowing diamond geresh, periodic sheen) + community name or tagline "א פרנסה׳לע פאר יעדן איד" | present | Shell.tsx `Band`/`Wordmark` | UI | gold wordmark with the glowing diamond geresh and periodic sheen; community name or the tagline; a customised name without a geresh renders as plain text in the same style |
| A4 | "ב״ה" + Hebrew date in the band | present | Shell.tsx · shell.ts `hebNow` | UI | ב״ה + Hebrew date — switches at sunset (the original switched at midnight) |
| A5 | Dedication ticker under the band, scrolling when it overflows, "ת.נ.צ.ב.ה." when the text has "נשמ" | present | Shell.tsx `Dedication` | UI | scrolls only when it overflows (ResizeObserver), pauses on hover/focus, still for reduced motion and on Shabbat; ת.נ.צ.ב.ה. when the text has נשמ |
| A6 | "⋯" display menu (below 700px) holding the three toggles | present | Shell.tsx `Band` (tools) | UI | ⋯ menu below 700px, inline buttons above; closes on outside click / Escape |
| A7 | "אותיות גדולות" (root 16→18.5px, per viewer, `alfon.big`) | present | skinPrefs.ts `useSkinPrefs` · parnasa.css `--pn-rem` | UI | per viewer (`maor_pn_big`); scales only the module (rem ⇒ `calc(N*var(--pn-rem))`), toasts אותיות גדולות/רגילות |
| A8 | "מצב לילה" / "מצב יום" — full night palette, follows the system by default, `alfon.theme` | present | skinPrefs.ts · ParnasaView.tsx (`data-pn-theme`) | UI | full night palette; follows the device by default, Orbit's dark 'היכל' theme ⇒ night, the viewer's choice wins (`maor_pn_theme`) |
| A9 | "צלילים" — synthesized coin clinks (WebAudio), silent in the Three Weeks, `alfon.mute` | present | sound.ts (`clink`/`plink`) | UI | WebAudio synth created on the first gesture only, per-viewer mute (`maor_pn_mute`), silent in the Three Weeks; coin sounds fire from the coins (cluster 2) |
| A10 | Floating glass bottom tab bar אלפון · לוח בקשות · לוח הקהילה · העסק שלי · ניהול, gold sliding indicator, badges (open requests · pending notices · fresh requests in my trade · pending pages) | partial | ParnasaView.tsx · Shell.tsx `TabBar` | UI (+SERVER for העסק שלי) | the original's floating glass tab bar (sticky above Orbit's mobile nav) with the gold indicator: אלפון · לוח בקשות · לוח הקהילה · העסק שלי · ניהול; badges: open requests · pending notices (gabbai) · pending + care queue on ניהול. Every port tab kept: care → ניהול/אישורים, booklet + ads → מודעות וחוברת, 📞 הקו and הגדרות → ניהול segments. Missing: the 'fresh requests in my trade' badge on העסק שלי (cluster 4) |
| A11 | Once-per-session intro: 3D pushke (three.js r128 from cdnjs) with CSS fallback, skippable | missing | — | UI | the CSS fallback (mark + letter-by-letter wordmark) is enough; three.js would have to be bundled |
| A12 | Gold-dust canvas behind the page (off for reduced motion and Shabbat) | missing | — | UI | |
| A13 | Footer colophon: mark · "פרנסה׳לע · א פרנסה׳לע פאר יעדן איד" · "נבנה לתועלת הקהילה · לחיזוק הפרנסה של אנשינו" · "לחסות על שער, להקדשה ולפרסום בחוברת השנתית: פנו לגבאי בטלפון …" | present | Shell.tsx `Colophon` | UI | verbatim, with the publicity phone from the settings |
| A14 | Toast with an action button ("לצפייה", "שעת צורך, להמשיך") | present | ParnasaView.tsx `toastAct` · `PnPortal` (`.pn-toast`) | UI | the original's toast with an action button, in a skin portal above Orbit: "לצפייה" after posting a request, "שעת צורך, להמשיך" on the Shabbat gentle lock; auto-hides after 4.5 s |
| A15 | Keyboard: "/" focuses the search anywhere; ↑↓ / Enter (WhatsApp) / Esc in results; W on a banner; F or כ flips a coin | present | ParnasaView.tsx ("/") · DirectoryTab.tsx `onKeyDown` · coinFx.ts (F/כ) | UI | "/" anywhere in the module focuses and selects the question (from any tab); ↑↓ move the selection in the results, Enter = WhatsApp of the selected banner (no banner ⇒ the prefilled request), Esc clears; W on a focused banner ⇒ WhatsApp; F or כ on a focused coin flips it |
| A16 | Deep link `#b-<key>` opens a business page ("העסק הזה לא נמצא באלפון") | missing | — | SERVER | needs a public URL; an in-app hash is UI |
| A17 | Per-viewer memory: last tab, admin segment, board tab, usage hints only in the first 3 visits | partial | ParnasaView.tsx (`useRemembered`) · skinPrefs.ts `useHintsOff` | UI | last tab + admin segment + filters remembered (session); usage hints only in the first 3 visits (`maor_pn_hints`); board tab memory with the board re-skin (cluster 5) |

## B. אלפון — home ("ask" mode)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| B1 | Greeting line: בוקר טוב / צהריים טובים / ערב טוב / לילה טוב, "שבת שלום", "שבוע טוב"; Hebrew day+month; zman chip (שקיעה · בעוד…, הדלקת נרות · בעוד…, צאת השבת); period chip (היום N ימים לעומר · בין המצרים · תשעת הימים · חודש אלול) | present | home.ts `greetingOf` · Home.tsx `AskStage` | UI | בוקר טוב … לילה טוב, שבת שלום / חג שמח, שבוע טוב on Motzei Shabbat; Hebrew day+month; zman chip (שקיעה · בעוד…, הדלקת נרות · בעוד… on Friday, צאת השבת/החג on Shabbat) from the community's zmanim; period chip (Omer, בין המצרים, תשעת הימים, חודש אלול) from shell.ts `periodOf` |
| B2 | "מה צריך?" at up to 7.4rem + "כותבים את הבעיה במילים שלכם, ומקבלים את האדם הנכון." (Shabbat: "שבת שלום. לשעת צורך, האדם הנכון כאן.") | present | Home.tsx `AskStage` (`h2.pn-q`) | UI | the original's huge "מה צריך?" with the gold question mark and both sub-lines verbatim (the Shabbat one during the closure) |
| B3 | Omnibox: 4rem pill, gold lens, gold ring spinning on focus, "/" hint, clear; typing switches to answer mode | present | Home.tsx `AskStage` (`.pn-box`/`.pn-ask`) · DirectoryTab.tsx | UI | 4rem pill, gold lens, gold ring spinning on focus, "/" hint, clear button; typing switches the screen to answer mode (`data-mode`) with the coins shrinking into pills |
| B4 | "חיפושים נפוצים" — 5 chips per season | present | home.ts `PN_SEASONS[*].pop` · Home.tsx (`.pn-pop`) | UI | 5 popular-search chips per season, verbatim from the original's season table |
| B5 | "חיוג מהיר" — favourites ★ (≤20) and recents (≤10) as medallions with a green open-now dot; replaces B4 when not empty | present | skinPrefs.ts `useQuickDial` · home.ts `quickDialList` · Home.tsx (`.pn-dial`) · BizSheet.tsx (★) | UI | medallions with the green open-now dot, replacing the popular searches when not empty; ★ on the business page (header and bar) toggles a favourite (≤20, toasts "נוסף לחיוג המהיר" / "הוסר מהחיוג המהיר"); recents (≤10) recorded on open / WhatsApp / call / copy; per viewer, namespaced per org |
| B6 | "בעונה הזו · {edition}" + season title; 6 minted coins per Hebrew season (editions: Sukkot weave, Chanukah silver, Purim masks + confetti, Pesach matzah) | present | home.ts `PN_SEASONS`/`PN_EDITIONS`/`seasonOf` · coins.ts · Home.tsx `AskStage` | UI | "בעונה הזו · {edition}" + the season title; 6 minted coins per Hebrew season with the original's coin art (generated 1:1 from its code: metals, rims, reliefs, editions — Sukkot weave, Chanukah silver, Purim masks + confetti, Pesach matzah) and each coin's live count (`searchCount`) |
| B7 | Tap a coin → it flies into the header pushke with a clink, then its query runs | present | coinFx.ts `coinTap`/`cnFly` · sound.ts | UI | tap ⇒ the coin flies into the header pushke (bump + clink; an off-screen pushke glows instead), then its query runs; reduced motion ⇒ straight to the query |
| B8 | Long-press / F → the coin flips to its live count ("N בעלי מקצוע"); hint "לחיצה: חיפוש · לחיצה ארוכה: כמה בעלי מקצוע יש" | present | coinFx.ts `cnFlip` · Home.tsx | UI | long-press or F/כ flips the coin to its live count ("N בעלי מקצוע"); hint verbatim (only in the first 3 visits) |
| B9 | Platinum sponsor coin (full width, monogram, ribbon "בחסות") opening the sponsor's trade with their card pinned; gabbai placeholder "כאן יופיע מטבע פלטינה בחסות · למכירה · 300 ₪ לחודש · רק הגבאי רואה" | present | AdForm.tsx ("מטבע פלטינה בחסות") · lib.ts `coinSponsor` · Home.tsx `AskStage` · DirectoryTab.tsx | DATA + UI | a sponsorship marked as the platinum coin (additive `PrAd.coin` + `mono`) shows full-width with the monogram and the "בחסות" ribbon and opens the sponsor's trade with their own card pinned; gabbai placeholder "כאן יופיע מטבע פלטינה בחסות · למכירה · N ₪ לחודש · רק הגבאי רואה" (price from the price list) jumps to the sponsorships. Registration + pay link only — no receipts |
| B10 | "שבוע טוב!" card on Motzei Shabbat ("N בקשות חיכו לכם מהשבת" / "שבוע של פרנסה טובה ובשורות טובות"), dismissible | present | home.ts `weekWaiting` · Home.tsx (`.pn-week`) | UI | on Motzei Shabbat: "שבוע טוב!" with the requests that waited since candle-lighting (non-quiet, swipeable rows) or "שבוע של פרנסה טובה ובשורות טובות"; dismissible for the evening |
| B11 | "החודש בקהילה" pulse: "N בקשות נמצאו · N פעמים בעלי מקצוע ענו · N תודות מהקהילה" (30 days) | present | home.ts `pulseOf` · Home.tsx (`.pn-pulse`) | UI | 30 days: found (closed non-quiet requests) · answers · thanks, verbatim wording with singular forms |
| B12 | "מבקשים עכשיו" — 3 open community-visible requests (urgent first) with "מכיר מישהו?" + "לכל הבקשות" | partial | home.ts `askingNow` · Home.tsx `RqRow` | SERVER | live for the module's users: 3 open non-quiet requests routed to the whole community, urgent first, with the requester's name (or "חבר הקהילה"), "מכיר מישהו?" (WhatsApp with the original's message, or the request on the board) + "לכל הבקשות"; rows swipe right ⇒ WhatsApp, left ⇒ call (only the actions the org turned on; the number itself is never shown in the row). Residents seeing it publicly = owner decision (SERVER) |
| B13 | "מומלצי השבוע" (crown) — up to 3 featured banners rotating daily + "עוד N מומלצים"; gabbai placeholder "כאן יופיעו כרטיסים מודגשים · למכירה · 45 ₪ לחודש" | present | home.ts `featuredRotation` · Home.tsx (`.pn-hFeat`) | UI | up to 3 featured photo banners rotating daily (every paying card reaches the top) + "עוד N מומלצים באלפון"; gabbai placeholder "כאן יופיעו כרטיסים מודגשים · למכירה · N ₪ לחודש" from the price list |
| B14 | Home sponsor line "פרנסה׳לע השבוע בחסות" — name, line, call, site | present | Home.tsx `SponsorLine` · lib.ts `adRotation` (slot `board`) · AdForm.tsx (url) | UI (+DATA: url) | "פרנסה׳לע השבוע בחסות" on the home — name, line, call, site (additive `PrAd.url`, http(s) only); still also on the community board |
| B15 | "כל האלפון" velvet button + "עוד באלפון" expander ("כל התחומים · מצטרפים חדשים") | present | Home.tsx (`.pn-hmore-r`) | UI | velvet "כל האלפון" + the "עוד באלפון" expander ("כל התחומים · מצטרפים חדשים") |
| B16 | "כל התחומים" — two-row rail of the 15 trades with mini coins and counts + "לכל האלפון" | present | home.ts `tradeRail` · Home.tsx (`.pn-trail`) | UI | two-row rail of the 15 trades with mini coins (the edition's metal) and counts + "לכל האלפון" |
| B17 | "חדש בפרנסה׳לע" — up to 6 joined/updated in 60 days ("הצטרפו או עודכנו לאחרונה") | present | home.ts `newJoiners` · Home.tsx (`.pn-hNew`) | UI | up to 6 joined or updated in 60 days, "הצטרפו או עודכנו לאחרונה" |
| B18 | Business CTA "לבעלי עסקים · יש לך עסק? · הצטרפות בחינם" / "הדף שלכם באלפון · לעריכת הדף" / pending text | partial | Home.tsx (`.pn-cta`) | SERVER | the CTA card verbatim ("לבעלי עסקים · יש לך עסק? · הצטרפות בחינם") — "הצטרפות בחינם" opens the add-business form for whoever may add cards. The owner's own page ("הדף שלכם באלפון · לעריכת הדף", pending text) needs owner logins = owner decision (SERVER) |
| B19 | Stats line "N בעלי מקצוע · N תחומים · N בקשות פתוחות" (counts up when scrolled into view) | present | Home.tsx (`.pn-statl`) · DirectoryTab.tsx | UI | "N בעלי מקצוע · N תחומים · N בקשות פתוחות", counting up once when scrolled into view (still for reduced motion) |
| B20 | Shabbat calm: banner with candles, once-per-Shabbat overlay "שבת שלום / האלפון נח עד צאת השבת", gentle lock on WhatsApp/call/post ("שעת צורך, להמשיך" → 15 min), statuses "חוזר במוצ״ש", motion stilled | present | Shell.tsx `CalmBanner` · ParnasaView.tsx (`data-calm`, Shabbat overlay, gentle lock) · lib.ts `listingStatus` | UI | candle banner; once-per-Shabbat overlay "שבת שלום / האלפון נח עד צאת השבת · HH:MM" (7 s, per device); gentle lock on WhatsApp/call/post ("שבת קודש. האלפון נח עד…" + "שעת צורך, להמשיך" ⇒ 15 min); statuses "חוזר במוצ״ש"; motion stilled — all from the engine's closure in the community's time zone (Yom Tov variants) |
| B21 | Friday-afternoon dusk tint; period skins (Omer seam fills to 49, Elul blue seam, Three Weeks desaturated and silent) | present | shell.ts `eveOf`/`periodOf` · ParnasaView.tsx (`--pn-eve`, `data-period`, `--pn-omer`) | UI | Friday-afternoon dusk tint inside the module; Omer seam fills to 49, Elul and Three Weeks skins from the original CSS; sounds silent in the Three Weeks |

## C. אלפון — results ("answer" mode)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| C1 | Deterministic matching: 25 problem concepts, prefixes, stems, typos, name, location, phone digits; rank coverage → tier → featured → open → recommendations → name | present | lib.ts `analyzeQuery`, `searchListings` | — | |
| C2 | Echo line "״{q}״ ← concept chips · שם · אזור" with matched words highlighted (`mark`) and "↑↓ בחירה · Enter וואטסאפ · Esc ניקוי" | present | Home.tsx `Understood`/`HiName` | UI | echo line "״{q}״ ← concept chips · שם · אזור", matched words highlighted with `mark` in names and titles, hint "↑↓ בחירה · Enter וואטסאפ · Esc ניקוי" |
| C3 | Photo banners: trade photo with an animated SVG live layer, logo/trade-icon medallion, name in silver or warm gradient, title, area with pin, "הנחה לקהילה"/"גמ״ח" badges, gold "מבצע" ribbon with a "עד D.M" seal, "מומלץ" seal or "בחסות · מוצמד ראשון", gold/platinum frames | present | Home.tsx `Banner`/`Medal` · banners.ts (`pbLayers`, 18 photos in `public/parnasa/photos/`) · bannerFx.ts | UI + DATA | the original's photo banners 1:1: trade photo (lazy, ≤4 live) under the animated SVG layer, logo/trade-icon medallion, silver or warm name, title, area pin, הנחה לקהילה / גמ״ח badges, gold "מבצע" ribbon with the "עד D.M" seal, "מומלץ" seal or "בחסות · מוצמד ראשון", gold/platinum frames. `logo`/`offer`/`palette` are healed additive fields (their editor = cluster 4) |
| C4 | First result as a full banner, the rest as compact rows; two-up at ≥960px with a sticky side column | present | Home.tsx `Answers` (`.pn-bns`) | UI | first result as a full banner, the rest as compact rows, "עוד N באלפון המלא"; two-up at ≥960px with the sticky side column (the original's CSS) |
| C5 | Swipe right → WhatsApp (or copy number), left → call; one-time nudge "ימינה לוואטסאפ · שמאלה לחיוג" | present | bannerFx.ts (swipe, `pbNudge`) | UI | swipe right ⇒ WhatsApp (or copy the number when WhatsApp is off), left ⇒ call; the one-time nudge "ימינה לוואטסאפ · שמאלה לחיוג" (per session); ripple on tap |
| C6 | The season coins shrink into a pill row under the search | present | parnasa.css (`[data-mode=answer] .pn-probs`) | UI | the season coins shrink into a pill row under the search |
| C7 | "לא מצאתי" / "רק N תוצאות? בקשו מהקהילה": "פרסום" (posts at once; quiet automatically if sensitive), "עם טלפון" (prefilled form), "ללוח הבקשות" | present | Home.tsx `NotFound` · DirectoryTab.tsx `postNow` → RequestsTab.tsx | UI (+SERVER for residents) | "לא מצאתי" / "רק N תוצאות? בקשו מהקהילה" / "פרסום בלוח הבקשות": "פרסום" posts at once (quiet automatically when the topic is sensitive — "נשלח בשקט, רק לבעלי המקצוע בתחום") with "לצפייה"; "עם טלפון" opens the prefilled form; hidden when the requests board is off |
| C8 | "לא בטוחים? שאלו את העוזר של פרנסה׳לע" → "מצא לי" (Claude: up to 4 picks with a reason line + a tip box) | missing | — | SERVER | LLM call; Orbit has a dormant Claude path in `src/lib/ai.ts` |
| C9 | Zero results "עוד אין לנו תשובה לזה." + "אבל הקהילה כן…" + post + AI | present | Home.tsx `Answers` | UI | "עוד אין לנו תשובה לזה." + "אבל הקהילה כן. בקשה אחת בלוח, וכולם רואים." + post; the AI box = C8 |
| C10 | Platinum-coin results: the sponsor's trade with the sponsor's own listing pinned (matched by phone/name) or a sponsor card "בחסות · מוצמד ראשון" | present | home.ts `pinnedHits` · Home.tsx `SponsorCard` | DATA + UI | the coin opens the sponsor's trade with the sponsor's own card pinned first (matched by the last 9 phone digits or the normalised name), else the sponsor card "בחסות · מוצמד ראשון" with WhatsApp/phone/site; like the original, pinned results are not ranked — no name/area highlights |
| C11 | Empty directory "האלפון עוד מתמלא"; loading "האלפון נטען, עוד רגע…" | present | Home.tsx `Answers` | UI | "האלפון עוד מתמלא" + the post box, verbatim; no loading state — the port's data is local |

## D. אלפון — browse "כל האלפון" and the trade gates

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| D1 | Browse header: "לשאלה" back pill · "כל האלפון" · "N אנשי מקצוע" | present | Browse.tsx (`.pn-bhead`) | UI | "לשאלה" back pill · "כל האלפון" · "N אנשי מקצוע" (approved, like the original) |
| D2 | Filter field "סינון לפי שם, מקצוע או עיר" (every word must match) | present | Browse.tsx (`.pn-filter`) · lib.ts `matchesAll` | UI | "סינון לפי שם, מקצוע או עיר" — every word must appear (name, title, description, city, area, gate, hours, tagline, services; the port adds the dial code); remembered per session |
| D3 | Gate index: 15 tiles with the gematria numeral in Karantina, name, count, crown when sponsored; "הכול · כל השערים"; selected tile turns velvet with a gold numeral | present | Browse.tsx (`.pn-idx`) | UI | 16 tiles — "הכול · כל השערים" + the 15 gates with the gematria letter (Karantina), name and count, a crown when the gate has a sponsor today; the selected tile turns velvet with a gold letter (the original's CSS) |
| D4 | Toggles "הנחה לקהילה", "גמ״ח", "פנויים לעבודה", "מתאים ל: כולם/גברים/נשים" | present | Browse.tsx (`.pn-toggles`) · lib.ts `filterListings` (`seek`) | DATA + UI | הנחה לקהילה · גמ״ח · פנויים לעבודה (`seek`) · מתאים ל: כולם/גברים/נשים — plus the port's פנוי עכשיו (the original's hidden toggle), חירום 24/7 and, for the gabbai, כולל ממתינים ומוסתרים (banners then carry the approval state) |
| D5 | Gate groups: huge numeral + name + "N כרטיסים" over a 2px rule; featured first, then name | present | Browse.tsx (`.pn-grp`) | UI | huge gate letter + name + "N כרטיסים" over the 2px rule; featured first, then name; the entries are the original's photo banners (first full, the rest rows) with the port's dial code as a badge; swipe hint on touch screens |
| D6 | Gate sponsor box ("בחסות" pill, name, line, call, site) | present | Browse.tsx `GateSponsor` · lib.ts `adRotation` | UI (+DATA: url) | the original's sponsor box ("בחסות" pill, name, line, call when telephony is on, site — https only) under the gate head; the port's daily rotation between several sponsors of a gate is kept. The original's home-line sponsor also lit the "בית, ניקיון וגינון" gate (both keyed `home`) — that collision is not ported |
| D7 | Empty gate "עוד אין אנשי מקצוע בשער הזה." + "פרסום בקשה בלוח"; "האלפון מחכה לכרטיס הראשון…" + "הוספת הכרטיס שלי"; "לא נמצא מתאים" | present | Browse.tsx | UI | "האלפון מחכה לכרטיס הראשון" + "הוספת הכרטיס שלי" · "לא נמצא מתאים" + "פרסום בקשה בלוח" · "עוד אין אנשי מקצוע בשער הזה." — verbatim |
| D8 | "הורדת האלפון לאקסל (CSV)" — "להדפסה, לבית המדרש ולמי שיש לו טלפון כשר." (BOM, CRLF, quoted, injection guard, LRM phones; approved only, gate order) | present | Browse.tsx (`.pn-exportrow`) · lib.ts `listingsCsvRows` | — | the original's export row ("הורדת האלפון לאקסל (CSV)" + "להדפסה, לבית המדרש ולמי שיש לו טלפון כשר."), through the export gate (`parnasa.export`) and the access log; the port's extra columns kept |

## E. Business page

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| E1 | Full-height spring sheet over the list (drag down / swipe sideways / Esc, focus trap), frosted mini header on scroll, floating sheet on desktop | present | BizSheet.tsx · sheetFx.ts `mountSheet` | UI | full-height spring sheet over any tab (the list stays below), drag down from the cover/grabber, swipe sideways, Esc (lightbox ⇒ envelope ⇒ sheet), focus trap and focus return, frosted mini header when scrolled, floating on desktop; page scroll locked while open. Sits under Orbit's modals (edit / "אני זמין" open above it) |
| E2 | Cover: trade photo tinted by the page palette, or palette velvet with a pushke watermark; 7px gold rope edge | present | BizSheet.tsx (`.pn-bpc`) · banners.ts `photoOf` | UI + DATA | the trade photo under the page palette tint (8 palettes, `data-pal`), or the palette velvet with the pushke watermark; 7px gold rope |
| E3 | Logo in an ivory disc with a conic gold ring, or a trade-icon monogram | present | BizSheet.tsx (`.pn-bplogo`) | DATA + UI | logo (data image only) in the ivory disc with the conic gold ring, else the trade-icon monogram on the palette |
| E4 | Name (Frank Ruhl 900), tagline (palette light), offer pill "{text} · עד D.M", title, "category · city · area", status pill when not open (סגור עכשיו / נפתח בקרוב / חוזר במוצ״ש) | present | BizSheet.tsx · lib.ts `listingStatus` · skin.tsx `StPill` | UI + DATA | name, tagline, offer pill "{text} · עד D.M", title, "gate · city · area", status pill when not open (סגור עכשיו / נפתח בקרוב / חוזר במוצ״ש) |
| E5 | Back + ★ quick-dial toggle ("נוסף לחיוג המהיר" / "הוסר מהחיוג המהיר") | present | BizSheet.tsx | UI | back on the cover and in the mini header; ★ quick-dial toggle with the original toasts |
| E6 | Trust badges: "מומלץ פרנסה׳לע", "ותק N שנים", "N ממליצים", certificate, "השגחה: …", "הנחה לקהילה", "גמ״ח", "24/7 חירום" | present | biz.ts `trustOf` · BizSheet.tsx (`.pn-tbs`) | DATA + UI | מומלץ · ותק · ממליצים · תעודה · השגחה · הנחה לקהילה · גמ״ח · 24/7 חירום in the original's order; the port adds the dial code and, for the gabbai, the approval state as badges of the same kind |
| E7 | Phone row "טלפון · וואטסאפ" + large number + "העתקה" | present | BizSheet.tsx (`.pn-bpcall`) | UI | "טלפון · וואטסאפ" + the large number + "העתקה" (button lights, toast "המספר … הועתק"); the port's second phone and a separate WhatsApp number get rows of their own |
| E8 | Featured block: seal + promo line + website host | present | BizSheet.tsx (`.pn-bpfeat`) | DATA + UI | seal "מומלץ פרנסה׳לע" + the promo line + the site host (gabbai-only `promoLine`/`promoUrl`, https only) while featured |
| E9 | "איך פונים" — three steps א/ב/ג when there is no description, services or photos | present | biz.ts `howtoOf` · BizSheet.tsx | UI | "איך פונים" א/ב/ג verbatim when there is no description, services or photos; the first step follows whether WhatsApp is on |
| E10 | "על העסק" story with a drop cap in the palette accent | present | BizSheet.tsx (`.pn-story`) | UI | "על העסק" with the drop cap in the palette accent (the original's CSS) |
| E11 | "שירותים ומחירים" with dotted leaders, price formatting ("150" → "150 ₪", "מ300" → "מ־300 ₪"), "המחירים להמחשה. סופי בתיאום" | present | BizSheet.tsx (`.pn-svcs`) · biz.ts `fmtPrice` | UI | dotted leaders, the original's price format ("1500" ⇒ "1,500 ₪", "מ300" ⇒ "מ־300 ₪"), "המחירים להמחשה. סופי בתיאום" |
| E12 | "מהעבודות שלנו" — gallery of 1–4 photos ("N תמונות") + lightbox (arrows/swipe/Esc) | present | BizSheet.tsx (`.pn-gal`, `.pn-lbox`) | DATA + UI | "מהעבודות שלנו" 1–4 photos ("N תמונות") + lightbox (arrows, swipe, Esc, focus trap). Photos are local data images in the listing (`photos`, healed); upload with the original's caps and a per-org budget = the editor (cluster 4) |
| E13 | "שעות פעילות": week table, today highlighted with a palette bar, "שבת קודש", "24 שעות", free-text hours, "זמינים גם לקריאות חירום, 24/7" | present | biz.ts `weekRows` · BizSheet.tsx (`.pn-hours`) | UI | week table with the original's day letters and time format ("7:30–19:00", RTL like the original), today highlighted, "שבת קודש", "24 שעות", free-text hours, the emergency line; the port's several windows per day and Motzei-Shabbat windows kept |
| E14 | "פרטים / פרטי העסק" tiles: תחום · גר ב · אזור שירות · שפות · מתאים · אמצעי תשלום (chips) | present | biz.ts `tilesOf` · BizSheet.tsx (`.pn-tiles`) | DATA + UI | "פרטים" / "פרטי העסק": תחום · גר ב · אזור שירות · שפות · מתאים · אמצעי תשלום (chips, from `pay`) |
| E15 | "שאלות נפוצות" accordion (first item open) | present | BizSheet.tsx (`.pn-faq`) | DATA + UI | "שאלות נפוצות" accordion, first item open (`faq`, healed; editing = cluster 4) |
| E16 | "המלצות מהקהילה" wall ("״…״ — name · ago"), empty state, member input "הוספת המלצה" / "עדכון" / "מחיקת שלי" (one per member, never on your own page) | partial | BizSheet.tsx (`.pn-wall`, `.pn-rec-form`) | UI (+SERVER) | the original's wall ("…" — name · ago), empty state "עוד אין המלצות" and form; in the port whoever uses the module adds a recommendation with a free-text name and the gabbai removes one. One recommendation per member / "מחיקת שלי" needs member logins (SERVER) |
| E17 | "המעטפת של העסק · {pct}% · רק הגבאי רואה" → constellation overlay | present | envelope.ts (`ENV_P`/`ENV_C`/`ENV_ROLES`/`ENV_G` verbatim) · EnvMap.tsx · BizSheet.tsx (`.pn-ev-row`, `.pn-ev-ov`) | UI | "המעטפת של העסק · N% · רק הגבאי רואה" ⇒ the constellation overlay (three rings, open slots, the card with "לדף העסק" / "העתקת הזמנה" — the invitation without a public link) |
| E18 | "הקופה של העסק" — 3D pushke by fill level, "N פעמים עזר לקהילה", answers/thanks, "N החודש", "זה לא דירוג…" | present | biz.ts `kupaOf`/`kupaArt` · BizSheet.tsx (`.pn-kupa`) · public/parnasa/kupa/ | UI | the 3D pushke by fill level (the original's 7 renders, loaded on demand), "N פעמים עזר לקהילה", answers/thanks, "N החודש" from the Hebrew month start, "זה לא דירוג…" — a coin per response and per recommendation |
| E19 | "עובדים לצידו — מי שפונה אליו צריך בדרך כלל גם" (up to 6) | present | envelope.ts `nearOf` · BizSheet.tsx (`.pn-nearrow`) | UI | "עובדים לצידו — מי שפונה אליו צריך בדרך כלל גם", up to 6 partners/peers; opens their page in the same sheet |
| E20 | Gate-sponsor line "שער ״…״ בחסות {name}" | present | BizSheet.tsx (`.pn-bpspn`) | UI | "שער ״…״ בחסות {name}" from today's gate sponsor (ads on) |
| E21 | Colophon "חבר ב{brand}" + "העתקת הפרטים כטקסט" + gabbai "הדגשה / ניהול ההדגשה" | present | BizSheet.tsx (`.pn-colo`) · biz.ts `shareLine` | UI | "חבר ב{brand}" + "העתקת הפרטים כטקסט" ("הכרטיס הועתק לשיתוף") + gabbai "הדגשה / ניהול ההדגשה" (opens the edit form with the featured date until the admin form of cluster 6); the port's source line, edit/approve/hide/delete live here too |
| E22 | Sticky bar: big green "וואטסאפ עכשיו" (second line "ההודעה מוכנה: ״…״"; "וואטסאפ במוצ״ש" on Shabbat) or velvet "חיוג" + number; call icon; share; ★ | present | BizSheet.tsx (`.pn-bpbar`) | UI | big green "וואטסאפ עכשיו" + "ההודעה מוכנה: ״…״" ("וואטסאפ במוצ״ש" on Shabbat) when the WhatsApp extension is on; else the velvet "חיוג" + number when telephony is on, else "העתקת המספר"; call icon; ★. The share button = E23 |
| E23 | Share panel "שיתוף הדף של {name}" (link field, "העתקה", "שליחה בוואטסאפ") | missing | — | SERVER | needs a public link |
| E24 | Requests in the business's trade | present | BizSheet.tsx ("מה מבקשים בתחום") | — | kept, now in the original's request rows: urgent badge, quiet requests sealed ("בשקט, לא יודעים מי ביקש", no name/phone), "אני זמין" ⇒ the port's response dialog |
| E25 | Gabbai actions: approve / hide / delete / edit | present | BizSheet.tsx (colophon actions) · CareTab.tsx | — | edit / approve / hide / delete (press twice) for whoever holds the grant, in the original's button style |

## F. Contact flow

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| F1 | WhatsApp `wa.me/972…` with "שלום, הגעתי אליך דרך {brand}." + " צריך עזרה: {q}" | present | Home.tsx `Banner` · BizSheet.tsx (bar) · hooks.ts `usePnContact` | — | "שלום, הגעתי אליך דרך {brand}." + " צריך עזרה: {q}" (the question the page was opened from); gated by the WhatsApp extension |
| F2 | Call `tel:`; copy number → "המספר … הועתק" | present | Home.tsx `Banner` · BizSheet.tsx (`.pn-copy`, bar) · hooks.ts `usePnContact` | UI | `tel:` when telephony is on (banner swipe-left, bar, call icon); copy number everywhere ("המספר … הועתק") — the phone row, the bar fallback and the banners when WhatsApp is off |
| F3 | Once-per-viewer "someone reached out" marker → owner's "פניות מהאלפון"; recents | missing | — | SERVER | |
| F4 | Shabbat gentle lock on contact | present | ParnasaView.tsx (gentle lock) | UI | see B20 — WhatsApp, call and post links are held on Shabbat with "שעת צורך, להמשיך" (15 min) |

## G. לוח בקשות (request board)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| G1 | Header "הקהילה עוזרת · לוח בקשות · לא מצאתם באלפון? כתבו כאן…" | missing | RequestsTab.tsx | UI | |
| G2 | Velvet "＋ בקשה חדשה — מחפשים בעל מקצוע או עובד? הקהילה תעזור" | partial | RequestsTab.tsx | UI | ordinary button |
| G3 | Form: "מה אתם מחפשים?", "תחום" (לא משנה + 15), "טלפון לחזרה (רשות)", "דחוף (צריך היום)", "בשקט (לא בלוח, בלי השם)", "זו הצעת עבודה" | present | RequestForm.tsx | UI | port adds requester name and area (gabbai-entered) |
| G4 | Sensitivity detection auto-ticks "בשקט" + "זיהינו נושא רגיש (…)" hint; quiet hides the phone | present | RequestForm.tsx, lib.ts `sensitiveTopic` | UI | |
| G5 | Match line "באלפון יש N בעלי מקצוע ב{cat} · לראות אותם" | missing | — | UI | |
| G6 | "מי עוד יכול לעזור לך" — related trades for the occasion (בר מצווה, חתונה, ברית ולידה, מעבר דירה, שיפוץ, תקלה בבית, לימודים, שבת וחג, אבלות) with up to 2 businesses each or "עוד לא באלפון" | missing | — | UI | static table (spec A17) |
| G7 | Job note "משרה מקודמת: 90 ₪ …" | missing | — | DATA + UI | job-promotion price |
| G8 | Filters "פתוחות · הצעות עבודה · הכול" | present | RequestsTab.tsx | UI | |
| G9 | Groups "דחוף · פתוחות · נמצאו" with sub-labels and counts | present | RequestsTab.tsx | UI | |
| G10 | Sort promoted job → urgent → newest | partial | RequestsTab.tsx | DATA + UI | no promoted jobs |
| G11 | Card as `<details>`: closed tab = trade (or "הצעת עבודה"/"בקשה כללית"), 2-line preview, "יום ג׳ · ב׳ חשוון · עכשיו"; badges בשקט / בתחום שלך / אצל העסקים / דחוף / משרה מקודמת / נמצא | partial | RequestsTab.tsx | UI | always-open cards with chips |
| G12 | Urgent styling: red frame + pulsing dot (urgent flag or text starting "דחוף", <48h) | partial | RequestsTab.tsx, lib.ts `isUrgent` | UI | chip only |
| G13 | Route line ("נשלחה ל־N עסקים בתחום · אם אף אחד לא יענה, תעבור לכל הקהילה בעוד …", "N עסקים זמינים", quiet variants) | present | lib.ts `routeRequest`, `routeSummary` | UI | |
| G14 | "אני זמין" pressed by the businesses of the trade (+ WhatsApp to the requester), "סימנת שאתה זמין" | partial | RequestsTab.tsx ("✋ רישום מענה", "📤 שליחה לעסקים") | SERVER | the gabbai records answers on the businesses' behalf |
| G15 | Quiet requests: sealed card "בקשה חסויה בתחום שלך" that self-wipes 15 minutes after opening; blind replies; the requester opens sealed "תשובה חסויה" cards | partial | RequestsTab.tsx, lib.ts `businessView` / `redactContact` | SERVER | privacy is enforced; the flow is gabbai-mediated |
| G16 | Contact the requester ("וואטסאפ": "ראיתי את הבקשה שלך ב…", "חיוג", "העתקת המספר") + swipe on the row | partial | RequestsTab.tsx | UI (+SERVER) | gabbai-only WaBtn/CallBtn |
| G17 | Requester block "הבקשה שלך": "סמן שנמצא" → gold coins fly to the pushke ("נמצא! מטבע זהב ל…") / "מחיקה"; quiet: "נמצא, למחוק הכול" | partial | RequestsTab.tsx | UI (+SERVER) | gabbai "✓ סמן שנמצא"/delete; no coin flight |
| G18 | Gabbai "⋯ ניהול · רק הגבאי רואה": סמן שנמצא · "קידום המשרה · 90 ₪" / "ביטול הקידום" · "הסרת הבקשה" | partial | RequestsTab.tsx | DATA + UI | no job promotion |
| G19 | Empty "אין בקשות פתוחות" / "אין כרגע הצעות עבודה" | present | RequestsTab.tsx | UI | |

## H. לוח הקהילה (community board)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| H1 | Walnut wall with a brass lamp and light cone; "בית המדרש · פרנסה׳לע"; gold "לוח הקהילה"; segmented "לוח הזמנים \| לוח המודעות" (remembered) | missing | BoardTab.tsx | UI | chips; the original isolates this look in a shadow root |
| H2 | Zmanim crest: crown, "זמני היום", Hebrew + civil date, split-flap clock, "לפי אופק …" | partial | BoardTab.tsx, zmanimBoard.ts | UI | data present |
| H3 | Bulb marquee "המניין הבא · {prayer} · {shul}" with countdown / "אין עוד מניינים היום" | present | BoardTab.tsx, zmanimBoard.ts `nextMinyan` | UI | |
| H4 | "זמני היום" — 12 brass plates, past dimmed, next highlighted | present | BoardTab.tsx, zmanimBoard.ts `markZmanim` | UI | |
| H5 | "מניינים בשכונה" — per-shul time chips, past struck, next glowing | present | BoardTab.tsx, PostForm.tsx | UI | port lets the gabbai edit shuls (the original had no UI) |
| H6 | "שבת קודש" — "השבת הקרובה", "פרשת {parsha}" or "שבת קודש", "שבת מברכים", הדלקת נרות · צאת השבת · רבנו תם | partial | BoardTab.tsx, zmanimBoard.ts `shabbatOf` | UI | no parsha (the original took it from settings) |
| H7 | "בקהילה השבוע" — events (day label, title, subtitle) | present | BoardTab.tsx, PostForm.tsx | UI | |
| H8 | Notice board: mitred brass frame, green felt, plaque "לוח המודעות · קהילת השכונה", kind filters, paper notes styled per kind (מזל טוב gold foil · אבלות black border · שיעורים lined paper · לרפואה Tehillim card · גמ״ח kraft + stamp · אבידות/מכירה tear-off tabs · מוסדות letterhead + seal · קידושא invitation) with pins/tape and "ממתין לאישור הגבאי" | partial | BoardTab.tsx, labels.ts | UI | list with kind labels and emoji |
| H9 | Opened note + "מי בקהילה יכול לעזור" chips that search the alfon | present | BoardTab.tsx, labels.ts `PR_NOTICE_HELP` | UI | |
| H10 | "תליית מודעה": kind buttons, כותרת, פרטים, מקום, מתי, "יורד מהלוח בתאריך" (+7 days); gabbai approval | present | PostForm.tsx | UI | port adds minyan/event/emergency kinds |
| H11 | Hanging a notice is blocked on Shabbat ("שבת קודש. אפשר לתלות מודעה במוצאי שבת") | missing | PostForm.tsx | UI | |
| H12 | Example notes/shuls/events while empty ("כך ייראה הלוח…", "(דוגמה)") | missing | — | UI | |
| H13 | Moderation: gabbai "אישור ותלייה" / "דחייה" / "הורדה מהלוח"; author "מחיקת המודעה שלי" | partial | BoardTab.tsx | SERVER (authors) | gabbai only |
| H14 | Footer "כל מודעה עוברת אצל הגבאי…" / "N מודעות ממתינות לאישור שלך" | partial | BoardTab.tsx | UI | pending count in the tab chip |

## I. העסק שלי (owner dashboard and editor)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| I1 | Page "לבעלי עסקים · העסק שלי · דף עסק מלא בתוך האלפון…" for a signed-in business owner | partial | MeTab.tsx (`.pn-mepage`) · Shell.tsx `Page` | SERVER | the page in the original's look ("לבעלי עסקים · העסק שלי · דף עסק מלא בתוך האלפון…"); in Orbit the gabbai/staff builds each page on the owner's behalf and with consent — picker "הדף שבעריכה" (every business with its approval state and ☎ code) + "➕ הוספת עסק"; a business owner signing in to edit their own page = owner decision (SERVER) |
| I2 | "בקשות בתחום שלך — {cat} · מגיעות אליכם לפני כל הקהילה" (14 days, quiet seals, "עוד X רק אצל העסקים", "אני זמין" / quiet reply) | present | MeTab.tsx (`.pn-mereqs`) · InTrade.tsx `inTradeOf`/`TradeRows`/`RespondModal` (shared with the business page) | UI | "בקשות בתחום שלך" + "{gate} · מגיעות אליכם לפני כל הקהילה" at the top of the page: the last 14 days, urgent first, "עוד X רק אצל העסקים", "אני זמין" / quiet "שליחת תשובה" (a written answer is required) answered on the business's behalf, then "סימנת שאתה זמין" / "שלחת תשובה."; a quiet request shows only its redacted text (the port's stricter privacy) instead of each owner's own 10-minute seal (per-owner screens = SERVER) |
| I3 | Status pill "טיוטה · עוד לא נשמר" / "באוויר באלפון" / "ממתין לאישור הגבאי" / "מוסתר ע״י הגבאי" | present | MeTab.tsx (`.pn-livepill`) | UI | "טיוטה · עוד לא נשמר" / "באוויר באלפון" / "ממתין לאישור הגבאי" / "מוסתר ע״י הגבאי" (term-aware) with the original's pulsing dot, over the mini card |
| I4 | Live mini preview of the page ("לתצוגה המלאה") + "כך תופיעו בתוצאות החיפוש" (your banner) | present | MeTab.tsx (`.pn-bpmini`, `.pn-mebn`) · BizSheet.tsx `BizBody` (prev + mini) | UI | the live mini page (follows the draft, 140 ms like edChanged) + "לתצוגה המלאה"; "כך תופיעו בתוצאות החיפוש" = the real result banner, inert |
| I5 | Completeness ring with weights (basics 20, description ≥60 chars 12, tagline 6, logo 10, palette 4, ≥2 services 15, photo 12, hours 8, FAQ 5, payment 4, area 4) and the three most valuable "+N%" chips that jump to the section | present | editor.ts `completeness` · MeTab.tsx (`.pn-ring`, `.pn-stepc`) | UI | the original's weights (20/12/6/10/4/15/12/8/5/4/4) and texts ("הדף שלכם מושלם" / "הדף נראה מצוין" / "עוד כמה צעדים לדף מלא" / "בואו נבנה את הדף שלכם"); the three heaviest "+N%" chips open the section and scroll to it |
| I6 | Tiles "פניות מהאלפון" (velvet) and "המלצות" | partial | MeTab.tsx (`.pn-dtiles`) | SERVER | "המלצות" tile as in the original; the velvet "פניות מהאלפון" tile (distinct people who pressed WhatsApp/copy) needs per-viewer contact logs (F3, SERVER) — in its place the velvet tile counts the same 14-day "בקשות בתחום" |
| I7 | "הקופה שלך" | present | BizSheet.tsx `Kupa` (own) · MeTab.tsx | UI | kupaRow(e, own): "הקופה שלך" · "N פעמים עזרת לקהילה" · "כל תשובה לבקשה בתחום שלך היא מטבע", shown even when empty, the 7 renders by fill |
| I8 | "קידום העסק": "כרטיס מודגש" 45 ₪ / "חסות על שער ״…״" 300 ₪ ("השער בחסות כרגע. נרשום אתכם לתור."), "הערה לגבאי (רשות)", "שליחת בקשה לגבאי"; sent state + "ביטול הבקשה" | partial | Editor.tsx ("שדות הגבאי": "כרטיס מודגש עד") · AdsTab.tsx (gate sponsorship) | SERVER (+DATA) | the gabbai, who edits the page, sets "כרטיס מודגש עד" directly and sells gate sponsorships in ניהול; the owner→gabbai request inbox ("שליחת בקשה לגבאי", promoreq) needs owner logins (SERVER) — owner decision |
| I9 | "המלצות שקיבלתם" (up to 6) + "לדף ולשיתוף" | present | MeTab.tsx (`.pn-dcard`) | UI | "המלצות שקיבלתם" (up to 6, "— שם · לפני …") + "לדף ולשיתוף" (opens the business page; disabled unless approved). The empty note drops "שלחו לו את הקישור לדף שלכם" — public deep links are SERVER |
| I10 | "המעטפת שלי" — 3-ring constellation, legend, empty slots with "העתקת הזמנה" | present | MeTab.tsx (`.pn-meenv`) · EnvMap.tsx · envelope.ts | UI | "המעטפת שלי" for an approved page: the constellation, legend and empty slots with "העתקת הזמנה" |
| I11 | Editor "עריכת דף העסק": 8 collapsible sections, gold progress bar, live summaries, ✓ when complete | present | Editor.tsx · editor.ts (`PN_SECS`, `secDone`, `secSum`) | UI | 8 collapsible sections with live summaries and ✓, the gold progress bar and "N מתוך 8 חלקים"; the heading is the original's gabbai form "עורך הדף" (the owner-mode "עריכת דף העסק" belongs to the owner login, SERVER). A ninth section "שדות הגבאי" (source · dial code + "🎲 הקוד הבא" · "כרטיס מודגש עד" · internal note) only for an approver. The draft survives switching tabs (the original keeps its form in the DOM) and is saved by a three-way merge against the live record (a recommendation, approval, dial code or promotion added meanwhile is never overwritten); "ביטול עריכה" (the original's admin form) discards unsaved changes |
| I12 | §פרטים בסיסיים: name, title, trade, phone, "משפט מפתח", "מבצע לבאנר" + "בתוקף עד", "על העסק", city, area, "שירות מתאים ל", chips "יש וואטסאפ במספר" / "הנחה לאנשי הקהילה" / "גמ״ח / בהתנדבות" / "פנוי ללקוחות נוספים" | present | Editor.tsx (basic) | UI | every field and chip of the original incl. offer + "בתוקף עד" (the original's date button in words — "יום ד׳, 11 בנובמבר 2026 · א׳ כסלו" + ✕, `PnDate`) and "פנוי ללקוחות נוספים"; the port adds "טלפון נוסף" |
| I13 | §עיצוב: "צבע הדף" — 8 palettes (קטיפה · תכלת · אזמרגד · חצות · זית · נחושת · שזיף · צפחה); logo upload (≤256px, ≤25 KB, monogram fallback, replace/remove) | present | Editor.tsx (design) · imageShrink.ts | UI | the 8 palette swatches; logo upload shrunk in the browser (≤256px, ≤25 KB, WebP keeps transparency), the monogram fallback, "החלפת הלוגו" / "הסרת הלוגו" |
| I14 | §שירותים ומחירים: ≤12 rows (name, price "150"/"מ־300"/"לפי הצעה", note), ↑↓ reorder, delete | present | Editor.tsx (svc, `Rb`) | UI | ≤12 rows (name, price, note), ↑ ↓ and delete, the original's hint |
| I15 | §תמונות: up to 4, compressed in the browser (≤900px, ≤45 KB WebP), remove, size meter | present | Editor.tsx (photos) · imageShrink.ts · transitions.ts `listingImagesWhy` | UI | up to 4, shrunk in the browser (≤900px, ≤45 KB WebP, JPEG fallback) through photoGallery's fitDimensions/isDataImage; size label per photo, remove; the store re-checks the caps, the 240 KB page and a per-org image budget |
| I16 | §שעות פעילות: day chips א׳–ו׳, from/to, "זמין 24/7", "שעות במילים", "זמינים לקריאות חירום" | present | Editor.tsx (hours) · editor.ts `schedOf`/`composeHours` | UI | the original's day chips א׳–ו׳ + from/to + "זמין 24/7" + "שעות במילים" + "זמינים לקריאות חירום"; the port's extra windows (a short Friday, מוצ״ש) kept under "חלונות נוספים" |
| I17 | §שאלות נפוצות: ≤4 question/answer rows, reorder | present | Editor.tsx (faq) | UI | ≤4 question/answer rows, ↑ ↓, delete |
| I18 | §תשלום ושפות: מזומן · העברה בנקאית · ביט · אשראי · צ׳קים + languages | present | Editor.tsx (pay) | UI | מזומן · העברה בנקאית · ביט · אשראי · צ׳קים + the languages |
| I19 | §תעודות, השגחה וותק: "שנות ותק", "תעודה / הסמכה", "השגחה" | present | Editor.tsx (cert) | UI | "שנות ותק" · "תעודה / הסמכה" · "השגחה" |
| I20 | Consent "אני מסכים שהפרטים יוצגו לחברי הקהילה" / "קיבלתי את הסכמתו להופיע באלפון" | present | Editor.tsx (`.pn-edsave`) | — | "קיבלתי את הסכמתו להופיע באלפון" (the original's gabbai wording — the staff edits on the owner's behalf), required for a new page |
| I21 | Sticky frosted save bar: "שמירת הדף" / "שליחה לאישור" / "פרסום הדף", "תצוגה", "יש שינויים שלא נשמרו", size meter (240 KB) | present | Editor.tsx (`.pn-edsave`) · editor.ts `sizeState` | UI | the frosted bar turns sticky with a gold edge when dirty: "שמירת הדף" / "שליחה לאישור" / "הוספה לאלפון" (approval mode and role), "תצוגה", "יש שינויים שלא נשמרו", the size meter (82% warn, 240 KB block). Deliberate fix: the original lifts the idle bar 86px over the last field ("השגחה" is hidden behind it); here it stays in flow, and when sticky it clears the tab bar and, on phones, Orbit's bottom navigation |
| I22 | Full preview with a "תצוגה מקדימה" ribbon | present | ParnasaView.tsx (`prevDraft`) · BizSheet.tsx (`draft`) | UI | the full sheet with the "תצוגה מקדימה" ribbon, no ★ / recommendation form / kupa, "כאן יופיעו ההמלצות שתקבלו" |
| I23 | "הסרת העסק" (press twice: "ללחוץ שוב כדי להסיר את הדף") | present | Editor.tsx (`del`, useArmed) | — | "הסרת העסק" → "ללחוץ שוב כדי להסיר את הדף" in the save bar, for whoever may delete (parnasa.delete); the owner deleting their own page = owner login (SERVER) |
| I24 | Validation: "חסר: …", consent, "הדף גדול מדי (…)" | present | Editor.tsx `save` | UI | "חסר: …" opens the section and focuses the field; consent; hours windows; "הדף גדול מדי (…)"; dial code (3 digits, free) |

## J. ניהול (gabbai)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| J1 | "גבאי האלפון · ניהול" + segmented tabs with counts: אישורים · הכנסות · חסויות · מודעות וחוברת · הגדרות | partial | ParnasaView.tsx | UI | chips: טיפול ואישורים · חוברת · פרסומות · הגדרות |
| J2 | "ממתינים לאישור" cards (medallion, info, badges; "לדף" / "אישור" / "הסתרה" / "מחיקה") | present | CareTab.tsx | UI | |
| J3 | "הוספת איש מקצוע ידנית" — "למי שאין לו אינטרנט או שיש לו טלפון כשר…" — with the same 8-section editor ("הוספה לאלפון", "שמירת שינויים", "ביטול עריכה") | partial | Editor.tsx ("מקור הרישום" = הוזן ע״י הגבאי) in העסק שלי | UI + DATA | the same 8-section editor; the entry point under ניהול = cluster 6 |
| J4 | "כרטיסים שהוזנו ידנית" (עריכה / מחיקה) and "כרטיסים מוסתרים" lists | partial | DirectoryTab.tsx ("כולל ממתינים ומוסתרים") | UI | |
| J5 | "בקשות קידום" inbox ("הגדרת ההדגשה" / "הגדרת החסות", "לדף העסק", "טופל") | missing | — | SERVER (+DATA) | depends on I8 |
| J6 | KPI tiles "הכנסה חודשית קבועה" (velvet), "חוברת {year}", "ממתין לגבייה" ("הכול נגבה, ברוך ה׳"), "צפי לשנה" (count-up) | partial | AdsTab.tsx, lib.ts `adsLedger` | UI + DATA | ads ledger only (total / collected / pending + meter) |
| J7 | Ledger with gold bars: כרטיסים מודגשים · חסויות ("N מתוך 15 שערים · ודף הבית · ומטבע הפלטינה") · הקדשה בראש האלפון · סה״כ לחודש · מודעות בחוברת · משרות מקודמות | partial | AdsTab.tsx | UI + DATA | needs featured price, dedication billing, job promotions |
| J8 | Featured-card form: "איש המקצוע", "מחיר לחודש (₪)", "שורת פרסום", "אתר", "בתוקף עד" (custom date picker), "הערה פנימית (רק לגבאי)"; list with "עריכה" / "חידוש" / "הסרת ההדגשה" | partial | Editor.tsx ("שדות הגבאי": "כרטיס מודגש עד") | DATA + UI | only an end date |
| J9 | "חסויות": rows "דף הבית", "מטבע פלטינה" and the 15 gates (business count — "שער עמוס שווה יותר", "פנוי לחסות" / "בחסות {name}", price, "הגדרה" / "עריכה"), inline form (name, price, line, phone, site; coin: trade + monogram), "הסרת החסות" | partial | AdsTab.tsx, AdForm.tsx | DATA + UI | gates + board line as ad slots (with rotation, queue and payLink); no home slot, no platinum coin, no site URL |
| J10 | "מודעות לחוברת השנתית": form (המפרסם, גודל + price, כותרת, טלפון, נוסח, מחיר, שולם) + KPIs + list ("סימון כשולם" → "התשלום נרשם. תזכו למצוות!", "עריכה", "מחיקה") | present | AdsTab.tsx, AdForm.tsx | UI | port adds dates, active flag and a payment link |
| J11 | "חוברת להדפסה": mini A5 cover, live TOC with page estimate and "כפולה של 4", dedication text, "לכלול את המודעות", "רק מודעות ששולמו", "חיסכון בדיו", "הפקת חוברת להדפסה" | present | BookletTab.tsx, booklet.ts | UI | port: print/PDF or .html download, dial codes; no mini cover |
| J12 | "הגדרות": community name, approval mode, public phone, artifact link, dedication; price list (featured, gate sponsor, dedication, promoted job, full/half/small ad) | present | SettingsTab.tsx, ZmanimLocationEditor.tsx | DATA (job price) | no artifact link (not needed); a "board line" price instead of "promoted job"; zmanim location editor added |
| J13 | Gabbai "for sale" placeholders on the public screens (featured cards, platinum coin) | missing | — | UI | |
| J14 | Destructive actions need a second press ("ללחוץ שוב…") | present | `useArmed` (shell) | — | |

## K. Printed booklet and exports

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| K1 | Cover: full-bleed burgundy satin, arched double gold frame, vector pushke (`MARK_SVG`), gold-gradient wordmark with diamond geresh, "ספר המקצועות של הקהילה", community, ornament rule, verse in Noto Rashi, "שנת …" plaque, gold fringe | partial | booklet.ts | UI | flat `#4d0a1c` block with plain text; no frame, mark, gradient or fringe |
| K2 | Dedication page: SVG crown, text, "ת.נ.צ.ב.ה.", ornament | partial | booklet.ts | UI | emoji crown, plain rule |
| K3 | "מפתח המקצועות" with Hebrew numerals, dotted leaders, "בחסות …", "◆ מודעות N" | present | booklet.ts | UI | table styling differs |
| K4 | Directory in two columns: velvet "שער {numeral}" chip + name + count, sponsor strip, entries (name, title, large LTR phone, city · hours, marks), featured boxed with a crown ribbon | partial | booklet.ts | UI | plain headers/boxes; port adds dial codes |
| K5 | Ad pages: full / two halves / six smalls with vacancy boxes "מקום זה שמור לפרסום" | present | booklet.ts | UI | |
| K6 | End page "תם ונשלם / שבח לא־ל בורא עולם", contact line, disclaimer, community · date, wordmark | present | booklet.ts | UI | |
| K7 | A5 pages, Hebrew-numeral page numbers, ink-saving mode, screen bar "להדפסה: Ctrl+P…" | present | booklet.ts, BookletTab.tsx, exportDoc.ts | — | |

## L. Data the original has and the port's model lacks (all additive)

| original field / collection | used by | port today |
|---|---|---|
| `palette` (8 keys) | cover tint, accents, medallion colour (B, C3, E2–E4, I13) | `PrListing.palette?` (healed; cluster 2) — swatches in the editor (cluster 4) |
| `logo` (data URL ≤256px/25 KB) | banners, medallions, cover, mini header | `PrListing.logo?` (healed; banners/medallions — cluster 2; cover disc + mini header — cluster 3) — upload shrunk in the browser (imageShrink.ts) + the store's image gate (cluster 4) |
| `photos[≤4]` (≤900px/45 KB each) | gallery (E12), completeness | `PrListing.photos?` (healed; cluster 2; gallery + lightbox — cluster 3) — upload with the original's caps, page ≤240 KB and a per-org image budget (`PR_IMG`, model.ts; enforced in `upsertPrListing` via `listingImagesWhy`) — cluster 4 |
| `offer {text ≤60, until}` | gold ribbon on banners, cover pill (C3, E4, I12) | `PrListing.offer?` (healed; ribbon + seal on banners, cluster 2) |
| `faq[≤4] {q,a}` | FAQ accordion (E15) | `PrListing.faq?` (healed; cluster 2; accordion — cluster 3) |
| `pay[]` (cash, transfer, bit, credit, checks) | details tile (E14) | `PrListing.pay?` (healed; cluster 2; payment chips — cluster 3) |
| `years`, `cert` | trust badges (E6) | `PrListing.years?`/`cert?` (healed; cluster 2; trust badges — cluster 3) + `kashrut` |
| `seek` ("פנוי ללקוחות נוספים") | browse toggle, booklet mark (D4) | `PrListing.seek?` (healed; cluster 2; "פנויים לעבודה" toggle — cluster 3) |
| promo `{price, tagline, url, until, note}` | featured block, revenue (E8, J6–J8) | `featuredUntil` + gabbai-only `promoLine`/`promoUrl`/`promoPrice`/`promoNote` (healed; a non-approver's save keeps them) |
| sponsors `home`, `coin {cat, mono}`, `url` on every sponsor | home line, platinum coin (B9, B14, J9) | slot `board` = the home line; `PrAd.coin?` + `mono?` = the platinum coin (kept out of the gate rotation); `PrAd.url?` (https only) |
| `jobpromo` + job price | board sort, gold frame (G7, G10, G18) | — |
| `promoreq` | promotion inbox (I8, J5) | — |
| `contacts/{key}/by/{uid}` | "פניות מהאלפון" (F3, I6) | — (SERVER) |
| notices `nm` (refuah name), `org` (mosad) | refuah / mosad note faces | — (also never collected by the original's form) |
| per-viewer `favs`, `recents`, `theme`, `big`, `mute`, `hints` | quick dial, toggles | skinPrefs.ts — per device in localStorage (never in the DB/cloud/backup); `favs`/`recents` namespaced per org (`nsLsKey`) |

## M. In the port but not in the original (keep)

Dial codes and the booklet code column (`transitions.ts nextDialCode`, booklet.ts) · the phone-line model (`phoneLine.ts`, mirrors the separate IVR artifact) · the care queue "🔔 דורש טיפול" (CareTab.tsx `needsCare`) · editable shuls/minyanim/events/emergency numbers and the zmanim location editor (PostForm.tsx, ZmanimLocationEditor.tsx — the original had no UI) · weekly zmanim table and emergency numbers on the board (BoardTab.tsx) · multiple opening windows per day · sponsor rotation and waiting queue per gate (lib.ts `adRotation`) · payment links on ads (`adPayLink`) · strict quiet-request privacy with logged reveal (`businessView`, `logAccess`) · CSV with more columns · "העסק שלי" run by the gabbai on the owner's behalf: picker "הדף שבעריכה" + "➕ הוספת עסק", the "שדות הגבאי" section (source, dial code + "🎲 הקוד הבא", "כרטיס מודגש עד", internal note), a draft that survives switching tabs and saves by a three-way merge against the live record (MeTab.tsx, Editor.tsx, editor.ts `rebaseDraft`).
