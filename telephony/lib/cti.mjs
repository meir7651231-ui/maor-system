// ─────────────────────────────────────────────────────────────────────────────
// telephony · cti — גשר screen-pop: מספר-מתקשר → איש-קשר במאור.
//
// טהור, אפס תלויות, אפס DOM/store. מקבל תצלום-DB בצורת מאור
// ({families, members, teachers, supporters}) + מספר-נכנס, ומחזיר את ההתאמה.
//
// downstream בכל נקודה: קריאה בלבד. לא כותב לשום ספק, לא כותב למאור.
// שני מסלולי-חיווט אפשריים (המנוע תומך בשניהם):
//   1. buildDirectory(db) → אינדקס e164→אנשי-קשר שנכתב פעם ל-directory/<e164>
//      בענן opt-in; צד-המרכזייה קורא משם (מתאים כשהמרכזייה אצל המפעיל).
//   2. lookupCaller(db, number) → הצלבה חיה מול תצלום-DB מקומי (מתאים כשמאור
//      עצמו מקבל את אירוע inbound_number ומצליב מקומית, local-first).
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';

// שדות-הטלפון פר-ישות במאור (מקור-האמת: src/types/domain.ts).
// Supporter = phone יחיד; השאר phone+phone2.
const PHONE_FIELDS = {
  family: ['phone', 'phone2'],
  member: ['phone', 'phone2'],
  teacher: ['phone', 'phone2'],
  supporter: ['phone'],
  volunteer: ['phone'],
  coordinator: ['phone'],
};
// שם-המערך-השורשי ב-DB → kind. שים לב: אין `members` שורשי — בני-המשפחה
// מקוננים ב-Family.members[] (מקור-אמת domain.ts) ומטופלים בנפרד ב-iterContacts.
const COLLECTION_KIND = {
  families: 'family',
  teachers: 'teacher',
  supporters: 'supporter',
  volunteers: 'volunteer',
  tzCoordinators: 'coordinator',
};

/** שם-תצוגה לרשומה. Member משתמש ב-first (+שם-משפחה); השאר ב-name. */
function nameOf(rec, kind, familyName) {
  if (kind === 'member') return [rec.first, familyName].filter(Boolean).join(' ') || String(rec.first || '');
  return rec.name || '';
}

function* iterContacts(db) {
  for (const [coll, kind] of Object.entries(COLLECTION_KIND)) {
    const arr = Array.isArray(db?.[coll]) ? db[coll] : [];
    for (const rec of arr) {
      if (rec && rec.id != null) yield { kind, rec, name: nameOf(rec, kind) };
    }
  }
  // בני-משפחה מקוננים ב-Family.members[] — לולאה נפרדת עם שם-המשפחה לתצוגה.
  for (const fam of Array.isArray(db?.families) ? db.families : []) {
    for (const m of Array.isArray(fam?.members) ? fam.members : []) {
      if (m && m.id != null) yield { kind: 'member', rec: m, name: nameOf(m, 'member', fam.name) };
    }
  }
}

/** כל הטלפונים של רשומה (phone/phone2 לפי הישות), מנורמלים. */
function phonesOf(rec, kind) {
  const out = [];
  for (const field of PHONE_FIELDS[kind] || ['phone']) {
    const e = toE164(rec[field]);
    if (e) out.push({ field, e164: e });
  }
  return out;
}

/** גרסת מבנה-ה-screen-pop (לתאימות-קדימה בצד-מאור). */
export const SCREENPOP_VERSION = 1;

/**
 * העשרת-כרטיס (item 41): שולף שדות-הקשר שימושיים מהרשומה — קטגוריה/עיר/תרומה-
 * אחרונה/סכום-מצטבר/תגיות/הערה — אם קיימים. אף שדה לא חובה; אין=לא-נכלל.
 */
export function enrichContact(rec, kind) {
  // רק שדות שקיימים באמת ב-domain.ts (Supporter: cat/city/last/ils/usd). אין balance/tags.
  const e = {};
  if (rec.cat) e.category = rec.cat;
  if (rec.city) e.city = rec.city;
  if (rec.last) e.lastDonation = rec.last;
  if (typeof rec.ils === 'number' && rec.ils) e.totalIls = rec.ils;
  if (typeof rec.usd === 'number' && rec.usd) e.totalUsd = rec.usd;
  return e;
}

/** מסנן שדות-כסף מהעשרה (למצב-צנעה). */
function stripMoney(enr) {
  const { totalIls, totalUsd, lastDonation, ...rest } = enr || {};
  return rest;
}

/**
 * item 6 · כרטיס-חסד: אותות-פעולה חיים ממאור למתקשר-מזוהה — מסירות-פתוחות,
 * שיוכי-חנות-פעילים, סטטוס-משפחה, הוראת-קבע. קריאה-בלבד, טהור. אף אות לא חובה;
 * חסר=לא-נכלל. מבנה-מאור מאומת מול domain.ts (Delivery/ShopAssignment/Hok/Family).
 * @param {object} db תצלום-DB של מאור
 * @param {{kind:string, id:string}} target איש-הקשר המזוהה
 * @returns {object} { openDeliveries?, deliveryStatus?, activeAssignments?, familyStatus?, hok? }
 */
export function careSignals(db, target) {
  if (!db || !target) return {};
  const care = {};
  // זיהוי המשפחה: family ⇒ ה-id עצמו; member ⇒ המשפחה שמכילה אותו.
  let famId = null;
  if (target.kind === 'family') famId = String(target.id);
  else if (target.kind === 'member') {
    for (const fam of Array.isArray(db.families) ? db.families : []) {
      if ((fam.members || []).some((m) => String(m.id) === String(target.id))) { famId = String(fam.id); break; }
    }
  }
  if (famId) {
    // מסירות-פתוחות (SHOP7): status !== 'delivered' ⇒ עדיין בדרך/ממתינה.
    const open = (Array.isArray(db.deliveries) ? db.deliveries : []).filter((d) => String(d.familyId) === famId && d.status !== 'delivered');
    if (open.length) {
      care.openDeliveries = open.length;
      // האות ה"קדימה-ביותר" לתצוגה מהירה (enroute > pickup).
      care.deliveryStatus = open.some((d) => d.status === 'enroute') ? 'enroute' : 'pickup';
    }
    // שיוכי-חנות פעילים (SHOP6): מזון/שירות שוטף.
    const active = (Array.isArray(db.shopAssignments) ? db.shopAssignments : []).filter((a) => String(a.famId) === famId && a.status === 'active');
    if (active.length) care.activeAssignments = active.length;
    // סטטוס-משפחה — 'pending' חשוב (טרם-אושרה) / 'inactive'.
    const fam = (Array.isArray(db.families) ? db.families : []).find((f) => String(f.id) === famId);
    if (fam && fam.status && fam.status !== 'active') care.familyStatus = fam.status;
  }
  // תומך: הוראת-קבע פעילה (תזכורת-גבייה).
  if (target.kind === 'supporter') {
    const sup = (Array.isArray(db.supporters) ? db.supporters : []).find((s) => String(s.id) === String(target.id));
    if (sup && sup.hok && sup.hok.active && typeof sup.hok.amount === 'number' && sup.hok.amount > 0) {
      care.hok = { amount: sup.hok.amount, cur: sup.hok.cur || '₪', day: sup.hok.day };
    }
  }
  return care;
}

/**
 * בונה אינדקס e164 → רשימת-אנשי-קשר. זה מה שנכתב (opt-in) ל-directory בענן.
 * מיפוי רב-לאחד: אותו מספר יכול להופיע אצל כמה אנשי-קשר (משפחה+תומך וכו').
 * @param {object} db  { families?, members?, teachers?, supporters? }
 * @returns {Record<string, Array<{kind:string,id:string,name:string,field:string}>>}
 */
export function buildDirectory(db) {
  const dir = {};
  for (const { kind, rec, name } of iterContacts(db)) {
    for (const { field, e164 } of phonesOf(rec, kind)) {
      (dir[e164] ||= []).push({ kind, id: String(rec.id), name, field });
    }
  }
  // דטרמיניזם: מיין כל רשומה לפי kind ואז id.
  for (const k of Object.keys(dir)) {
    dir[k].sort((a, b) => (a.kind + a.id).localeCompare(b.kind + b.id));
  }
  return dir;
}

// עדיפות-הצגה ל-screen-pop כשיש כמה התאמות. תומך > משפחה > מורה > חבר — לפי
// הקונטקסט הנפוץ של שיחה נכנסת (תרומות/משפחות קודם). ניתן להתאמה פר-לקוח בעתיד.
const POP_PRIORITY = { supporter: 0, family: 1, teacher: 2, member: 3, volunteer: 4, coordinator: 5 };

/**
 * screen-pop למספר בודד. מצליב מול תצלום-DB חי (מסלול local-first).
 * @param {object} db
 * @param {string} rawNumber  מספר-המתקשר הגולמי (cid_e164 מהדיאלפלן — לא ה-DID inbound_number)
 * @returns {{number:string|null, matches:Array, primary:object|null}}
 */
export function lookupCaller(db, rawNumber) {
  const e164 = toE164(rawNumber);
  if (!e164) return { number: null, matches: [], primary: null };
  const dir = buildDirectory(db);
  const matches = dir[e164] || [];
  const sorted = [...matches].sort(
    (a, b) => (POP_PRIORITY[a.kind] ?? 9) - (POP_PRIORITY[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''),
  );
  return { number: e164, matches: sorted, primary: sorted[0] || null };
}

/**
 * screen-pop מתוך אינדקס-directory מוכן (מסלול המרכזייה-אצל-המפעיל).
 * זהה ל-lookupCaller אבל בלי לבנות אינדקס — מקבל directory שכבר נכתב לענן.
 * @param {Record<string,Array>} directory  פלט buildDirectory שנשמר
 * @param {string} rawNumber
 */
export function lookupInDirectory(directory, rawNumber) {
  const e164 = toE164(rawNumber);
  if (!e164) return { number: null, matches: [], primary: null };
  const matches = (directory && directory[e164]) || [];
  const sorted = [...matches].sort(
    (a, b) => (POP_PRIORITY[a.kind] ?? 9) - (POP_PRIORITY[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''),
  );
  return { number: e164, matches: sorted, primary: sorted[0] || null };
}

// ── item 48: עדיפות-הצגה מותאמת פר-ורטיקל ────────────────────────────────────
// חסד/חלוקה → משפחה קודם; תרומות/כולל → תומך קודם. ברירת-מחדל = POP_PRIORITY.
const VERTICAL_PRIORITY = {
  chesed: { family: 0, member: 1, supporter: 2, teacher: 3 },
  gemach: { family: 0, member: 1, supporter: 2, teacher: 3 },
  talmudtorah: { teacher: 0, member: 1, family: 2, supporter: 3 },
  shul: { supporter: 0, family: 1, member: 2, teacher: 3 },
  kollel: { supporter: 0, teacher: 1, member: 2, family: 3 },
};
export function popPriorityFor(vertical) {
  return VERTICAL_PRIORITY[vertical] || POP_PRIORITY;
}

// ── item 50: הצללת-מספר (תואם shell.privacy של מאור) ─────────────────────────
/** ממסך מספר לתצוגה: משאיר 4 ספרות אחרונות. "+972501112233" → "•••••••2233". */
export function maskNumber(e164) {
  if (typeof e164 !== 'string' || e164.length < 4) return e164;
  const tail = e164.slice(-4);
  return '•'.repeat(Math.max(0, e164.length - 4)) + tail;
}

// ── item 46+45+49: screen-pop payload מגורס (נכנס/יוצא), עם suggestion+privacy ─
/**
 * מבנה-ה-screen-pop המלא לצד-מאור. מגורס (SCREENPOP_VERSION), כולל העשרה,
 * עדיפות-פר-ורטיקל, הצעת-הוספה למתקשר-לא-מוכר, והצללה אם privacy.
 * @param {object} db  תצלום-DB של מאור
 * @param {string} rawNumber
 * @param {{direction?:'inbound'|'outbound', vertical?:string, privacy?:boolean, line?:string}} [opt]
 */
export function screenPop(db, rawNumber, opt = {}) {
  const direction = opt.direction === 'outbound' ? 'outbound' : 'inbound';
  const e164 = toE164(rawNumber);
  const base = { version: SCREENPOP_VERSION, direction, line: opt.line || null };
  if (!e164) return { ...base, number: null, matches: [], primary: null, suggestion: null };

  const prio = popPriorityFor(opt.vertical);
  const recIndex = {};
  for (const { kind, rec } of iterContacts(db)) recIndex[`${kind}:${rec.id}`] = rec;

  const dir = buildDirectory(db);
  const raw = dir[e164] || [];
  const matches = [...raw]
    .sort((a, b) => (prio[a.kind] ?? 9) - (prio[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''))
    .map((m) => {
      const rec = recIndex[`${m.kind}:${m.id}`];
      const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
      // כרטיס-חסד (opt-in opt.care): אותות-פעולה חיים. בצנעה — לא נכלל (עלול לחשוף מקבל-צדקה).
      if (opt.care && !opt.privacy) {
        const care = careSignals(db, m);
        if (Object.keys(care).length) base.care = care;
      }
      return base;
    });

  const number = opt.privacy ? maskNumber(e164) : e164;
  // מצב-צנעה: ממסך גם שדות-כסף בהעשרה (לא רק המספר).
  const shownMatches = opt.privacy ? matches.map((m) => ({ ...m, enrichment: stripMoney(m.enrichment) })) : matches;
  // item 45: מתקשר-לא-מוכר → הצעת-הוספה (בצנעה גם המספר-בהצעה ממוסך).
  const suggestion = matches.length
    ? null
    : { action: 'add', number: opt.privacy ? maskNumber(e164) : e164, kinds: direction === 'inbound' ? ['family', 'supporter'] : ['supporter'] };

  return { ...base, number, e164Masked: opt.privacy, matches: shownMatches, primary: shownMatches[0] || null, suggestion };
}

// ── item 42: אירוע-שיחה ל-EventType 'call' של מאור (additive) ─────────────────
/**
 * בונה רשומת-אירוע-שיחה בצורת מאור (type:'call'). additive — לא נוגע ברצף-קבלות.
 * @param {{number:string, direction?:string, startedAt:string, durationSec?:number,
 *          line?:string, primary?:object|null, note?:string}} p
 */
export function callEvent(p) {
  const e164 = toE164(p.number) || p.number || '';
  const dir = p.direction === 'outbound' ? 'יוצאת' : 'נכנסת';
  const who = p.primary ? p.primary.name : 'לא מזוהה';
  return {
    type: 'call',
    date: (p.startedAt || '').slice(0, 10),
    startedAt: p.startedAt || '',
    direction: p.direction === 'outbound' ? 'outbound' : 'inbound',
    number: e164,
    line: p.line || '',
    durationSec: Number.isFinite(p.durationSec) ? p.durationSec : 0,
    ...(p.primary ? { contactKind: p.primary.kind, contactId: p.primary.id, contactName: p.primary.name } : {}),
    title: `שיחה ${dir} · ${who}`,
    note: p.note || '',
  };
}

// ── item 8 · תרומה-בטלפון → כוונת-תרומה (מאור מנפיק את הקבלה; לא נוגע ב-R-/D-) ──
/**
 * בונה רשומת-**כוונת-תרומה** משיחה — additive, כמו callEvent. **אינה קבלה**:
 * מנוע-הקבלות של מאור (donationSeq/receiptSeq) הוא היחיד שמנפיק R-/D' רציף. כאן
 * רק "תרומה-נכנסה-בטלפון, אשר-והנפק" — שומר על אינווריאנט-הרציפות של מאור.
 * @param {{number:string, amount:number, cur?:string, designation?:string,
 *          startedAt:string, primary?:object|null, note?:string}} p
 * @returns {object|null} רשומת-כוונה (null אם סכום לא-תקין)
 */
export function donationIntent(p) {
  const amount = Number(p && p.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const e164 = toE164(p.number) || p.number || '';
  return {
    type: 'donationIntent', // מאור מזהה, מאשר, ומנפיק קבלה — לא נוצרת כאן קבלה
    receiptIssued: false, // אינווריאנט: הטלפוניה לעולם לא מנפיקה קבלת-מס
    date: (p.startedAt || '').slice(0, 10),
    startedAt: p.startedAt || '',
    number: e164,
    amount,
    cur: p.cur === '$' ? '$' : '₪',
    ...(typeof p.designation === 'string' && p.designation ? { designation: p.designation } : {}),
    ...(p.primary ? { contactKind: p.primary.kind, contactId: p.primary.id, contactName: p.primary.name } : {}),
    note: p.note || '',
  };
}

// ── item 43: click-to-call — קוד-החיוג להוצאת-שיחה מכרטיס-מאור ────────────────
/**
 * קוד-החיוג שהמנהל מקיש/הכפתור שולח כדי לחייג את e164 דרך מספר-הלקוח.
 * viaNumberId מצביע על number.id (SIM עם ערוץ) ⇒ "<ערוץ>#<יעד>"; אחרת ברירת-מחדל.
 * @param {object} tenant  tenant מנורמל (עם numbers[].gatewayChannel)
 * @param {string} rawTarget  היעד לחיוג
 * @param {{viaNumberId?:string}} [opt]
 */
export function dialString(tenant, rawTarget, opt = {}) {
  const target = toE164(rawTarget) || String(rawTarget || '');
  const sims = (tenant.numbers || []).filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
  const via = opt.viaNumberId && sims.find((n) => n.id === opt.viaNumberId);
  if (via) return `${via.gatewayChannel}#${target}`;
  return target; // ברירת-מחדל: יוצא דרך out_default של הדיאלפלן
}

// ── item 44: היסטוריית-שיחות פר-איש-קשר ──────────────────────────────────────
/** מסנן+ממיין לוג-שיחות (callEvent[]) למספר בודד, מהחדש לישן. */
export function callHistoryFor(logs, rawNumber) {
  const e164 = toE164(rawNumber);
  if (!e164) return [];
  return (Array.isArray(logs) ? logs : [])
    .filter((l) => toE164(l.number) === e164)
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

// ── item 9 · קמפיין-התרמה טלפוני (שכבת-הלוגיקה; החיוג-בפועל=runtime/חייגן) ────
/**
 * בונה תוכנית-קמפיין מרשימת-אנשי-קשר: לכל אחד מחרוזת-חיוג דרך ה-SIM של הלקוח,
 * עם דדופ (אותו מספר פעם-אחת) ודילוג-מנומק על לא-תקינים. downstream — יוצא
 * מהמספר של העמותה. החיוג-בפועל (להרים את השיחה) הוא ה-runtime; זו רק התוכנית.
 * @param {Array<{number:string, name?:string, id?:string}>} contacts
 * @param {object} tenant tenant מנורמל (numbers[].gatewayChannel)
 * @param {{viaNumberId?:string}} [opt] דרך איזה SIM לחייג (אחרת ברירת-מחדל)
 * @returns {{calls:Array<{name,e164,id,dialString}>, skipped:Array<{raw,reason}>, total:number}}
 */
export function campaignPlan(contacts, tenant, opt = {}) {
  const calls = [];
  const skipped = [];
  const seen = new Set();
  for (const c of Array.isArray(contacts) ? contacts : []) {
    const raw = c && (c.number ?? c.phone ?? '');
    const e164 = toE164(raw);
    if (!e164) { skipped.push({ raw: String(raw || ''), reason: 'מספר לא-תקין' }); continue; }
    if (seen.has(e164)) { skipped.push({ raw: e164, reason: 'כפול' }); continue; }
    seen.add(e164);
    calls.push({ name: (c && c.name) || '', id: (c && c.id != null) ? c.id : null, e164, dialString: dialString(tenant, e164, { viaNumberId: opt.viaNumberId }) });
  }
  return { calls, skipped, total: calls.length };
}

// ── item 10 · מפת-חום שיחות↔צרכים (שכבת-הלוגיקה; ה-UI בצד-מאור) ──────────────
/**
 * מאגד לוג-שיחות (callEvent[]) פר-איש-קשר, ומצליב מול צרכים חיים ממאור: מי
 * שהתקשר הרבה **וגם** יש לו אות-פעולה פתוח (מסירה/ממתין/הו״ק) עולה ל"רשימת-תשומת-
 * הלב" — "המשפחה הזו התקשרה 5× והחבילה שלה פגה". טהור, קריאה-בלבד.
 * @param {Array} logs מערך callEvent
 * @param {{db?:object, frequentThreshold?:number, since?:string}} [opt]
 * @returns {{total:number, contacts:Array, frequent:Array, attention:Array}}
 */
export function callHeatmap(logs, opt = {}) {
  const frequentThreshold = Number.isInteger(opt.frequentThreshold) && opt.frequentThreshold > 0 ? opt.frequentThreshold : 3;
  const since = opt.since || null;
  const events = (Array.isArray(logs) ? logs : []).filter((l) => l && l.number && (!since || String(l.startedAt) >= since));
  const byNum = new Map();
  for (const e of events) {
    const num = toE164(e.number) || e.number;
    const b = byNum.get(num) || { number: num, count: 0, inbound: 0, outbound: 0, lastCall: '', contactKind: null, contactId: null, contactName: '' };
    b.count++;
    if (e.direction === 'outbound') b.outbound++; else b.inbound++;
    if (String(e.startedAt || '') > String(b.lastCall)) b.lastCall = e.startedAt || '';
    if (e.contactName && !b.contactName) { b.contactName = e.contactName; b.contactKind = e.contactKind || null; b.contactId = e.contactId != null ? e.contactId : null; }
    byNum.set(num, b);
  }
  const contacts = [...byNum.values()].sort((a, b) => b.count - a.count || String(b.lastCall).localeCompare(String(a.lastCall)));
  const frequent = contacts.filter((c) => c.count >= frequentThreshold);
  const attention = [];
  if (opt.db) {
    for (const c of frequent) {
      if (!c.contactKind || c.contactId == null) continue;
      const care = careSignals(opt.db, { kind: c.contactKind, id: c.contactId });
      if (Object.keys(care).length) attention.push({ ...c, care });
    }
  }
  return { total: events.length, contacts, frequent, attention };
}
