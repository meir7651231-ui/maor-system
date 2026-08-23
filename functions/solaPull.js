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
  const tries = org === 'root' ? ['root', 'maor-hachesed'] : [org];
  for (const t of tries) {
    try {
      const d = await db.doc('orgSecrets/' + t).get();
      const s = d.exists ? (d.data() || {}) : {};
      if (s.solaXKey) return { key: String(s.solaXKey).trim(), from: t };
    } catch { /* אין כספת ⇒ הבא */ }
  }
  // 🐛 (23.8, אבחון-ההצצה): הבעלים שומר את המפתח מהכתובת שבה הוא עובד
  // (?org=<slug>) — וה-slug האמיתי אינו בהכרח הניחוש הסטטי שלמעלה. root בלבד:
  // סורקים את אוסף-הכספות הקטן ומאתרים את המגירה **היחידה** שמחזיקה solaXKey;
  // יותר מאחת ⇒ דו-משמעי — נדרש ?vault= מפורש (לא מנחשים של מי הכסף).
  if (org === 'root') {
    // 🐛 נחיל-סולה S7: הסריקה הדינמית עלולה (בריבוי-לקוחות עתידי) להרים מפתח של
    // ארגון זר. עוגן מפורש: SOLA_ROOT_VAULT (env, slug לא-סוד) גובר על הסריקה.
    const pinned = (process.env.SOLA_ROOT_VAULT || '').trim();
    if (pinned) {
      try {
        const d = await db.doc('orgSecrets/' + pinned).get();
        const sec = d.exists ? (d.data() || {}) : {};
        if (sec.solaXKey) return { key: String(sec.solaXKey).trim(), from: pinned };
      } catch { /* ממשיכים לסריקה */ }
    }
    try {
      const all = await db.collection('orgSecrets').limit(30).get();
      const withKey = all.docs.filter((d) => (d.data() || {}).solaXKey);
      if (withKey.length === 1) {
        return { key: String(withKey[0].data().solaXKey).trim(), from: withKey[0].id };
      }
      if (withKey.length > 1) return { key: '', from: '', ambiguous: withKey.map((d) => d.id) };
    } catch { /* נפילה ל-env */ }
  }
  const env = process.env.SOLA_XKEY || '';
  return { key: env, from: env ? 'env' : '' };
}

/** אבחון-כספות להצצה (שמות-מגירות + האם-יש-מפתח בלבד — לעולם לא ערכים). */
async function vaultDrawers(db) {
  try {
    const all = await db.collection('orgSecrets').limit(30).get();
    return all.docs.map((d) => d.id + ((d.data() || {}).solaXKey ? '✓' : '·'));
  } catch {
    return [];
  }
}

const API_BASE = () => (process.env.SOLA_API_BASE || 'https://x1.cardknox.com').replace(/\/+$/, '');

/** משיכת דוח-עסקאות: Report:Transactions בין תאריכים (כולל).
 *  🐛 (23.8, שטח-אמת מצילום-הבעלים): נקודת-הקצה /report מדברת form-urlencoded —
 *  גוף-JSON נבלע ("Required: xKey" מקושר). הבקשה = URLSearchParams; התשובה —
 *  ‏JSON כשיש נתונים, ו-urlencoded בשגיאות — הפרסור מטפל בשתי הצורות. */
/** 💎 גשש-הלקוחות (peek=2, ‏23.8): ברירת-המחדל של הדוח חוזרת **בלי** טלפון/אימייל,
 *  אבל בקשת-עמודות מפורשת (xFields) כן מחזירה אותם — אומת מול השער האמיתי
 *  (xBillPhone/xEmail מלאים). הרשימה = כל העמודות שנצפו-חיות + פרטי-הקשר. */
const SOLA_FIELDS = [
  'xRefNum', 'xCommand', 'xName', 'xMaskedCardNumber', 'xToken', 'xAmount',
  'xRequestAmount', 'xCustom01', 'xEnteredDate', 'xResponseAuthCode',
  'xResponseResult', 'xVoid', 'xVoidable',
  'xBillFirstName', 'xBillLastName', 'xBillPhone', 'xBillMobile', 'xEmail',
].join(',');

async function fetchSolaReport(xKey, beginIso, endIso) {
  const body = new URLSearchParams({
    xKey,
    xVersion: '5.0.0',
    xSoftwareName: 'MaorOrbit',
    xSoftwareVersion: '1.0',
    xCommand: 'Report:Transactions',
    xBeginDate: beginIso,
    xEndDate: endIso,
    xFields: SOLA_FIELDS,
  });
  const resp = await fetch(API_BASE() + '/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await resp.text();
  // 🐛 נחיל-סולה S1 (23.8, HIGH): כשל-HTTP (502/HTML מ-proxy) נבלע בעבר כ"דוח
  // ריק" — פרוסה כושלת בשקט בזמן שפרוסות מאוחרות מקדמות את ה-cursor = חור-
  // עסקאות קבוע. כשל ⇒ throw: הריצה נופלת לפני עדכון-cursor, והדדופ בולע retry.
  if (!resp.ok) throw new Error('sola: HTTP ' + resp.status + ' — ' + text.slice(0, 120));
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
  // 🐛 נחיל-סולה S1ב: תשובה בלי סימן-הצלחה מוכר (xResult=S/Success) היא מבנה-זר
  // (HTML/JSON-אחר) — לא "0 עסקאות". דוח-ריק אמיתי חוזר עם xResult=S.
  const okMarker = json.xResult === 'S' || /^success$/i.test(String(json.xStatus || ''));
  let rows = json.xReportData ?? json.ReportData ?? json.data;
  // 💎 שטח-אמת 23.8 (טוסט-הבעלים, xResult=S): התשובה כולה urlencoded, ו-xReportData
  // מגיע כ**מחרוזת-JSON ארוזה** בתוכה — פותחים אותה למערך. xRecordsReturned = האמת.
  if (typeof rows === 'string' && rows.trim()) {
    try { rows = JSON.parse(rows); } catch { /* מבנה-לא-מוכר — ייזרק למטה */ }
  }
  if (!okMarker && !Array.isArray(rows)) {
    throw new Error('sola: תשובה לא-מוכרת מהשער — ' + text.slice(0, 160));
  }
  // אבחון-שטח (23.8): דוח-ריק/מבנה-לא-מוכר — debug חוזר גם ל-caller (ומשם למסך!)
  // וגם ללוג **כמחרוזת-אחת** (console.log מרובה-ארגומנטים מודפס ריק ב-functions:log).
  // בלי xKey (בבקשה בלבד); כרטיסים ממילא ממוסכים בדוח.
  let debug = '';
  if (!Array.isArray(rows) || rows.length === 0) {
    debug = 'חלון=' + beginIso + '..' + endIso + ' · records=' + String(json.xRecordsReturned ?? '?')
      + ' · keys=' + Object.keys(json).join(',') + ' · raw=' + text.slice(0, 300);
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
    // 🐛 נחיל-סולה S6 (23.8, HIGH): האיפוס מחק גם שורות handled והחיה 300 עסקאות
    // שכבר מוזגו כ-pending. מוחקים **pending בלבד** — המטופלות נשארות, והקריאה-
    // לפני-כתיבה במשיכה-מחדש מדלגת עליהן (הדדופ מגן ממיזוג-כפול).
    const snap = await col.where('provider', '==', 'sola').where('status', '==', 'pending').limit(400).get();
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

/**
 * 🧮 בדיקת-התאמה (23.8, "תבדוק אם נמשך הכל והמספרים תואמים") — **קריאה בלבד**:
 * מושכת את הדוח המלא מהשער (בלי לכתוב דבר), ממפה אותו בדיוק כמו משיכה אמיתית,
 * ומשווה מול מה שיושב בתור: כמות · סכומים פר-מטבע · טווח-תאריכים · אסמכתאות
 * חסרות/עודפות. אפס-כתיבה — אין batch/set/delete בפונקציה הזו.
 */
async function runSolaAudit(org) {
  const db = getFirestore();
  const { key: xKey, from: vaultFrom, ambiguous } = await solaKey(db, org);
  if (!xKey) {
    throw new Error(ambiguous
      ? 'כמה כספות מחזיקות xKey (' + ambiguous.join(', ') + ') — נדרש vault מפורש'
      : 'אין xKey בכספת של ' + org);
  }
  const firstDays = Number(process.env.SOLA_FIRST_DAYS || 365);
  const today = new Date().toISOString().slice(0, 10);
  const begin = shiftIsoDays(today, -firstDays);
  const end = shiftIsoDays(today, 1);
  const CHUNK = 90;
  // צד-השער: כל השורות בחלון המלא, ממופות באותו מנוע בדיוק (planSolaWrites)
  const gwWrites = new Map(); // id → data (ה-Map בולע כפילויות בין-פרוסות)
  let gwRaw = 0;
  const seenRefs = new Set();
  let voided = 0;
  let notApproved = 0;
  for (let s = begin; s < end; s = shiftIsoDays(s, CHUNK)) {
    const e = shiftIsoDays(s, CHUNK) < end ? shiftIsoDays(s, CHUNK) : end;
    const { rows } = await fetchSolaReport(xKey, s, e);
    for (const r of rows) {
      const ref = String(r.xRefNum || '');
      if (ref && seenRefs.has(ref)) continue; // חפיפת-פרוסות — לא נספרת פעמיים
      if (ref) seenRefs.add(ref);
      gwRaw += 1;
      const res = String(r.xResult || r.xResponseResult || r.xStatus || '');
      if (!(res === 'A' || /approved/i.test(res))) notApproved += 1;
      else if (String(r.xVoid || '') === '1') voided += 1;
    }
    for (const w of planSolaWrites(rows, org).writes) gwWrites.set(w.id, w.data);
  }
  const gw = { raw: gwRaw, eligible: gwWrites.size, notApproved, voided, byCur: {}, first: '', last: '' };
  for (const d of gwWrites.values()) {
    const c = String(d.currency || '?');
    gw.byCur[c] = Math.round(((gw.byCur[c] || 0) + Number(d.amount || 0)) * 100) / 100;
    const dt = String(d.d || '');
    if (dt && (!gw.first || dt < gw.first)) gw.first = dt;
    if (dt > gw.last) gw.last = dt;
  }
  // צד-התור: כל שורות-סולה שכבר נכתבו (כולל handled — הדדופ שומר אותן לעד)
  const snap = await incomingCol(db, org).where('provider', '==', 'sola').get();
  const q = { count: snap.size, byCur: {}, byStatus: {}, first: '', last: '' };
  const qIds = new Set();
  for (const doc of snap.docs) {
    const d = doc.data() || {};
    qIds.add(doc.id);
    const c = String(d.currency || '?');
    q.byCur[c] = Math.round(((q.byCur[c] || 0) + Number(d.amount || 0)) * 100) / 100;
    const st = String(d.status || '?');
    q.byStatus[st] = (q.byStatus[st] || 0) + 1;
    const dt = String(d.d || '');
    if (dt && (!q.first || dt < q.first)) q.first = dt;
    if (dt > q.last) q.last = dt;
  }
  const missing = [...gwWrites.keys()].filter((id) => !qIds.has(id));
  const extra = [...qIds].filter((id) => !gwWrites.has(id));
  // 🐛 נחיל-סולה S5: השוואת-JSON רגישה לסדר-מפתחות ⇒ mismatch-כוזב בריבוי-מטבעות.
  const curKeys = new Set([...Object.keys(gw.byCur), ...Object.keys(q.byCur)]);
  const sumsMatch = [...curKeys].every((k) => (gw.byCur[k] || 0) === (q.byCur[k] || 0));
  return {
    vault: vaultFrom,
    window: begin + '..' + end,
    gateway: gw,
    queue: q,
    missing: missing.length,
    missingSample: missing.slice(0, 5),
    extra: extra.length,
    extraSample: extra.slice(0, 5),
    match: missing.length === 0 && extra.length === 0 && sumsMatch,
  };
}

async function runSolaPull(org, opts = {}) {
  const db = getFirestore();
  const col = incomingCol(db, org);
  const cursorRef = syncCol(db, org).doc('cursor');
  // ⚠️ לקוח-השורש: האוספים ב-root אבל הכספת נכתבת תחת ה-slug האמיתי
  // (OrgSecretsSection כותב orgSecrets/{config.slug}) — vaultOrg מגשר.
  const { key: xKey, from: vaultFrom, ambiguous } = await solaKey(db, opts.vaultOrg || org);
  if (!xKey) {
    throw new Error(ambiguous
      ? 'כמה כספות מחזיקות xKey (' + ambiguous.join(', ') + ') — נדרש vault מפורש'
      : 'אין xKey — הזינו "🔑 Sola xKey" בהגדרות←מפתחות-ההרחבות');
  }
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
  let enrichedRows = 0;
  let voided = 0;
  let lastDebug = '';
  let maxDate = lastDate;
  for (const [ws, we] of windows) {
    const { rows, debug } = await fetchSolaReport(xKey, ws, we);
    scanned += rows.length;
    if (debug) lastDebug = debug;
    const { writes, lastDateIso } = planSolaWrites(rows, org);
    // אי-דריסה (הלקח מנדרים 20.8): doc-id שכבר קיים — ייתכן שכבר 'handled' — לא נכתב שוב.
    // 💎 העשרה (23.8, "שם לשם, טלפון לטלפון"): רשומה קיימת שחסרים בה פרטי-קשר
    // והדוח (עם xFields) מביא אותם — ממלאים **רק** phone/email/name ריקים במיזוג-
    // חלקי; הסטטוס/הסכום/הקבלה לעולם לא נגעים.
    const byId = new Map(writes.map((w) => [w.id, w]));
    const refs = writes.map((w) => col.doc(w.id));
    const existing = new Set();
    const enrichSets = [];
    for (let i = 0; i < refs.length; i += 300) {
      const snaps = await db.getAll(...refs.slice(i, i + 300));
      for (const s of snaps) {
        if (!s.exists) continue;
        existing.add(s.id);
        const w = byId.get(s.id);
        const cur = s.data() || {};
        const fill = {};
        for (const f of ['phone', 'email', 'name']) {
          const nv = String((w && w.data[f]) || '').trim();
          if (nv && !String(cur[f] || '').trim()) fill[f] = nv;
        }
        if (Object.keys(fill).length) enrichSets.push({ ref: s.ref, fill });
      }
    }
    const fresh = writes.filter((w) => !existing.has(w.id));
    for (let i = 0; i < fresh.length; i += 400) {
      const batch = db.batch();
      const slice = fresh.slice(i, i + 400);
      for (const w of slice) batch.set(col.doc(w.id), { ...w.data, at: new Date().toISOString() });
      await batch.commit();
      added += slice.length;
    }
    for (let i = 0; i < enrichSets.length; i += 400) {
      const batch = db.batch();
      const slice = enrichSets.slice(i, i + 400);
      for (const e of slice) batch.set(e.ref, e.fill, { merge: true });
      await batch.commit();
      enrichedRows += slice.length;
    }
    // 🐛 נחיל-סולה S2 (23.8, HIGH): מכירה שנמשכה כ-pending ואז **בוטלה בשער**
    // (xVoid הופך '1') נשארה ממתינה לעד ⇒ סיכון קבלה על כסף שהוחזר. שורת-void
    // שה-doc שלה קיים ועדיין pending ⇒ status:'voided' (יוצאת מהתור; handled
    // לא נגוע — ביטול-אחרי-מיזוג הוא החלטת-מנהל, מוצג ב-audit).
    const { safeId: sid } = require('./solaReport');
    const voidRefs = rows
      .filter((r) => String(r.xVoid || '') === '1' && String(r.xRefNum || '').trim())
      .map((r) => col.doc('sola-' + sid(String(r.xRefNum).trim())));
    for (let i = 0; i < voidRefs.length; i += 300) {
      const snaps = await db.getAll(...voidRefs.slice(i, i + 300));
      const batch = db.batch();
      let n = 0;
      for (const s of snaps) {
        if (!s.exists || (s.data() || {}).status !== 'pending') continue;
        batch.set(s.ref, { status: 'voided', voidedAt: new Date().toISOString() }, { merge: true });
        n++;
        voided++;
      }
      if (n) await batch.commit();
    }
    // 🐛 נחיל-סולה S3 (23.8): lastDateIso לא נכבל לחלון — תאריך-עתידי משובש בשורה
    // אחת היה תוקע את ה-cursor בעתיד והמשיכות מתות בשקט. כובלים לקצה-החלון.
    const clamped = lastDateIso > we ? we : lastDateIso;
    if (clamped && clamped > maxDate) maxDate = clamped;
  }
  if (maxDate && maxDate > lastDate) {
    await cursorRef.set({ lastDateIso: maxDate, at: new Date().toISOString() }, { merge: true });
  }
  // debug חוזר ל-caller רק כשכלום-לא-נסרק — הקליינט מציג אותו במקום "0" סתום.
  return { added, scanned, window: begin + '..' + end + ' (' + windows.length + ' פרוסות)', removed, vault: vaultFrom, enriched: enrichedRows, voided, ...(scanned === 0 && lastDebug ? { debug: lastDebug } : {}) };
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
    // 🔎 peek=2 — גישוש-לקוחות (23.8, "שם יכנס לשם, טלפון לטלפון"): דוח-העסקאות
    // חוזר בלי טלפון/אימייל; מגששים אילו נקודות-קצה של השער כן מחזירות פרטי-קשר
    // ומדפיסים גלם קצוץ ללוג-הבעלים — כדי לחווט העשרה אמיתית על עובדות, לא ניחוש.
    if (p.peek === '2') {
      try {
        const db = getFirestore();
        const { key: xKey } = await solaKey(db, vaultOrg);
        if (!xKey) return res.status(400).json({ ok: false, error: 'אין xKey בכספת' });
        const today = new Date().toISOString().slice(0, 10);
        const form = (extra) => new URLSearchParams({
          xKey, xVersion: '5.0.0', xSoftwareName: 'MaorOrbit', xSoftwareVersion: '1.0',
          xBeginDate: shiftIsoDays(today, -30), xEndDate: shiftIsoDays(today, 1), ...extra,
        });
        const probes = [];
        const tryPost = async (name, url, body, headers) => {
          try {
            const r = await fetch(url, { method: 'POST', headers, body });
            const t = await r.text();
            probes.push({ name, status: r.status, body: t.slice(0, 400) });
          } catch (e) {
            probes.push({ name, status: -1, body: String((e && e.message) || e).slice(0, 200) });
          }
        };
        const FORM_H = { 'Content-Type': 'application/x-www-form-urlencoded' };
        await tryPost('Report:Customers', API_BASE() + '/report', form({ xCommand: 'Report:Customers' }), FORM_H);
        await tryPost('Report:Transactions+xFields', API_BASE() + '/report',
          form({ xCommand: 'Report:Transactions', xFields: 'xBillFirstName,xBillLastName,xBillPhone,xEmail,xBillMobile' }), FORM_H);
        await tryPost('v1/Customers', 'https://api.cardknox.com/v1/Customers',
          JSON.stringify({ SoftwareName: 'MaorOrbit', SoftwareVersion: '1.0' }),
          { 'Content-Type': 'application/json', Authorization: xKey });
        return res.status(200).json({ ok: true, probes });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    if (p.peek === '1') {
      try {
        const db = getFirestore();
        // אבחון (23.8): אילו מגירות קיימות ובמי יש מפתח (שמות+בוליאני בלבד) +
        // כמה שורות-סולה כבר יושבות בתור-השורש — מודפס רק ללוג-Actions של הבעלים.
        const drawers = await vaultDrawers(db);
        let rootRows = -1;
        try {
          rootRows = (await incomingCol(db, 'root').where('provider', '==', 'sola').count().get()).data().count;
        } catch { /* אגרגט-לא-זמין ⇒ ‎-1 */ }
        const { key: xKey, from, ambiguous } = await solaKey(db, vaultOrg);
        if (!xKey) {
          const error = ambiguous ? 'כמה כספות עם xKey: ' + ambiguous.join(', ') : 'אין xKey בכספת';
          return res.status(400).json({ ok: false, error, drawers, rootRows });
        }
        const today = new Date().toISOString().slice(0, 10);
        const peek = await fetchSolaReport(xKey, shiftIsoDays(today, -90), shiftIsoDays(today, 1));
        return res.status(200).json({ ok: true, count: peek.rows.length, sample: peek.rows.slice(0, 3), vault: from, drawers, rootRows, ...(peek.debug ? { debug: peek.debug } : {}) });
      } catch (e) {
        return res.status(502).json({ ok: false, error: String((e && e.message) || e) });
      }
    }
    // 🧮 ?audit=1 — בדיקת-התאמה קריאה-בלבד: שער מול תור (אפס-כתיבה)
    if (p.audit === '1') {
      try {
        return res.status(200).json({ ok: true, ...(await runSolaAudit(org)) });
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
