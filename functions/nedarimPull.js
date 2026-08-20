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
 * secrets: NEDARIM_MOSAD_ID · NEDARIM_API_PASSWORD (npk_, סוד) · PAY_SECRET.
 * env (לא-סוד): NEDARIM_ORG — slug הארגון לרשת-הביטחון (nedarimSyncHourly).
 */
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');
const { planHistoryWrites } = require('./nedarimHistory');
const { parseDonorsTsv } = require('./nedarimDonors');

/** אימות-סוד קבוע-זמן + fail-closed (PAY_SECRET ריק ⇒ שקר). זהה ל-index.js. */
function secretOk(given, expected) {
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(String(expected ?? ''));
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** אימות **טוקן-כניסה** (Firebase ID token) של מייל-על / מנהל-הארגון — כדי שכפתור
 * "משוך וסנכרן" באפליקציה יפעל **בלי סוד בדפדפן**. מורשה אם המייל ב-SUPER_ADMIN_EMAILS
 * (env, לא-סוד) או מנהל/חבר של platformOrgs/{org}. תיקון 20.8 (ייעול נדרים). */
async function isOrgAdmin(idToken, org) {
  if (!idToken) return false;
  try {
    const tok = await getAuth().verifyIdToken(String(idToken));
    const email = String(tok.email || '').toLowerCase();
    if (!email || tok.email_verified === false) return false;
    const supers = String(process.env.SUPER_ADMIN_EMAILS || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
    if (supers.includes(email)) return true;
    if (org === 'root') return false; // אין platformOrgs לשורש ⇒ מייל-על בלבד
    const d = await getFirestore().doc('platformOrgs/' + org).get();
    const data = d.exists ? (d.data() || {}) : {};
    if (String(data.manager || '').toLowerCase() === email) return true;
    const members = Array.isArray(data.members) ? data.members.map((x) => String(x).toLowerCase()) : [];
    return members.includes(email);
  } catch {
    return false;
  }
}

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

/** אישורי-נדרים לארגון: **כספת-הארגון גוברת** (orgSecrets/{slug}: nedarimMosad/
 *  nedarimApiPass), נפילה ל-env הגלובלי (חד-מוסדי). כך שדות-הכספת שהמנהל מזין
 *  באמת פועלים (הבאג: המשיכה קראה רק env גלובלי ⇒ הכספת הייתה מתה). (תיקון 20.8) */
async function nedarimCreds(db, org) {
  let mosad = process.env.NEDARIM_MOSAD_ID || '';
  let pass = process.env.NEDARIM_API_PASSWORD || '';
  try {
    const d = await db.doc('orgSecrets/' + org).get();
    const s = d.exists ? (d.data() || {}) : {};
    if (s.nedarimMosad) mosad = String(s.nedarimMosad).trim();
    if (s.nedarimApiPass) pass = String(s.nedarimApiPass).trim();
  } catch { /* אין כספת ⇒ הגלובלי */ }
  return { mosad, pass };
}

async function fetchNedarimHistory(lastId, maxId, creds = {}) {
  const body = new URLSearchParams({
    Action: 'GetHistoryJson',
    MosadId: creds.mosad || process.env.NEDARIM_MOSAD_ID || '',
    ApiPassword: creds.pass || process.env.NEDARIM_API_PASSWORD || '',
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

/** משיכת רשימת-התורמים — בייטים גולמיים (הקידוד בפועל UTF-16LE, נפילה ל-Windows-1255). */
async function fetchNedarimDonorsBytes(creds = {}) {
  const mosad = creds.mosad || process.env.NEDARIM_MOSAD_ID || '';
  const body = new URLSearchParams({
    Action: 'GetTormimCsv',
    MosadNumber: mosad,
    MosadId: mosad,
    ApiPassword: creds.pass || process.env.NEDARIM_API_PASSWORD || '',
    ToMail: '0',
  });
  const resp = await fetch('https://matara.pro/nedarimplus/Reports/Manage3.aspx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return Buffer.from(await resp.arrayBuffer());
}

/** פענוח בטוח לפי שם-קידוד; **fatal:true** ⇒ קידוד-שגוי (בייטים לא-חוקיים) זורק
 * ⇒ שרשרת-הנפילה (`utf-16le || windows-1255 || utf-8`) באמת מנסה את הבא, במקום
 * לבלוע ג'יבריש ולהחזיר mojibake שמפרק את פרסור-ה-TSV בשקט. */
function tryDecode(buf, enc) {
  try { return new TextDecoder(enc, { fatal: true }).decode(buf); } catch { return ''; }
}

function donorsCol(db, org) {
  return org === 'root' ? db.collection('nedarimDonors')
    : db.collection('orgs').doc(org).collection('nedarimDonors');
}

/** משיכת רשימת-התורמים ואחסונם (doc-id=מזהה-תורם) — צד-הלקוח יוצר מהם כרטיסי-תורם. */
async function runNedarimDonorsPull(org) {
  const db = getFirestore();
  const buf = await fetchNedarimDonorsBytes(await nedarimCreds(db, org));
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
  const creds = await nedarimCreds(db, org);
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
    const rows = await fetchNedarimHistory(lastId, MAX_ID, creds);
    if (!rows.length) break;
    const { writes, cursor } = planHistoryWrites(rows, org);
    // ⚠️ אי-דריסה (תיקון 20.8): doc-id דטרמיניסטי `nedarim-<tid>` משותף עם ה-webhook.
    // ה-webhook לא מקדם את ה-cursor, לכן כל משיכה חוזרת על עסקאות-webhook שכבר קיימות
    // (וייתכן ש**כבר טופלו** — status:'handled'). batch.set היה **דורס** אותן חזרה
    // ל-'pending' (+ מוחק raw, מוסיף source:'pull') ⇒ הצפת-המזכירה בתשלומים-שכבר-נרשמו.
    // לכן: קוראים-לפני-כתיבה (getAll במנות) ומדלגים על doc-id שכבר קיים — כותבים רק חדשים.
    const refs = writes.map((w) => col.doc(w.id));
    const existing = new Set();
    for (let i = 0; i < refs.length; i += 300) {
      const snaps = await db.getAll(...refs.slice(i, i + 300));
      for (const s of snaps) if (s.exists) existing.add(s.id);
    }
    const fresh = writes.filter((w) => !existing.has(w.id));
    for (let i = 0; i < fresh.length; i += 400) {
      const batch = db.batch();
      const slice = fresh.slice(i, i + 400);
      for (const w of slice) batch.set(col.doc(w.id), { ...w.data, at: new Date().toISOString() });
      await batch.commit();
      added += slice.length;
    }
    if (cursor > maxCursor) maxCursor = cursor;
    // הגנת-התקדמות: אם ה-cursor לא עלה (עמוד בלי TransactionId תקין ⇒ cursor=0, או
    // החזרה לא-עולה) — לעצור, לא להתאפס ל-0 ולמשוך שוב מההתחלה בלולאה אינסופית.
    if (!(cursor > lastId)) break;
    lastId = cursor;
    if (rows.length < MAX_ID) break; // עמוד אחרון (פחות מהמקסימום)
  }
  if (maxCursor > startCursor) await cursorRef.set({ lastTxnId: maxCursor, at: new Date().toISOString() }, { merge: true });
  return { added, pages, cursor: maxCursor, removed };
}

/**
 * 🔄 nedarimPull (HTTP) — משיכה יזומה/על-דרישה. **שתי דרכי-הרשאה:**
 *   1. כתובת-ידנית: ?org=<slug>&secret=<PAY_SECRET> (למייל-על מהדפדפן/סקריפט).
 *   2. **כפתור-האפליקציה:** Authorization: Bearer <Firebase ID token> של מייל-על/מנהל —
 *      בלי סוד בדפדפן (isOrgAdmin). ?full=1 = תורמים+עסקאות בקליק. CORS פתוח.
 * env (לא-סוד): SUPER_ADMIN_EMAILS (מיילי-על, מופרד-פסיק) — לאימות כפתור-האפליקציה.
 */
exports.nedarimPull = onRequest(
  {
    secrets: ['PAY_SECRET', 'NEDARIM_MOSAD_ID', 'NEDARIM_API_PASSWORD'],
    timeoutSeconds: 540, // גיבוי-מלא מ-2019 (אלפי עסקאות) — עד 9 דק' (מקס' gen2)
    memory: '512MiB',
  },
  async (req, res) => {
    // CORS — הכפתור באפליקציה (gh-pages) קורא cross-origin עם Authorization ⇒ preflight.
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).send('POST/GET only');
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const org = String(p.org ?? '').trim();
    if (!/^[a-z0-9-]{2,40}$|^root$/.test(org)) return res.status(400).send('bad org');
    // הרשאה: **סוד** (כתובות-ידניות) **או** טוקן-כניסה של מייל-על/מנהל (כפתור באפליקציה).
    const bearer = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
    const authed = secretOk(p.secret, process.env.PAY_SECRET) || (await isOrgAdmin(bearer && bearer[1], org));
    if (!authed) return res.status(403).send('unauthorized');
    // ?full=1 ⇒ **משיכה מלאה בקליק** (כפתור-האפליקציה): תורמים ואז עסקאות בקריאה אחת.
    if (p.full === '1') {
      try {
        const donors = await runNedarimDonorsPull(org);
        const pull = await runNedarimPull(org, { reset: p.reset === '1' });
        return res.status(200).json({ ok: true, ...donors, ...pull });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    // ?peek=1 ⇒ הצצה: מחזיר את 3 העסקאות הראשונות גולמיות (כל השדות) בלי לכתוב — לתכנון מיפוי.
    if (p.peek === '1') {
      try {
        return res.status(200).json({ ok: true, sample: await fetchNedarimHistory(0, 3, await nedarimCreds(getFirestore(), org)) });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    // ?peekdonors=1 ⇒ הצצה: 5 התורמים הראשונים אחרי פרסור (מוודא מיפוי נכון).
    if (p.peekdonors === '1') {
      try {
        const buf = await fetchNedarimDonorsBytes(await nedarimCreds(getFirestore(), org));
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
 * מנדרים לארגון שב-NEDARIM_ORG. כשל-רך (לא מפיל את התזמון).
 *
 * ⚠️ NEDARIM_ORG = **משתנה-סביבה** (slug — לא סוד) ולכן **אינו** ב-`secrets`:
 *   (1) כך פריסה-מלאה (`--only functions`) לא נכשלת כשהסוד טרם נוצר ב-Secret-Manager;
 *   (2) חסר NEDARIM_ORG ⇒ **מדלגים** (לא מושכים ל-'root' בשקט — הארגון-החי הוא slug).
 */
exports.nedarimSyncHourly = onSchedule(
  { schedule: 'every 60 minutes', secrets: ['NEDARIM_MOSAD_ID', 'NEDARIM_API_PASSWORD'] },
  async () => {
    const org = (process.env.NEDARIM_ORG || '').trim();
    if (!org) {
      console.error('nedarimSyncHourly: NEDARIM_ORG לא-מוגדר — מדלג (לא מושך ל-root כדי לא לכתוב לארגון שגוי)');
      return;
    }
    try {
      const out = await runNedarimPull(org);
      console.log('nedarimSyncHourly', org, JSON.stringify(out));
    } catch (e) {
      console.error('nedarimSyncHourly failed', org, String((e && e.message) || e));
    }
  },
);
