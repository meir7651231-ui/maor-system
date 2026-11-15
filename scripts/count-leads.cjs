/**
 * W1-S7 · ספירת לידים — **קריאה בלבד** (אפס כתיבה/מחיקה). מדפיס מספרים בלבד, בלי שמות/טלפונים.
 * מאיר מריץ בעצמו (Admin SDK + התחברות gcloud):
 *   1. cd functions && npm ci
 *   2. gcloud auth application-default login
 *   3. GOOGLE_CLOUD_PROJECT=maor-system node ../scripts/count-leads.cjs 2026-10-22
 * הערות-מבנה (מהקוד): בקשת-הרשמה **נמחקת** באישור/דחייה ⇒ platformRequests = ממתינות בלבד;
 * בקשה שאושרה = מסמך platformOrgs עם createdAt. ללידים ולבקשות **אין שדה "טופל/קיבל שיחה"**.
 */
const path = require('node:path');
const req = require('node:module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');

const since = process.argv[2] || '2026-10-22';
if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error('תאריך בפורמט YYYY-MM-DD');
initializeApp();
const db = getFirestore();
const HANDLED_KEYS = ['handled', 'contacted', 'called', 'done', 'status'];

function tally(docs, dateKey) {
  let total = 0, sinceN = 0, noDate = 0, handled = 0;
  for (const d of docs) {
    const v = d.data();
    total++;
    const at = typeof v[dateKey] === 'string' ? v[dateKey] : '';
    if (!at) { noDate++; continue; }
    if (at.slice(0, 10) >= since) {
      sinceN++;
      if (HANDLED_KEYS.some((k) => k in v)) handled++;
    }
  }
  return { total, since: sinceN, noDate, withHandledField: handled };
}

(async () => {
  const [leads, reqs, orgs] = await Promise.all([
    db.collection('platformLeads').get(),
    db.collection('platformRequests').get(),
    db.collection('platformOrgs').get(),
  ]);
  const liveOrgs = orgs.docs.filter((d) => !d.data().deleted);
  console.log(JSON.stringify({
    since,
    platformLeads: tally(leads.docs, 'at'),
    platformRequests_pending: tally(reqs.docs, 'at'),
    platformOrgs_created: tally(liveOrgs, 'createdAt'),
  }, null, 2));
  process.exit(0);
})().catch((e) => { console.error(String(e)); process.exit(1); });
