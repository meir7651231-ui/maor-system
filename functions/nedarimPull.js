/**
 * כיוון-יוצא · נדרים-פלוס — משיכת היסטוריית-עסקאות (GetHistoryJson) → תשלומים-
 * נכנסים, + רשת-ביטחון אוטומטית. מודול עצמאי: index.js טוען אותו ב-
 * `Object.assign(exports, require('./nedarimPull'))` כדי ש-firebase יגלה את
 * הפונקציות. הלוגיקה הטהורה (מיפוי-שורות) ב-`nedarimHistory.js` (נבדקת ביחידה).
 *
 * רשת-ביטחון: ה-webhook הוא "ניסיון-אחד-בלבד" (מסמך נדרים) — אם מאור לא היה זמין
 * ברגע החיוב, העסקה אבדה. המשיכה מכסה: כל עסקה מאז ה-cursor האחרון נמשכת ונכתבת.
 *
 * דדופ **מבוסס-שאילתה** (reference==TransactionId) ⇒ מה שה-webhook כבר תפס לא
 * משוכפל — **בלי תלות בשיטת-ה-id של ה-webhook** (עובד גם מול webhook ותיק). בנוסף
 * doc-id דטרמיניסטי `nedarim-<tid>` מונע כפילות בין ריצות-משיכה.
 *
 * מגבלת-נדרים: 20 פניות/שעה ⇒ תקרת-עמודים נוקשה.
 * secrets: NEDARIM_MOSAD_ID · NEDARIM_API_PASSWORD (npk_, סוד) · NEDARIM_ORG · PAY_SECRET.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');
const { planHistoryWrites } = require('./nedarimHistory');
const { parseDonorsTsv } = require('./nedarimDonors');

function incomingCol(db, org) {
  return org === 'root'
    ? db.collection('incomingPayments')
    : db.collection('orgs').doc(org).collection('incomingPayments');
}
function syncCol(db, org) {
  return org === 'root'
    ? db.collection('nedarimSync')
    : db.collection('orgs').doc(org).collection('nedarimSync');
}

async function fetchNedarimHistory(lastId, maxId) {
  const body = new URLSearchParams({
    Action: 'GetHistoryJson',
    MosadId: process.env.NEDARIM_MOSAD_ID || '',
    ApiPassword: process.env.NEDARIM_API_PASSWORD || '',
    MaxId: String(maxId),
  });
  if (lastId) body.set('LastId', String(lastId));
  const resp = await fetch('https://matara.pro/nedarimplus/Reports/Manage3.aspx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('nedarim: תשובה לא-JSON — ' + text.slice(0, 200));
  }
  // נדרים מחזיר מערך; חלק מהתשובות עוטפות ב-{Transactions:[…]} — סובלנות.
  return Array.isArray(json) ? json : json.Transactions || json.data || [];
}

/** איפוס-משיכה (opt-in): מחיקת שורות-המשיכה הקודמות (source==pull) + ה-cursor,
 * לפני משיכה-מחדש — כדי למשוך הכל שוב עם המפה המעודכנת (שמות). שורות-webhook נשמרות. */
/** משיכת רשימת-התורמים כ-CSV (GetTormimCsv). שים לב: השדה הוא MosadNumber (לא MosadId). */
/** משיכת רשימת-התורמים — בייטים גולמיים (הקידוד הוא Windows-1255, לא UTF-8!). */
async function fetchNedarimDonorsBytes() {
  const body = new URLSearchParams({
    Action: 'GetTormimCsv',
    MosadNumber: process.env.NEDARIM_MOSAD_ID || '',
    MosadId: process.env.NEDARIM_MOSAD_ID || '',
    ApiPassword: process.env.NEDARIM_API_PASSWORD || '',
    ToMail: '0',
  });
  const resp = await fetch('https://matara.pro/nedarimplus/Reports/Manage3.aspx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return Buffer.from(await resp.arrayBuffer());
}

/** פענוח בטוח לפי שם-קידוד; מחזיר '' אם הקידוד לא נתמך בסביבה. */
function tryDecode(buf, enc) {
  try { return new TextDecoder(enc).decode(buf); } catch { return ''; }
}

function donorsCol(db, org) {
  return org === 'root' ? db.collection('nedarimDonors')
    : db.collection('orgs').doc(org).collection('nedarimDonors');
}

/** משיכת רשימת-התורמים ואחסונם (doc-id=מזהה-תורם) — צד-הלקוח יוצר מהם כרטיסי-תורם. */
async function runNedarimDonorsPull(org) {
  const db = getFirestore();
  const buf = await fetchNedarimDonorsBytes();
  const text = tryDecode(buf, 'utf-16le') || tryDecode(buf, 'windows-1255') || tryDecode(buf, 'utf-8');
  const donors = parseDonorsTsv(text);
  const col = donorsCol(db, org);
  let n = 0;
  for (let i = 0; i < donors.length; i += 400) {
    const batch = db.batch();
    for (const d of donors.slice(i, i + 400)) {
      if (!d.toremId) continue;
      batch.set(col.doc(d.toremId), { ...d, at: new Date().toISOString() });
      n++;
    }
    await batch.commit();
  }
  return { donors: n };
}

/** רשימת-התורמים כטקסט נקי — Windows-1255 (נפילה ל-UTF-8). */
async function fetchNedarimDonorsCsv() {
  const buf = await fetchNedarimDonorsBytes();
  return tryDecode(buf, 'windows-1255') || tryDecode(buf, 'utf-8');
}

async function clearPullRows(db, col, cursorRef) {
  let removed = 0;
  for (;;) {
    const snap = await col.where('source', '==', 'pull').limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    removed += snap.size;
    if (snap.size < 400) break;
  }
  await cursorRef.delete().catch(() => {});
  return removed;
}

async function runNedarimPull(org, opts = {}) {
  const db = getFirestore();
  const col = incomingCol(db, org);
  const cursorRef = syncCol(db, org).doc('cursor');
  let removed = 0;
  if (opts.reset) removed = await clearPullRows(db, col, cursorRef); // מוחק שורות-משיכה + cursor
  const cursorSnap = await cursorRef.get();
  const startCursor = Number((cursorSnap.exists && cursorSnap.data().lastTxnId) || 0);
  let lastId = startCursor;
  let maxCursor = startCursor;
  let added = 0;
  let pages = 0;
  const MAX_PAGES = 10; // 10×2000=20K עסקאות/ריצה — עדיין מתחת ל-20 פניות/שעה
  const MAX_ID = 2000; // תקרת נדרים
  while (pages < MAX_PAGES) {
    pages++;
    const rows = await fetchNedarimHistory(lastId, MAX_ID);
    if (!rows.length) break;
    const { writes, cursor } = planHistoryWrites(rows, org);
    // כתיבה **באצוות** (400/batch) עם doc-id דטרמיניסטי `nedarim-<tid>` ⇒ אידמפוטנטי
    // בין ריצות-משיכה. **בלי שאילתת-reference פר-שורה** — זו הייתה O(n) קריאות
    // סדרתיות שגרמו ל-timeout על גיבוי-מלא (אלפי עסקאות). דדופ מול ה-webhook (id
    // אקראי, אותו reference/txnId) נעשה **בשלב-הסנכרון** (planNedarimSync דדופ לפי
    // txnId) ⇒ עסקה כפולה ב-incomingPayments לא מייצרת כפל-חיוב בכרטיס.
    for (let i = 0; i < writes.length; i += 400) {
      const batch = db.batch();
      const slice = writes.slice(i, i + 400);
      for (const w of slice) batch.set(col.doc(w.id), { ...w.data, at: new Date().toISOString() });
      await batch.commit();
      added += slice.length;
    }
    if (cursor > maxCursor) maxCursor = cursor;
    lastId = cursor;
    if (rows.length < MAX_ID) break; // עמוד אחרון (פחות מהמקסימום)
  }
  if (maxCursor > startCursor) await cursorRef.set({ lastTxnId: maxCursor, at: new Date().toISOString() }, { merge: true });
  return { added, pages, cursor: maxCursor, removed };
}

/**
 * 🔄 nedarimPull (HTTP) — משיכה יזומה/על-דרישה. מאובטח בסוד PAY_SECRET (כמו
 * ה-webhook). פתיחת כתובת ?org=<slug>&secret=<PAY_SECRET>. מחזיר {added,pages,cursor}.
 */
exports.nedarimPull = onRequest(
  {
    secrets: ['PAY_SECRET', 'NEDARIM_MOSAD_ID', 'NEDARIM_API_PASSWORD'],
    timeoutSeconds: 540, // גיבוי-מלא מ-2019 (אלפי עסקאות) — עד 9 דק' (מקס' gen2)
    memory: '512MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).send('POST/GET only');
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    if ((p.secret ?? '') !== process.env.PAY_SECRET) return res.status(403).send('bad secret');
    const org = String(p.org ?? '').trim();
    if (!/^[a-z0-9-]{2,40}$|^root$/.test(org)) return res.status(400).send('bad org');
    // ?peek=1 ⇒ הצצה: מחזיר את 3 העסקאות הראשונות גולמיות (כל השדות) בלי לכתוב — לתכנון מיפוי.
    if (p.peek === '1') {
      try {
        return res.status(200).json({ ok: true, sample: await fetchNedarimHistory(0, 3) });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    // ?peekdonors=1 ⇒ הצצה: 5 התורמים הראשונים אחרי פרסור (מוודא מיפוי נכון).
    if (p.peekdonors === '1') {
      try {
        const buf = await fetchNedarimDonorsBytes();
        const text = tryDecode(buf, 'utf-16le') || tryDecode(buf, 'windows-1255');
        return res.status(200).json({ ok: true, parsed: parseDonorsTsv(text).slice(0, 5) });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    // ?donors=1 ⇒ משיכת רשימת-התורמים ואחסונם (doc-id=מזהה-תורם); הלקוח יוצר כרטיסי-תורם.
    if (p.donors === '1') {
      try {
        return res.status(200).json({ ok: true, ...(await runNedarimDonorsPull(org)) });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      // ?reset=1 ⇒ מחיקת שורות-משיכה קודמות + cursor, ואז משיכה-מחדש (עם המפה המעודכנת).
      const out = await runNedarimPull(org, { reset: p.reset === '1' });
      res.status(200).json({ ok: true, ...out });
    } catch (e) {
      res.status(502).json({ ok: false, error: String((e && e.message) || e) });
    }
  },
);

/**
 * 🕒 nedarimSyncHourly — רשת-הביטחון האוטומטית: כל שעה מושכת עסקאות-חדשות
 * מנדרים לארגון שב-NEDARIM_ORG (ברירת-מחדל root). כשל-רך (לא מפיל את התזמון).
 */
exports.nedarimSyncHourly = onSchedule(
  { schedule: 'every 60 minutes', secrets: ['NEDARIM_MOSAD_ID', 'NEDARIM_API_PASSWORD', 'NEDARIM_ORG'] },
  async () => {
    const org = (process.env.NEDARIM_ORG || 'root').trim();
    try {
      const out = await runNedarimPull(org);
      console.log('nedarimSyncHourly', org, JSON.stringify(out));
    } catch (e) {
      console.error('nedarimSyncHourly failed', org, String((e && e.message) || e));
    }
  },
);
