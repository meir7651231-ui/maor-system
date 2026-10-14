# ▶️ זמן-הריצה · The Runtime (PRODUCT, 14.10.2026)

**לבעלים, בשלוש שורות:**
1. עד היום המכונה עצרה בתוכנית מוכחת: "לצורך הזה — החלק הזה". מכאן התוכנית נהיית **פונקציות שאפשר לקרוא להן**.
2. לכל צורך — פונקציה שמריצה את **החלק המוכח עצמו**, מהקוד המקורי שלו; שילוב (🧩) רץ באותו חיבור שהמאמת בדק.
3. החלקים של מוצר נארזים לקובץ סטטי אחד (`catalog/products/<id>/parts.bundle.mjs`), כך שהדף רץ בדפדפן בלי שום קובץ שלא בגיט.

| קובץ | מה |
|---|---|
| `runtime.mjs` | טהור (דפדפן + node): `makeRuntime(assembly, parts)` ⇒ `{n1: fn, n2: fn, …}`. צורות: single · on · chain · pair · graph — אותו חיבור כמו `combine.mjs` (composeChain / compose('pair') / composeOn / composeGraph). בלי שורת-חישוב משלו |
| `manifest.mjs` | node: ההרכבה של מילה (`assemble`) ⇒ מניפסט: לכל צעד — איזה קובץ ואיזה ייצוא רצים (ליבה · אורביט · `inner/gen`), כמה קלטים, ומקורות-מוצא (פרויקט · קובץ:שורה). שילוב נושא את המתכון השמור |
| `bundle.mjs` | node: לכל מוצר ב-`PRODUCTS` ⇒ `assembly.json` + `parts.bundle.mjs` (rolldown, tree-shaking — רק מה שההרכבה בחרה). `--check` |
| `proven.mjs` | node: אותו מניפסט, כל צורך רץ **כמו שהוכח** — בארגז-החול (`loadRunners`+`callerFor`) או דרך המתכון (`comboFunction`). לבדיקת-השקילות. `provenExtras` — אותו דבר לכלי-המדידה |

**PRODUCT-V2 (14.10.2026):** גרף יכול להכיל **לולאה** (`graph.mjs` — חיווט בלבד: אותם חלקים מוכחים בכל סיבוב, המצב עובר הלאה) — כך נמצאו «מסדר מסלול» (השכן-הקרוב ⇒ 2-opt), «משבץ עד התקרה» ו«מתזמן בחלונות». ו**כלי-מדידה** (`PRODUCTS[].extras` ב-`bundle.mjs`): חלק מוכח אחד, נבחר ביד בשמו ובתפקידו, לכל מספר שהמסך מציג — `extras()` בחבילה, עם "נמצא ב:". דוח: `knowledge/CLOSED-PRODUCT-V2-2026-10-14.md`.

```bash
node catalog/runtime/bundle.mjs            # כותב catalog/products/distribution/{assembly.json, parts.bundle.mjs}
node catalog/runtime/bundle.mjs --check    # יציאה 1 אם לא מעודכן
npx vitest run catalog/__tests__/product-distribution.test.ts
node catalog/products/shots.mjs            # צילומי המוצר + lab.html ⇒ knowledge/shots/product-v2-2026-10-14/
```

```js
import { runtime, ASSEMBLY } from './parts.bundle.mjs';
const need = runtime();            // n1…n19 של «מוקד-חלוקה»
need.n2(volunteers, family);       // המתנדב הקרוב (nearestPoint — הכוכב-הקרוב-לעכבר של הגלקסיה)
need.n5({ points, near: 3 }, a, b) // הדרך הקצרה: רשת-הסינפסות ⇒ דייקסטרה של בנייה-חכמה
need.n17(volunteer, families)      // מסלול ממוטב: השכן-הקרוב ⇒ 2-opt (שילוב-גרף, 60/60)
extras().pct(base, saved)          // אחוז — חלק מוכח (buildWallData.retention)
```

**גבול:** שרשרת-מתאמים של טבעת 2–3 (חלק + מתאם-סוג שלא דרך שילוב) עוד לא נתמכת — המניפסט זורק הודעה ברורה. ב«מוקד-חלוקה» אין כזו.
