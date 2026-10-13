# 🧩 ארגז המנועים — המסך (13.10.2026, ענף `claude/enginebox-ui-261013`, לא מוזג)

> חזון-הבעלים: "יש ארגז עם מנועים עם חיבור זכר ונקבה. הלקוח בא עם מנוע או מוצר ראשון ואז מתחיל לחבר.
> הוא בוחר מנוע, ואז המערכת אומרת: אתה יכול לחבר את המנוע פה ופה ושם, והתוצאה תהיה זה וזה וזה."

סשן-בנאי במקביל: סשן A בונה את הליבה הטהורה (`src/lib/enginebox/`), סשן B יחבר. הסשן הזה בנה **רק את המסך**,
מול תפר (seam) — לא מול הליבה. בסיס: `claude/community-os-261013` @ 7073c4b.

## מה נבנה
- **המסך** `src/components/enginebox/EngineBoxScreen.tsx` (Modal עם focus-trap/Escape מערכת-ה-UI):
  1. **במה מתחילים?** — כרטיסי-מוצרים + "או ממנוע אחד" (כל מנוע בארגז).
  2. **איזה מנוע להוסיף?** — גריד-כרטיסים (אימוג'י · שם · צ׳יפ "מאיזה כלי" · שורת "מה הוא עושה"), **בלי מנועי-ההתחלה**.
  3. **איפה אפשר לחבר?** — שורה לכל מקום-חיבור: **התוצאה = הטקסט הגדול ביותר**, מתחתיה 🔌 נותן ← צ׳יפ-התקע ← 🔘 מקבל;
     "חבר" או "✓ מחובר"+"נתק". `canEdit=false` ⇒ אין שום כפתור (רק "✓ מחובר" כמידע).
  4. אין התאמה ⇒ "המנוע הזה עוד לא מתחבר למוצר הזה".
  5. מתחת: **"בקרוב · עוד לא זמין"** מ-`future()` — רשימה נפרדת, מושתקת, מקווקוות, `aria-disabled`, בלי כפתור/onClick.
  6. כותרת: ההתחלה + "N חיבורים עכשיו" (`linkedCount`) + כפתור-חזרה צעד ("מנוע אחר" / "התחלה אחרת").
- **`source = null`** ⇒ "🧩 הארגז בהרכבה — עוד מעט" (ובלי שום צעד). ארגז ריק ⇒ אותה הודעה בצעד 1.
- עיצוב `enginebox.css` — רק tokens (ערכות/כהה/ניגודיות), mobile-first 390px, יעדי-מגע ≥ 40px, פוקוס לכותרת-הצעד בכל מעבר.
- **כניסה:** צ׳יפ "🧩 ארגז המנועים" בשורת-הצ׳יפים העליונה של ההגדרות (ליד 🎛️/🛠/👥/💬) ⇒ `#enginebox` ⇒ App פותח chunk עצל.

## התפר (`src/components/enginebox/types.ts`)
```ts
interface BoxPart { id; name; emoji; from; what }
interface BoxProduct { id; name; emoji; parts: BoxPart[] }
interface BoxOption { key; giver; needer; plugLabel; result; side: 'into'|'from'; linked }
interface BoxFuture { giver; needer; plugLabel; result }
interface EngineBoxSource { products(); parts(); options(start, picked); future(start, picked);
  linkedCount(start); connect(key); disconnect(key); canEdit }
```
**הכרעה (דו-משמעות בפקודה):** `start` = מזהה **מוצר או מנוע בודד** ("או ממנוע אחד"). `resolveStart` (model.ts) מחפש קודם
במוצרים ואז במנועים; התחלה-ממנוע ⇒ `parts=[המנוע]`, ורק הוא מוחרג בצעד 2. ⇒ על הליבה לקבל גם מזהה-מנוע ב-`options/future/linkedCount`.
`side` נשמר בתפר אך לא מוצג בנפרד (הכיוון כבר נאמר ב"נותן/מקבל").
אחרי `connect/disconnect` המסך מרנדר מחדש (מונה-tick פנימי) וקורא שוב `options/linkedCount` — הליבה לא חייבת להיות reactive.

## קבצים
| קובץ | |
|---|---|
| `src/components/enginebox/types.ts` | התפר |
| `src/components/enginebox/model.ts` | עזרי-תצוגה טהורים: resolveStart · pickableParts (החרגה+דדופ) · linksLabel |
| `src/components/enginebox/EngineBoxScreen.tsx` | המסך; צעדים טהורים (StartStep/PickStep/PlugStep/OptionRow/FutureList/BoxHeader) + EngineBoxBody (state) + EngineBoxScreen (Modal) |
| `src/components/enginebox/enginebox.css` | העיצוב (chunk-CSS עצל) |
| `src/components/enginebox/__tests__/fixtures.ts` | מקור-דוגמה — **בדיקות בלבד** |
| `…/__tests__/enginebox-screen.test.ts` | 13 בדיקות: 3 הצעדים, החרגה, תוצאות, חבר/נתק עם המפתח, קריאה-בלבד, ריקים, "בקרוב" נפרד ולא-לחיץ |
| `…/__tests__/enginebox-guards.test.ts` | 5 ratchets: opt-in `=== true` + OPT_IN_KEYS · אין import של fixtures בייצור · `source={null}` ⇒ מצב-ריק · lazy בלבד |
| `e2e/enginebox-smoke.mjs` | דפדפן: כבוי=אין צ׳יפ/‎#enginebox‎ לא נפתח · דלוק (390px) צ׳יפ⇒מסך⇒מצב-ריק · אין גלילה-אופקית · Escape · אפס שגיאות |

**קבצים משותפים (תוספות בלבד):** `src/types/features.ts` (+1 שורה, `shell.enginebox` optIn) · `optin-keys.ts` (+1) ·
`SettingsView.tsx` (+4, הצ׳יפ) · `App.tsx` (+19: lazy, state מ-hash, onHash, רינדור מגודר עם `source={null}`).

## הכרעות
- **אין testing-library בריפו** ⇒ לא הוספתי תלות (package.json משותף). אידיום-הפרויקט: `renderToStaticMarkup` + הפעלת `onClick`
  ישירה על עץ-האלמנטים של רכיבי-הצעדים, שנבנו **בלי hooks** בדיוק לשם כך. `initial={start,picked}` מאפשר לרנדר כל צעד.
- מסך = Modal (כמו 👥 ניהול העובדות) — focus-trap/Escape/✕ חינם. "נתק" בלחיצה-אחת (הפיך — "חבר" מחזיר; לא מחיקה).
- הצ׳יפ גלוי לכל מי שרואה הגדרות כשהדגל דלוק (לא מגודר-מנהל): עם `source=null` זה מצב-ריק בלבד; הגבלת-הרשאה אמיתית = `canEdit` מהליבה.
- **בנדל:** הכניסה הראשית +170B gzip (158,367⇒158,537; שורות-הרישום ב-App — בלתי-נמנע); המסך = chunk נפרד 2.2KB js + 0.9KB css.
- אפס כסף/קבלות/Rules/Functions/store/domain. דגל חסר ⇒ ביט-זהה (כל 3,571 הבדיקות הקיימות ירוקות בלי הקלטה-מחדש).

## מה סשן B צריך לעשות כדי לחבר
1. לממש `EngineBoxSource` מעל `src/lib/enginebox/` — מומלץ קובץ-מתאם חדש, למשל `src/components/enginebox/source.ts`
   (`export function engineBoxSource(db, config, canEdit): EngineBoxSource`), שממפה קטלוג⇒`parts()`, מוצרים⇒`products()`,
   matcher⇒`options/future` (כולל `start` שהוא מזהה-מנוע), links⇒`linked`/`linkedCount`/`connect`/`disconnect`.
   `key` חייב להיות יציב וייחודי פר-חיבור (המסך מחזיר אותו כמות-שהוא).
2. ב-`App.tsx` להחליף `source={null}` במקור האמיתי (lazy — לייבא את המתאם מתוך ה-chunk, לא סטטית; למשל לעטוף
   ב-`EngineBoxEntry` בתוך `components/enginebox/` שבונה את המקור ומעביר ל-`EngineBoxScreen`). `canEdit` = הכרעת-הרשאה (מנהל?).
3. **לעדכן את ratchet (ג)** ב-`enginebox-guards.test.ts` (כיום נועל `<EngineBoxScreen source={null}`) — להשאיר בדיקה שהמסך עם `null`
   מציג מצב-ריק, ולנעול שהמתאם לא מייבא fixtures (ratchet (ב) כבר סורק את כל `src`).
4. אם connect/disconnect כותבים ל-DB דרך ה-store — לוודא שהמסך מתרענן (כיום tick פנימי מספיק; מנוי `useDbWatch` אם יש משטחים נוספים).
5. להריץ `node e2e/enginebox-smoke.mjs` — ציפיית "הארגז בהרכבה" תשתנה; להוסיף מסע 3-צעדים אמיתי + צילום (לקח 18).
