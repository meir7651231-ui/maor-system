# RUNBOOK · הפעלת שרת-ההרחבות (Cloud Functions) — חלון-בעלים

**מה זה:** `functions/` בריפו = השרת של שלוש ההרחבות שנשארו roadmap
(‏SMS · טלפוניית-ימות · גיליון-חי) + השלמת סליקה-מלאה (webhook). הקוד כתוב
ו-deploy-ready; **עד הפריסה — אפס השפעה** (האתר הסטטי לא תלוי בו).

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

## עקרונות שנלעסו
- ‏webhook **לא** רושם תרומה/קבלה ישירות — רק "תשלום-נכנס" לאישור; רציפות
  מוני-R-/D- נשמרת בידי המערכת (החוק הרגולטורי שלנו).
- ‏Rules: `orgs/{slug}/...` כבר מוגן (חברי-הארגון); `incomingPayments`/`smsOutbox`
  נכתבים ע"י Functions (Admin SDK עוקף Rules) ונקראים ע"י חברי-הארגון.
- מחיקת-עלויות: הכול בתוך Free-tier ברמות-השימוש הצפויות; `smsOutbox` מוגבל
  20 הודעות/דקה.
