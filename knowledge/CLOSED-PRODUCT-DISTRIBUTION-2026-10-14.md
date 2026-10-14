# CLOSED · 🧺 מוצר מסובך מהמכונה — «מוקד חלוקת סלים לחג» (14.10.2026)

ענף `claude/product-261014` (מ-`claude/machine-v4-261014` @2c990a6). לא מוזג ל-main. **`src/` לא נגע.**

## 1. לבעלים, בקצרה

- **שאלת "מה יוצא לי מזה?" — התשובה בדף אחד:** `catalog/products/distribution/index.html`. מוקד חלוקה שלם: 40 משפחות בעיירה בדויה, 6 מתנדבים עם רכב. לוחצים ① חלק ⇒ כל משפחה נצבעת בצבע של המתנדב הקרוב; ② מסלולים ⇒ דרך קצרה לכל מתנדב על המפה; ③ התחל ⇒ הרכבים נוסעים, הסטטוסים מתקדמים (באיסוף ⇒ בדרך ⇒ נמסר), משלוח שמאחר עולה בשלבים (תזכורת ⇒ רכז האזור ⇒ מנהל המוקד), ומתנדב שלא עונה — המסלול שלו עובר לבא בתור. יש ספירה לאחור לחג, מונים חיים, רשימת-המתנה, הודעה מוכנה לכל מתנדב (העתקה בלבד) ודוח סוף-יום לפי אזור.
- **אף חישוב בדף לא נכתב לדף.** המילה «מוקד-חלוקה» נכתבה במילון כ-16 צרכים (פועל · חומר), המכונה בחרה לכל צורך חלק מוכח מהקוד שלנו — **16/16 ✅** (14 חלקים · 1 חלק פנימי · 1 שילוב · 0 🔎) — וזמן-הריצה החדש הופך את הבחירה לפונקציות שהדף קורא להן. בכל לוח יש שבב "🧩 נמצא ב: …" שנלקח מההרכבה.
- **חדש באמת:** מעטפת-המסך (כפתורים, ציור, שעון-הדמיה) · זמן-הריצה (`catalog/runtime/`) · ליבה אחת קטנה שחולצה מהגלקסיה (`nearestPoint`, 1 שורת-קוד שבונה על ליבה קיימת). כל השאר — קיים ומוכח.
- **בונוס שנפל בדרך:** 6 מילים קיימות במילון ("המונית הקרובה", "האמבולנס הקרוב", "תחנה קרובה"…) קיבלו עכשיו את "הקרוב באמת" במקום חלק פנימי שהחזיר רק מרחק. מוכחים במילון: 989/990 ⇒ **1005/1006**.

## 2. המוצר — 16 צרכים ⇒ חלק/שילוב ⇒ מקורות

`catalog/goals/products.json` (עולם «מוצרים», המילה `מוקד-חלוקה`). ההרכבה המלאה (כולל כל המקורות) — `catalog/products/distribution/assembly.json`.

| # | צורך | פועל·חומר | סטטוס | החלק (תפקיד) | נמצא ב (פרויקט · קובץ:שורה) |
|---:|---|---|---|---|---|
| 1 | משפחות כנקודות במקומות על מפת העיירה | random·geo | ✅ מוכח בהרצה | `randomPoints` (מגריל) | אורביט · `src/components/parnasa/Ambient.tsx:63` (אבק-הזהב) |
| 2 | כל משפחה למתנדב הקרוב אליה | extreme·geo | ✅ מוכח בהרצה | `nearestPoint` (בוחר את הקיצוני) — **חולץ עכשיו** | אורביט · `src/components/supporters/SupportersGalaxy.tsx:125` (הכוכב הקרוב לעכבר); `SupportersUniverse3D.tsx:111`; `parnasa/envelope.ts:187` |
| 3 | אזורים בעיירה לפי הצד של המרכז | group·geo | ✅ מוכח בהרצה | `groupBySide` (מקבץ) | אורביט · `src/lib/three-scene.ts:121` (שתי האונות) |
| 4 | סדר התחנות של כל מתנדב לפי המרחק | sort·geo | ✅ מוכח בהרצה | `byDistance` (ממיין) | אורביט · `src/lib/three-scene.ts:122`; `parnasa/envelope.ts:187` |
| 5 | הדרך הקצרה בין התחנות | shortest-path·geo | ✅ מוכח — שילוב (24/24) | `nearNet` ⇒ `shortestPath` | אורביט · `src/lib/three-scene.ts:114` (רשת-הסינפסות) ⇒ בנייה חכמה · `app_flutter/lib/logic/install_engine.dart:759` (דייקסטרה); המחולל · `new/dart/find_shortest_path.dart:51` |
| 6 | הרכבים נוסעים במסלול על המפה | move-along-path·geo | ✅ מוכח בהרצה | `moveAlongPath` (מתקדם במסלול) | אורביט · `src/components/parnasa/coinFx.ts:211`; `shop7/lib.ts:12` |
| 7 | ספירה לאחור עד החג | countdown·times | ✅ מוכח בהרצה | `countdown` (סופר לאחור) | אורביט · `src/components/timer/MoneyTimer.tsx:117` |
| 8 | הסטטוס הבא: איסוף ⇒ בדרך ⇒ נמסר | route·choice | ✅ מוכח בהרצה | `advanceStatus` (מנתב לפי ערוץ) | אורביט · `src/components/shop7/lib.ts:15` (מודול החלוקה עצמו) |
| 9 | משלוח שמאחר עובר הלאה כשאין תשובה | escalate·waiting | ✅ מוכח בהרצה | `escalationState` (מסלים בזמן) | אורביט · `src/lib/atoms/parts/escalate.ts:84` ("מה צריך?" של פרנס׳לע) |
| 10 | מתנדב שלא עונה ⇒ עובר למתנדב הבא | escalate·waiting | ✅ מוכח בהרצה | `escalationState` (אותו חלק) | אורביט · `src/lib/atoms/parts/escalate.ts:84` |
| 11 | משפחה חדשה בהמתנה נבחרת לפי המזהה | lookup·waiting | ✅ מוכח — חלק פנימי | `ReenrollFamilyPanel.regEnroll` (מחפש לפי מפתח) | אורביט · `src/components/families/ReenrollFamilyPanel.tsx:54` |
| 12 | כמה סלים נותרו | count·list | ✅ מוכח בהרצה | `prayerOpenCount` (סופר) | אורביט · `src/components/supporters/prayer.ts:39` (שמות לתפילה שעוד לא הוזכרו) |
| 13 | תזכורת — תאריך יום לפני החלוקה | offset·date | ✅ מוכח בהרצה | `addDaysIso` (מזיז) | אורביט · `src/components/hosting/transitions.ts:90` |
| 14 | מסירה נחשבת רק עם אישור מהמקבל | require-source·list | ✅ מוכח בהרצה | `requireSource` (דורש מקור) | יומן הבינה · `schema.json:46`; אורביט · `src/lib/config.ts:112` (safeHttpsUrl) |
| 15 | הודעה לכל מתנדב עם הרשימה שלו | format·text | ✅ מוכח בהרצה | `prayerListText` (מעצב לטקסט) | אורביט · `src/components/supporters/prayer.ts:44` |
| 16 | דוח סוף יום לפי אזור | tally·list | ✅ מוכח בהרצה | `sheetSummary` (סופר לפי קבוצה) | אורביט · `src/components/courses/lib.ts:406` (סיכום-נוכחות ליום) |

**ביושר על הבחירות:**
- **הריצה הראשונה כבר נתנה 16 ✅ — אבל לא כולם עשו את העבודה.** "כמה נותרו" נפל על "ספור זוגיים ברשימה" (הטבעות), "ההודעה" על "סידור הישיבה כטקסט", "הקרוב" על חלק פנימי שמחזיר **מרחק** ולא **מי**. המכונה מדרגת לפי חוקים, לא לפי מה שהמוצר צריך. תיקנתי בשתי דרכים בלבד: (א) ניסוח הצורך — שובר-השוויון של המכונה הוא חפיפת-מילים לשם החלק (`overlap`), כך "סופר את השמות שעוד לא נמסרו" מגיע ל-`prayerOpenCount`; (ב) חילוץ ליבה אחת (`nearestPoint`). שום חלק לא נבחר ביד.
- **"מתנדב שלא עונה" — `escalationState`, לא tolerate/relay/next.** בקוד יש חלק שנקרא בדיוק "מעביר הלאה כשאין תשובה"; הוא מוכח ל«מסלים בזמן». המסלול של מתנדב 3 עובר ל"מתנדב 4" — והסדר של המחליפים הוא `byDistance` (צורך 4), שימוש-חוזר.
- **"משלוח מאחר" — אותו חלק עם שלב ראשון "בזמן" (45 דקות):** כך גם ההחלטה "מאחר או לא" באה מהחלק, ולא מהשוואת-שעון בדף.
- **סדר-התחנות = מהקרובה לרחוקה (`byDistance`), לא "השכן-הקרוב-הבא".** כפי שהכורה אמר — אין בקוד שלנו לולאת nearest-neighbour, וההנחיה אסרה לולאה בלי חלק מוכח שנותן אותה. לכן הסדר רדיאלי, וכל רגל בין שתי תחנות היא הדרך הקצרה ברשת. **הזדמנות:** חלק "השכן הקרוב שעוד לא בוקר" (גרסה של `nearestPoint` עם רשימת-ביקור) ייתן מסלול קצר יותר — זה חלק חדש, לא חילוץ, ולכן לא נבנה.
- **`advanceStatus` מוכח כ«מנתב לפי ערוץ»** (בחירה ⇒ בחירה, ומה שלא מוכר הולך לברירת-המחדל) — הצורך נכתב route·choice כי זה מה שהמכונה הוכיחה עליו. **`sheetSummary`** סופר "כמה מהרשימה מסומנים ביום הזה" — במוצר: נמסר-ואושר היום.

## 3. מה חדש ומה קיים

| | קבצים | שורות-חישוב חדשות |
|---|---|---:|
| **ליבה שחולצה** | `catalog/core/nearest-point.mjs` (+ `origins-c.json`, `core-c-census`, `behavior/core-c.json` — 21/21 «בוחר את הקיצוני» על נקודות) | 1 (`byDistance(points, from)[0] ?? null`) |
| **זמן-הריצה** | `catalog/runtime/{runtime,manifest,bundle,proven}.mjs` + README | 0 — רק מחבר פלט לקלט (אותן צורות כמו `combine.mjs`) |
| **המוצר** | `catalog/goals/products.json` · `catalog/products/distribution/{index.html, assembly.json, parts.bundle.mjs, samples.json}` · `catalog/products/shots.mjs` | מעטפת-מסך בלבד |
| **בדיקות** | `catalog/__tests__/product-distribution.test.ts` (6) · עדכוני-ספירה: `goals.test` (עד 16 צרכים בעולם «מוצרים»; 940 ⇒ 956) · `inner.test` (956) · `machine-v4.test` (10 ליבות) | |
| **נוצר מחדש בסקריפטים** | `lift.json` · `motion-baseline.json` · `index.json` · `alphabet.md` · `coverage.*` · `combos.json` · `lab-data.json` | |

**מה המעטפת עושה (וזה כל מה שהיא עושה):** כפתורים ושלבים · ציור על canvas · שעון-הדמיה (דקה ⇒ צעד) · הצגה: מילישניות ⇒ "ימים · שעות", תוויות עבריות לסטטוס, צבעים. ההתקדמות של רכב על רגל = מרחק שעבר ÷ מחיר-הרגל (המחיר — מ-`shortestPath`).

**איך הדף רץ בלי קבצים שלא בגיט:** `bundle.mjs` אורז ב-rolldown (tree-shaking) רק את 15 הפונקציות שההרכבה בחרה, מהקבצים המקוריים (כולל `inner/gen` שנוצר לפי דרישה) + זמן-הריצה + המניפסט ⇒ `parts.bundle.mjs` (47KB). `--check` נאכף בבדיקה.

**השקילות:** לכל צורך 1–3 קלטי-דוגמה (`samples.json`, 29 מקרים) — הפונקציה מהחבילה מחזירה **בדיוק** מה שהחלק המוכח מחזיר בארגז-החול של קורא-ההתנהגות (ולשילוב — דרך המתכון השמור, `run-combo`). וגם: זמן-הריצה על המודולים עצמם = החבילה.

## 4. כמה זמן לקח

כשעה של סשן אחד (≈12:30–13:35 UTC): ~15 דק׳ קריאה ותכנון, ~10 דק׳ מילה ⇒ 16 ✅ (כולל חילוץ `nearestPoint` וההרצה מחדש של המכונה), ~15 דק׳ זמן-ריצה + חבילה + בדיקה, ~15 דק׳ הדף והצילומים, והשאר שערים ודוח.

## 5. מה הבעלים מרוויח

1. **מוצר מילה.** "מוקד-חלוקה" נכתב כ-16 שורות במילון — והחישובים של מוצר שלם יצאו מהמכונה, כל אחד עם מקור ועם הוכחה. מוצר הבא (ארוחות-שבת לחולים, הסעות לבית-הכנסת, חלוקת מצות) = מילה חדשה + מעטפת-מסך; החלקים כבר קיימים.
2. **שדרוג ישיר לאורביט (לא נגעתי ב-`src/`, רק מצביע):** מודול החלוקה `shop7` מסדר היום את עצירות המתנדב **לפי סדר הלוח** (`volunteerRouteStops`, `src/components/shop7/lib.ts:136` — לולאה על `db.deliveries` כמו שהן) ושולח למפות כרשימה. ההרכבה הזו נותנת: שיבוץ אוטומטי למתנדב הקרוב (הגלקסיה), סדר לפי מרחק, ודרך קצרה (רשת-הסינפסות של דף ההרשמה + הדייקסטרה של בנייה-חכמה) — שלושה חלקים מוכחים, `parts.bundle.mjs` מוכן. מה שחסר לחיבור: קואורדינטות למשפחות (היום יש כתובת בלבד) — הכרעת-בעלים.
3. **אותו דבר ל-escalation:** `shop7` היום לא יודע "מאחר" ו"לא עונה". `escalationState` כבר באורביט (חלקי-האטומים), מוכח, ונבדק כאן על מסירות.
4. **המכונה התחזקה בדרך:** 6 מילים קיבלו "הקרוב" אמיתי; זמן-הריצה הוא השלב הבא של המכונה — מתוכנית מוכחת לקוד שרץ.

## 6. הוכחה

- `npx vitest run catalog` · `npm run verify` — ירוקים (מספרים בהודעת-הסיום).
- **`--check` (14):** core-census · core-b-census · core-c-census · lift · baseline · catalog-build · goals-coverage · core-demo · combiner prove · combine · build · **runtime/bundle** · ensure-gen · atoms-factory (דרך verify).
- **שקילות-המילון:** נבדק צורך-צורך מול צילום-בסיס של HEAD (990 צרכים): 0 ירדו, 6 החליפו חלק (`extreme·geo`, פנימי ⇒ `nearestPoint`), 16 חדשים. מוכחים: 892+57+40 ⇒ 912+52+41.
- **צילומים** (`knowledge/shots/product-distribution-2026-10-14/`, 390×844 ו-1280×800, אפס שגיאות קונסולה): `1-start` · `2-assigned` · `3-routes` · `4-mid` (25 נמסרו, 16 נותרו, מאחרים בשלבים, מתנדב 3 הועבר) · `5-report` · `lab` (16/16, 0 🔎). הסקריפט נכשל אם אין התקדמות/איחור/העברה, או אם נותרו סלים בסוף.
- **פרטיות:** `piiLeak` על ההרכבה, על הדף ועל הדוגמאות — נקי; אין קישורים בדף; "משפחה N" / "מתנדב N" בלבד.

## 7. הרצה מחדש

```bash
node catalog/inner/lib/ensure-gen.mjs
node catalog/scripts/core-c-census.mjs && node catalog/scripts/behavior-probe.mjs --source core-c
node catalog/inner/scripts/lift.mjs && node catalog/scripts/catalog-build.mjs && node catalog/scripts/goals-coverage.mjs
node catalog/combiner/combine.mjs && node catalog/combiner/build.mjs
node catalog/runtime/bundle.mjs
npx vitest run catalog/__tests__/product-distribution.test.ts
node catalog/products/shots.mjs
python3 -m http.server   # ואז /catalog/products/distribution/index.html
```
