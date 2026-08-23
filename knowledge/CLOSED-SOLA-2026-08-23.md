# CLOSED · חיווט Sola Payments מקצה-לקצה + אימות-התאמה מלא (23.8.2026)

## מה נסגר
"יש חשבון תתחיל לעבוד ותתחיל לחווט כמו נדרים" → משיכת עסקאות מסולה (Cardknox
white-label) לתור-האישור, בתבנית-נדרים המלאה, **מאומתת מול נתוני-אמת**.

## שרשרת ה-PR-ים (כולם squash ל-main + פריסה דרך deploy-fn/sola)
- ‏#342 המנוע (solaReport.js טהור + solaPull.js) · ‏#343/#346 גשר-כספת/כתובת-חשופה
- ‏#347/#348 אימות (SUPER_ADMIN_EMAILS ב-functions/.env; ‏email_verified הוסר)
- ‏#349 form-urlencoded (השער בולע JSON) · ‏#350/#351 חלון-שנה+debug-עד-המסך
- ‏#352 פרוסות ≤90 יום (מגבלת-100 של השער) · ‏#354 פתיחת xReportData-ארוז + 🧹 איפוס
- ‏#355 **מטבע ברירת-מחדל '$'** (הכרעת-בעלים "לפי דולר"; שקל רק על ILS מפורש)
- ‏#357 **נפילת-כספת דינמית**: root סורק orgSecrets ומקבל מגירה-יחידה-עם-מפתח;
  ריבוי ⇒ שגיאה מפורשת. הצצה מדווחת drawers/vault/rootRows (בלי ערכים!)
- ‏#358 **סינון xVoid='1'** (שטח-אמת: מכירה מבוטלת נשארת Approved!) + ratchet שורה-אמיתית
- ‏#360 **runSolaAudit (?audit=1) קריאה-בלבד** + ‏SOLA_ORG=mavr-hchsd (סנכרון-שעתי חי)

## 💎 עובדות-שטח (מאומתות מול השער האמיתי — הצצות #26/#29)
- **הארגון-החי של סולה הוא `mavr-hchsd`** — הכספת ב-orgSecrets/mavr-hchsd והתור
  ב-orgs/mavr-hchsd/incomingPayments (‏rootRows=0). לא 'maor-hachesed'!
- שורת-הדוח: ‏`xResponseResult` (Approved/Error) ולא xResult · ‏`xAmount` בלי
  xAuthAmount · **אין xCurrency בכלל** (⇒ '$') · תאריך אמריקאי M/D/YYYY ·
  ‏`xVoid`/`xVoidable` דגלים · ‏xToken/xCustom01 קיימים (לא נשמרים).
- ‏multi-arg console.log מודפס ריק ב-functions:log — תמיד מחרוזת-אחת.

## ✅ אימות-ההתאמה (ריצה #29, ‏23.8 00:33 UTC)
| | שער (365 יום) | תור mavr-hchsd |
|---|---|---|
| שורות-גולמיות | 723 | — |
| נדחו (Error/Declined) | 171 | — |
| מבוטלות (xVoid) | 0 | — |
| **זכאיות** | **552** | **552** |
| **סכום** | **$185,800** | **$185,800** |
| טווח | 2025-08-25→2026-08-20 | זהה |
| חסרות/עודפות | — | **0 / 0** |
סטטוסים בתור: 300 handled · 252 pending ("למה 252" = המסך מציג pending בלבד).
`match:true` — סנכרון מלא, הכול בדולרים.

## אינווריאנטים (ratchets ב-functions/solaReport.test.mjs — 9/9)
- solaPull כותב **רק** incomingPayments (status:'pending', ‏receipt:'' — סולה
  לא מנפיקה §46; קבלה רק באישור-מנהל במאור).
- runSolaAudit קריאה-בלבד (אפס כתיבות-Firestore בגוף).
- דדופ doc-id `sola-<xRefNum>` + קריאה-לפני-כתיבה (handled לא נדרס).
- הצצה/audit לא חושפים ערכי-מפתח לעולם (שמות-מגירות + בוליאני בלבד).

## פתוח (הכרעת-בעלים/רו"ח)
- מיזוג חיוב-סולה לכרטיס: hist-בלבד או קבלת-D במאור? (סולה לא מנפיקה §46.)
- בדיקת-שיבוץ: מיזוג-יחיד על תורם מוכר לפני פתיחת שיבוץ המוני.

עוגן-ידע קודם: `knowledge/SOLA-PAYMENTS-2026-08-21.md` · ‏Runbook: `RUNBOOK-FUNCTIONS-2026-08-04.md`.
