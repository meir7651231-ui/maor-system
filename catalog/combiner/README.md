# 🧲 המצרף · The Combiner

**לבעלים, בשלוש שורות:**
1. כותבים מילה אחת ("חמנייה"). המילון אומר מה היא עושה, צורך אחרי צורך: פועל + חומר, בלי עולם.
2. לכל צורך המכונה מחפשת חלקים מכל הפרויקטים, בטבעות: חלק אחד ⇒ זוג ⇒ שלישייה. היא מריצה מה שאפשר ומסמנת "מוכח".
3. מה שאין לו חלק נכנס לרשימת "חסר" כבקשת-בנייה מוכנה למחולל (`missing/*.json`). זה צעד ה-Waze.

```bash
node catalog/combiner/cli.mjs "חמנייה"            # טבלה
node catalog/combiner/cli.mjs "חמנייה" --json     # JSON
node catalog/combiner/cli.mjs --random 7          # מילה אקראית מהמילון (זרע ⇒ דטרמיניסטי)
node catalog/combiner/cli.mjs "חמנייה" --save     # מתכון ⇒ catalog/recipes/<id>.json (נהיה חלק חדש)
node catalog/combiner/prove.mjs                   # השופט ⇒ proofs.json   (--check)
node catalog/combiner/build.mjs                   # lab-data.json + missing/*.json   (--check)
node catalog/combiner/shots.mjs                   # צילומי lab.html ⇒ knowledge/shots/combiner-2026-10-14/
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
| `missing/` | בקשות-בנייה: `{verb, material, takes, gives, example}` |
