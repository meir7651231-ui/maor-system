# 🧲 המצרף · The Combiner

**לבעלים, בשלוש שורות:**
1. כותבים מילה אחת ("חמנייה"). המילון אומר מה היא עושה, צורך אחרי צורך: פועל + חומר, בלי עולם.
2. לכל צורך המכונה מחפשת חלקים מכל הפרויקטים, בטבעות: חלק אחד ⇒ זוג ⇒ שלישייה. **נחשב רק מה שהוכח בהרצה**; חלק אחד עושה את הפעולה, וכל השאר מתאמי-סוג (ממיר/מעצב/מפצל/מצרף/מנרמל).
3. **"לא חסר כלום"** (הכרעת-בעלים): כל צורך מסתיים ב-✅ מוכח בהרצה · ✅ מוכח — חלק פנימי · ✅ מוכח — שילוב · ⛏️ נמצא בקוד — בכרייה (רק `NEW:x`) · 🔎 עוד לא נחפר (עם מקומות לחפור). בקשות-החפירה ב-`dig/*.json`; המחולל הוא הצרכן האחרון שלהן.
4. **🧩 שילוב** (14.10.2026): לפני 🔎 המכונה מנסה שני חלקים מוכחים (P1 → P2) — מפרק ⇒ מחבר ⇒ מאמת: הפונקציה המורכבת מתקבלת **רק** אם היא עוברת את חוקי הפועל n/n (`combine.mjs`). סדר: חלק אחד > חלק פנימי > שילוב.

> `missing/` שונה ל-`dig/` (14.10.2026) — אותם שדות + `status` + `places[]`.

```bash
node catalog/combiner/cli.mjs "חמנייה"            # טבלה
node catalog/combiner/cli.mjs "חמנייה" --json     # JSON
node catalog/combiner/cli.mjs --random 7          # מילה אקראית מהמילון (זרע ⇒ דטרמיניסטי)
node catalog/combiner/cli.mjs "חמנייה" --save     # מתכון ⇒ catalog/recipes/<id>.json (נהיה חלק חדש)
node catalog/combiner/prove.mjs                   # השופט ⇒ proofs.json   (--check)
node catalog/combiner/combine.mjs                 # מכונת-השילוב ⇒ combos.json + recipes/combo-*.json   (--check) — לפני build
node catalog/combiner/build.mjs                   # lab-data.json + dig/*.json   (--check)
node catalog/combiner/cli.mjs "דרקון" --dig       # כותב את בקשות-החפירה של מילה אחת
node catalog/combiner/shots.mjs [--out <תיקייה>]  # צילומי lab.html + דף-הליבות ⇒ knowledge/shots/combiner-2026-10-14/
npx vitest run catalog/__tests__/combiner.test.ts
```

הדף: `catalog/lab.html`. הוא צריך שרת (fetch + מודולים), למשל `python3 -m http.server` משורש-הריפו ואז `/catalog/lab.html#w=חמנייה`.

| קובץ | מה |
|---|---|
| `core.mjs` | הליבה. טהורה ודטרמיניסטית, רצה ב-node ובדפדפן: אינדקס · טבעות · דירוג · הרכבה · "מה יצא" · חסרים · מתכונים · פרטיות |
| `verbs.mjs` | האלפבית (`catalog/verbs.json`) + מיפוי הפעלים של המילון הזמני (`gate⇒validate`…) + מתייג סטטי לפעלים שאין באלפבית (`sun-position`) |
| `judge.ts` → `proofs.json` | השופט: חוקי-המאמת של 8 החלקים, חוקי-שמש, הלוך-חזור שעה⇄דקות, וזרימות פלט⇒קלט |
| `laws.mjs` | חוקי-פועל על דוגמה אמיתית: דוגמה שסותרת את החוק מורידה את התווית |
| `load.mjs` | טעינה מהדיסק: מקורות · קורא-ההתנהגות · מילון-המטרות · fixtures · מתכונים |
| `fixtures/goals.json` | 13 מטרות-בדיקה. החמנייה של הבעלים (`owner: true`) גוברת על המילון |
| `dig/` | בקשות-חפירה: `{verb, material, takes, gives, example, status, places[]}` |
| `leads.json` | מקומות ידועים בקוד (file:line, אומתו ביד) — מוצגים תחת ⛏️/🔎 |
| מקורות | `load.mjs` טוען **כל** `catalog/sources/*.json` ו-`catalog/behavior/*.json` (גם `core`, `core-b`, `inner-*`). `NEW:x` ⇒ x כש-`verbs.json` מכיר את x. חלק עם `parent` ⇒ "נמצא בתוך"; `origins[]` ⇒ כל פרויקטי-המקור |

## 🧩 מכונת-השילוב (`combine.mjs`)

| | |
|---|---|
| מועמדים | קודם רמזי `verb-recipes.json` (פועל/סוג לכל שלב), ואז ליבה מוכחת ל-V + מתאם-סוג מוכח (`adapterRole`). עד 24 לזוג (פועל·חומר), דטרמיניסטי |
| צורות | `chain` — P2(P1(a…), b…) · `pair` — P2(P1(x…), P1(y…)) (לפועל דו-מקומי; `at` = הקלט של P1 שמשחק את "הדבר") |
| רצים | אורביט · core · core-b · inner-* (מודולי-gen בריפו) — בלי שכפולים, אותו ארגז-חול |
| אימות | `probePart` עם **רק** הפועל V, אותו זרע ⇒ n/n. נכשל ⇒ נרשם החוק הראשון שנכשל + הסיבה (`combos.json › tried`) |
| שמירה | `catalog/recipes/combo-<V>-<M>.json` — מנגנון-המתכונים: חלק אחד שמוכח ל-V; בתצוגה נפרש לשני החלקים + "עבר N/N חוקים של <פועל>" |
| חומר-לפי-חוק | צורך V·M כש-M הוא בדיוק סוג שהפועל עצמו מקבל/נותן (`ownKinds`; בפעלי-התנועה — הקלט השני) ⇒ כל חלק מוכח ל-V מתאים לו. גם החומר שהקורא מדד (`material`) נספר |
