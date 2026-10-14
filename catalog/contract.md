# 📇 חוזה הקטלוג · The Parts Catalog Contract

גרסה 1 · 14.10.2026 · בעלים: סשן-הקטלוג של אורביט (maor-system). מכונה-קריאה: [`schema.json`](./schema.json). בודק: [`lib/check.mjs`](./lib/check.mjs).

> **בעברית פשוטה:** כל פרויקט שבנינו מפורק לחלקים קטנים. כל חלק נרשם באותה צורה בדיוק: מה הוא עושה, מה הוא מקבל, מה הוא נותן.
> ככה מכונה אחת יכולה לחפש צירופים של חלקים מכל הפרויקטים יחד, ולבנות מהם כל דבר.
>
> **In plain English:** every project is broken into small parts, and every part is written down in the same shape (what it does, what it takes, what it gives), so one combiner can search combinations across all projects and a verifier can check them.

---

## 1. קובץ אחד לכל מקור · One file per source

`catalog/sources/<source>.json`:

```json
{ "source": "orbit", "repo": "owner/repo", "ref": "branch@sha", "generatedAt": null, "parts": [ /* Part[] */ ] }
```

| שדה | Field | כלל · Rule |
|---|---|---|
| `source` | source id | `[a-z][a-z0-9-]*` — `orbit`, `generator`, `rings`, `buildsmart`, `yeshiva`, `qa-scanner`, `yoman-habina`, `14kk`, `mmmm` |
| `repo` | repository | `owner/name` |
| `ref` | where it was read | `<branch>@<sha>` (7–40 hex) |
| `generatedAt` | — | **תמיד `null`** — אין חותמת-זמן, כדי שהקובץ יהיה דטרמיניסטי · always `null`, so the file is deterministic |
| `parts` | parts | **ממוינים לפי `id`**, בלי כפילויות · sorted by `id`, unique |

אותו קוד ⇒ אותו קובץ, ביט אחר ביט (חוץ מ-`ref`). · Same code ⇒ byte-identical file (except `ref`).

## 2. חלק · Part

| שדה | Field | סוג | כלל · Rule |
|---|---|---|---|
| `id` | id | string | `"<source>:<path>#<symbol>"` — בדיוק כך · exactly this |
| `source` | | string | = ה-`source` של הקובץ |
| `path` | | string | נתיב יחסי לשורש-הריפו · repo-relative path |
| `symbol` | | string | שם הפונקציה/הקבוע; חלק פנימי של כרטיס: `CARD.N` · function/const name; card inner part: `CARD.N` |
| `lang` | | enum | `ts` · `js` · `dart` · `py` · `machine` · `json` |
| `what` | | enum | `function` · `brick` · `particle` · `engine` · `component` · `rule` |
| `name` | | string | **עברית של כל יום, צורת-פועל, עד 9 מילים, אומר מה החלק עושה.** בלי אותיות לטיניות. ✅ "מחלק לחלקים שווים" ❌ "divideSpan" · plain Hebrew verb phrase ≤ 9 words, no Latin letters |
| `does` | | string | משפט עברי אחד פשוט · one simple Hebrew sentence |
| `takes` | | `{name, kind, type}[]` | הקלטים, לפי הסדר. `type` = הטיפוס כפי שנכתב בקוד (או `unknown`) · inputs in order; `type` = the code's type text |
| `gives` | | `{kind, type}` | הפלט · the output |
| `pure` | | boolean | `true` = אותו קלט ⇒ אותו פלט, בלי שעון/אקראי/רשת/דיסק/מסך · same input ⇒ same output, no clock/random/IO/DOM |
| `example` | | `{in, out}` \| `null` | **רק מקבצי-בדיקה או fixtures, אחרי סינון.** `in` = אובייקט לפי שמות-הקלט · only from tests/fixtures, scrubbed |
| `tags` | | string[] | חופשי; מומלץ `module:x`, `lib:x`, `brick:x`, `engine`, `place:<kind>` · free-form |
| `parent` | | string | רק ב-`what: inner` — מזהה החלק שממנו הורם (`<source>:<path>#<symbol>`; אם ההורה לא בקטלוג — תגית `parent:uncataloged`) · inner only |
| `origins` | | `{repo, file, line, what}[]` | רק ב-`what: inner` — איפה בדיוק בקוד · inner only |

### `what` — מה זה · what it is

| ערך | מתי · when |
|---|---|
| `function` | פונקציה רגילה שאפשר לקרוא לה · a callable function |
| `brick` | חלק קטן וכללי שלא יודע על איזה מוצר הוא עובד (כמו 8 החלקים של אורביט) · a small generic part that knows nothing about the product |
| `particle` | חלק פנימי של מנוע שמתואר במילים ואין לו פונקציה אחת משלו (`lang: machine`) · an engine's inner step, described, with no single function |
| `engine` | מנוע שלם: הרבה חלקים יחד, עם "מקומות" שאפשר להתחבר אליהם · a whole engine with places to plug into |
| `component` | רכיב-מסך (`kind: ui`) · a screen component |
| `rule` | כלל/בדיקה/תבנית שאינם פונקציה (regex, טבלת-כללים, סכמה) · a rule, table or schema that is not a function |
| `inner` | ערך-בדרך שהורם מתוך פונקציה גדולה יותר (פותח-הפונקציות, `catalog/inner/`) — פונקציה טהורה עומדת-בפני-עצמה. עם `parent` (מזהה החלק-ההורה) ו-`origins` (`[{repo, file, line, what}]`) · an intermediate value lifted out of a bigger function |

### `lang`

`ts` TypeScript · `js` JavaScript (`.js`/`.mjs`) · `dart` · `py` · `json` (נתונים/סכמה) · `machine` — תיאור הצהרתי (כרטיס-מנוע, טבלה) שאינו קוד-להרצה · a declarative description, not runnable code.

## 3. הסוגים — מילון אחד · `kind` — ONE shared vocabulary

**אסור להמציא סוגים ואסור לשנות שמות.** סוג חדש — רק כללי, ורק בהחלטה משותפת שנכתבת כאן. · No renames, no private kinds.

| kind | עברית | כלל · Rule | דוגמאות · Examples |
|---|---|---|---|
| `span` | מ… עד… | התחלה וסוף של אותו דבר (שעות, תאריכים, מספרים) · a start and an end | `{from: 480, to: 960}` · 8:00–16:00 · `checkIn…checkOut` |
| `amount` | סכום כסף | כסף בלבד · money only (כמות/ספירה ⇒ `number`) | `₪1,187` · `price` · `balance` |
| `number` | מספר | מספר שאינו כסף ואינו רגע: ספירה, כמות, אינדקס, אחוז, דקות · a plain number | `nights` · `qty` · `pct` · `990` דקות |
| `times` | רגעים בזמן | שעה ביום, רגע (ms), או רשימת זמנים · a clock time, an instant, or a list of moments | `"17:46"` · `nowMs` · `["06:12","17:46"]` |
| `date` | תאריך | יום אחד בלוח (ISO `YYYY-MM-DD`, או תאריך עברי) · one calendar day | `"2026-10-16"` · `IsoDate` |
| `sequence` | רשימה מסודרת | רשימה שהסדר בה הוא העיקר (לפי זמן, תורות, שלבים) · ordered, order matters | לילות פנויים ברצף · תור-משימות · `Run[]` |
| `list` | רשימה | אוסף שהסדר בו לא העיקר, מפה, טבלה · a collection, map or table | `string[]` · `Map<…>` · שורות CSV |
| `waiting` | מחכה לתשובה | משהו פתוח שמחכה למישהו (בקשה, אישור, משימה) · something open, awaiting someone | בקשה בלי מענה · עסק ממתין לאישור |
| `text` | טקסט | מילים לקריאה או לחיפוש · words | שם · הערה · הודעת וואטסאפ |
| `bool` | כן/לא | | `isOpen` · `canPay` |
| `record:<entity>` | רשומה | אובייקט מובנה מסוג ידוע; `<entity>` = שם-הטיפוס ב-lowerCamel (`HostBooking` ⇒ `record:hostBooking`). לאובייקט בלי שם — שם הפונקציה. `record:db` = כל המאגר · a structured object; entity = lowerCamel type name | `record:supporter` · `record:hostQuote` · `record:db` |
| `geo` | מקום | נקודה, עיר, קו-רוחב/אורך, כתובת-כמקום · a place | `{lat, lon}` · `"בני ברק"` |
| `image` | תמונה | תמונה או כתובת-תמונה · an image or image URL | `data:image/…` · `photoUrl` |
| `sound` | קול | הקלטה, קול-דיבור · audio | קובץ-הקלטה · קול עברי |
| `file` | קובץ | קובץ שלם או בייטים · a whole file / bytes | `Blob` · CSV להורדה |
| `choice` | בחירה מתוך אפשרויות | ערך אחד מרשימה קבועה · one of a fixed set | `'open' \| 'done'` · `1 \| -1` |
| `ui` | רכיב-מסך | רכיב או סגנון שמוצג על המסך · something rendered | `ReactNode` · `CSSProperties` |
| `unknown` | לא ידוע | לא נקבע (פונקציית-callback, טיפוס כללי `T`). עדיף `unknown` אמיתי על ניחוש · not determined; honest unknown beats a guess |

**כלל-הכרעה · Tie-break:** כסף ⇒ `amount` לפני `number`; יום-בלוח ⇒ `date`, שעה/רגע ⇒ `times`; רשימה שהסדר בה קובע ⇒ `sequence`, אחרת `list`; ערך-מתוך-רשימה-קבועה ⇒ `choice` לפני `text`.

## 4. דוגמאות ופרטיות · Examples and privacy

- דוגמה נלקחת **רק** מקובץ-בדיקה או fixture שקיים בריפו, ורק כשהקלט והפלט מילוליים.
- **מסננים לפני כתיבה:** בלי טלפונים (7+ ספרות, גם עם רווחים), מיילים (`@`), ת״ז, כתובות, טוקנים/סודות (24+ תווים אקראיים), קישורים, ובלי שמות-אנשים (גם בדויים). מפתחות כמו `name`/`phone`/`email` באובייקט ⇒ הדוגמה לא נכנסת.
- עדיף `example: null` מאשר דוגמה מסופקת. · When in doubt, `null`.

## 5. איך בודקים · How it is checked

`catalog/lib/check.mjs` — `validateSource(doc)`: הסכמה + `id = source:path#symbol` + ממוין ויחיד + שם בעברית ≤ 9 מילים בלי לטינית. עם `{ strict: true }` גם "השם מתחיל בפועל מהרשימה `NAME_VERBS`" (חובה באורביט; למקורות אחרים מומלץ).

## 6. שינויים בחוזה · Changing the contract

שינוי = הצעה בדוח-הסגירה של הסשן, החלטה אצל הארכיטקט, ואז עדכון של `contract.md` + `schema.json` + `check.mjs` יחד, וגרסה +1. לא משנים לבד.
