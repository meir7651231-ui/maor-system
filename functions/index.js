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
 *   SMTP_URL      — ‏smtps://user:pass@host — לשליחת-מיילים (צרור-הלילה)
 *   MAIL_FROM     — כתובת-השולח המוצגת במיילים
 *   NEDARIM_MOSAD_ID     — מספר-המוסד בנדרים-פלוס (7 ספרות) — למשיכת-עסקאות
 *   NEDARIM_API_PASSWORD — מפתח-API של המוסד (npk_ — סוד; רק השרת נוגע בו)
 *   NEDARIM_ORG          — slug הארגון לרשת-הביטחון האוטומטית (nedarimSyncHourly)
 */
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const { mapPaymentCallback, sanitizeDedupKey } = require('./paymentMap');

initializeApp();

/** אימות-סוד קבוע-זמן (מונע timing-attack) + fail-closed: PAY_SECRET ריק ⇒ שקר.
 * שיתוף עם המשיכה (nedarimPull) דרך export כדי לא לשכפל. */
function secretOk(given, expected) {
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(String(expected ?? ''));
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

// כיוון-יוצא (משיכת-נדרים) — מודול נפרד; נטען בסוף הקובץ (Object.assign(exports,…)).

/** אוסף התשלומים-הנכנסים בתחום הארגון (root=הלקוח-הקיים; אחרת orgs/{slug}/…). */
function incomingCol(db, org) {
  return org === 'root'
    ? db.collection('incomingPayments')
    : db.collection('orgs').doc(org).collection('incomingPayments');
}

/**
 * 💳 paymentsWebhook — חברת-הסליקה קוראת לכאן אחרי חיוב מוצלח.
 * מאמת סוד-משותף וכותב רשומת-"תשלום-נכנס" — האפליקציה מציגה אותם במסך
 * "💰 תשלומים נכנסים" לאישור-רישום (התרומה/הקבלה נרשמות ע"י המזכירה בקליק —
 * לא אוטומטית, שמירה על רציפות מוני-הקבלות R-/D-).
 * ‏org=root ⇒ הלקוח-הקיים (אוסף-שורש incomingPayments); אחרת orgs/{slug}/…
 */
exports.paymentsWebhook = onRequest({ secrets: ['PAY_SECRET'] }, async (req, res) => {
  // נדרים-פלוס (וספקים אחרים) קוראים כ-CallBack — לעיתים GET, לעיתים POST,
  // לעיתים query ולעיתים body. מאחדים את שלושתם ובוררים סובלני-שמות (paymentMap).
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).send('POST/GET only');
  const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
  if (!secretOk(p.secret, process.env.PAY_SECRET)) return res.status(403).send('bad secret');
  const m = mapPaymentCallback(p);
  if (!/^[a-z0-9-]{2,40}$|^root$/.test(m.org)) return res.status(400).send('bad org');
  // פאזה-מודעת-כסף: **חיוב**=Amount חיובי · **זיכוי**=שלילי (מקזז) · **ביטול**=0.
  // קולטים את שלושתם עם kind (במקום 400/דילוג) — הלקוח מקזז/מסמן. תמיד 200 (אין CallBack-כושל).
  const kind = m.amount < 0 ? 'refund' : m.amount === 0 ? 'cancel' : 'charge';
  // eslint-disable-next-line no-unused-vars
  const { secret, ...rawSafe } = p; // המטען-הגולמי בלי הסוד-המשותף — לתיעוד/דיוק-מיפוי
  const db = getFirestore();
  const col = incomingCol(db, m.org);
  const payload = {
    amount: m.amount,
    currency: m.currency, // '₪' | '$' — נדרים Currency 1/2 (בלי זה תרומת-$ מוצגת כ-₪)
    name: m.name, // נדרים שולח ClientName — בלי המיפוי השם היה נכנס ריק
    phone: m.phone,
    email: m.email,
    zeout: m.zeout, // ת"ז — עוזר למזכירה לשייך לתומך קיים
    category: m.category, // Groupe — קטגוריית התרומה (ייעוד)
    kevaId: m.kevaId, // מזהה הו"ק — מסמן שזה חיוב הוראת-קבע (לא חד-פעמי)
    reference: m.reference,
    toremId: m.toremId, // מזהה-תורם נדרים — חיבור-אוטומטי-לכרטיס לפי מפתח
    receipt: m.receipt, // KabalaId — מספר-קבלת-§46 של נדרים → hist[].receipt
    last4: m.last4, // 4 ספרות אחרונות → hist[].last4
    d: m.d, // תאריך-העסקה האמיתי (ISO) → hist[].d — עקבי עם המשיכה (לא זמן-הקליטה)
    at: new Date().toISOString(),
    status: 'pending', // ממתין לחיבור (אוטומטי-לכרטיס / אישור-ידני)
    ...(kind !== 'charge' ? { kind } : {}), // 'refund'/'cancel' — חיוב רגיל ביט-זהה
    raw: JSON.parse(JSON.stringify(rawSafe)),
  };
  // dedup + אי-דריסה: TransactionId ⇒ doc-id דטרמיניסטי משותף עם המשיכה (nedarimSync).
  // בלי TransactionId — נופלים לאסמכתא (reference) כמפתח-דדופ ⇒ CallBack-כפול לא משכפל.
  // create() נכשל אם כבר קיים ⇒ עסקה שכבר תועדה (וייתכן שכבר נרשמה) לא מתאפסת ל-pending.
  // ⚠️ חיטוי-doc-id (21.8): reference מגיע מהספק ויכול להכיל '/' וכד׳ — doc() עם
  // '/' זורק ⇒ 500 ⇒ ה-CallBack (חד-פעמי אצל נדרים!) אובד. sanitizeDedupKey
  // (paymentMap) מחטא ל-[A-Za-z0-9_-], שומר ייחודיות (hash-זנב דטרמיניסטי) ותוחם אורך.
  const tid = String(p.TransactionId ?? p.Transaction ?? '').trim();
  const rawKey = tid || (m.reference ? 'ref-' + m.reference : '');
  const dedupKey = rawKey ? sanitizeDedupKey(rawKey, rawSafe) : '';
  try {
    if (tid) payload.txnId = tid;
    if (dedupKey) {
      await col.doc('nedarim-' + dedupKey).create(payload);
    } else {
      await col.add(payload); // בלי מזהה-עסקה ובלי אסמכתא — id אקראי (ספק אחר / CallBack חלקי)
    }
  } catch (e) {
    // ALREADY_EXISTS (code 6) ⇒ כבר תועד ⇒ אידמפוטנטי (מחזירים ok). שגיאה אחרת ⇒ מפילים.
    if (e && e.code !== 6 && e.code !== 'already-exists') throw e;
  }
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
 * 🗝 כספת פר-ארגון (9.8 — "כל מנהל יש את הסודות שלו"): orgSecrets/{slug}
 * נכתב ע"י מנהל-הארגון מהאפליקציה (Rules: read:false — רק Admin-SDK קורא).
 * סוד-הארגון גובר; ה-secret הגלובלי = נפילה-לאחור לארגונים בלי כספת.
 */
const _orgSecretsCache = new Map();
async function orgSecretsOf(db, slug) {
  if (!slug) return {};
  if (_orgSecretsCache.has(slug)) return _orgSecretsCache.get(slug);
  let out = {};
  try {
    const d = await db.doc('orgSecrets/' + slug).get();
    out = d.exists ? (d.data() ?? {}) : {};
  } catch { /* אין כספת ⇒ הגלובלי */ }
  _orgSecretsCache.set(slug, out);
  setTimeout(() => _orgSecretsCache.delete(slug), 60_000).unref?.();
  return out;
}

/** ה-slug של מסמך-תור (orgs/{slug}/xxx/{id}) או '' לתור-השורש. */
function slugOfQueueDoc(docSnap) {
  const parts = docSnap.ref.path.split('/');
  return parts[0] === 'orgs' && parts.length >= 4 ? parts[1] : '';
}

/**
 * 📱 smsOutbox — כל דקה: שולח הודעות שממתינות ב-smsOutbox (שורש) וב-
 * orgs/{slug}/smsOutbox (collectionGroup תופס את שניהם). האפליקציה כותבת
 * ‏{to, text}; כאן נשלח דרך הספק ומסומן sent/error. מוגבל 20/דקה.
 * ‏9.8: מפתח-הארגון (orgSecrets.smsApiKey) גובר על הגלובלי.
 */
exports.smsOutbox = onSchedule({ schedule: 'every 1 minutes', secrets: ['SMS_API_KEY', 'SMS_PROVIDER', 'SMS_SENDER'] }, async () => {
  const db = getFirestore();
  const pending = await db.collectionGroup('smsOutbox').where('status', '==', 'pending').limit(20).get();
  for (const doc of pending.docs) {
    const { to, text } = doc.data();
    try {
      const sec = await orgSecretsOf(db, slugOfQueueDoc(doc));
      const apiKey = sec.smsApiKey || process.env.SMS_API_KEY || '';
      if (!apiKey) continue; // אין מפתח (ארגוני או גלובלי) — נשאר pending עד שיוגדר
      await sendSmsVia(process.env.SMS_PROVIDER || '019', apiKey, process.env.SMS_SENDER || '', String(to), String(text));
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
  // ‏9.8: ‏?org=slug ⇒ הטוקן של הארגון מהכספת; בלעדיו — הגלובלי (השורש)
  const org = String(req.query.org ?? '');
  if (org && !/^[a-z0-9-]{1,40}$/.test(org)) return res.status(400).send('bad org');
  const sec = org ? await orgSecretsOf(getFirestore(), org) : {};
  const token = sec.yemotToken || process.env.YEMOT_TOKEN || '';
  if (!token) return res.status(503).send('no token');
  const url = new URL('https://www.call2all.co.il/ym/api/' + action);
  url.searchParams.set('token', token);
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'action' && k !== 'org') url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString());
  res.status(r.status).send(await r.text());
});

/**
 * 📅 icsFeed — מנוי-יומן חי (9.8): גוגל/אאוטלוק מושכים מכאן את לוח-הארגון
 * ומתעדכנים לבד. האפליקציה מחשבת את ה-ICS בלקוח (הלוח העברי נשאר שם —
 * מקור-אמת יחיד, כמו הכרעת צרור-הלילה) ומפרסמת ל-icsFeeds/{slug} עם token
 * סודי; כאן רק הגשה. בלי token תקף — 404 אחיד (אין הבחנה קיים/לא-קיים ⇒
 * אי-אפשר למנות ארגונים).
 */
exports.icsFeed = onRequest(async (req, res) => {
  const org = String(req.query.org ?? '');
  const key = String(req.query.key ?? '');
  if (!/^[a-z0-9-]{1,40}$/.test(org) || !/^[a-f0-9]{32,64}$/.test(key)) return res.status(404).send('not found');
  const snap = await getFirestore().collection('icsFeeds').doc(org).get();
  const data = snap.exists ? snap.data() : null;
  if (!data || typeof data.token !== 'string' || data.token !== key || typeof data.ics !== 'string') {
    return res.status(404).send('not found');
  }
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Cache-Control', 'private, max-age=600');
  res.status(200).send(data.ics);
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

/* ═══════════ צרור-הלילה (ROADMAP-100 ‏#1/#3/#9, 5.8.2026) ═══════════ */

/**
 * 📧 mailOutbox — כל דקה: שולח מיילים שממתינים ב-mailOutbox (שורש +
 * orgs/{slug}/mailOutbox — ‏collectionGroup). האפליקציה כותבת {to,subject,text}
 * (קבלות-במייל, תקצירים); כאן נשלח ב-SMTP ומסומן sent/error. מוגבל 20/דקה.
 * ‏SMTP פר-לקוח (orgSecrets.smtpUrl מהכספת); כתובת-השולח (From) נגזרת מה-username
 * של ה-smtpUrl — ‏SMTP_URL/MAIL_FROM הגלובליים = נפילה-לאחור בלבד (לא קיימים כ-secrets).
 */
// הכרעת-בעלים 20.8 'רק של הלקוח': בלי סודות גלובליים — כל ארגון עם smtpUrl משלו
// בכספת (orgSecrets); בלי סוד-גלובלי הפריסה לא דורשת Secret Manager.
exports.mailOutbox = onSchedule({ schedule: 'every 1 minutes' }, async () => {
  const nodemailer = require('nodemailer');
  const db = getFirestore();
  const pending = await db.collectionGroup('mailOutbox').where('status', '==', 'pending').limit(20).get();
  if (pending.empty) return;
  // ‏9.8: ‏SMTP פר-ארגון (orgSecrets.smtpUrl) גובר על הגלובלי; transport ממוטמן פר-URL
  // (אובייקט ולא Map — ratchet-הבידוד של הצרור אוסר קריאות-כתיבה בקטע הזה)
  const transports = Object.create(null);
  const transportFor = (smtpUrl) => (transports[smtpUrl] ??= nodemailer.createTransport(smtpUrl));
  for (const doc of pending.docs) {
    const { to, subject, text } = doc.data();
    try {
      const sec = await orgSecretsOf(db, slugOfQueueDoc(doc));
      const smtpUrl = sec.smtpUrl || process.env.SMTP_URL || '';
      if (!smtpUrl) continue; // אין SMTP (ארגוני או גלובלי) — נשאר pending עד שיוגדר
      // ✉️ כתובת-השולח (21.8): הפונקציה לא מצהירה secrets ⇒ MAIL_FROM תמיד ריק היה
      // שולח מיילים בלי From (ספאם/דחייה). הכרעת-הבעלים "מייל פר-לקוח" ⇒ השולח
      // נגזר מה-smtpUrl של הארגון עצמו: ה-username ב-URL הוא כתובת-המייל של הלקוח
      // (smtpUrl.ts מרכיב עם encodeURIComponent ⇒ decodeURIComponent מחזיר).
      let from = process.env.MAIL_FROM || undefined; // נפילה-לאחור בלבד (לא קיים כ-secret)
      try {
        const u = decodeURIComponent(new URL(smtpUrl).username);
        if (u) from = u;
      } catch { /* smtpUrl לא-URL-תקין — נופלים ל-MAIL_FROM אם הוגדר אי-פעם */ }
      await transportFor(smtpUrl).sendMail({ from, to: String(to), subject: String(subject ?? ''), text: String(text ?? '') });
      await doc.ref.update({ status: 'sent', sentAt: new Date().toISOString() });
    } catch (e) {
      await doc.ref.update({ status: 'error', error: String(e).slice(0, 500) });
    }
  }
});

/**
 * ⏰ remindersNightly — תקציר-בוקר יומי (05:00) לכל ארגון-פלטפורמה שהדליק
 * sms/mail: קשרי-תורם שהגיע יומם (supporters.nextDate ≤ היום) + מסירות-חלוקה
 * שמתוכננות היום וטרם נמסרו. התקציר נכנס לתורים (smsOutbox/mailOutbox) —
 * השליחה בפועל ע"י הפונקציות שלמעלה.
 * גבולות במכוון: אין חישוב לוח-עברי בשרת (יארצייט נשאר בצד-הלקוח — מקור-אמת
 * יחיד ב-hebdate.ts); ארגון מוצפן (מסמכי {enc,iv}) מדולג — השרת לא מפענח.
 */
exports.remindersNightly = onSchedule({ schedule: 'every day 05:00', timeZone: 'Asia/Jerusalem' }, async () => {
  const db = getFirestore();
  const today = new Date().toISOString().slice(0, 10);
  const orgs = await db.collection('platformOrgs').get();
  for (const org of orgs.docs) {
    try {
      const cfg = org.data().config ?? {};
      const smsTo = cfg?.integrations?.sms?.enabled ? String(cfg?.integrations?.sms?.settings?.adminPhone ?? '').trim() : '';
      const mailTo = cfg?.integrations?.mail?.enabled ? String(cfg?.integrations?.mail?.settings?.digestTo ?? '').trim() : '';
      if (!smsTo && !mailTo) continue;
      const base = db.collection('orgs').doc(org.id);
      const [sups, days, dels] = await Promise.all([
        base.collection('supporters').get(),
        base.collection('distributionDays').get(),
        base.collection('deliveries').get(),
      ]);
      // ארגון מוצפן — אין לשרת מה לקרוא (ולא צריך שיהיה)
      if (sups.docs.some((d) => d.data().enc && d.data().iv)) continue;
      const contacts = sups.docs
        .map((d) => d.data())
        .filter((s) => typeof s.nextDate === 'string' && s.nextDate && s.nextDate <= today)
        .map((s) => String(s.name ?? ''));
      const todayDayIds = new Set(days.docs.filter((d) => d.data().date === today).map((d) => d.id));
      const dueDeliveries = dels.docs.filter((d) => todayDayIds.has(String(d.data().dayId ?? '')) && d.data().status !== 'delivered').length;
      if (!contacts.length && !dueDeliveries) continue;
      const lines = ['תקציר-בוקר ' + today];
      if (contacts.length) lines.push('☎ קשרי-תורם שהגיע יומם (' + contacts.length + '): ' + contacts.slice(0, 10).join(', ') + (contacts.length > 10 ? '…' : ''));
      if (dueDeliveries) lines.push('📦 מסירות מתוכננות היום שטרם נמסרו: ' + dueDeliveries);
      const text = lines.join('\n');
      const at = new Date().toISOString();
      if (smsTo) await base.collection('smsOutbox').add({ to: smsTo, text, status: 'pending', at });
      if (mailTo) await base.collection('mailOutbox').add({ to: mailTo, subject: 'תקציר-בוקר — ' + today, text, status: 'pending', at });
    } catch (e) {
      console.error('remindersNightly ' + org.id + ': ' + String(e).slice(0, 300));
    }
  }
});

/**
 * 💾 backupNightly — צילום-לילי (02:30) של כל ארגון-פלטפורמה ל-Storage:
 * ‏backups/{slug}/{date}.json — ‏meta + envelope + 21 אוספי-הישויות, ושומר 30
 * צילומים אחרונים (טבעת כמו ה-IndexedDB המקומי). ארגון שהדליק הצפנת-ענן —
 * המסמכים כבר {enc,iv} ⇒ הצילום מוצפן מלידה; ארגון לא-מוצפן — הצילום באותה
 * רמת-הגנה כמו Firestore עצמו (אותו פרויקט, אותן הרשאות-Admin).
 * ⚠️ הרשימה חייבת לשקף את ENTITY_COLLECTIONS (src/lib/cloud-diff.ts) —
 * נאכף ב-ratchet ‏night-bundle.test.ts.
 */
const BACKUP_COLLECTIONS = [
  'families', 'courses', 'enrollments', 'events', 'rooms', 'teachers', 'supporters',
  'tzCoordinators', 'tzBoxes', 'tzCampaigns', 'tzEvents',
  'shopItems', 'shopProducts', 'shopStores', 'shopCriteria', 'shopAssignments', 'shopEvents', 'shopIntakes',
  'volunteers', 'distributionDays', 'deliveries', 'tasks', 'warehouse',
];
// 🔀 מסלול-B · פיצול-תרומות (21.8): ארגון עם donationSplit שומר את התרומות באוסף
// נפרד orgs/{slug}/donations — **במכוון לא** ב-ENTITY_COLLECTIONS (ולכן לא
// ב-BACKUP_COLLECTIONS, שנשאר ≡ ל-ratchet ‏night-bundle). בלי הגיבוי הנוסף הזה
// צילום-לילה של ארגון-מפוצל היה יוצא בלי תרומות/קבלות — שחזור היה מאבד אותן בשקט.
const EXTRA_BACKUP = ['donations'];
const BACKUP_KEEP = 30;

exports.backupNightly = onSchedule({ schedule: 'every day 02:30', timeZone: 'Asia/Jerusalem' }, async () => {
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const today = new Date().toISOString().slice(0, 10);
  const orgs = await db.collection('platformOrgs').get();
  for (const org of orgs.docs) {
    try {
      const base = db.collection('orgs').doc(org.id);
      const snapshot = { slug: org.id, at: new Date().toISOString(), meta: null, envelope: null, collections: {} };
      const metaDoc = await db.doc('orgs/' + org.id + '/meta/org').get();
      if (metaDoc.exists) snapshot.meta = metaDoc.data();
      const envDoc = await db.doc('orgs/' + org.id + '/_enc/envelope').get();
      if (envDoc.exists) snapshot.envelope = envDoc.data();
      for (const col of [...BACKUP_COLLECTIONS, ...EXTRA_BACKUP]) {
        const snap = await base.collection(col).get();
        if (snap.size) snapshot.collections[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      await bucket.file('backups/' + org.id + '/' + today + '.json').save(JSON.stringify(snapshot), { contentType: 'application/json' });
      // טבעת: מוחקים את העודף מעבר ל-30 הצילומים האחרונים (שמות = תאריכים ⇒ מיון לקסיקוגרפי)
      const [files] = await bucket.getFiles({ prefix: 'backups/' + org.id + '/' });
      const sorted = files.map((f) => f.name).sort();
      for (const name of sorted.slice(0, Math.max(0, sorted.length - BACKUP_KEEP))) {
        await bucket.file(name).delete().catch(() => {});
      }
    } catch (e) {
      console.error('backupNightly ' + org.id + ': ' + String(e).slice(0, 300));
    }
  }
});

// כיוון-יוצא · נדרים (משיכת-עסקאות + רשת-ביטחון) — מודול עצמאי, נטען כאן כדי
// ש-firebase יגלה את exports.nedarimPull / exports.nedarimSyncHourly.
Object.assign(exports, require('./nedarimPull'));

// כיוון-נכנס · Sola Payments (חיווט-כמו-נדרים, 21.8) — משיכת-עסקאות + רשת-ביטחון.
Object.assign(exports, require('./solaPull'));
