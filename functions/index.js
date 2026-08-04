/**
 * Cloud Functions — שלד "עד-המפתח" (INTEGRATIONS גל ג׳, 4.8.2026).
 *
 * ⚠️ הקוד כאן **לא פרוס** עד שהבעלים: (1) מדליק Blaze בקונסולת-Firebase,
 * ‏(2) `firebase deploy --only functions`, ‏(3) מזין secrets (למטה).
 * עד אז — אפס השפעה על המערכת (האתר הסטטי לא יודע שהתיקייה קיימת).
 * ‏Runbook מלא: knowledge/RUNBOOK-FUNCTIONS-2026-08-04.md
 *
 * ‏secrets (firebase functions:secrets:set):
 *   SMS_API_KEY   — מפתח ספק-ה-SMS (019 / InforU)
 *   YEMOT_TOKEN   — טוקן ימות-המשיח
 *   PAY_SECRET    — הסוד המשותף לאימות webhook מחברת-הסליקה
 */
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

/**
 * 💳 paymentsWebhook — חברת-הסליקה קוראת לכאן אחרי חיוב מוצלח.
 * מאמת סוד-משותף וכותב רשומת-"תשלום-נכנס" ל-orgs/{slug}/incomingPayments —
 * האפליקציה (ארגון-ענן) תציג אותם לאישור-רישום (התרומה/הקבלה נרשמות במערכת
 * ע"י המזכירה בקליק — לא אוטומטית, שמירה על רציפות מוני-הקבלות R-/D-).
 */
exports.paymentsWebhook = onRequest({ secrets: ['PAY_SECRET'] }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  if ((req.query.secret ?? '') !== process.env.PAY_SECRET) return res.status(403).send('bad secret');
  const slug = String(req.query.org ?? '');
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return res.status(400).send('bad org');
  const { amount, name, phone, reference } = req.body ?? {};
  if (!(Number(amount) > 0)) return res.status(400).send('bad amount');
  await getFirestore().collection('orgs').doc(slug).collection('incomingPayments').add({
    amount: Number(amount),
    name: String(name ?? ''),
    phone: String(phone ?? ''),
    reference: String(reference ?? ''),
    at: new Date().toISOString(),
    status: 'pending', // המזכירה מאשרת-רושמת במערכת
  });
  res.status(200).send('ok');
});

/**
 * 📱 smsOutbox — כל דקה: שולח הודעות-SMS שממתינות ב-orgs/{slug}/smsOutbox.
 * האפליקציה כותבת {to, text}; הפונקציה שולחת דרך ספק (019/InforU) ומסמנת sent.
 * ‏TODO-מפתח: להשלים את קריאת-הספק לפי החשבון שנפתח (גוף-הבקשה משתנה בין ספקים).
 */
exports.smsOutbox = onSchedule({ schedule: 'every 1 minutes', secrets: ['SMS_API_KEY'] }, async () => {
  const db = getFirestore();
  const pending = await db.collectionGroup('smsOutbox').where('status', '==', 'pending').limit(20).get();
  for (const doc of pending.docs) {
    const { to, text } = doc.data();
    try {
      // === גבול-המפתח: קריאת-הספק (להשלים אחרי פתיחת חשבון) ===
      // await fetch('https://api.provider.co.il/send', { method:'POST', headers:{...SMS_API_KEY...}, body: JSON.stringify({to, text}) });
      void to; void text;
      await doc.ref.update({ status: 'sent', sentAt: new Date().toISOString() });
    } catch (e) {
      await doc.ref.update({ status: 'error', error: String(e) });
    }
  }
});

/**
 * 📞 yemotProxy — פרוקסי לימות-המשיח (אין CORS אצלם ⇒ הדפדפן לא יכול ישירות).
 * האפליקציה קוראת עם action+params; הפונקציה מוסיפה את הטוקן ומעבירה.
 */
exports.yemotProxy = onRequest({ secrets: ['YEMOT_TOKEN'] }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  const action = String(req.query.action ?? '');
  if (!/^[A-Za-z]{2,40}$/.test(action)) return res.status(400).send('bad action');
  const url = new URL('https://www.call2all.co.il/ym/api/' + action);
  url.searchParams.set('token', process.env.YEMOT_TOKEN ?? '');
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'action') url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString());
  res.status(r.status).send(await r.text());
});

/**
 * 📊 sheetsNightly — ייצוא-לילי של נתוני-ארגון-ענן לגיליון (03:00).
 * ‏TODO-מפתח: service-account עם הרשאת-Sheets + מזהה-הגיליאון פר-ארגון
 * (orgs/{slug}/meta/sheets.spreadsheetId). עד אז הפונקציה רק סופרת (בטוחה).
 */
exports.sheetsNightly = onSchedule('every day 03:00', async () => {
  const db = getFirestore();
  const orgs = await db.collection('platformOrgs').get();
  for (const org of orgs.docs) {
    // === גבול-המפתח: googleapis Sheets append לפי spreadsheetId של הארגון ===
    void org.id;
  }
});
