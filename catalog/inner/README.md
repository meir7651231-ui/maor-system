# 🔓 פותח-הפונקציות · The Function Opener

**לבעלים, בשלוש שורות:**
1. בתוך כל פונקציה גדולה יש חישובים קטנים "בדרך" — כיוון השמש בתוך חישוב הזריחה, גל שעולה ויורד בתוך ציור הגלקסיה, ספירה לאחור בתוך שעון-הכסף.
2. הפותח מוצא אותם, חותך כל אחד החוצה לחלק קטן שעומד בפני עצמו (בלי מסך, בלי שעון, בלי רשת), ומריץ אותו כדי לדעת מה הוא באמת עושה.
3. כך "לא חסר כלום": פעולות שנראו חסרות היו שם כל הזמן — רק בתוך פונקציה אחרת.

## מה יש כאן

| קובץ | מה |
|---|---|
| `lib/opener.mjs` | ההליכה על הקוד (המהדר של TypeScript, גם ל-JS) · מציאת הערכים-בדרך · חיתוך-אחורה · כתיבת המודול |
| `lib/purity.mjs` | כללי-הטוהר: מה מותר בחלק מורם ולמה דילגנו (לפי הסמלים של המהדר, לא לפי שמות) |
| `lib/name.mjs` | שם עברי בלי-עולם מצורת החישוב ("מחשב נקודה על מעגל", "מודד מרחק בין שתי נקודות") |
| `lib/build.mjs` · `lib/repos.mjs` | ריפו ⇒ קבצי-gen + `catalog/sources/inner-<source>.json` + מונים |
| `lib/motion.mjs` | צופי-התנועה: דועך · סופר לאחור · צובר · מתנדנד · מקיף — **נמדד בהרצה**, נשמר בשדה `motion` (לא פעלים של האלפבית) |
| `lib/prove-job.mjs` · `scripts/prove*.mjs` | ההוכחה: אותו קורא-התנהגות ואותו ארגז-חול של הקטלוג ⇒ `catalog/behavior/inner-<source>.json` |
| `gen/<source>/<path>.mjs` | מודול טהור לכל קובץ-מקור: הערכים-בדרך כפונקציות + `SIGS` (צורת הקלטים). **לא בריפו** — נוצר לפי דרישה (`lib/ensure-gen.mjs`) |
| `lib/resolve.mjs` | (v2) תוכנית-מהדר לריפו: ייבוא נפתר גם דרך `paths` של ה-tsconfig/jsconfig הקרוב לקובץ (`@/*`) |
| `lib/store.mjs` · `store/*.json` | (v2) המחסן הדחוס: החלקים וההתנהגות, שורה לכל חלק — **מה שבריפו**. `catalog/sources/inner-*.json` ו-`catalog/behavior/inner-*.json` נפרשים ממנו, ביט-זהים |
| `lib/ensure-gen.mjs` | (v2) **נקודת-הכניסה היחידה** לכל מה שנוצר: פורש את המחסן, ומשחזר את `gen/` — אורביט מהקוד, החיצוניים מ-`pack/`. כל צרכן קורא לו קודם |
| `gen.manifest.json` · `pack/<source>.json.br` | (v2) חתימה (sha256·16) לכל מודול; החבילות הדחוסות של הריפואים החיצוניים (בלי השכפולים אי-אפשר ליצור אותם מחדש) |
| `open-<source>.json` | מונים: מועמדים · נחתכו · סיבות-דילוג |
| `motion-baseline.json` | אותם צופי-תנועה על החלקים **השלמים** של הקטלוג — קו-בסיס להשוואה הוגנת |
| `lift.json` | ההרמה: כמה התנהגויות ממילון-המטרות מקבלות חלק מוכח רק בזכות החלקים הפנימיים |
| `dart-candidates.json` | Dart: מועמדים סטטיים בלבד (`proven: false`) — אין SDK בסביבה |
| `scripts/sun-demo.mjs` | הדגמה: כיוון השמש בירושלים ב-8:00 · 12:00 · 16:00 מתוך החלקים שהורמו מחישוב-הזריחה |

## איך זה עובד

1. **הליכה.** לכל קובץ JS/TS בריפו (לא רק אלה שבקטלוג): כל `const x = …` / `let x = …` בתוך פונקציה, בכל עומק (callback, `useEffect`, `requestAnimationFrame`, `map`/`reduce`).
   גם **מצטבר אחרי לולאה** (`let best = null` שמתעדכן רק בלולאה אחת שאחריו) וגם **מעטפת-זמן** של `AudioParam` (`setValueAtTime` / `…RampToValueAtTime` / `setTargetAtTime` ⇒ הערך ברגע נתון, לפי המפרט).
2. **סינון.** רק חישוב: חשבון, `Math.*`, השוואה, תנאי, מתודה טהורה, קריאה לעוזר טהור — מאותו קובץ **או מקובץ אחר באותו ריפו** (v2). קריאה-בלבד (`a.b`) או ליטרל — לא נספרים (`trivial`).
3. **חיתוך-אחורה.** הקלטים = המשתנים החופשיים. בגוף: ההצהרות שהערך תלוי בהן (טרנזיטיבית), העוזרים הטהורים והקבועים — מאותו קובץ ומקבצים אחרים בריפו (v2: אותם חוקי-טוהר בהקשר של הקובץ שלהם, טרנזיטיבי, בטוח-מעגלים, עד 6 קפיצות-קובץ; `import { a as b }` ⇒ שורת-כינוי; `import * as U` ⇒ אובייקט `U` עם החברים שבשימוש). **עוזר-סגור** (פונקציה מקומית שתופסת משתנים של הפונקציה העוטפת) נכנס לגוף, והמשתנים שהוא תופס נחתכים כרגיל.
   תלות שאינה טהורה (`useState`, `ref.current`, `Date.now()`) **נחתכת והופכת לקלט** — הזרקה. ערך שבעצמו נוגע ב-await/this/שעון/אקראי/DOM/IO/קריאה מיובאת/שינוי-מבחוץ — מדולג, עם סיבה.
4. **שתי צורות:** `slice` (הקלטים = קלטי-הפונקציה העוטפת) ו-`step` (הקלטים = מה שהביטוי עצמו קורא — הנוסחה).
5. **הוכחה.** כל חלק מורץ בארגז-החול של הקטלוג. פועל נרשם רק אם כל החוקים שלו עברו n/n. השם לא משתתף.

```bash
node catalog/inner/lib/ensure-gen.mjs               # gen/ + inner-*.json הפרושים (לפי דרישה; כל הצרכנים קוראים לזה לבד)
node catalog/inner/scripts/open.mjs                 # כל המקורות (שכפולים ב-../catsrc; אורביט לא צריך) ⇒ store/ · מניפסט · pack/
node catalog/inner/scripts/open.mjs --check         # יציאה 1 אם לא מעודכן (מקור בלי שכפול — מדולג ונאמר)
node catalog/inner/scripts/prove.mjs                # catalog/behavior/inner-*.json  (~10 דקות)
node catalog/inner/scripts/baseline.mjs             # motion-baseline.json
node catalog/inner/scripts/lift.mjs                 # lift.json   (--check)
node catalog/inner/scripts/dart.mjs                 # dart-candidates.json
node catalog/scripts/catalog-build.mjs              # index.json · alphabet.md — כוללים את inner-*
npx vitest run catalog                              # כולל catalog/__tests__/inner.test.ts
```

**מתי צריך:** שינוי בקובץ של אורביט ⇒ `open.mjs --source orbit` ⇒ `prove.mjs --source orbit` ⇒ `lift.mjs` ⇒ `catalog-build.mjs`, וקומיט. הבדיקה נכשלת אם שכחו.

דוחות: [`knowledge/CLOSED-INNER-PARTS-2026-10-14.md`](../../knowledge/CLOSED-INNER-PARTS-2026-10-14.md) · [`knowledge/CLOSED-INNER-V2-2026-10-14.md`](../../knowledge/CLOSED-INNER-V2-2026-10-14.md) (מעקב-ייבוא + המחסן).
