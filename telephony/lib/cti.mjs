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
};
// שם-המערך ב-DB → kind יחיד.
const COLLECTION_KIND = {
  families: 'family',
  members: 'member',
  teachers: 'teacher',
  supporters: 'supporter',
};

function* iterContacts(db) {
  for (const [coll, kind] of Object.entries(COLLECTION_KIND)) {
    const arr = Array.isArray(db?.[coll]) ? db[coll] : [];
    for (const rec of arr) {
      if (rec && rec.id != null) yield { kind, rec };
    }
  }
}

/**
 * בונה אינדקס e164 → רשימת-אנשי-קשר. זה מה שנכתב (opt-in) ל-directory בענן.
 * מיפוי רב-לאחד: אותו מספר יכול להופיע אצל כמה אנשי-קשר (משפחה+תומך וכו').
 * @param {object} db  { families?, members?, teachers?, supporters? }
 * @returns {Record<string, Array<{kind:string,id:string,name:string,field:string}>>}
 */
export function buildDirectory(db) {
  const dir = {};
  for (const { kind, rec } of iterContacts(db)) {
    for (const field of PHONE_FIELDS[kind]) {
      const e164 = toE164(rec[field]);
      if (!e164) continue;
      (dir[e164] ||= []).push({ kind, id: String(rec.id), name: rec.name || '', field });
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
const POP_PRIORITY = { supporter: 0, family: 1, teacher: 2, member: 3 };

/**
 * screen-pop למספר בודד. מצליב מול תצלום-DB חי (מסלול local-first).
 * @param {object} db
 * @param {string} rawNumber  מספר גולמי (מתוך inbound_number של הדיאלפלן)
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
