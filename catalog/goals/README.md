# 🎯 מילון המטרות · Goals Dictionary

**לבעלים, בשלוש שורות:**
1. כאן כתוב, לכל מילה של כל יום ("חמנייה", "רמזור", "דרקון"), **מה הדבר הזה עושה** — מפורק להתנהגויות קטנות.
2. כל התנהגות = **פועל אחד** (מה עושים) על **חומר אחד** (על מה) — בלי שום קשר לעולם שממנו באה. "הדרקון מתרגז בשלבים" ו"תזכורת שמתגברת" הם אותו פועל: `escalate`.
3. המכונה המחברת מחפשת בקטלוג חלק שעושה את הפועל הזה על החומר הזה. **היום — לכל 940 ההתנהגויות יש פועל באלפבית ויש לו חלק בקטלוג** ([מד-הכיסוי](./coverage.md)). `NEW:` שמור לפועל שבאמת אין בשום מקום.

## איך משתמשים · How it is used

```
"אני רוצה חמנייה"  ⇒  goals/nature.json  ⇒  needs[]  ⇒  לכל need: (verb, material)
                    ⇒  המחבר מחפש בקטלוג (catalog/sources/*.json) חלק שעושה verb על material
                    ⇒  נמצא ⇒ מחברים · לא נמצא / NEW: ⇒ רשימת-חסר למחולל
```

- **word** — המילה (מקף במקום רווח: `רכבת-הרים`). ייחודית בכל המילון.
- **does** — משפט אחד: מה הדבר עושה.
- **needs** (4–8) — התנהגויות לפי הסדר: `behavior` (בעברית, מהעולם) · `verb` (בלי עולם) · `material` (סוג מהחוזה, `catalog/contract.md` §3) · `detail` (לא חובה).
- **verb** — מזהה מ-`catalog/verbs.json` (60 פעלים; הרשימה ב-`schema.json` נבדקת מול האלפבית), או `NEW:<id>` לפועל שעוד אין בשום מקום.
- הקבצים דטרמיניסטיים: עולם לכל קובץ, מילים ממוינות (סדר-תווים), ‏`JSON.stringify(doc, null, 2)` + שורה ריקה. נבדק ב-`catalog/__tests__/goals.test.ts`.

## במספרים

**171 מילים** · 15 עולמות · 940 התנהגויות · **0 פעלי-NEW** · כיסוי **775 ⇒ 940** (82.4% ⇒ 100%) — [`coverage.md`](./coverage.md) (`node catalog/scripts/goals-coverage.mjs`).

| קובץ | עולם | מילים | התנהגויות |
|---|---|---:|---:|
| `animals.json` | בעלי חיים | 13 | 74 |
| `body-health.json` | גוף ובריאות | 11 | 58 |
| `celebrations.json` | חגיגות | 11 | 61 |
| `city.json` | עיר | 11 | 62 |
| `food.json` | אוכל | 10 | 53 |
| `games.json` | משחקים | 12 | 68 |
| `home.json` | בית | 11 | 59 |
| `machines.json` | מכונות | 13 | 73 |
| `music.json` | מוזיקה | 10 | 54 |
| `nature.json` | טבע | 12 | 66 |
| `sports.json` | ספורט | 10 | 55 |
| `toys.json` | צעצועים | 13 | 73 |
| `vehicles.json` | כלי תחבורה | 11 | 59 |
| `weather-space.json` | מזג אוויר וחלל | 12 | 64 |
| `workplace.json` | מקום עבודה | 11 | 61 |

## מה היה חסר — ונמצא (14.10.2026)

כשהמילון נכתב, 144 התנהגויות (15%) צריכות 14 פעלים שלא היו באלפבית — כמעט כולם "זמן שזורם". הבעלים: **"יש הכל"**. המפקד הראשון הריץ רק לוגיקה עסקית וקפץ על קוד-המסך, האנימציה, האפקטים, התלת-ממד, הקול והניתוב — ושם בדיוק גרים הזמן והתנועה. כל 14 נמצאו בקוד שלנו (חוץ מ"קופץ"), חולצו לליבה בלי עולם (`catalog/core/<פועל>.mjs`) ונכנסו לאלפבית עם חוקים ומוטנטים. דוח: `knowledge/CLOSED-MINED-VERBS-2026-10-14.md`.

**המיפוי לאלפבית הסופי:** `NEW:<x>` ⇒ `<x>` (14 הפעלים) · `gate` ⇒ `validate` · `minmax` ⇒ `extreme` · `rank-tiers` ⇒ `tier` · `search` ⇒ `lookup` · `frame-swap` ⇒ `freeze` · `daily-snapshot` ⇒ `bucket` · `round-robin` ⇒ `rotate` · `route-channel` ⇒ `route` · `tolerate-failure` ⇒ `tolerate` · `hub-relay` ⇒ `relay` · `sun-position` ⇒ `sun-position` (פועל חדש — חולץ מלוח-הזמנים של פרנס׳לע).

| # | פועל | כמה פעמים | נמצא ב (הטוב ביותר) |
|---:|---|---:|---|
| 1 | `decay` | 27 | אבק-הזהב של פרנס׳לע מאט מחיכוך (`Ambient.tsx`) |
| 2 | `countdown` | 24 | שעון-הכסף במצב טיימר (`MoneyTimer.tsx`) |
| 3 | `accumulate` | 21 | קופת-צדקה עד "ריקון" (`useApp.ts`, `tzedaka/lib.ts`) |
| 4 | `sun-position` | 21 | זמני-היום של פרנס׳לע, NOAA (`zmanimBoard.ts`) |
| 5 | `oscillate` | 17 | לב-הגלקסיה פועם (`SupportersGalaxy.tsx`) |
| 6 | `random` | 12 | mulberry32 של המאמת (`atoms/verify/gen.ts`) |
| 7 | `gravity` | 11 | קונפטי נופל (המחולל, `motion-family.html`) |
| 8 | `move-along-path` | 9 | מטבע שעף לחריץ בעקומה (`coinFx.ts`) |
| 9 | `orbit` | 6 | כוכבי-התורמים בגלקסיה (`SupportersGalaxy.tsx`) |
| 10 | `shortest-path` | 5 | שרשרת-המחברים של בנייה-חכמה, דייקסטרה (`install_engine.dart`) |
| 11 | `spread` | 4 | "כל מה שמגיעים אליו ב-N קפיצות" (בנייה-חכמה, `hop_graph.dart`) |
| 12 | `sample` | 3 | כל דף עשירי בש"ס (הישיבה, `mefarshim.py`) |
| 13 | `echo` | 2 | PING ל-Redis ומדידת זמן-תגובה (14kk, `api-gateway/server.js`) |
| 14 | `follow` | 2 | כדור-המוח נגרר אחרי העכבר (`three-scene.ts`) |
| 15 | `bounce` | 1 | 🔴 **לא נמצא בשום מקום** — נבנה חדש, מינימלי |
