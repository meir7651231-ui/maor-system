/**
 * 🔄 כיוון-נכנס · Sola Payments — משיכת עסקאות (Reporting API) → תשלומים-נכנסים,
 * בתבנית-נדרים המדויקת (nedarimPull.js): כספת-פר-ארגון · דדופ doc-id דטרמיניסטי ·
 * קריאה-לפני-כתיבה (אי-דריסת handled) · cursor · peek · רשת-ביטחון מתוזמנת.
 *
 * חוזה-הכסף: כותב **רק** ל-incomingPayments (status:'pending'). לעולם לא קבלות,
 * לעולם לא מונים — סולה לא מנפיקה §46; הקבלה נרשמת במאור באישור-המנהל (הזרימה
 * הקיימת של תור-האישור). ratchet: functions/solaPull.test.mjs.
 *
 * אישורים: orgSecrets/{slug}.solaXKey (הכספת גוברת — המנהל מזין בהגדרות←מפתחות-
 * ההרחבות), נפילה ל-env ‏SOLA_XKEY (חד-מוסדי). endpoint: ‏SOLA_API_BASE (env,
 * ברירת-מחדל https://x1.cardknox.com — השער של Cardknox שסולה היא white-label
 * שלו). ⚠️ אימות-שטח: להריץ ?peek=1 מול החשבון האמיתי לפני שסומכים על המיפוי.
 *
 * cursor **מבוסס-תאריך** (שונה מנדרים שמונה TransactionId): solaSync/cursor
 * שומר lastDateIso; כל משיכה מבקשת מ-(lastDate−יום-חפיפה) עד מחר, והדדופ
 * ב-doc-id בולע את החפיפה. ריצה ראשונה: 30 הימים האחרונים (SOLA_FIRST_DAYS).
 *
 * העתקי-העזר (secretOk/isOrgAdmin/incomingCol) משוכפלים מ-nedarimPull.js
 * **בכוונה** — המודול ההוא פרוס-ויציב ולא נוגעים בו לצורך חילוץ-shared.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');
const { planSolaWrites } = require('./solaReport');

function secretOk(given, expected) {
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(String(expected ?? ''));
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function isOrgAdmin(idToken, org) {
  if (!idToken) { console.warn('solaPull auth: אין Bearer (org=' + org + ')'); return false; }
  try {
    const tok = await getAuth().verifyIdToken(String(idToken));
    const email = String(tok.email || '').toLowerCase();
    // 🐛 (22.8, "עדיין 403"): הדרישה email_verified דחתה גם את מייל-העל — חשבון
    // אימייל+סיסמה שלא לחץ על מייל-אימות הוא verified=false, אבל הזהות מוכחת
    // בסיסמה (verifyIdToken מאמת שהטוקן שלנו). הדרישה הוסרה; נשאר רק email-קיים.
    if (!email) { console.warn('solaPull auth: טוקן בלי email'); return false; }
    // מיילי-העל: env ‏SUPER_ADMIN_EMAILS + עוגן-קשיח שמשקף את allowlist-השורש
    // ב-firestore.rules (ציבורי בריפו) — מנטרל תלות בטעינת-env ("עדיין 403").
    const supers = new Set(['meir7651231@gmail.com',
      ...String(process.env.SUPER_ADMIN_EMAILS || '').toLowerCase().split(/[,\s]+/).filter(Boolean)]);
    if (supers.has(email)) return true;
    if (org === 'root') { console.warn('solaPull auth: נדחה על root — ' + email + ' (verified=' + tok.email_verified + ')'); return false; }
    const d = await getFirestore().doc('platformOrgs/' + org).get();
    const data = d.exists ? (d.data() || {}) : {};
    if (String(data.manager || '').toLowerCase() === email) return true;
    const members = Array.isArray(data.members) ? data.members.map((x) => String(x).toLowerCase()) : [];
    if (!members.includes(email)) console.warn('solaPull auth: נדחה — ' + email + ' לא חבר/מנהל ב-' + org);
    return members.includes(email);
  } catch (e) {
    console.warn('solaPull auth: verifyIdToken נכשל — ' + String((e && e.message) || e));
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
    ? db.collection('solaSync')
    : db.collection('orgs').doc(org).collection('solaSync');
}

/** ה-xKey לארגון: כספת-הארגון גוברת (orgSecrets/{slug}.solaXKey), נפילה ל-env.
 *  ‏org='root' בלי vault (הכתובת החשופה, slug='default' — שם אין כספת בכלל):
 *  נופלים לכספת הלקוח-החי 'maor-hachesed' — אותו תקדים כמו מילוט-השורש ב-Rules
 *  (icsFeeds/teamChats), כי שתי הכתובות הן אותו לקוח-שורש בדיוק. */
async function solaKey(db, org) {
  let key = process.env.SOLA_XKEY || '';
  const tries = org === 'root' ? ['root', 'maor-hachesed'] : [org];
  for (const t of tries) {
    try {
      const d = await db.doc('orgSecrets/' + t).get();
      const s = d.exists ? (d.data() || {}) : {};
      if (s.solaXKey) return String(s.solaXKey).trim();
    } catch { /* אין כספת ⇒ הבא/הגלובלי */ }
  }
  return key;
}

const API_BASE = () => (process.env.SOLA_API_BASE || 'https://x1.cardknox.com').replace(/\/+$/, '');

/** משיכת דוח-עסקאות: Report:Transactions בין תאריכים (כולל).
 *  🐛 (23.8, שטח-אמת מצילום-הבעלים): נקודת-הקצה /report מדברת form-urlencoded —
 *  גוף-JSON נבלע ("Required: xKey" מקושר). הבקשה = URLSearchParams; התשובה —
 *  ‏JSON כשיש נתונים, ו-urlencoded בשגיאות — הפרסור מטפל בשתי הצורות. */
async function fetchSolaReport(xKey, beginIso, endIso) {
  const body = new URLSearchParams({
    xKey,
    xVersion: '5.0.0',
    xSoftwareName: 'MaorOrbit',
    xSoftwareVersion: '1.0',
    xCommand: 'Report:Transactions',
    xBeginDate: beginIso,
    xEndDate: endIso,
  });
  const resp = await fetch(API_BASE() + '/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await resp.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // תשובה מקושרת (xResult=E&xError=…) — הצורה שהשער מחזיר שגיאות בה
    json = Object.fromEntries(new URLSearchParams(text));
  }
  if (json.xResult === 'E' || /^error$/i.test(String(json.xStatus || '')) || json.xError) {
    throw new Error('sola: ' + String(json.xError || json.xStatus || 'שגיאת-שער'));
  }
  const rows = json.xReportData ?? json.ReportData ?? json.data;
  // אבחון-שטח (23.8): דוח-ריק/מבנה-לא-מוכר — debug חוזר גם ל-caller (ומשם למסך!)
  // וגם ללוג **כמחרוזת-אחת** (console.log מרובה-ארגומנטים מודפס ריק ב-functions:log).
  // בלי xKey (בבקשה בלבד); כרטיסים ממילא ממוסכים בדוח.
  let debug = '';
  if (!Array.isArray(rows) || rows.length === 0) {
    debug = 'חלון=' + beginIso + '..' + endIso + ' · keys=' + Object.keys(json).join(',') + ' · raw=' + text.slice(0, 300);
    console.log('sola report empty/unknown: ' + debug + text.slice(300, 900));
  } else {
    console.log('sola report rows=' + rows.length + ' first-keys=' + Object.keys(rows[0] || {}).join(','));
  }
  return { rows: Array.isArray(rows) ? rows : [], debug };
}

/** yyyy-MM-dd בהזזת-ימים, זמן-UTC (השרת; דיוק-יום מספיק — הדדופ בולע חפיפה). */
function shiftIsoDays(iso, days) {
  const t = Date.parse((iso || new Date().toISOString().slice(0, 10)) + 'T12:00:00Z');
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

async function clearPullRows(db, col, cursorRef) {
  let removed = 0;
  for (;;) {
    const snap = await col.where('provider', '==', 'sola').limit(400).get();
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

async function runSolaPull(org, opts = {}) {
  const db = getFirestore();
  const col = incomingCol(db, org);
  const cursorRef = syncCol(db, org).doc('cursor');
  // ⚠️ לקוח-השורש: האוספים ב-root אבל הכספת נכתבת תחת ה-slug האמיתי
  // (OrgSecretsSection כותב orgSecrets/{config.slug}) — vaultOrg מגשר.
  const xKey = await solaKey(db, opts.vaultOrg || org);
  if (!xKey) throw new Error('אין xKey — הזינו "🔑 Sola xKey" בהגדרות←מפתחות-ההרחבות');
  let removed = 0;
  if (opts.reset) removed = await clearPullRows(db, col, cursorRef);
  const cursorSnap = await cursorRef.get();
  const lastDate = String((cursorSnap.exists && cursorSnap.data().lastDateIso) || '');
  // ריצה-ראשונה: שנה אחורה ("תביא את העסקה האחרונה" — 23.8; 30 יום פספסו חשבון
  // שקט). 🐛 שטח-אמת 23.8 (טוסט-הבעלים): השער מגביל דוח ל-100 יום ("Date range
  // exceeds 100 day limit") ⇒ החלון מפוצל לפרוסות ≤90 יום, מהישן לחדש; הדדופ
  // ב-doc-id בולע חפיפות. ריצות-המשך = חלון-הפרש קטן מה-cursor (פרוסה אחת בד"כ).
  const firstDays = Number(process.env.SOLA_FIRST_DAYS || 365);
  const today = new Date().toISOString().slice(0, 10);
  const begin = lastDate ? shiftIsoDays(lastDate, -1) : shiftIsoDays(today, -firstDays);
  const end = shiftIsoDays(today, 1);
  const CHUNK = 90;
  const windows = [];
  for (let s = begin; s < end; s = shiftIsoDays(s, CHUNK)) {
    const e = shiftIsoDays(s, CHUNK) < end ? shiftIsoDays(s, CHUNK) : end;
    windows.push([s, e]);
  }
  let added = 0;
  let scanned = 0;
  let lastDebug = '';
  let maxDate = lastDate;
  for (const [ws, we] of windows) {
    const { rows, debug } = await fetchSolaReport(xKey, ws, we);
    scanned += rows.length;
    if (debug) lastDebug = debug;
    const { writes, lastDateIso } = planSolaWrites(rows, org);
    // אי-דריסה (הלקח מנדרים 20.8): doc-id שכבר קיים — ייתכן שכבר 'handled' — לא נכתב שוב.
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
    if (lastDateIso && lastDateIso > maxDate) maxDate = lastDateIso;
  }
  if (maxDate && maxDate > lastDate) {
    await cursorRef.set({ lastDateIso: maxDate, at: new Date().toISOString() }, { merge: true });
  }
  // debug חוזר ל-caller רק כשכלום-לא-נסרק — הקליינט מציג אותו במקום "0" סתום.
  return { added, scanned, window: begin + '..' + end + ' (' + windows.length + ' פרוסות)', removed, ...(scanned === 0 && lastDebug ? { debug: lastDebug } : {}) };
}

/**
 * 🔄 solaPull (HTTP) — משיכה יזומה/על-דרישה. אותן שתי דרכי-הרשאה כמו nedarimPull:
 *   1. ?org=<slug>&secret=<PAY_SECRET> (כתובת-ידנית למייל-על).
 *   2. Authorization: Bearer <Firebase ID token> של מייל-על/מנהל/חבר (כפתור-האפליקציה).
 * ‏?peek=1 ⇒ 3 שורות-דוח גולמיות בלי לכתוב (אימות-מיפוי מול החשבון האמיתי).
 * ‏?reset=1 ⇒ מחיקת שורות-סולה + cursor ומשיכה-מחדש.
 */
exports.solaPull = onRequest(
  { secrets: ['PAY_SECRET'], timeoutSeconds: 300, memory: '256MiB' },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).send('POST/GET only');
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const org = String(p.org ?? '').trim();
    if (!/^[a-z0-9-]{2,40}$|^root$/.test(org)) return res.status(400).send('bad org');
    const bearer = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
    const authed = secretOk(p.secret, process.env.PAY_SECRET) || (await isOrgAdmin(bearer && bearer[1], org));
    if (!authed) return res.status(403).send('unauthorized');
    // vault: **רק** ללקוח-השורש (org=root ⇒ מורשי-root בלבד עברו את השער) מותר
    // להצביע על מגירת-הכספת של ה-slug האמיתי; ארגון-פלטפורמה תמיד קורא את שלו.
    const vaultRaw = String(p.vault ?? '').trim();
    const vaultOrg = org === 'root' && /^[a-z0-9-]{2,40}$/.test(vaultRaw) ? vaultRaw : org;
    if (p.peek === '1') {
      try {
        const db = getFirestore();
        const xKey = await solaKey(db, vaultOrg);
        if (!xKey) return res.status(400).json({ ok: false, error: 'אין xKey בכספת' });
        const today = new Date().toISOString().slice(0, 10);
        const peek = await fetchSolaReport(xKey, shiftIsoDays(today, -90), shiftIsoDays(today, 1));
        return res.status(200).json({ ok: true, count: peek.rows.length, sample: peek.rows.slice(0, 3), ...(peek.debug ? { debug: peek.debug } : {}) });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    try {
      const out = await runSolaPull(org, { reset: p.reset === '1', vaultOrg });
      res.status(200).json({ ok: true, ...out });
    } catch (e) {
      res.status(502).json({ ok: false, error: String((e && e.message) || e) });
    }
  },
);

/**
 * 🕒 solaSyncHourly — רשת-הביטחון: כל שעה מושכת עסקאות-חדשות לארגון שב-SOLA_ORG.
 * ‏SOLA_ORG = env (slug, לא-סוד); חסר ⇒ מדלגים (דורמנטי — לא מושך ל-root בשקט).
 */
exports.solaSyncHourly = onSchedule({ schedule: 'every 60 minutes' }, async () => {
  const org = (process.env.SOLA_ORG || '').trim();
  if (!org) return; // דורמנטי עד שהבעלים קובע SOLA_ORG (או שהכספת פר-ארגון + כפתור מספיקים)
  try {
    const out = await runSolaPull(org);
    console.log('solaSyncHourly', org, JSON.stringify(out));
  } catch (e) {
    console.error('solaSyncHourly failed', org, String((e && e.message) || e));
  }
});
