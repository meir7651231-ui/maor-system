/**
 * הגנת-מקור · App Check (16.8) — שכבת אנטי-שכפול אמיתית.
 *
 * המטרה: עותק-מגורר של החזית (frontend), שמישהו יארח על דומיין משלו, **לא יוכל
 * לדבר עם ה-Firestore/Auth שלנו**. App Check מצרף לכל בקשת-ענן טוקן-attestation
 * מ-reCAPTCHA v3 שמוכיח שהבקשה הגיעה מהאפליקציה-הרשמית שלנו; Firestore (כשה-
 * Enforcement דלוק בקונסולה) דוחה בקשות בלי טוקן תקין ⇒ הקליפה-המגוררת מתה.
 *
 * דורמנטי-כברירת-מחדל (חוזה-הדגלים של הפרויקט): בלי `firebase.appCheckKey` —
 * **מדולג לחלוטין, ביט-זהה להיום**. הפעלה = הבעלים מזין מפתח-reCAPTCHA באשף
 * ומדליק Enforcement בקונסולה (RUNBOOK-ANTICLONE). נכשל-רך: כל שגיאה נבלעת כדי
 * שלא לחסום את האפליקציה (App Check הוא הקשחה, לא נתיב-קריטי).
 *
 * מדולג ב-Playwright (navigator.webdriver) — כמו רישום-ה-PWA — כדי שסוויטות-
 * הדפדפן לא ינסו לטעון reCAPTCHA.
 */
import type { FirebaseApp } from 'firebase/app';

/** מפעיל App Check אם הוגדר מפתח-אתר. no-op בטוח אחרת. */
export function initAppCheck(app: FirebaseApp, appCheckKey?: string): void {
  if (!appCheckKey) return; // דורמנטי — אין מפתח ⇒ אין App Check (ביט-זהה להיום)
  if (typeof navigator !== 'undefined' && navigator.webdriver) return; // Playwright — דילוג
  try {
    // dynamic import — firebase/app-check נשאר מחוץ לנתיב-הטעינה כשההגנה כבויה
    void import('firebase/app-check')
      .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckKey),
          isTokenAutoRefreshEnabled: true,
        });
      })
      .catch(() => {
        /* נכשל-רך — App Check הוא הקשחה, לא חוסם את האפליקציה */
      });
  } catch {
    /* סביבה בלי dynamic-import — מדלגים */
  }
}
