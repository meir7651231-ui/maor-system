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

## נשאר (שלב ב׳, לא בוצע)
`telephony/lib/*` (~26K לפני דחיסה-משותפת) עדיין בבנדל — נמשך ע"י `home/widgets.tsx` (`nextClosure`) ו-`src/lib/telephony/engine.ts`
שמייבא גם את הסימולטור. פיצול = להפריד את `nextClosure`/`zmanim` מהמחולל/סימולטור (`telephony/lib.ts` דק לבית).
נוגע במנוע-הטלפוניה (golden של 677 בדיקות) ⇒ אשכול נפרד.
