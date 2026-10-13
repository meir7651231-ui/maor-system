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
**Now (after cluster 1 — skin + shell)**: **41 present · 63 partial · 60 missing**

**Design-phase breakdown** (before the re-skin): of the 134 partial+missing rows, the main blocker is: 93 UI-only · 26 need new data fields (DATA, usually with UI) · 15 need a server or public access (SERVER, out of scope). A parenthetical "(+DATA…)"/"(+SERVER…)" marks a secondary, smaller part of the gap.

Current counts per area (recomputed from the rows after every cluster):

| area | present | partial | missing |
|---|---|---|---|
| A. Shell & brand | 10 | 3 | 4 |
| B. Home | 1 | 5 | 15 |
| C. Results | 1 | 4 | 6 |
| D. Browse | 1 | 6 | 1 |
| E. Business page | 3 | 10 | 12 |
| F. Contact | 1 | 1 | 2 |
| G. Requests | 6 | 9 | 4 |
| H. Community board | 6 | 5 | 3 |
| I. העסק שלי | 3 | 10 | 11 |
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
| A14 | Toast with an action button ("לצפייה", "שעת צורך, להמשיך") | partial | Orbit toast | UI | |
| A15 | Keyboard: "/" focuses the search anywhere; ↑↓ / Enter (WhatsApp) / Esc in results; W on a banner; F or כ flips a coin | missing | — | UI | |
| A16 | Deep link `#b-<key>` opens a business page ("העסק הזה לא נמצא באלפון") | missing | — | SERVER | needs a public URL; an in-app hash is UI |
| A17 | Per-viewer memory: last tab, admin segment, board tab, usage hints only in the first 3 visits | partial | ParnasaView.tsx (`useRemembered`) · skinPrefs.ts `useHintsOff` | UI | last tab + admin segment + filters remembered (session); usage hints only in the first 3 visits (`maor_pn_hints`); board tab memory with the board re-skin (cluster 5) |

## B. אלפון — home ("ask" mode)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| B1 | Greeting line: בוקר טוב / צהריים טובים / ערב טוב / לילה טוב, "שבת שלום", "שבוע טוב"; Hebrew day+month; zman chip (שקיעה · בעוד…, הדלקת נרות · בעוד…, צאת השבת); period chip (היום N ימים לעומר · בין המצרים · תשעת הימים · חודש אלול) | missing | (zmanimBoard.ts `dayTimes`, `shabbatOf`) | UI | sunset/candles/tzeis exist; Omer count, Three Weeks and Elul need small pure functions |
| B2 | "מה צריך?" at up to 7.4rem + "כותבים את הבעיה במילים שלכם, ומקבלים את האדם הנכון." (Shabbat: "שבת שלום. לשעת צורך, האדם הנכון כאן.") | partial | DirectoryTab.tsx | UI | 16px label in a card |
| B3 | Omnibox: 4rem pill, gold lens, gold ring spinning on focus, "/" hint, clear; typing switches to answer mode | partial | DirectoryTab.tsx | UI | `TextInput` + "✕ ניקוי" |
| B4 | "חיפושים נפוצים" — 5 chips per season | missing | — | UI | table in `assets/maps.json` → `SEASONS[*].pop` |
| B5 | "חיוג מהיר" — favourites ★ (≤20) and recents (≤10) as medallions with a green open-now dot; replaces B4 when not empty | missing | (lib.ts `openNow`) | UI | per-viewer local state |
| B6 | "בעונה הזו · {edition}" + season title; 6 minted coins per Hebrew season (editions: Sukkot weave, Chanukah silver, Purim masks + confetti, Pesach matzah) | missing | (lib.ts `searchCount` — "מטבעות-העונה במקור", unused) | UI | coin art in `assets/coins/` |
| B7 | Tap a coin → it flies into the header pushke with a clink, then its query runs | missing | — | UI | |
| B8 | Long-press / F → the coin flips to its live count ("N בעלי מקצוע"); hint "לחיצה: חיפוש · לחיצה ארוכה: כמה בעלי מקצוע יש" | missing | — | UI | |
| B9 | Platinum sponsor coin (full width, monogram, ribbon "בחסות") opening the sponsor's trade with their card pinned; gabbai placeholder "כאן יופיע מטבע פלטינה בחסות · למכירה · 300 ₪ לחודש · רק הגבאי רואה" | missing | — | DATA + UI | new sponsorship slot `coin` {trade, monogram} |
| B10 | "שבוע טוב!" card on Motzei Shabbat ("N בקשות חיכו לכם מהשבת" / "שבוע של פרנסה טובה ובשורות טובות"), dismissible | missing | — | UI | requests are gabbai-only in the port, so the list part would be gabbai-only |
| B11 | "החודש בקהילה" pulse: "N בקשות נמצאו · N פעמים בעלי מקצוע ענו · N תודות מהקהילה" (30 days) | missing | — | UI | data exists |
| B12 | "מבקשים עכשיו" — 3 open community-visible requests (urgent first) with "מכיר מישהו?" + "לכל הבקשות" | missing | — | SERVER | requests are not public in the port |
| B13 | "מומלצי השבוע" (crown) — up to 3 featured banners rotating daily + "עוד N מומלצים"; gabbai placeholder "כאן יופיעו כרטיסים מודגשים · למכירה · 45 ₪ לחודש" | missing | (lib.ts `isFeatured`) | UI | `featuredUntil` exists |
| B14 | Home sponsor line "פרנסה׳לע השבוע בחסות" — name, line, call, site | partial | BoardTab.tsx, AdsTab.tsx (slot `board`) | UI (+DATA: url) | the port's "שורת חסות בלוח" is shown on the board tab, not on a home |
| B15 | "כל האלפון" velvet button + "עוד באלפון" expander ("כל התחומים · מצטרפים חדשים") | missing | — | UI | |
| B16 | "כל התחומים" — two-row rail of the 15 trades with mini coins and counts + "לכל האלפון" | partial | DirectoryTab.tsx | UI | chip row with emoji + counts |
| B17 | "חדש בפרנסה׳לע" — up to 6 joined/updated in 60 days ("הצטרפו או עודכנו לאחרונה") | missing | — | UI | `createdAt`/`updatedAt` exist |
| B18 | Business CTA "לבעלי עסקים · יש לך עסק? · הצטרפות בחינם" / "הדף שלכם באלפון · לעריכת הדף" / pending text | missing | — | SERVER | owner self-service |
| B19 | Stats line "N בעלי מקצוע · N תחומים · N בקשות פתוחות" (counts up when scrolled into view) | missing | — | UI | |
| B20 | Shabbat calm: banner with candles, once-per-Shabbat overlay "שבת שלום / האלפון נח עד צאת השבת", gentle lock on WhatsApp/call/post ("שעת צורך, להמשיך" → 15 min), statuses "חוזר במוצ״ש", motion stilled | partial | Shell.tsx `CalmBanner` · ParnasaView.tsx (`data-calm`) | UI | candle banner (Shabbat wording verbatim; a Yom Tov variant), motion stilled and WhatsApp desaturated via the original's `[data-calm]` rules, from the engine's closure (community time zone). Overlay + gentle lock: cluster 2 |
| B21 | Friday-afternoon dusk tint; period skins (Omer seam fills to 49, Elul blue seam, Three Weeks desaturated and silent) | present | shell.ts `eveOf`/`periodOf` · ParnasaView.tsx (`--pn-eve`, `data-period`, `--pn-omer`) | UI | Friday-afternoon dusk tint inside the module; Omer seam fills to 49, Elul and Three Weeks skins from the original CSS; sounds silent in the Three Weeks |

## C. אלפון — results ("answer" mode)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| C1 | Deterministic matching: 25 problem concepts, prefixes, stems, typos, name, location, phone digits; rank coverage → tier → featured → open → recommendations → name | present | lib.ts `analyzeQuery`, `searchListings` | — | |
| C2 | Echo line "״{q}״ ← concept chips · שם · אזור" with matched words highlighted (`mark`) and "↑↓ בחירה · Enter וואטסאפ · Esc ניקוי" | partial | DirectoryTab.tsx | UI | chips present; no highlighting, no hint |
| C3 | Photo banners: trade photo with an animated SVG live layer, logo/trade-icon medallion, name in silver or warm gradient, title, area with pin, "הנחה לקהילה"/"גמ״ח" badges, gold "מבצע" ribbon with a "עד D.M" seal, "מומלץ" seal or "בחסות · מוצמד ראשון", gold/platinum frames | missing | ListingCard.tsx | UI + DATA | generic card with emoji and a coloured border; needs `logo`, `offer {text, until}` and the 18 photos (`assets/photos/`) |
| C4 | First result as a full banner, the rest as compact rows; two-up at ≥960px with a sticky side column | missing | DirectoryTab.tsx | UI | grid of cards |
| C5 | Swipe right → WhatsApp (or copy number), left → call; one-time nudge "ימינה לוואטסאפ · שמאלה לחיוג" | missing | — | UI | |
| C6 | The season coins shrink into a pill row under the search | missing | — | UI | |
| C7 | "לא מצאתי" / "רק N תוצאות? בקשו מהקהילה": "פרסום" (posts at once; quiet automatically if sensitive), "עם טלפון" (prefilled form), "ללוח הבקשות" | partial | DirectoryTab.tsx → RequestsTab.tsx | UI (+SERVER for residents) | prefilled request draft for the gabbai |
| C8 | "לא בטוחים? שאלו את העוזר של פרנסה׳לע" → "מצא לי" (Claude: up to 4 picks with a reason line + a tip box) | missing | — | SERVER | LLM call; Orbit has a dormant Claude path in `src/lib/ai.ts` |
| C9 | Zero results "עוד אין לנו תשובה לזה." + "אבל הקהילה כן…" + post + AI | partial | DirectoryTab.tsx | UI | same sentence in an `Empty` |
| C10 | Platinum-coin results: the sponsor's trade with the sponsor's own listing pinned (matched by phone/name) or a sponsor card "בחסות · מוצמד ראשון" | missing | — | DATA + UI | |
| C11 | Empty directory "האלפון עוד מתמלא"; loading "האלפון נטען, עוד רגע…" | partial | DirectoryTab.tsx | UI | different wording |

## D. אלפון — browse "כל האלפון" and the trade gates

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| D1 | Browse header: "לשאלה" back pill · "כל האלפון" · "N אנשי מקצוע" | missing | — | UI | no separate browse mode |
| D2 | Filter field "סינון לפי שם, מקצוע או עיר" (every word must match) | partial | DirectoryTab.tsx | UI | only the ranked search |
| D3 | Gate index: 15 tiles with the gematria numeral in Karantina, name, count, crown when sponsored; "הכול · כל השערים"; selected tile turns velvet with a gold numeral | partial | DirectoryTab.tsx (`PR_CATEGORIES` with `num`) | UI | chips "num · emoji name (n)" |
| D4 | Toggles "הנחה לקהילה", "גמ״ח", "פנויים לעבודה", "מתאים ל: כולם/גברים/נשים" | partial | DirectoryTab.tsx, lib.ts `filterListings` | DATA + UI | disc/free/aud present (+ port-only "פתוח עכשיו", "חירום"); "פנויים לעבודה" needs `seek` |
| D5 | Gate groups: huge numeral + name + "N כרטיסים" over a 2px rule; featured first, then name | partial | DirectoryTab.tsx, lib.ts `groupByCategory` | UI | |
| D6 | Gate sponsor box ("בחסות" pill, name, line, call, site) | partial | DirectoryTab.tsx `GateSponsor` | UI (+DATA: url) | port rotates several sponsors per gate (superset) |
| D7 | Empty gate "עוד אין אנשי מקצוע בשער הזה." + "פרסום בקשה בלוח"; "האלפון מחכה לכרטיס הראשון…" + "הוספת הכרטיס שלי"; "לא נמצא מתאים" | partial | DirectoryTab.tsx | UI | |
| D8 | "הורדת האלפון לאקסל (CSV)" — "להדפסה, לבית המדרש ולמי שיש לו טלפון כשר." (BOM, CRLF, quoted, injection guard, LRM phones; approved only, gate order) | present | DirectoryTab.tsx, lib.ts `listingsCsvRows` | — | port adds columns (dial code, second phone, WhatsApp, languages, kashrut, emergency) |

## E. Business page

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| E1 | Full-height spring sheet over the list (drag down / swipe sideways / Esc, focus trap), frosted mini header on scroll, floating sheet on desktop | partial | ListingDetail.tsx | UI | inline page + "→ חזרה למדריך" sticky bar |
| E2 | Cover: trade photo tinted by the page palette, or palette velvet with a pushke watermark; 7px gold rope edge | missing | — | UI + DATA | needs `palette` + photos |
| E3 | Logo in an ivory disc with a conic gold ring, or a trade-icon monogram | missing | ListingDetail.tsx (emoji) | DATA + UI | `logo` |
| E4 | Name (Frank Ruhl 900), tagline (palette light), offer pill "{text} · עד D.M", title, "category · city · area", status pill when not open (סגור עכשיו / נפתח בקרוב / חוזר במוצ״ש) | partial | ListingDetail.tsx, ListingCard.tsx `OpenBadge` | UI + DATA | no offer |
| E5 | Back + ★ quick-dial toggle ("נוסף לחיוג המהיר" / "הוסר מהחיוג המהיר") | partial | ListingDetail.tsx | UI | back only |
| E6 | Trust badges: "מומלץ פרנסה׳לע", "ותק N שנים", "N ממליצים", certificate, "השגחה: …", "הנחה לקהילה", "גמ״ח", "24/7 חירום" | partial | ListingDetail.tsx | DATA + UI | featured chip; kashrut/disc/free/emergency as text; needs `years`, `cert` |
| E7 | Phone row "טלפון · וואטסאפ" + large number + "העתקה" | partial | ListingCard.tsx `ContactRow` | UI | no copy button |
| E8 | Featured block: seal + promo line + website host | missing | — | DATA + UI | promo `tagline`, `url` |
| E9 | "איך פונים" — three steps א/ב/ג when there is no description, services or photos | missing | — | UI | |
| E10 | "על העסק" story with a drop cap in the palette accent | partial | ListingDetail.tsx | UI | |
| E11 | "שירותים ומחירים" with dotted leaders, price formatting ("150" → "150 ₪", "מ300" → "מ־300 ₪"), "המחירים להמחשה. סופי בתיאום" | partial | ListingDetail.tsx, labels.ts `priceText` | UI | same footnote |
| E12 | "מהעבודות שלנו" — gallery of 1–4 photos ("N תמונות") + lightbox (arrows/swipe/Esc) | missing | — | DATA + UI | `photos`; storage decision (inline data URLs vs. files) |
| E13 | "שעות פעילות": week table, today highlighted with a palette bar, "שבת קודש", "24 שעות", free-text hours, "זמינים גם לקריאות חירום, 24/7" | present | ListingDetail.tsx, zmanimBoard.ts | UI | port supports several windows per day (superset) |
| E14 | "פרטים / פרטי העסק" tiles: תחום · גר ב · אזור שירות · שפות · מתאים · אמצעי תשלום (chips) | partial | ListingDetail.tsx | DATA + UI | one text line; needs `pay` |
| E15 | "שאלות נפוצות" accordion (first item open) | missing | — | DATA + UI | `faq` |
| E16 | "המלצות מהקהילה" wall ("״…״ — name · ago"), empty state, member input "הוספת המלצה" / "עדכון" / "מחיקת שלי" (one per member, never on your own page) | partial | ListingDetail.tsx | UI (+SERVER) | gabbai types a recommendation with a free-text name; members cannot recommend themselves |
| E17 | "המעטפת של העסק · {pct}% · רק הגבאי רואה" → constellation overlay | missing | — | UI | static tables ENV_P / ENV_C / ENV_ROLES (spec A16) |
| E18 | "הקופה של העסק" — 3D pushke by fill level, "N פעמים עזר לקהילה", answers/thanks, "N החודש", "זה לא דירוג…" | missing | — | UI | data exists (responses, recs) |
| E19 | "עובדים לצידו — מי שפונה אליו צריך בדרך כלל גם" (up to 6) | missing | — | UI | envelope tables |
| E20 | Gate-sponsor line "שער ״…״ בחסות {name}" | missing | — | UI | data exists (ad slot `category`) |
| E21 | Colophon "חבר ב{brand}" + "העתקת הפרטים כטקסט" + gabbai "הדגשה / ניהול ההדגשה" | missing | — | UI | |
| E22 | Sticky bar: big green "וואטסאפ עכשיו" (second line "ההודעה מוכנה: ״…״"; "וואטסאפ במוצ״ש" on Shabbat) or velvet "חיוג" + number; call icon; share; ★ | partial | ListingCard.tsx `ContactRow` | UI | small 📞/💬 buttons (gated by Orbit's telephony/WhatsApp extensions) |
| E23 | Share panel "שיתוף הדף של {name}" (link field, "העתקה", "שליחה בוואטסאפ") | missing | — | SERVER | needs a public link |
| E24 | Requests in the business's trade | present | ListingDetail.tsx ("🙋 מה מבקשים בתחום") | — | original shows them in העסק שלי (I2) |
| E25 | Gabbai actions: approve / hide / delete / edit | present | ListingDetail.tsx, CareTab.tsx | — | |

## F. Contact flow

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| F1 | WhatsApp `wa.me/972…` with "שלום, הגעתי אליך דרך {brand}." + " צריך עזרה: {q}" | present | ListingCard.tsx `waIntro` + `WaBtn` | — | |
| F2 | Call `tel:`; copy number → "המספר … הועתק" | partial | ListingCard.tsx `CallBtn` | UI | no copy |
| F3 | Once-per-viewer "someone reached out" marker → owner's "פניות מהאלפון"; recents | missing | — | SERVER | |
| F4 | Shabbat gentle lock on contact | missing | — | UI | see B20 |

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
| I1 | Page "לבעלי עסקים · העסק שלי · דף עסק מלא בתוך האלפון…" for a signed-in business owner | missing | — | SERVER | no owner identity in the port |
| I2 | "בקשות בתחום שלך — {cat} · מגיעות אליכם לפני כל הקהילה" (14 days, quiet seals, "עוד X רק אצל העסקים", "אני זמין" / quiet reply) | partial | ListingDetail.tsx | SERVER | gabbai view on the business page |
| I3 | Status pill "טיוטה · עוד לא נשמר" / "באוויר באלפון" / "ממתין לאישור הגבאי" / "מוסתר ע״י הגבאי" | partial | ListingCard.tsx, ListingDetail.tsx | UI | status chips |
| I4 | Live mini preview of the page ("לתצוגה המלאה") + "כך תופיעו בתוצאות החיפוש" (your banner) | missing | — | UI | useful in the gabbai form too |
| I5 | Completeness ring with weights (basics 20, description ≥60 chars 12, tagline 6, logo 10, palette 4, ≥2 services 15, photo 12, hours 8, FAQ 5, payment 4, area 4) and the three most valuable "+N%" chips that jump to the section | missing | — | UI (+DATA for the fields) | |
| I6 | Tiles "פניות מהאלפון" (velvet) and "המלצות" | partial | ListingDetail.tsx (recs count) | SERVER | contacts need F3 |
| I7 | "הקופה שלך" | missing | — | UI | |
| I8 | "קידום העסק": "כרטיס מודגש" 45 ₪ / "חסות על שער ״…״" 300 ₪ ("השער בחסות כרגע. נרשום אתכם לתור."), "הערה לגבאי (רשות)", "שליחת בקשה לגבאי"; sent state + "ביטול הבקשה" | missing | — | SERVER (+DATA) | |
| I9 | "המלצות שקיבלתם" (up to 6) + "לדף ולשיתוף" | missing | — | UI | |
| I10 | "המעטפת שלי" — 3-ring constellation, legend, empty slots with "העתקת הזמנה" | missing | — | UI | |
| I11 | Editor "עריכת דף העסק": 8 collapsible sections, gold progress bar, live summaries, ✓ when complete | partial | ListingForm.tsx | UI | one modal: core fields + "פרטים נוספים" |
| I12 | §פרטים בסיסיים: name, title, trade, phone, "משפט מפתח", "מבצע לבאנר" + "בתוקף עד", "על העסק", city, area, "שירות מתאים ל", chips "יש וואטסאפ במספר" / "הנחה לאנשי הקהילה" / "גמ״ח / בהתנדבות" / "פנוי ללקוחות נוספים" | partial | ListingForm.tsx | DATA + UI | all except offer and seek; port adds second phone and gabbai fields |
| I13 | §עיצוב: "צבע הדף" — 8 palettes (קטיפה · תכלת · אזמרגד · חצות · זית · נחושת · שזיף · צפחה); logo upload (≤256px, ≤25 KB, monogram fallback, replace/remove) | missing | — | DATA + UI | |
| I14 | §שירותים ומחירים: ≤12 rows (name, price "150"/"מ־300"/"לפי הצעה", note), ↑↓ reorder, delete | partial | ListingForm.tsx | UI | no reorder |
| I15 | §תמונות: up to 4, compressed in the browser (≤900px, ≤45 KB WebP), remove, size meter | missing | — | DATA + UI | |
| I16 | §שעות פעילות: day chips א׳–ו׳, from/to, "זמין 24/7", "שעות במילים", "זמינים לקריאות חירום" | present | ListingForm.tsx | UI | richer multi-window editor |
| I17 | §שאלות נפוצות: ≤4 question/answer rows, reorder | missing | — | DATA + UI | |
| I18 | §תשלום ושפות: מזומן · העברה בנקאית · ביט · אשראי · צ׳קים + languages | partial | ListingForm.tsx | DATA + UI | languages only |
| I19 | §תעודות, השגחה וותק: "שנות ותק", "תעודה / הסמכה", "השגחה" | partial | ListingForm.tsx | DATA + UI | kashrut only |
| I20 | Consent "אני מסכים שהפרטים יוצגו לחברי הקהילה" / "קיבלתי את הסכמתו להופיע באלפון" | present | ListingForm.tsx | — | |
| I21 | Sticky frosted save bar: "שמירת הדף" / "שליחה לאישור" / "פרסום הדף", "תצוגה", "יש שינויים שלא נשמרו", size meter (240 KB) | partial | ListingForm.tsx | UI | modal buttons; save labels follow the approval mode |
| I22 | Full preview with a "תצוגה מקדימה" ribbon | missing | — | UI | |
| I23 | "הסרת העסק" (press twice: "ללחוץ שוב כדי להסיר את הדף") | partial | ListingDetail.tsx (gabbai delete) | SERVER (owner) | |
| I24 | Validation: "חסר: …", consent, "הדף גדול מדי (…)" | present | ListingForm.tsx | UI | |

## J. ניהול (gabbai)

| # | original | status | port file | gap | notes |
|---|---|---|---|---|---|
| J1 | "גבאי האלפון · ניהול" + segmented tabs with counts: אישורים · הכנסות · חסויות · מודעות וחוברת · הגדרות | partial | ParnasaView.tsx | UI | chips: טיפול ואישורים · חוברת · פרסומות · הגדרות |
| J2 | "ממתינים לאישור" cards (medallion, info, badges; "לדף" / "אישור" / "הסתרה" / "מחיקה") | present | CareTab.tsx | UI | |
| J3 | "הוספת איש מקצוע ידנית" — "למי שאין לו אינטרנט או שיש לו טלפון כשר…" — with the same 8-section editor ("הוספה לאלפון", "שמירת שינויים", "ביטול עריכה") | partial | ListingForm.tsx (`source: gabbai`) | UI + DATA | editor gaps as in I12–I19 |
| J4 | "כרטיסים שהוזנו ידנית" (עריכה / מחיקה) and "כרטיסים מוסתרים" lists | partial | DirectoryTab.tsx ("כולל ממתינים ומוסתרים") | UI | |
| J5 | "בקשות קידום" inbox ("הגדרת ההדגשה" / "הגדרת החסות", "לדף העסק", "טופל") | missing | — | SERVER (+DATA) | depends on I8 |
| J6 | KPI tiles "הכנסה חודשית קבועה" (velvet), "חוברת {year}", "ממתין לגבייה" ("הכול נגבה, ברוך ה׳"), "צפי לשנה" (count-up) | partial | AdsTab.tsx, lib.ts `adsLedger` | UI + DATA | ads ledger only (total / collected / pending + meter) |
| J7 | Ledger with gold bars: כרטיסים מודגשים · חסויות ("N מתוך 15 שערים · ודף הבית · ומטבע הפלטינה") · הקדשה בראש האלפון · סה״כ לחודש · מודעות בחוברת · משרות מקודמות | partial | AdsTab.tsx | UI + DATA | needs featured price, dedication billing, job promotions |
| J8 | Featured-card form: "איש המקצוע", "מחיר לחודש (₪)", "שורת פרסום", "אתר", "בתוקף עד" (custom date picker), "הערה פנימית (רק לגבאי)"; list with "עריכה" / "חידוש" / "הסרת ההדגשה" | partial | ListingForm.tsx ("כרטיס מודגש עד") | DATA + UI | only an end date |
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
| `palette` (8 keys) | cover tint, accents, medallion colour (B, C3, E2–E4, I13) | — |
| `logo` (data URL ≤256px/25 KB) | banners, medallions, cover, mini header | — |
| `photos[≤4]` (≤900px/45 KB each) | gallery (E12), completeness | — |
| `offer {text ≤60, until}` | gold ribbon on banners, cover pill (C3, E4, I12) | — |
| `faq[≤4] {q,a}` | FAQ accordion (E15) | — |
| `pay[]` (cash, transfer, bit, credit, checks) | details tile (E14) | — |
| `years`, `cert` | trust badges (E6) | — (only `kashrut`) |
| `seek` ("פנוי ללקוחות נוספים") | browse toggle, booklet mark (D4) | — |
| promo `{price, tagline, url, until, note}` | featured block, revenue (E8, J6–J8) | `featuredUntil` only |
| sponsors `home`, `coin {cat, mono}`, `url` on every sponsor | home line, platinum coin (B9, B14, J9) | ad slots `category`/`board`, no url |
| `jobpromo` + job price | board sort, gold frame (G7, G10, G18) | — |
| `promoreq` | promotion inbox (I8, J5) | — |
| `contacts/{key}/by/{uid}` | "פניות מהאלפון" (F3, I6) | — (SERVER) |
| notices `nm` (refuah name), `org` (mosad) | refuah / mosad note faces | — (also never collected by the original's form) |
| per-viewer `favs`, `recents`, `theme`, `big`, `mute`, `hints` | quick dial, toggles | — (local only) |

## M. In the port but not in the original (keep)

Dial codes and the booklet code column (`transitions.ts nextDialCode`, booklet.ts) · the phone-line model (`phoneLine.ts`, mirrors the separate IVR artifact) · the care queue "🔔 דורש טיפול" (CareTab.tsx `needsCare`) · editable shuls/minyanim/events/emergency numbers and the zmanim location editor (PostForm.tsx, ZmanimLocationEditor.tsx — the original had no UI) · weekly zmanim table and emergency numbers on the board (BoardTab.tsx) · multiple opening windows per day · sponsor rotation and waiting queue per gate (lib.ts `adRotation`) · payment links on ads (`adPayLink`) · strict quiet-request privacy with logged reveal (`businessView`, `logAccess`) · CSV with more columns.
