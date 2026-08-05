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
 * מאמת סוד-משותף וכותב רשומת-"תשלום-נכנס" — האפליקציה מציגה אותם במסך
 * "💰 תשלומים נכנסים" לאישור-רישום (התרומה/הקבלה נרשמות ע"י המזכירה בקליק —
 * לא אוטומטית, שמירה על רציפות מוני-הקבלות R-/D-).
 * ‏org=root ⇒ הלקוח-הקיים (אוסף-שורש incomingPayments); אחרת orgs/{slug}/…
 */
exports.paymentsWebhook = onRequest({ secrets: ['PAY_SECRET'] }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  if ((req.query.secret ?? '') !== process.env.PAY_SECRET) return res.status(403).send('bad secret');
  const slug = String(req.query.org ?? '');
  if (!/^[a-z0-9-]{2,40}$|^root$/.test(slug)) return res.status(400).send('bad org');
  const { amount, name, phone, reference } = req.body ?? {};
  if (!(Number(amount) > 0)) return res.status(400).send('bad amount');
  const db = getFirestore();
  const col = slug === 'root'
    ? db.collection('incomingPayments')
    : db.collection('orgs').doc(slug).collection('incomingPayments');
  await col.add({
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
 * 📱 sendSmsVia — מתאמי-הספקים (הושלם בגל ד׳ "עד-השרת"): 019sms ו-InforU.
 * מבנה-הבקשות לפי מסמכי-הספקים; אם הספק עדכן endpoint — לתקן כאן בלבד (תפר-יחיד).
 * הבחירה: secret ‏SMS_PROVIDER ('019' ברירת-מחדל / 'inforu').
 */
async function sendSmsVia(provider, apiKey, sender, to, text) {
  if (provider === 'inforu') {
    const r = await fetch('https://uapi.inforu.co.il/SendMessageJson', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: 'Basic ' + apiKey },
      body: JSON.stringify({ Data: { Message: text, Recipients: [{ Phone: to }], Settings: { Sender: sender } } }),
    });
    if (!r.ok) throw new Error('inforu ' + r.status + ': ' + (await r.text()).slice(0, 200));
    return;
  }
  // ברירת-מחדל: 019sms (JSON API)
  const r = await fetch('https://019sms.co.il/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ sms: { user: { username: sender }, source: sender, destinations: { phone: [{ _: to }] }, message: text } }),
  });
  if (!r.ok) throw new Error('019 ' + r.status + ': ' + (await r.text()).slice(0, 200));
}

/**
 * 📱 smsOutbox — כל דקה: שולח הודעות שממתינות ב-smsOutbox (שורש) וב-
 * orgs/{slug}/smsOutbox (collectionGroup תופס את שניהם). האפליקציה כותבת
 * ‏{to, text}; כאן נשלח דרך הספק ומסומן sent/error. מוגבל 20/דקה.
 */
exports.smsOutbox = onSchedule({ schedule: 'every 1 minutes', secrets: ['SMS_API_KEY', 'SMS_PROVIDER', 'SMS_SENDER'] }, async () => {
  const db = getFirestore();
  const pending = await db.collectionGroup('smsOutbox').where('status', '==', 'pending').limit(20).get();
  for (const doc of pending.docs) {
    const { to, text } = doc.data();
    try {
      await sendSmsVia(process.env.SMS_PROVIDER || '019', process.env.SMS_API_KEY || '', process.env.SMS_SENDER || '', String(to), String(text));
      await doc.ref.update({ status: 'sent', sentAt: new Date().toISOString() });
    } catch (e) {
      await doc.ref.update({ status: 'error', error: String(e).slice(0, 500) });
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
 * 📊 sheetsNightly — ייצוא-לילי לגיליון-חי (03:00), הושלם בגל ד׳ "עד-השרת":
 * לכל ארגון-פלטפורמה עם spreadsheetId בקונפיג (integrations.sheets.spreadsheetId,
 * מוזן באשף) — שורת-סיכום יומית (משפחות/תרומות-החודש/מסירות) מתווספת לגיליון.
 * **גבול-המפתח:** ‏secret ‏GOOGLE_SA = ‏JSON של service-account עם הרשאת-Sheets,
 * והבעלים משתף את הגיליון עם מייל-החשבון. עד אז — הפונקציה מדלגת בשקט.
 */
exports.sheetsNightly = onSchedule({ schedule: 'every day 03:00', secrets: ['GOOGLE_SA'] }, async () => {
  if (!process.env.GOOGLE_SA) return; // אין service-account ⇒ דורמנטי
  const { google } = require('googleapis');
  const sa = JSON.parse(process.env.GOOGLE_SA);
  const auth = new google.auth.JWT(sa.client_email, undefined, sa.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
  const sheets = google.sheets({ version: 'v4', auth });
  const db = getFirestore();
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const orgs = await db.collection('platformOrgs').get();
  for (const org of orgs.docs) {
    const cfg = org.data().config ?? {};
    const spreadsheetId = cfg?.integrations?.sheets?.spreadsheetId;
    if (typeof spreadsheetId !== 'string' || !spreadsheetId.trim()) continue;
    try {
      const base = db.collection('orgs').doc(org.id);
      const [fams, sups, dels] = await Promise.all([
        base.collection('families').count().get(),
        base.collection('supporters').get(),
        base.collection('deliveries').get(),
      ]);
      let monthIls = 0;
      for (const s of sups.docs) {
        for (const d of s.data().donations ?? []) {
          if (String(d.date ?? '').startsWith(month) && d.cur !== '$') monthIls += Number(d.amount) || 0;
        }
      }
      const delivered = dels.docs.filter((x) => x.data().status === 'delivered').length;
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId.trim(),
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[today, fams.data().count, monthIls, dels.size, delivered]] },
      });
    } catch (e) {
      console.error('sheetsNightly ' + org.id + ': ' + String(e).slice(0, 300));
    }
  }
});
