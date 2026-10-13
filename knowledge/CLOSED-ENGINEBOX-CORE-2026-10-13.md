# ✅ CLOSED · ארגז-המנועים — הליבה (שלב א׳, 13.10.2026)

ענף: `claude/enginebox-261013` (מבוסס על `claude/community-os-261013` @7073c4b). לא מוזג. תוכנית: `BUILD-ORDER-ENGINEBOX-2026-10-13.md`.

## מה נבנה
- `src/lib/enginebox/plugs.ts` — תקן החיבור: 16 סוגים סגורים, `PLUG_STANDARD_VERSION = 1`, `isPlugType/plugInfo/plugOrder`.
- `src/lib/enginebox/parts.ts` — 14 חלקים (7 פרנסה׳לע · 6 אירוח · 1 אורביט) ו-2 מוצרים; `partById/productById/partOrder`.
- `src/lib/enginebox/links.ts` — `linkKey` · `VALID_LINKS` (נגזר) · `DEFAULT_LINKS` (11) · `sanitizeLinks` · `effectiveLinks` · `isLinked` · `parseLink` · `healEngineLinksIn`.
- `src/lib/enginebox/match.ts` — `catalogFor` · `connectOptions` · `futureOptions`.
- `src/lib/enginebox/index.ts` — barrel.
- חוזה-נתונים: `UiPrefs.engineLinks?: string[]` (`src/types/domain.ts`), ריפוי ב-`migrate()` (`src/store/persist.ts`, אחרי ריפוי-האירוח)
  ובמיזוג-meta מהענן (`applyMetaPartial`, `src/lib/cloud-merge.ts`) — שם עובר ה-`ui` מהענן (`healRecord` מטפל רק ברשומות-ישויות; `ui` אינו ישות).
- בדיקות: `src/lib/enginebox/__tests__/enginebox.test.ts` — **34 בדיקות** בשבעה חלקים (א–ז).

## החלקים
| חלק | מקור | מודול / תת-דגל | נותן (חי ⇐ יכולת) | צריך (חי ⇐ נקודת-צריכה) | בקרוב |
|---|---|---|---|---|---|
| `pr.zmanim` 🕯️ זמני היום והשבת | פרנסה׳לע | parnasa / parnasa.zmanim | times.shabbat, day.summary ⇐ `parnasa.shabbat` (`parnasa/abilities.ts:277`) | — | נותן times.blocked, date.hebrew |
| `pr.board` 📌 לוח קהילה | פרנסה׳לע | parnasa / parnasa.board | times.prayers, day.summary ⇐ `parnasa.minyanim` (`:278-280`) · emergency ⇐ `parnasa.emergency` (`:282`) | — | — |
| `pr.directory` 📇 מדריך העסקים | פרנסה׳לע | parnasa / parnasa.directory | pro.match ⇐ `parnasa.findPro` (`:276`) | — | — |
| `pr.phone` 📞 הקו | פרנסה׳לע | parnasa / parnasa.phone | — | availability ⇐ `parnasa/phoneLine.ts:726` | נותן voice.menu · צריך booking |
| `pr.care` 🏠 ניהול ואישורים | פרנסה׳לע | parnasa / parnasa.care | — | day.summary ⇐ `parnasa/TodayCard.tsx:25` | — |
| `pr.booklet` 📖 חוברת | פרנסה׳לע | parnasa / parnasa.booklet | — | — | נותן print.page |
| `pr.ads` 📣 פרסומות | פרנסה׳לע | parnasa / parnasa.ads | — | — | נותן payment.link |
| `host.units` 🛏️ יחידות ותפוסה | אירוח | hosting | availability ⇐ `hosting.availability` (`hosting/abilities.ts:160`) | — | נותן booking · צריך person |
| `host.stay` 🧳 כרטיס השהייה | אירוח | hosting / hosting.shabbat | — | times.shabbat ⇐ `SwitchPanels.tsx:121,125` · times.prayers ⇐ `SwitchPanels.tsx:91` | נותן message.text · צריך payment.link |
| `host.shabbat` 🕯️ לשונית שבת | אירוח | hosting / hosting.shabbat | — | times.shabbat ⇐ `SwitchPanels.tsx:148` · times.prayers ⇐ `SwitchPanels.tsx:155` (+`ShabbatTab.tsx:106`) | — |
| `host.maint` 🔧 תחזוקה | אירוח | hosting / hosting.maint | — | pro.match ⇐ `MaintTab.tsx:105` → `SwitchPanels.tsx:187` · emergency ⇐ `SwitchPanels.tsx:190` | — |
| `host.clean` 🧹 ניקיון | אירוח | hosting / hosting.housekeeping | — | pro.match ⇐ `CleanTab.tsx:69` → `SwitchPanels.tsx:187` | — |
| `host.dash` 📊 לוח הבקרה | אירוח | hosting | day.summary ⇐ `hosting.today` (`hosting/abilities.ts:159`) | day.summary ⇐ `SwitchPanels.tsx:268` (מרונדר ב-`DashTab.tsx:99`) | — |
| `orbit.families` 👪 משפחות | אורביט | families | — | — | נותן person |

## חיבורי ברירת-המחדל (= החיווט של היום) — ראיות
| # | מפתח | ראיה בקוד |
|---|---|---|
| 1 | `pr.zmanim>times.shabbat>host.stay` | `StayShabbat` — `SwitchPanels.tsx:121` `ask('parnasa.shabbat', ctx, { atIso: friIso })`, מוצג `:125` (`data-switch="stay-shabbat"`), מרונדר `BookingModal.tsx:220` |
| 2 | `pr.zmanim>times.shabbat>host.shabbat` | `BoardShabbatPanel` — `SwitchPanels.tsx:148`, מרונדר `ShabbatTab.tsx:53` |
| 3 | `pr.board>times.prayers>host.stay` | `familyLink` ⇒ `shabbatFamilyText({… minyanim: minyanimOf(…) })` — `SwitchPanels.tsx:91` ("📤 שליחה למשפחה"), וגם `MinyanRows` בכרטיס |
| 4 | `pr.board>times.prayers>host.shabbat` | `SwitchPanels.tsx:155` (`MinyanRows` בפאנל) + `ShabbatSendLink` בשורות `ShabbatTab.tsx:106` |
| 5 | `pr.directory>pro.match>host.maint` | `MaintTab.tsx:105` `text: faultNeed(r)` ⇒ `FindProDialog` `SwitchPanels.tsx:187` `ask('parnasa.findPro', …)` |
| 6 | `pr.directory>pro.match>host.clean` | `CleanTab.tsx:69` `text: cleanNeed(tk)` ⇒ אותו דיאלוג |
| 7 | `pr.board>emergency>host.maint` | `SwitchPanels.tsx:190` `props.urgent ? ask('parnasa.emergency', …)`; `urgent` נשלח רק מקריאת-תחזוקה (`MaintTab.tsx:105`, `priority <= 1 \|\| safety`) |
| 8 | `host.units>availability>pr.phone` | `hostBranch` — `phoneLine.ts:726` (+`:730`,`:733`), דרך `PhoneTab.tsx:99` |
| 9 | `pr.zmanim>day.summary>host.dash` | `todaySummary` (`summary.ts`) ⇐ `today` של `parnasa.shabbat`; נצרך `SwitchPanels.tsx:268` |
| 10 | `pr.board>day.summary>host.dash` | אותו, ⇐ `today` של `parnasa.minyanim` (`parnasa/abilities.ts:280`) |
| 11 | `host.dash>day.summary>pr.care` | `todaySummary` ⇐ `today` של `hosting.today`; נצרך `TodayCard.tsx:25`, מרונדר `CareTab.tsx:199` |

כל שמונה החיבורים שברשימת-המשימה אומתו; 1–4 פוצלו לפי מסך-מקבל (כרטיס-השהייה / לשונית-השבת) כי לכל אחד תוצאה אחרת;
"שורות-היום" פוצלו לשלושה זוגות-חלקים. **לא נמצא חיבור-חוצה-כלים נוסף.** אף חיבור לא הושמט.

## תקן החיבור (16)
times.shabbat · times.prayers · times.blocked · pro.match · emergency · availability · booking · request.text · message.text · voice.menu ·
print.page · date.hebrew · reminder · payment.link · person · day.summary. (request.text ו-reminder מוגדרים בתקן ועוד לא בשימוש — מותר.)

## בדיקות ושערים
- `enginebox.test.ts`: 34 ✓ — (א) תקן סגור 2 · (ב) כנות 4 · (ג) ברירת-מחדל 3 · (ד) מתאים 10 · (ה) חיטוי/מיגרציה/ענן 7 · (ו) מוטציה 4 · (ז) הגנות-מקור 4.
- מוטציה ידנית לפני commit: marker שגוי ב-`host.clean` ⇒ (ב) אדום; `via` של המדריך הוחלף ליכולת עם תת-דגל אחר ⇒ (ב) אדום; שוחזר ⇒ ירוק.
- `npm run verify:fast`: 431 קבצים · 3587 בדיקות ✓ (כולל `ui-golden.test.ts` של המרכזייה — **בלי הקלטה-מחדש**). `npm run verify` (+build) — לפני push.

## החלטות (בנאי — לאישור הארכיטקט)
1. **מזהי-חלקים** `pr.*` / `host.*` / `orbit.*` — לא `parnasa.*`, כדי לא להתבלבל עם מזהי-היכולות ותת-הדגלים.
2. **חיבור = בין כלים שונים בלבד.** זוג באותו מודול (למשל זמני-השבת ⇒ תקציר-היום של פרנסה׳לע עצמה) הוא חיווט פנימי — לא מוצע ולא תקין ב-`sanitizeLinks`.
3. **פיצול לפי מסך-מקבל:** "זמני שבת לכרטיס-השהייה" ו"זמני שבת ללוח" = שני חלקים מקבלים (`host.stay`, `host.shabbat`) עם תוצאות שונות.
4. **תת-הדגל של Give חי חייב להיות זהה לתת-הדגל של היכולת** (ratchet) — כך "החלק בארגז" ⇒ "היכולת זמינה", בלי הבטחה ריקה.
5. **`start` ⊇ `picked` ⇒ []** (המנוע כבר חלק מהמוצר). שני הצדדים חייבים להיות בארגז (`catalogFor`), גם ב"בקרוב".
6. **`stored` שאינו מערך ⇒ כמו חסר** (ברירת-המחדל) — הכי בטוח, שומר על ההתנהגות של היום. `[]` מפורש ⇒ כלום.
7. **מיון `sanitizeLinks` לקסיקוגרפי** (יציב ואידמפוטנטי). ריפוי לא-מערך ⇒ המפתח יורד (לא `[]` — כדי לא להפוך "חסר" ל"כלום מחובר").
8. **`healRecord`** ב-`cloud-merge.ts` מטפל ברשומות-ישויות בלבד; `ui` מגיע מהענן דרך `applyMetaPartial` — הריפוי שם.
9. **הבנדל-הראשי** מייבא רק את `enginebox/links` (שגורר את `parts`+`plugs` — נתונים בלבד, ייבוא-טיפוסים מהמרכזייה). `match.ts` (שמייבא config) לא נגרר. נעול ב-(ז).
10. **בלי חלק "אורביט-לוח-שנה"** (תאריך עברי/תזכורת) — זה הלוח-הראשי, מחוץ לבידוד; `date.hebrew` הוצהר כ"בקרוב" על `pr.zmanim`.
11. **`payment.link` ו-`booking`** הוצהרו רק כ"בקרוב" (קישור בלבד / בקשה לאישור) — בלי שום קוד-כסף.

## שאלות פתוחות (לבעלים/לארכיטקט)
1. בשלב ב׳ — האם ניתוק חיבור מתבצע ע״י מנהל-ארגון בלבד, או גם ע״י מייל-על מלוח-הבקרה (ואז זה יושב ב-config ולא ב-`db.ui`)?
2. "שורות-היום" — האם הלקוח רוצה לנתק פר-שורה (זמני-שבת בלי המניין הבא) או את הכרטיס כולו?
3. "בקרוב": אילו מהם לקדם ראשונים (הזמנה מהקו · משפחה רשומה כאורח · קישור-תשלום בהודעה)?
