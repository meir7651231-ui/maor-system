# RUNBOOK · הפעלת שרת-ההרחבות (Cloud Functions) — חלון-בעלים

**מה זה:** `functions/` בריפו = השרת של שלוש ההרחבות שנשארו roadmap
(‏SMS · טלפוניית-ימות · גיליון-חי) + השלמת סליקה-מלאה (webhook). הקוד כתוב
ו-deploy-ready; **עד הפריסה — אפס השפעה** (האתר הסטטי לא תלוי בו).

## ⚡ פריסה מדורגת (20.8) — הדרך המומלצת

אומת 20.8: ‏Blaze פעיל, ‏Rules מפורסמים, הפונקציות **לא פרוסות** (icsFeed=404),
הקוד נטען תקין (10 פונקציות) והטסטים ירוקים (30/30). ‏⚠️ ‏`deploy --only functions`
על **הכול** ייכשל כשסוד מוצהר חסר (חוק Functions v2) — לכן מדורג:

```bash
npm i -g firebase-tools && firebase login
cd maor-system   # תיקיית הריפו

# ── שלב 1 · בלי סודות — מדליק מיד תזכורות-בוקר, גיבוי-לילי ומנוי-ICS ──
cd functions && npm install && cd ..
firebase deploy --project maor-system \
  --only functions:icsFeed,functions:remindersNightly,functions:backupNightly
# (גיבוי-לילי דורש Storage דלוק בקונסולה — Build ← Storage ← Get started)

# ── שלב 2 · מייל-קבלות אוטומטי — שני סודות ──
firebase functions:secrets:set SMTP_URL   # smtps://user:app-password@smtp.gmail.com:465
firebase functions:secrets:set MAIL_FROM  # כתובת-השולח המוצגת
firebase deploy --project maor-system --only functions:mailOutbox

# ── שלב 3 · לפי ספק, כשרלוונטי ──
# סליקה:  PAY_SECRET                            → functions:paymentsWebhook
# נדרים:  NEDARIM_MOSAD_ID + NEDARIM_API_PASSWORD (+PAY_SECRET)
#                                               → functions:nedarimPull,functions:nedarimSyncHourly
# ‏SMS:    SMS_API_KEY + SMS_PROVIDER + SMS_SENDER → functions:smsOutbox
# ימות:   YEMOT_TOKEN                            → functions:yemotProxy
# גיליון: GOOGLE_SA                              → functions:sheetsNightly
```

אימות אחרי שלב 1: ‏`https://us-central1-maor-system.cloudfunctions.net/icsFeed`
בדפדפן — כל תשובה שאינה 404 = פרוס.

## צעדי-הבעלים (פעם אחת)
1. **Blaze:** קונסולת Firebase ← ⚙️ Usage and billing ← Modify plan ← Blaze
   (תשלום-לפי-שימוש; בהיקפים שלנו — שקלים בודדים בחודש, יש Free-tier נדיב).
2. **כלי-הפריסה:** במחשב עם Node —
   `npm i -g firebase-tools && firebase login`
3. **secrets** (רק מה שרלוונטי):
   ```
   firebase functions:secrets:set PAY_SECRET     # סוד-משותף ל-webhook הסליקה
   firebase functions:secrets:set SMS_API_KEY    # מפתח הספק (019/InforU)
   firebase functions:secrets:set SMS_PROVIDER   # '019' (ברירת-מחדל) או 'inforu'
   firebase functions:secrets:set SMS_SENDER     # שם/מספר-השולח שאושר אצל הספק
   firebase functions:secrets:set YEMOT_TOKEN    # טוקן ימות-המשיח
   firebase functions:secrets:set GOOGLE_SA      # JSON של service-account (גיליון-חי)
   firebase functions:secrets:set SMTP_URL       # smtps://user:pass@host — שליחת-מיילים (צרור-הלילה)
   firebase functions:secrets:set MAIL_FROM      # כתובת-השולח המוצגת (למשל receipts@org.org)
   ```
4. **פריסה:** מתיקיית הריפו —
   `cd functions && npm install && cd .. && firebase deploy --only functions`

## מה כל פונקציה עושה (וגבול-המפתח שלה)
| פונקציה | תפקיד | מה נשאר להשלים אחרי פתיחת-החשבון |
|---|---|---|
| `paymentsWebhook` | חברת-הסליקה מדווחת חיוב ⇒ נכתב ל-`orgs/{slug}/incomingPayments` לאישור-המזכירה (מוני-הקבלות לא נגעים אוטומטית!) | להזין את כתובת-ה-webhook אצל חברת-הסליקה: `https://<region>-<project>.cloudfunctions.net/paymentsWebhook?org=<slug>&secret=<PAY_SECRET>` |
| `smsOutbox` | שולח הודעות מ-`orgs/{slug}/smsOutbox` כל דקה | קריאת-הספק (TODO מסומן בקוד — משתנה בין 019/InforU) |
| `yemotProxy` | פרוקסי-CORS לימות-המשיח | טוקן בלבד |
| `sheetsNightly` | ייצוא-לילי לגיליון פר-ארגון-ענן | service-account + spreadsheetId פר-ארגון (TODO מסומן) |
| `mailOutbox` (צרור-הלילה #1) | שולח מיילים מ-`orgs/{slug}/mailOutbox` כל דקה (קבלות-לתורם, תקצירים) | ‏SMTP_URL + MAIL_FROM — כל ספק-SMTP (Gmail-App-Password / SendGrid / דומיין) |
| `remindersNightly` (צרור-הלילה #3) | תקציר-בוקר 05:00 (שעון-ישראל) פר-ארגון: קשרי-תורם שהגיע-יומם + מסירות-היום ⇒ לתורי sms/mail. יעדים: ‏`sms.adminPhone` / ‏`mail.digestTo` באשף | אין — עובד ברגע שהתורים חיים; ארגון-מוצפן מדולג (השרת לא מפענח); בלי לוח-עברי בשרת |
| `backupNightly` (צרור-הלילה #9) | צילום-לילי 02:30 של כל ארגון ל-Storage ‏`backups/{slug}/{date}.json` (meta+envelope+21 אוספים), טבעת 30 צילומים | להדליק Storage בקונסולה (ברירת-מחדל bucket); ארגון עם הצפנת-ענן ⇒ הצילום מוצפן מלידה |

## עקרונות שנלעסו
- ‏webhook **לא** רושם תרומה/קבלה ישירות — רק "תשלום-נכנס" לאישור; רציפות
  מוני-R-/D- נשמרת בידי המערכת (החוק הרגולטורי שלנו).
- ‏Rules: `orgs/{slug}/...` כבר מוגן (חברי-הארגון); `incomingPayments`/`smsOutbox`
  נכתבים ע"י Functions (Admin SDK עוקף Rules) ונקראים ע"י חברי-הארגון.
- מחיקת-עלויות: הכול בתוך Free-tier ברמות-השימוש הצפויות; `smsOutbox` מוגבל
  20 הודעות/דקה.

## עדכון 21.8 — מייל פר-לקוח בפועל, יעדי-workflow חדשים, ו-Rules ממתינים לבעלים
- **From נגזר מהלקוח עצמו:** ‏`mailOutbox` כבר לא מסתמכת על ‏`MAIL_FROM` גלובלי
  (שלא קיים כ-secret — הכרעת-הבעלים "מייל פר-לקוח בלבד" ⇒ מיילים יצאו **בלי
  From** ונפלו לספאם/נדחו). כתובת-השולח נגזרת עכשיו מה-`smtpUrl` של הארגון
  (ה-username ב-URL = כתובת-המייל שהלקוח הזין בכספת; ‏`lib/smtpUrl.ts` מרכיב עם
  ‏encodeURIComponent ⇒ ‏decodeURIComponent בשרת). ‏`SMTP_URL`/`MAIL_FROM`
  הגלובליים = נפילה-לאחור בלבד ואינם נדרשים לפריסה.
- **יעדי-workflow חדשים נגישים מה-Actions UI** (‏`deploy-functions.yml`):
  ‏`logs` (לוגי-המתוזמנות בלי לפרוס) · ‏`indexes` (פריסת firestore.indexes.json) ·
  ‏`rules` (פריסת firestore.rules — **פעולת-בעלים מפורשת בלבד**). ה-case-ים היו
  קיימים אך חסרו מרשימת-הבחירה ⇒ לא היו ניתנים-להפעלה מהאתר.
- **גיבוי-לילה כולל את אוסף-התרומות הנפרד:** ‏`backupNightly` מגבה עכשיו גם את
  ‏`orgs/{slug}/donations` (מסלול-B, ‏donationSplit) דרך ‏`EXTRA_BACKUP` —
  ‏`BACKUP_COLLECTIONS` נשאר ≡ ל-‏ENTITY_COLLECTIONS (ratchet).
- **חיטוי מפתח-דדופ ב-webhook:** ‏reference עם '/' כבר לא מפיל את ‏paymentsWebhook
  ב-500 (ה-CallBack של נדרים חד-פעמי — תשלום היה אובד); ‏`sanitizeDedupKey`
  ב-‏paymentMap.js (דטרמיניסטי, שומר-ייחודיות).
- **⚠️ שינוי-Rules ממתין לפרסום-בעלים:** ‏firestore.rules שבריפו הורחב —
  הבריחה של הארגון-השורש ב-‏icsFeeds/‏teamChats מכסה עכשיו גם ‏slug
  ‏'maor-hachesed' (הלקוח-החי), לא רק ‏'default'. **לא פורסם** — ייכנס לתוקף רק
  בפרסום-ה-Rules הבא של הבעלים (יעד ‏`rules` ב-workflow או ‏firebase deploy
  ‏--only firestore:rules).
