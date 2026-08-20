# סנכרון נדרים-פלוס ↔ מאור — דו-כווני מלא דרך המפתחות (19.8.2026)

**ענף:** `claude/firebase-functions-config` (כל שרשרת-נדרים חיה כאן).
**ארגון-יעד:** `mavr-hchsd` (מאור החסד). **מוסד נדרים:** 7001532.

## התמונה המלאה (שני הכיוונים)

```
                      ┌──────────────── נדרים-פלוס ────────────────┐
   כיוון-נכנס  ◄──────┤ GetHistoryJson (עסקאות) · GetTormimCsv (תורמים) │
                      └────────────────────────────────────────────┘
   כיוון-יוצא  ──────►  matara.pro/nedarimplus/online/?mosad=… (Amount/ClientName)
```

### כיוון-נכנס (נדרים → מאור) — הושלם

1. **Webhook** (`functions/index.js` · `paymentsWebhook`) — כל חיוב בזמן-אמת → `incomingPayments`
   (doc-id דטרמיניסטי `nedarim-<tid>`). מיפוי ב-`paymentMap.js`.
2. **משיכת-עסקאות** (`functions/nedarimPull.js` · `nedarimHistory.js`) — רשת-ביטחון
   (ה-webhook = ניסיון-אחד). `GetHistoryJson`, דדופ לפי `reference`==TransactionId,
   cursor. **מועשר (19.8):** כל שורה נושאת גם `d` (תאריך-אמת ISO), `receipt`
   (KabalaId — מספר-קבלת-§46 של נדרים), `last4`, `toremId`.
3. **משיכת-תורמים** (`?donors=1`) — `GetTormimCsv` (**UTF-16LE TSV**), פרסור טהור
   `nedarimDonors.js` (מיפוי לפי כותרות; ת"ז-אפסים ⇒ ריק; מזהה-תורם = מפתח-שיוך).
   ‏1445 תורמים ב-`orgs/mavr-hchsd/nedarimDonors/{toremId}`.
4. **מנוע-הסנכרון הטהור** `src/lib/nedarimSync.ts` · `planNedarimSync(existing,donors,charges)`:
   - **התאמה לפי מפתחות** (סדר-עדיפות): `extId(ToremId)` → `idNum(ת"ז)` → `phone` →
     `email` → `name+city`. **אותם מפתחות כמו מנוע-הדדופ** (עקביות ⇒ 100%).
   - תורם-תואם ⇒ **העשרת-כרטיס** (מילוי-שדות-ריקים + קביעת `extId`; בלי דריסת-מלאים).
   - תורם ללא-התאמה ⇒ **כרטיס-חדש** (מזהה דטרמיניסטי `sup-ned-<ToremId>`).
   - כל עסקה ⇒ `Supporter.hist[]` של הכרטיס התואם. **אפס-אובדן:** אין התאמה כלל
     ⇒ כרטיס נוצר (חיוב לא הולך לאיבוד).
   - **דדופ-חיובים לפי `txn`** ⇒ אידמפוטנטי (הרצה-חוזרת לא משכפלת).
   - **כל סוגי-התרומות:** חד-פעמי · הו"ק (`kevaId`) · ₪/$; חיוב-אפס/שלילי מדולג.
   - **הכרעת-רו"ח ("נדרים"):** נדרים מנפיק את קבלת ה-§46 ⇒ העסקאות נרשמות כ-`hist[]`
     (היסטוריית-חיוב), **לא** כתרומות/קבלות. `count/ils/usd` השמורים (אינווריאנט-הענן,
     קבלות-בלבד) **לא נגעים**; הצבירה-המוצגת כוללת `hist` דרך `supporterAggregates`.
5. **חיווט:** `fetchNedarimDonors` (`cloud.ts`) · `applyNedarimSync` (store, יישום-אטומי
   + `logAudit`) · **`NedarimSyncModal`** — תצוגה-מקדימה (חדשים/עודכנו/חיובים/כפולים/
   סכומים/הו"ק) + **אישור דו-שלבי** לפני כתיבה. כניסה: כפתור **🔄 סנכרון מנדרים**
   ב-`SupportersView` (מגודר `payments` + ענן-מחובר).

### כיוון-יוצא (מאור → נדרים) — הושלם (מילוי-מראש, בלי API)

הבעלים ביקש: לא מפתח-API ולא הזנת-קישור ע"י התורם — **"המערכת לוחצת על הכפתור/הקישור
המתאים"** ומעבירה סכום/שם. `src/lib/payLink.ts` בונה קישור לעמוד-הסליקה של הארגון
(`payUrl` בקונפיג, `ManageModal`/`SupporterDetail`). **מודע-נדרים (19.8):** מארח
`matara.pro/nedarimplus` ⇒ מילוי ב-`Amount`/`ClientName` (PascalCase — מה שנדרים
באמת קורא), לא `amount`/`name` הכלליים. תבנית `{amount}`/`{name}` עדיין נתמכת.

## מפתחות-השיוך (הליבה של "100% התאמה")

מנוע-הדדופ (`src/lib/dedup.ts`) שודרג ("ללמוד ממשפחות, להתאים לתורמים"):
- `findSupporterDupGroups` — קיבוץ לפי `phone/email/idNum/extId/name+city` (Union-Find).
- `mergeSupportersGroup(keeper,losers[])` — מיזוג-קבוצה אטומי (פאריטי `mergeFamilies`).
- `SUP_DUP_FIELDS` + `mergeSupportersByFields` — מיזוג שדה-שדה (הכסף לא נבחר-ידנית).
- `Supporter.extId?` — מזהה-ספק-סליקה (ToremId) — additive, מפתח-שיוך חוזר.
- UI: `SupDedupModal` קיבל 🧩 מיזוג-לפי-שדות + 🗑 הסרה (מגודר `settings.dedup.fields`).

## סודות / הפעלה (צד-הבעלים)

- Secrets מוגדרים: `PAY_SECRET`, `NEDARIM_MOSAD_ID=7001532`, `NEDARIM_API_PASSWORD` (npk_).
  **חסר:** `NEDARIM_ORG=mavr-hchsd` (דרוש ל-`nedarimSyncHourly` האוטומטי).
- **נותר לבעלים אחרי השינוי הזה:**
  1. `firebase deploy --only functions:nedarimPull` (השדות המועשרים d/receipt/last4/toremId).
  2. פתיחת `…/nedarimPull?org=mavr-hchsd&secret=<PAY_SECRET>&reset=1` — משיכה-מחדש עם השדות.
  3. פתיחת `…/nedarimPull?org=mavr-hchsd&secret=<PAY_SECRET>&donors=1` — רענון רשימת-התורמים.
  4. במאור: **תורמים → 🔄 סנכרון מנדרים** → בדיקת התצוגה-המקדימה → אישור.
     (הפצת-הלקוח = push→main→gh-pages; רענון-דף אצל הלקוח.)
- אזהרת-בטיחות: הסנכרון כותב לכרטיסי-התומכים החיים — **תמיד** דרך התצוגה-המקדימה
  והאישור. אין כתיבה שקטה.

## בדיקות (ratchet)

- `functions/nedarimHistory.test.mjs` — תאריך dd/MM/yyyy→ISO + שדות-hist (+2).
- `src/lib/__tests__/sup-dedup.test.ts` — מפתחות ת"ז/extId + מיזוג-קבוצה/שדות (7).
- `src/lib/__tests__/nedarim-sync.test.ts` — התאמה/יצירה/אפס-אובדן/אידמפוטנטיות/
  מטבע/הו"ק (7).
- `integrations-wave3.test.ts` — payLink מודע-נדרים (Amount/ClientName) (+1).
- שער מלא ירוק: 1659 tests · build.

## פאזה-מודעת-כסף — זיכויים/ביטולים (20.8.2026, נבנתה)

לפי תיעוד-נדרים (מתועד ב-`functions/nedarimHistory.js`): **חיוב** = Amount חיובי ·
**זיכוי** = Amount שלילי (+"זיכוי עסקה:" בהערות) · **ביטול** = Amount 0. עד עכשיו
שלושתם דולגו ⇒ הצבירה-המוצגת נופחה-נטו (זיכוי שלא קוזז). עכשיו:
- **שרת** (`nedarimHistory.js` + `index.js`): קולט את שלושת הסוגים עם שדה `kind`
  (`refund`/`cancel`; חיוב-רגיל בלי-שדה = ביט-זהה). ה-webhook כבר לא מחזיר 400.
- **מנוע** (`nedarimSync.ts`): זיכוי (Amount<0) ⇒ **שורת-hist שלילית** שמקזזת את
  `supIls`/`supUsd` (הכרעת "לכולל", נטו) — בלי `withNedarimHok` (מוגן `amount>0`)
  ובלי מונה-recurring; `refundsApplied` נספר. ביטול (Amount 0) ⇒ מסומן טופל, **לא**
  ל-hist ולא יוצר-כרטיס. זיכוי בלי כרטיס-תואם ⇒ נשאר pending (לא כרטיס-שלילי).
  `supCount` ממילא סופר חיובי-בלבד ⇒ זיכוי לא מנפח ספירה/RFM.
- **UI**: מסך-הסנכרון מציג "זיכויים (קוזזו)" + "ביטולים (סומנו)"; רשימת-התשלומים
  מתייגת ↩️ זיכוי / 🚫 ביטול. ratchets: `nedarim-sync.test.ts` (קיזוז/ביטול/הגנת-הו"ק) +
  `nedarimHistory.test.mjs` (kind) + הגנת-מקור.

## נותר (הגדרת-היקף-עתידית)

- `NEDARIM_ORG` + פריסת `nedarimSyncHourly` (רשת-ביטחון אוטומטית שעתית).
- `#84` (רישום-בקליק תשלום→תרומה עם קבלת-§46 של **מאור**) — לא רלוונטי כל עוד נדרים
  מנפיק את הקבלה; יופעל רק אם הבעלים יעביר את הנפקת-הקבלה למאור.
- **קישור-זיכוי-לחיוב-המקורי** (reconciliation מדויק לפי "זיכוי עסקה: <tid>" בהערות)
  — כרגע הזיכוי מקזז את הכרטיס בכללותו (נכון לצבירה); שיוך-לחיוב-הבודד = אימות מול
  דגימת-זיכוי אמיתית (`?peek=1`) כשתהיה.
