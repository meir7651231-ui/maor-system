<p align="right"><b>עברית</b> · <a href="#contributing-english">English</a></p>

<div dir="rtl">

# תרומה לפרויקט

תודה על העניין. הפרויקט בפיתוח פעיל ובשימוש בפרודקשן, ולכן יש כמה כללים קבועים.

## לפני שמתחילים
- דיווח על באג או בקשת שיפור: דרך תבניות ה-Issues. **חולשת אבטחה — לא ב-Issue ציבורי**, אלא לפי [`SECURITY.md`](SECURITY.md).
- אין כרגע קובץ רישיון. לפני תרומת קוד, פתחו Issue ותאמו.

## סביבה
Node 22 (`.nvmrc`), ואז:

</div>

```bash
npm ci
npm run dev           # http://localhost:5173/?org=demo
npm run verify:fast   # typecheck → lint → test
npm run verify        # + build — the full gate
```

<div dir="rtl">

## כללי עבודה
- **עובדים על ענף**, לא על `main`. כל push ל-`main` מפעיל פריסה לפרודקשן (`.github/workflows/deploy.yml`).
- **שערים אוטומטיים** ב-`.githooks/` (נחמשים ב-`git config core.hooksPath .githooks`): לפני commit רצים typecheck, lint ובדיקות; לפני push רץ build מלא, ו-push ל-`main` נחסם.
- **CI** (`.github/workflows/ci.yml`) מריץ את השער המלא, את בדיקת ה-Rules מול אמולטור ו-`npm audit` על כל PR.
- **הודעות commit** בעברית עם קידומת: `מנוע ·` / `תיקון ·` / `שדרוג ·` / `פער N ·` / `גל N ·`.

## מוסכמות קוד
- **הפרדת טוהר:** לוגיקה ב-`lib.ts` טהור (בלי store ובלי DOM) עם בדיקות יחידה; רכיבים מעליו.
- **באג שתוקן = בדיקת ratchet** שמתעדת את הבאג ושומרת שלא יחזור.
- **מחרוזות UI** עוברות דרך `termOf`, ופיצ'רים חדשים מגודרים ב-`featureOn`. פיצ'ר שאסור שיידלק מעצמו — opt-in מפורש `=== true`.
- **תאריכים:** ISO לועזי במסד; `isoToday` מ-`date-util`, לא `toISOString`.
- **אפס אובדן יכולת:** לא מוחקים יכולת קיימת — משדרגים אותה.
- **כסף:** מוני הקבלות רציפים ולעולם לא יורדים. מודול מבודד לא כותב לתרומות או לקבלות.

## Pull Request
- מלאו את התבנית, כולל שורת **CI על main**.
- קבצי `.github/workflows/` נוגעים בפריסה. שינוי בהם דורש תיאום מראש.

</div>

---

<a id="contributing-english"></a>
## Contributing (English)

- **Bugs / ideas:** use the issue templates. **Security issues:** never in a public issue — see [`SECURITY.md`](SECURITY.md).
- There is no license file yet; please open an issue before contributing code.
- Work on a branch; every push to `main` deploys to production.
- Git hooks in `.githooks/` (enable with `git config core.hooksPath .githooks`) run typecheck + lint + tests before a commit and a full build before a push; pushing to `main` is blocked.
- CI runs the full gate, the Firestore Rules red-team and `npm audit` on every PR.
- Conventions: pure `lib.ts` + unit tests, a ratchet test for every fixed bug, UI strings through `termOf`, features behind `featureOn`, no removal of existing capabilities, receipt counters strictly sequential.
