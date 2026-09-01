# 📇 Runbook — סנכרון אנשי-קשר ל-Google Contacts (People API)

**מה זה:** כל אנשי-הקשר של הארגון (משפחות · תורמים · מתנדבים) מסונכרנים
אוטומטית ל-Google Contacts שלכם, בקבוצה ייעודית. הסנכרון **אידמפוטנטי** —
כל איש-קשר מזוהה לפי מפתח-פנימי (`clientData.maorKey`), כך שריצה חוזרת
**מעדכנת** את אותו איש-קשר במקום לשכפל. לעולם לא מוחק (איש-קשר שהוסר אצלנו
נשאר ב-Google).

**סטטוס:** התשתית **פרוסה ודורמנטית**. עד שהבעלים מקים חיבור-OAuth חד-פעמי,
הסנכרון-החי כבוי — אך **ייצוא vCard ידני עובד מיד** (הגדרות ← 📚 נתונים ←
📇 סנכרון אנשי-קשר ל-Google ← "⬇ ייצוא vCard").

---

## מסלול א׳ — עובד מיד, בלי הקמה (ייצוא vCard)
1. הגדרות ← 📚 נתונים ← **📇 סנכרון אנשי-קשר ל-Google**.
2. לחצו **⬇ ייצוא vCard** — יורד `maor-contacts.vcf`.
3. ב-[contacts.google.com](https://contacts.google.com) ← **ייבוא** ← בחרו את הקובץ.
   Google מזהה כפילויות; אפשר לאחד. זהו — כל אנשי-הקשר בגוגל.

> להצגת הסעיף באפליקציה: להדליק את ההרחבה `gcontacts` באשף-ההקמה (Builder).

---

## מסלול ב׳ — סנכרון-חי אוטומטי (חלון-בעלים, חד-פעמי)

### 1. Google Cloud — אפליקציית-OAuth + People API
1. [console.cloud.google.com](https://console.cloud.google.com) → הפרויקט `maor-system`.
2. **APIs & Services → Library** → הפעילו **People API**.
3. **OAuth consent screen** → External → מלאו שם-אפליקציה + מייל-תמיכה.
   הוסיפו את ה-scope `https://www.googleapis.com/auth/contacts`.
   הוסיפו את המייל שלכם תחת **Test users**.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   תחת **Authorized redirect URIs** הוסיפו:
   `https://developers.google.com/oauthplayground`
   שמרו את ה-**Client ID** וה-**Client secret**.

### 2. השגת refresh-token (פעם אחת, ב-OAuth Playground)
1. [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
   → גלגל-השיניים (⚙) → סמנו **Use your own OAuth credentials** → הדביקו
   Client ID + Secret.
2. בשדה **Input your own scopes** הזינו:
   `https://www.googleapis.com/auth/contacts` → **Authorize APIs** → אשרו
   בחשבון-Google של הארגון.
3. **Exchange authorization code for tokens** → העתיקו את ה-**Refresh token**.

### 3. הזנת הסודות
- **גלובלי (env של ה-Functions, פעם אחת):**
  `firebase functions:secrets:set GCONTACTS_CLIENT_ID`
  `firebase functions:secrets:set GCONTACTS_CLIENT_SECRET`
- **פר-ארגון (הכספת):** ב-Firestore, מסמך `orgSecrets/<slug>` → שדה
  `gcontactsRefresh` = ה-refresh-token מסעיף 2.
  (לקוח-השורש: ה-slug הוא ה-slug האמיתי של הארגון, לא `default`.)

### 4. פריסה
דרך ה-workflow `deploy-functions.yml` (Actions ידני, או push לענף
`deploy-fn/<target>`). הפונקציות `gcontactsSync` (מתוזמן יומי 04:10) +
`gcontactsSyncNow` (on-demand) יעלו.

### 5. הפעלה
- הדליקו את ההרחבה `gcontacts` (אשף-ההקמה); אופציונלי: הגדירו שם-קבוצה
  (`groupName`) — ברירת-מחדל "מאור — אנשי קשר".
- בהגדרות ← 📇 → **🔄 סנכרן עכשיו ל-Google**. הכפתור קורא ל-gcontactsSyncNow
  עם טוקן-הכניסה שלכם; השרת מאמת מנהל/מייל-על, מריץ People API, ומחזיר
  "N חדשים · M עודכנו".

---

## אבטחה וגבולות
- **סודות לא בקונפיג:** ה-refresh-token חי רק בכספת-השרת (`orgSecrets`), לא
  ב-`config` (שמסתנכרן לענן/גיבוי). ה-`groupName` בלבד בקונפיג (לא-סוד).
- **אימות on-demand:** Bearer ID-token; רק מנהל-הארגון / מייל-על.
- **דורמנטי:** בלי `GCONTACTS_CLIENT_ID`/`SECRET` → הפונקציה יוצאת מוקדם;
  בלי refresh-token לארגון → `skipped:'no-refresh-token'`.
- **אפס-כסף/קבלות** — סנכרון-אנשי-קשר בלבד.

## קבצים
| קובץ | תפקיד |
|------|--------|
| `src/lib/googleContacts.ts` | מנוע-טהור: איסוף, מפתח-יציב, מיפוי People, vCard |
| `functions/gcontactsSync.js` | פונקציית-השרת (People API) + ליבה-טהורה נבדקת |
| `src/components/settings/GContactsSection.tsx` | סעיף-ההגדרות (סנכרן/ייצוא) |
| `src/lib/cloud.ts` → `syncGContacts` | קריאת on-demand עם טוקן-הכניסה |
