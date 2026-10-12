# 🌉 מתווך-הקצה של אורביט — "רק הדומיין שלנו, אפס בקשות לגוגל מהסנן"

לקוחות על אינטרנט מסונן (נטפרי/רימון) מגיעים לאתר, אבל הסנן חוסם את הכתובות של
גוגל שהכניסה והסנכרון צריכים. המתווך הוא Cloudflare Worker על תת-דומיין שלנו
(`edge.orbit-il.com`): הטלפון מדבר רק איתו, והוא פונה לגוגל מאחורי-הקלעים.
התכנון המלא, הנימוקים והסיכונים: `knowledge/BUILD-ORDER-FILTERED-2026-10-12.md`.

**כלום לא משתנה עד שמדליקים.** בלי שדה `edgeProxy` בקונפיג — האפליקציה ביט-זהה
להיום. וגם עם השדה — רק מכשיר שנכנס בקישור `?edge=on` עובר דרך המתווך (אלא אם
מוסיפים `"allDevices": true`).

## הפעלה — 5 צעדים

1. **Cloudflare** ← Workers & Pages ← Create ← Worker ← שם: `orbit-edge` ←
   Edit code ← למחוק את התבנית ← להדביק את כל `edge-proxy/worker.js` ← **Deploy**.
2. ב-Worker ← Settings ← Domains & Routes ← Add ← **Custom Domain** ←
   `edge.orbit-il.com`. (הדומיין כבר מנוהל ב-Cloudflare; Cloudflare מוסיף את רשומת-ה-DNS
   לבד. הרשומות של האתר עצמו — `orbit-il.com` — לא נגעות.)
3. **בדיקה מדפדפן רגיל:** `https://edge.orbit-il.com/evil` ⇒ חייב להחזיר **404**
   ("not found") — סימן שה-allowlist עובד. גרסה: בכלי-המפתח (Network) בכל תשובה
   מופיעה הכותרת `X-Orbit-Edge: 2026-10-12.1`.
4. **הדלקה בקונפיג** (שינוי-קוד באישור — PR): להוסיף ל-`public/c/maor-hachesed/config.json`
   (הלקוח החי) ו/או ל-`public/config.json` (אתר-השורש: הרשמות חדשות):
   ```json
   "edgeProxy": { "host": "edge.orbit-il.com" }
   ```
   מיזוג ⇒ הרצת ה-workflow בריפו `orbit-il` (Actions ← Run workflow) ⇒ לוודא ש-
   `https://orbit-il.com/version.json` התחלף.
5. **על הקו המסונן:** לפתוח `https://orbit-il.com/?org=maor-hachesed&edge=on`
   (או `https://orbit-il.com/?edge=on` לאתר-השורש) ⇒ להתחבר ⇒ הנתונים זורמים.
   🩺 "בדיקת תקשורת" מציג עכשיו את "מתווך-הקצה". המכשיר זוכר את הבחירה.
   אם הסנן חוסם גם את `edge.orbit-il.com` — לבקש מחברת-הסינון (נטפרי ‎*3617) לאשר
   את התת-דומיין.

רק אחרי שזה ירוק, ואם רוצים שכל המכשירים של הארגון יעברו דרך המתווך:
`"edgeProxy": { "host": "edge.orbit-il.com", "allDevices": true }`. **מומלץ להשאיר
בלי** — רק המסוננים בקישור; פחות תעבורה ב-Worker (מכסת-חינם: 100K בקשות ליום).

אם בבדיקת-השטח הסנכרון "נתקע" מאחורי הסנן: `"forceLongPolling": true` בתוך אותו שדה.

## לוודא בקונסולת Firebase (פעם אחת)
- Authentication ← Settings ← **reCAPTCHA לאימייל/סיסמה כבוי** (במתווך הוא לא יעבוד).
- App Check ← **Enforcement כבוי** ל-Firestore/Auth.
- אם למפתח-ה-API יש הגבלת-Referrer — `orbit-il.com` ברשימה.
- חשבון Cloudflare עם אימות-דו-שלבי, ו**בלי** Logpush/רישום-גופי-בקשות (במתווך עוברות
  סיסמאות וטוקנים — הקוד עצמו לא רושם כלום).

## כיבוי / חזרה אחורה
- **מכשיר אחד, מיד:** `?edge=off` (נשמר במכשיר). `?edge=auto` מחזיר לברירת-הארגון.
- **כל הארגון:** להסיר את `allDevices` (או את כל `edgeProxy`) מהקונפיג + פריסה.
- **ה-Worker עצמו — אחרון:** כיבויו לפני הקונפיג מנתק מכשירים שעוברים דרכו.

## מה מותר לעבור (וכל השאר = 404)
| נתיב אצל המתווך | יעד |
|---|---|
| `/identitytoolkit.googleapis.com/v1/accounts:{signInWithPassword,signUp,lookup,sendOobCode,update}` · `/v2/passwordPolicy` | כניסה/הרשמה (רק עם מפתח-הפרויקט) |
| `/securetoken.googleapis.com/v1/token` | חידוש-חיבור (רק עם מפתח-הפרויקט) |
| `/google.firestore.v1.Firestore/{Listen,Write}/channel` · `/v1/projects/maor-system/databases/(default)/documents…` | סנכרון — רק הפרויקט `maor-system` |
| `/us-central1-maor-system.cloudfunctions.net/{nedarimPull,solaPull,gcontactsSyncNow}` | פעולות-מנהל |

| קוד | משמעות |
|---|---|
| 404 | נתיב/שיטה/מפתח/פרויקט לא ברשימה — המתווך לא פנה לגוגל |
| 403 | הבקשה הגיעה מאתר אחר (Origin זר) — רק `orbit-il.com` ו-`meir7651231-ui.github.io` |
| 502 | גוגל לא ענה (תקלה זמנית) |

**שינוי מפתח-API / פרויקט / דומיין-האתר:** לעדכן את הקבועים בראש `worker.js`
ולהדביק מחדש (צעד 1). הבדיקות בריפו נכשלות אם הקונפיג הציבורי והמתווך לא מסונכרנים.
