# סגירה · 🕯 "40 יום לא נשמר דלוק ולא עובד" — השורש האמיתי (5.10.2026)

## הדיווח (בעלים, פעם רביעית)
"הכפתור 40 יום לא נשמר דלוק והוא לא עובד." קודמיו: 3.9 (זרע בשקט) · 10.9 · 16.9 (#494 אבחון) · 22.9 (#501 "דלוק ברירת-מחדל"). כל פעם תוקן משהו בצד-המסך — והבעיה חזרה אצל הלקוח-בענן.

## השורש — מדוד, לא מנוחש
**הדלקת דגל בלוח-הבקרה/באשף-המרוחק מעולם לא הגיעה לענן.**

1. האשף "מדליק" דגל רגיל ע"י **מחיקת-המפתח** (חוזה "חסר=דלוק") — `BuilderWizard.tsx:404-413` (`setFeatures`: on ⇒ `delete features[k]`; off ⇒ `false`).
2. הכתיבה לענן הלכה דרך `writeOrgCloudConfig` ⇒ `writeOrgCloudDoc` ⇒ `setDoc(…, { merge: true })` (`src/lib/cloudConfig.ts:128-134` לפני התיקון).
3. **`merge: true` ב-Firestore ממזג-עומק מפות.** מפתח שנמחק מקומית פשוט לא נשלח — וה-`false` הישן ב-`config.features` נשאר. הוכח על אמולטור-Firestore אמיתי (`e2e/rules-redteam.mjs §י״א`):
   - ענן: `{supporters.segula:false, core.taxreceipt:false}` → האשף כותב `{supporters.hok:false}` (הדגלים "הודלקו") → **אחרי merge:true הענן עדיין מחזיק את שני ה-false**.
4. הלקוח מקבל את הקונפיג ב-`watchOrgCloudConfig` (onSnapshot) ⇒ `resolveOrgConfig` ⇒ `effectiveConfigFor` ⇒ `writeCloudConfigCache` (`useApp.ts:1079-1097`) — ה-false המיובא נכנס גם למטמון `maor_cloudcfg:{slug}`, שנטען **לפני כל דבר** בעלייה הבאה (`config.ts:841-844`).
5. לכן: #501 החליף את הדגל-הקובע מ-`supporters.segula` ל-`core.taxreceipt` — אבל אם גם הוא נכתב פעם `false` לארגון (למשל ניסוי עם חבילה מסחרית — `COMMERCIAL_OFF` ב-`verticalPacks.ts:43`; או כיבוי-ידני של "קבלת סעיף 46"), ההדלקה-החוזרת שלו **לא נשמרה** מאותה סיבה. "לא נשמר דלוק" — מילולית.

אותו מלכוד כבר נתפס נקודתית ב-21.8 (`ManagerPanel.tsx` `weeklyGoal`: "delete + merge:true ⇒ השדה מעולם לא נמחק") ותוקן עם `deleteField` רק שם — הלקח לא הוכלל לקונפיג.

## מה נבדק ונשלל (עם ראיות)
| חשד | ממצא |
|---|---|
| `featureOn` / `normalizeConfig` / `resolveOrgConfig` | מעתיקים features כמו-שהם; false מפורש בלבד מכבה (`config.ts:40-52, 515-535, 817-823`) |
| `effectiveConfigFor` (כרטיס-עובד) | מגביל רק `false` מפורש; מנהל = קונפיג-הארגון כמו-שהוא (`platform/lib.ts:209-222`). לא כופה כלום. |
| sw.js | index.html/version.json/config = network-first; רק `/assets/` (hash) cache-first ⇒ אין היתקעות על בנדל ישן באונליין (`public/sw.js:40-83`) |
| זריעה + התמדה (תרחיש ב׳) | לחיצה ⇒ 5 אירועי `call`+`spId`+הערה "סגולת 40 יום" ⇒ רענון ⇒ שרדו, הפאנל פעיל (`e2e/segula-cloudcfg-smoke.mjs` 15/15) |
| סנכרון-ענן של האירועים | לחיצת-יד: תוספת-מקומית נשמרת ונדחפת עם notes/spId/type; ענן-מנצח רק באותו id; מצבה חוסמת תחייה (`segula-events-cloudsync.test.ts` 3/3) |
| סידור-הכרטיס (5.10) | `sanitizeIds` מסתיר רק מזהה שהוסר ידנית מהפריסה; חסר=סדר-החי (`widgetLayout.ts`, `SupporterDetail.tsx:882-897`) |
| "נשמר דלוק" = בורר-החזרה? | `useState('segula')` — מצב-מסך, חוזר ל-40 יום בכל פתיחה; צפוי ומתועד ב-e2e (ג) |

## התיקון
- `src/lib/cloudConfig.ts` — `writeOrgCloudConfig` כותב `setDoc(ref, { config }, { mergeFields: ['config'] })`: שדה `config` **מוחלף בשלמותו** (מה שהאשף מחזיק = מה שבענן); `members/manager/memberConfigs/joinOpen` לא נגועים (מוכח באמולטור). Rules: רק מייל-על כותב config (מנהל-ארגון נחסם — נבדק).
- `SettingsView` 🔎 אבחון-דגלים: גם `raw core.taxreceipt=` (הדגל שבאמת קובע מאז #501) — false תקוע כבר לא בלתי-נראה.
- לידת-ארגון (`PlatformPanel` approve) נשארת על `writeOrgCloudDoc` — מסמך חדש (נבדק-קיום לפני), אין false ישן.

## ratchets
- `e2e/rules-redteam.mjs §י״א` (אמולטור, CI job `rules`): (הבאג) merge:true משאיר false · (התיקון) mergeFields מנקה ושומר members · מנהל לא כותב config. 66/66.
- `src/lib/__tests__/segula-cloudcfg-merge.test.ts` (6): סימולציית שתי הסמנטיקות על "הדלקה-באשף" + הגנות-מקור (mergeFields ב-writeOrgCloudConfig; אשף/לוח כותבים רק דרכו; אבחון raw core.taxreceipt). **מוטציה:** החזרת merge:true ⇒ אדום ⇒ שוחזר.
- `src/store/__tests__/segula-events-cloudsync.test.ts` (3): אירועי-הסגולה מול הענן.
- `e2e/segula-cloudcfg-smoke.mjs` (15): (א) false תקוע מהענן ⇒ מוסתר + אבחון OFF/raw; segula:false בלבד ⇒ מוצג; (ב) זריעה⇒רענון⇒שרד+פאנל פעיל (צילום `e2e/shots/segula-cloudcfg-after-reload.png`); (ג) בורר-חזרה = מצב-מסך.
- קיימים ירוקים: `segula-smoke` 16/16 · `teachers-csv-segula-diag-smoke` 10/10.

## מה הבעלים צריך לעשות אחרי המיזוג (פעם אחת)
הענן של הארגון **עדיין מחזיק** את ה-false הישן — התיקון מונע הישנות, לא מנקה עבר. אחרי הפריסה (אימות: `curl https://orbit-il.com/version.json` — orbit-il מתעדכן ב-cron 03:00 UTC או בהרצה ידנית):
1. לוח-הבקרה (`#platform`) ← הארגון (ככל הנראה `mavr-hchsd`) ← דגלים ← **כל שינוי** (למשל לכבות ולהדליק "סגולת 40 יום") ⇒ הקונפיג נכתב בשלמותו ⇒ ה-false התקועים נעלמים.
2. אצל הלקוח: הגדרות ← 🏷 הארגון שלי ← 🔎 אבחון דגלים ⇒ `40 יום נראה: ON · raw core.taxreceipt=undefined`.
אם `core.taxreceipt` עצמו כבוי בכוונה (ורטיקל מסחרי) — הכפתור מוסתר **במכוון** (שם "העין"=פרויקטים).

## שאלה אחת לבעלים
**מה ה-slug של הארגון שבו זה קורה** (הכתובת `orbit-il.com/?org=…`)? או צילום של "🔎 אבחון דגלים" מהמכשיר של הלקוח — בשורה `40 יום נראה` יופיע עכשיו גם `raw core.taxreceipt=…`, וזה יגיד מיד אם זה ה-false התקוע או משהו אחר.

## לקח (נוסף ל-ARCHITECT-LESSONS #21)
`setDoc(…, {merge:true})` על מסמך עם מפות = **מחיקת-מפתח לא נשמרת לעולם**. חוזה "חסר=דלוק" + merge:true = דגל שמת פעם אחת לא קם. לכתיבת-מפה-שלמה: `mergeFields:[field]`; למפתח יחיד: `deleteField()`. תיקון מקומי (21.8) שלא הוכלל = אותו באג חוזר במקום אחר.

---

## המשך (6.10.2026, אחרי הפריסה) — "40 יום לא עובד אפילו שהפעלתי אותו"
האבחון של הבעלים אחרי #504 (build 02:42):
`40 יום נראה: OFF · raw supporters.segula=undefined · raw core.taxreceipt=false`, ו-33 דגלים כבויים (ביניהם core.taxreceipt, core.receipts, supporters.hok).

**השורש השני:** #501 קשר את הנראות של הכפתור ל-`core.taxreceipt` ("קבלת סעיף 46") כפרוקסי ל"עמותה". הבעלים הדליק את הדגל
שנקרא "סגולת 40 יום" בלוח-הבקרה — וזה **נשמר** (raw=undefined, #504 עובד) — אבל הקוד התעלם ממנו והסתכל רק על §46,
שכבוי אצלו. דגל שלא שולט במה ששמו אומר = הבעלים "מפעיל" ושום דבר לא קורה.

**התיקון (PR הבא):** `segulaOn = featureOn(config, 'supporters.segula')` — הדגל שולט (חסר=דלוק, רק false מפורש מכבה);
false ⇒ הודעה גלויה בכרטיס (כלל 16.9, הוחזרה מ-#494); ורטיקל מסחרי מכבה דרך `COMMERCIAL_OFF['supporters.segula']=false`
(לא פרוקסי). האבחון מודד את הדגל הזה ומציג את שניהם raw. ratchets: `teachers-csv-segula-diag.test` (כוונה חדשה + COMMERCIAL_OFF),
`vertical-matrix-data.json` חולל-מחדש (10 חבילות מסחריות), `e2e/segula-cloudcfg-smoke` 16/16 (א2 = המצב האמיתי של הבעלים:
§46 כבוי + segula חסר ⇒ מוצג), `teachers-csv-segula-diag-smoke` 10/10, `segula-smoke` 16/16. verify:fast 2800/2800.

**לקח:** פרוקסי ("אם אין §46 זה עסק") שובר את החוזה של הדגל. כשמוסיפים הכרעת-"דלוק ברירת-מחדל" — משאירים את הדגל כשליט
ומתקנים את **מה שכתב false** (מקור-הכתיבה), לא עוקפים את הדגל.

---

## המשך 2 (6.10.2026, אחרי #505 חי) — «תכניס את הכפתור בלוח מעקב טיפול»
- `AyinBoard.tsx`: לכל שורה בלוח כפתור **«🕯 40 יום»** בעמודת-הפעולה (מתחת לכפתור-החכם / «🎯 קשר הבא»); לחיצה =
  `seedSegulaReminders(sp.id, today, 'זיווג')` — אותו מנגנון של הכרטיס (5 תזכורות-לוח + קשר-הבא), `stopPropagation`
  (לא פותח כרטיס). שורה עם סגולה פעילה ⇒ צ'יפ-מצב **«🕯 יום N/40»** (ירוק, title עם התזכורת-הבאה והסיום) במקום הכפתור —
  לא זורעים פעמיים. מגודר `supporters.segula` (חסר=דלוק) — אותו דגל כמו הכרטיס. `useDbWatch('supporters','events')`
  (חוזה db-watch — המצב נגזר מ-events). יישור-הגריד נשמר (עמודת-הפעולה הפכה ל-flex-column).
- ratchets: `ayin-board-segula.test.ts` (הגנות-מקור + segulaStatus) · `e2e/segula-board-smoke.mjs` (כפתור בכל שורה ⇒ לחיצה ⇒
  5 אירועים לשורה הנכונה + קשר-הבא ⇒ צ'יפ ⇒ לא נפתח כרטיס ⇒ הכרטיס מציג «סגולה פעילה»; דגל false ⇒ אין כפתור).
