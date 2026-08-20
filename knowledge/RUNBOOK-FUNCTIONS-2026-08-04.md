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
