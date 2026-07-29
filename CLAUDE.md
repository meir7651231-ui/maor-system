# מאור החסד (maor-system) — הוראות לכל סשן

## ענף עבודה
`claude/architect-minimum-100-percent-ctk3w5` — כל עבודה על ענף זה.
אין push ל-`main` ללא אישור מפורש מהמשתמש. Deploy ל-GitHub Pages רץ אוטומטית מכל push ל-`main` (`.github/workflows/deploy.yml`).

## מה המערכת
מערכת ניהול מלאה לעמותה (React 19 + TypeScript + Vite + Zustand + Firebase opt-in): משפחות ובני משפחה, חוגים ושיבוצים, כרטיסיות ותשלומים, נוכחות, לוח שנה עברי-לועזי, יומני חדרים, תורמים ותרומות (כולל מעקב עי"ן), דוחות והגדרות. RTL, עברית, white-label רב-ארגוני דרך `config.json`.

## דרך העבודה — 100% זה המינימום

**כל commit חייב לעבור את השרשרת המלאה:**
```bash
npm run verify   # typecheck + lint (0 אזהרות!) + test (479+) + build
```
- **lint נקי לחלוטין** — 0 אזהרות oxlint. אזהרה חדשה = מתקנים לפני commit.
- **טסטים** — כל טסט קיים ירוק. פיצ׳ר חדש / באג מתוקן = טסט חדש שמוכיח.
- **אין `any` חדש, אין שגיאות נבלעות** בנתיבי persist/cloud.
- שינוי במודל הנתונים (`types/domain.ts`) ⇒ בדיקת migration ב-`persist.ts` (DB_VERSION).
- commit מוקדם ותכוף — הקונטיינר זמני; עבודה לא דחופה הולכת לאיבוד.

## שרשרת כלים
| פקודה | מה עושה |
|---|---|
| `npm run verify` | השער המלא: typecheck → lint → test → build |
| `npm run dev` | שרת פיתוח vite |
| `npm run e2e` | toggle-matrix בדפדפן אמיתי (פורט 4190, דורש `npm run build` קודם) |
| `node e2e/demo-walkthrough.mjs` | מעבר דמו מלא + צילומים ל-`e2e/shots/` |
| `node e2e/launch-readiness.mjs` | מסעות משתמש + אכיפת 0 שגיאות קונסולה |
| `node scripts/make-demo.mjs` | מחולל `public/demo.json` דטרמיניסטי |

Chromium ל-e2e: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (ניתן לדרוס עם `CHROME_PATH`).

## ⚠️ מצב ידוע: e2e חסום ע"י מסך התחברות ענן
`public/config.json` מכיל `firebase` ⇒ `cloud.enabled` ⇒ המערכת עולה למסך "כניסה למערכת" — ושלושת סקריפטי ה-e2e (שנכתבו לפני שכבת הענן) נעצרים שם. **הטסטים (vitest) לא מושפעים.**
פתרון עתידי מוסכם-לתכנון: הזרקת `maor_org_config` ללא `firebase` בתחילת כל סקריפט e2e (localStorage גובר על `config.json` — ראה `src/lib/config.ts`), או פרופיל בדיקה ייעודי. עד אז — `verify` הוא השער; אל תדווח על e2e כעובר.

## קבצי ליבה
| קובץ | תפקיד |
|---|---|
| `src/store/useApp.ts` | Zustand — כל המצב ופעולות העסקים (אין מוטציה במקום; הכול דרך `setDb`) |
| `src/store/persist.ts` | התמדה: localStorage + IndexedDB + snapshots + הצפנה at-rest |
| `src/store/cloudSync.ts` · `src/lib/cloud*.ts` | סנכרון Firebase opt-in (diff/merge טהורים) |
| `src/types/domain.ts` | מודל הנתונים + DB_VERSION (כרגע 5) |
| `src/lib/config.ts` | טעינת config ארגוני: localStorage ← `./config.json` |
| `src/App.tsx` | שלד: שערים (הצפנה → login ענן → נעילה), ניווט, overlays |

## כללים קשיחים
- IDs רק דרך `nextId(prefix)`; מוני קבלות `receiptSeq`/`donationSeq` — אסור לדלג.
- מחרוזות UI בעברית כפי שהן; מונחים ניתנים לשינוי דרך `terms` בלבד.
- אין להוסיף ספריות בלי הצדקה ארכיטקטונית מפורשת.
- `e2e/shots/` הוא תוצר ריצה — לא נכנס ל-git (ב-.gitignore).
