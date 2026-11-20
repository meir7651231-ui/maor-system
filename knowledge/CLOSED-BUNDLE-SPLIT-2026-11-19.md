# CLOSED · פיצול-הבנדל: 11 מודאלים נטענים-בפתיחה (19.11.2026)

## למה
הבנדל הראשי (ה-JS שכל משתמש מוריד בכל כניסה) הגיע ל-**159,656B gzip = 89% מהתקרה** (180K).
עוד כמה פיצ'רים והוא היה עובר אותה. המטרה: להוריד משקל בלי לשנות שום התנהגות.

## איך נמצא מה כבד
סקריפט-מדידה (vite build + plugin שקורא `chunk.modules`) — מודולים בבנדל-הכניסה לפי gzip:
react-dom ‏~85K (הכרחי) · `home/widgets.tsx` ‏~17K · `App.tsx` ‏~12K · **telephony/lib/*** ‏~26K (מחולל/סימולטור/ולידטור —
נמשך דרך `widgets.tsx`→`nextClosure` ו-`CallerLookup`) · **מודאלים שנפתחים רק בלחיצה**: קופה ‏8K, פלטה ‏7.6K,
קיר-השפעה ‏6K, טיימר ‏3.4K, צ׳אט ‏4.4K, איחוד-כפילויות ‏3.3K, מפת-אזורים ‏2.5K, כרטיס-שיחה ‏2.4K, בדיקת-תקשורת ‏1.9K.

## מה נעשה
- `src/App.tsx`: ‏11 מודאלים עברו מ-`import` סטטי ל-`lazy()` (אותו דפוס שכבר קיים למסכים), וכל שימוש עטוף
  ב-`<Suspense fallback={null}>` נפרד (מודאל שנטען לא מסתיר מודאל אחר פתוח). נבדק לפני: לאף אחד אין קוד
  שרץ בטעינת-המודול (side-effects) ⇒ טעינה מאוחרת לא משנה התנהגות.
  ImpactWall · MoneyTimer · CashRegister · BodyMap · DedupModal · CallerLookup · CommandPalette · NetCheckModal ·
  SupportChatModal · SupportInbox · TeamChatModal.
- `scripts/bundle-budget.mjs`: התקרה **180K ⇒ 150K** (חוזה יורד-בלבד) — הרווח ננעל.

## תוצאה
| | לפני | אחרי |
|---|---:|---:|
| בנדל ראשי (gzip) | 159,656B (89% מ-180K) | **131,548B** (88% מ-150K) |
| חיסכון | | **−28.1KB (−17.6%)** בכל כניסה |

## הוכחות
- `npm run verify` · vitest 3215+23 ירוקים · typecheck · lint.
- ratchet `src/lib/__tests__/bundle-split.test.ts` (23): אין import סטטי של ה-11 ב-App.tsx, כל שימוש עטוף
  ב-Suspense, התקרה ≤150K. **הוכח:** App.tsx הישן מכשיל 22 מתוך 23.
- e2e חדש `e2e/lazy-modals-smoke.mjs` (בסוויטת push של CI): כל מודאל נפתח בדרך האמיתית שלו (hash /
  Ctrl+K / ❓⇒בדיקת תקשורת / `#call=`) ותוכנו מופיע · בטעינת-הבית אף אחד מהם לא נטען מראש · אפס שגיאות-קונסולה ⇒ 10/10.
- סוויטת e2e push המלאה (33 סקריפטים) על ה-build החדש.

## שלב ב׳ (20.11.2026) — מנוע-הטלפוניה יצא מהבית
**השורש:** ‏`home/widgets.tsx` (בבנדל הראשי) ייבא `nextClosure` (שורת "🕯️ הדלקת נרות" בראש הבית) מ-`components/telephony/lib.ts`,
שמייבא את `engine.ts` ⇒ ‏`index.mjs` (מחולל) + `simulate.mjs` + `report.mjs` + ולידטור. ‏`nextClosure` צריך רק את `zmanim.mjs`.

**מה נעשה:**
- `src/lib/telephony/closure.ts` חדש — גשר דק: רק `zmanim.mjs` (+`hebcal`/`config` שהוא עצמו צריך); מ-`engine` רק `import type`.
  גוף-`nextClosure` הועבר כמות-שהוא.
- `components/telephony/lib.ts` מייצא-מחדש את `nextClosure` מהגשר ⇒ ה-API לא השתנה (פאנל-הטלפוניה, בדיקות).
- `home/widgets.tsx` מייבא מהגשר-הדק.
- תקרה 150K ⇒ **130K**.

| | 19.11 בבוקר | אחרי שלב א׳ | **אחרי שלב ב׳** |
|---|---:|---:|---:|
| בנדל ראשי (gzip) | 159,656B | 131,548B | **112,798B** |
| מצטבר | | −17.6% | **−29.4%** |

**הוכחות:** ratchet `src/lib/telephony/__tests__/closure-split.test.ts` — פלט זהה בית-בבית למימוש המקורי מעל engine
ב-**400 ימים רצופים × כל הערים + עיר חסרה/לא-קיימת** (מכסה תשרי ושנה שלמה), בלי telephony ⇒ null, אותה פונקציה דרך
lib.ts, closure.ts בלי ייבוא-ריצה של engine/מחולל/סימולטור, הבית מייבא מהגשר (הוכח: widgets.tsx הישן מכשיל) ·
golden הטלפוניה 677/677 · vitest 3243/3243 · e2e: שורת-הדלקת-הנרות מופיעה בבית (lazy-modals-smoke) + סוויטת push מלאה.

## נשאר
בבנדל: react-dom (~85K לפני דחיסה-משותפת, הכרחי), `home/widgets.tsx`+`homeData.ts`, `App.tsx`. אין עוד "פרי נמוך" מובהק —
המשך = מדידה מחדש לפני כל פיצ'ר כבד.
