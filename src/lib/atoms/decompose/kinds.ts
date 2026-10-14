/**
 * 🔨 המפרק · כללי-הסוגים (ATOMS-DECOMPOSE, 14.10.2026).
 * טקסט-טיפוס של TypeScript + שם-שדה ⇒ אחד משישת הסוגים (או null), תמיד עם הסיבה בעברית.
 * משותף לסקריפט (`scripts/atoms-decompose.mjs` טוען את הקובץ הזה ישירות) ולבדיקות — מקור-אמת אחד לכללים.
 * טהור, דטרמיניסטי, לא זורק. ⚠️ תחביר-מחיק בלבד (Node מריץ אותו בלי קומפילציה): בלי enum/namespace, ייבוא-טיפוס בלבד.
 */
import type { Kind } from '../contract';

export interface KindVerdict {
  kind: Kind | null;
  /** למה — בעברית פשוטה. */
  reason: string;
}

/** שדה ברשומה, כפי שהסקריפט קורא אותו מ-domain.ts. */
export interface FieldInfo {
  name: string;
  /** טקסט-הטיפוס אחרי פתירת כינויים פשוטים (למשל `'open' | 'done'` במקום `HostFaultStatus`). */
  type: string;
  /** טקסט-הטיפוס כפי שנכתב (למשל `IsoDate | ''`). */
  raw?: string;
  optional?: boolean;
}

/* ───────── שמות-שדות ───────── */

/** לעולם לא מקום: פרטי-קשר, מזהים, מידע רגיש ותוכן בינארי. נבדק ראשון. */
export const SENSITIVE_FIELD = /^(phone\d?|phones|whatsapp|email|idNum|fatherId|motherId|health|address|last4|txn|ref|receipt|clearer|brand|security|pin|password|hash|salt|signature|photos?|logo|img|data|url|promoUrl|mime|extId|kevaId|dialCode)$/i;
/** מזהה או הפניה לרשומה אחרת — לא נתון. */
export const ID_FIELD = /^(id|rid|chargedRid|[a-z]+Id|[a-z]+Ids|by|defBy|cook|server|clearer|tableSetter|listingId)$/;
/** רגעים טכניים — לא מקום. */
export const TECH_FIELD = /^(updatedAt|reviewedAt|savedAt)$/;
/** תאריך או רגע לפי השם (כשהטיפוס הוא string ולא IsoDate). */
export const DATE_NAME = /(^date$|Date$|At$|^at$|^d$|^iso$|Iso$|^birth$|^until$|^nextTalk$|^lastTouch$|^featuredUntil$)/;
/** כסף. */
export const MONEY_NAME = /^(amount|price\d?|total|totalDue|sum|cost|rate|ils|usd|budget|due|balance|carryBalance|fee|goal|orgGoal|lessonPrice\d?|promoPrice|shopValue|value|a)$/;
/** כמות (סוג "סכום או כמות"). */
export const QTY_NAME = /^(qty|count|beds|cap|purchased|used|size|maxStudents|stock|minStock|kids|adults|perGuest|dinerCount|hours|eyes|days|baseServings|score|kidsHome|kidsMarried|pays|termMonths|freq|years|temp)$/;
/** טקסט חופשי — אפשר לחפש בו. */
export const TEXT_NAME = /^(name|first|title|text|desc|description|notes?|headline|body|label|cat|category|mealName|tagline|reason|forWho|community|city|area|school|grade|semester|sector|audience|role|type|customType|kashrut|hoursNote|allergens|alg|place|prayer|advertiser|designation|purpose|method|nextNote|answeredNote|q|unit|device|chair|noticeKind|target|languages|ingredients|steps|services)$/;
/** טקסט שמותר להראות ממנו מילה בתצוגה — רק תוויות של דברים (לא של אנשים), ורק ברשומה שאין בה טלפון. */
export const ECHO_TEXT_NAME = /^(name|title|cat|category|label|mealName|semester|sector|type|unit)$/;
/** תווית של אדם — לעולם לא מוצגת, גם ברשומה בלי טלפון. */
export const PERSON_TEXT_NAME = /^(first|father|mother|advertiser|requester|forWho|designation)$/;

/** סטטוסים שפירושם "מחכה" — רשומה עם אחד מהם = משהו שמחכה לתשובה. */
export const OPEN_STATUS = ['open', 'pending', 'wait', 'new', 'inprogress', 'pickup', 'enroute', 'lead', 'eyes', 'answer'] as const;

/** זוגות התחלה/סוף ⇒ טווח. */
export const SPAN_PAIRS: readonly (readonly [string, string])[] = [
  ['start', 'end'],
  ['from', 'to'],
  ['checkIn', 'checkOut'],
  ['ageMin', 'ageMax'],
  ['gradeMin', 'gradeMax'],
  ['first', 'last'],
  ['startIso', 'endIso'],
  ['sunrise', 'sunset'],
  ['candle', 'end'],
];

/* ───────── עזרים לטקסט-טיפוס ───────── */

const clean = (t: unknown): string => String(t ?? '').replace(/\s+/g, ' ').trim();

/** `X[]` / `Array<X>` / `readonly X[]` ⇒ X; אחרת null. */
export function arrayElement(type: string): string | null {
  const t = clean(type).replace(/^readonly /, '');
  let m = /^Array<(.+)>$/.exec(t);
  if (m) return clean(m[1]);
  m = /^\((.+)\)\[\]$/.exec(t);
  if (m) return clean(m[1]);
  m = /^([A-Za-z_][\w.]*)\[\]$/.exec(t);
  if (m) return m[1];
  m = /^(\{.*\})\[\]$/.exec(t);
  if (m) return m[1];
  return null;
}

/** החלקים של איחוד (ברמה העליונה בלבד), בלי null/undefined/''. */
export function unionParts(type: string): string[] {
  const t = clean(type);
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of t) {
    if (ch === '<' || ch === '{' || ch === '(' || ch === '[') depth++;
    if (ch === '>' || ch === '}' || ch === ')' || ch === ']') depth--;
    if (ch === '|' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter((p) => p && p !== 'null' && p !== 'undefined' && p !== "''" && p !== '""');
}

/** ערכי-מחרוזת מילוליים של איחוד (`'open' | 'done'`); לא איחוד מילולי ⇒ []. */
export function stringLiterals(type: string): string[] {
  const parts = unionParts(type);
  if (!parts.length) return [];
  const out: string[] = [];
  for (const p of parts) {
    const m = /^'([^']*)'$/.exec(p) ?? /^"([^"]*)"$/.exec(p);
    if (!m) return [];
    out.push(m[1]);
  }
  return out;
}

const isDateType = (t: string): boolean => unionParts(t).some((p) => p === 'IsoDate');
const isClockType = (t: string): boolean => unionParts(t).some((p) => p === 'TimeHM');
const isNumber = (t: string): boolean => unionParts(t).length > 0 && unionParts(t).every((p) => p === 'number');
const isString = (t: string): boolean => unionParts(t).length > 0 && unionParts(t).every((p) => p === 'string');

/* ───────── הכללים ───────── */

/**
 * שדה בודד ⇒ סוג. הסדר קובע: רגיש ⇒ מזהה ⇒ תאריך ⇒ שעה ⇒ כסף ⇒ כמות ⇒ טקסט ⇒ אחר.
 * רשימות (`X[]`) — הסקריפט פותח אותן לפי הפריט; כאן רק רשימת תאריכים/שעות/טקסטים פשוטה.
 */
export function classifyField(type: string, field: string): KindVerdict {
  const t = clean(type);
  const f = String(field ?? '');
  if (SENSITIVE_FIELD.test(f)) return { kind: null, reason: 'פרטי קשר, מזהה אישי או מידע רגיש — לא מקום' };
  if (ID_FIELD.test(f)) return { kind: null, reason: 'הפניה לרשומה אחרת — לא נתון' };
  if (TECH_FIELD.test(f)) return { kind: null, reason: 'רגע טכני (עדכון/בדיקה) — לא נתון של העבודה' };
  const el = arrayElement(t);
  if (el !== null) {
    if (isDateType(el)) return { kind: 'times', reason: 'רשימת תאריכים' };
    if (isClockType(el)) return { kind: 'times', reason: 'רשימת שעות' };
    if (el === 'string' && TEXT_NAME.test(f)) return { kind: 'text', reason: 'רשימת מילים' };
    return { kind: null, reason: 'רשימה — נבדקת לפי הפריט שבה' };
  }
  if (isDateType(t)) return { kind: 'times', reason: 'תאריך (IsoDate)' };
  if (isClockType(t)) return { kind: 'times', reason: 'שעה ביום (TimeHM)' };
  if (isString(t) && DATE_NAME.test(f)) return { kind: 'times', reason: 'רגע לפי שם השדה' };
  if (isNumber(t) && MONEY_NAME.test(f)) return { kind: 'amount', reason: 'סכום כסף לפי שם השדה' };
  if (isNumber(t) && QTY_NAME.test(f)) return { kind: 'amount', reason: 'כמות לפי שם השדה' };
  if (isNumber(t)) return { kind: null, reason: 'מספר בלי משמעות ברורה (לא כסף ולא כמות)' };
  if (stringLiterals(t).length) return { kind: null, reason: 'בחירה מתוך רשימה קבועה — נבדקת כסטטוס' };
  if (isString(t) && (TEXT_NAME.test(f) || PERSON_TEXT_NAME.test(f))) return { kind: 'text', reason: 'טקסט חופשי' };
  if (isString(t)) return { kind: null, reason: 'טקסט טכני (לא שם ולא תיאור)' };
  if (unionParts(t).every((p) => p === 'boolean')) return { kind: null, reason: 'כן/לא בודד' };
  return { kind: null, reason: 'טיפוס מורכב — לא אחד מששת הסוגים' };
}

/** האם מותר להראות מילה מהטקסט הזה בתצוגה. רשומה עם טלפון = אדם או עסק ⇒ לעולם לא. */
export function textEcho(field: string, recordHasPhone: boolean): boolean {
  return !recordHasPhone && ECHO_TEXT_NAME.test(field) && !PERSON_TEXT_NAME.test(field);
}

/** זוגות התחלה/סוף ברשומה ⇒ טווחים. שני הצדדים חייבים להיות תאריך/שעה/מספר מאותו סוג. */
export function spanPairs(fields: readonly FieldInfo[]): { from: string; to: string; unit: 'date' | 'clock' | 'number' }[] {
  const by = new Map(fields.map((f) => [f.name, f]));
  const out: { from: string; to: string; unit: 'date' | 'clock' | 'number' }[] = [];
  for (const [a, b] of SPAN_PAIRS) {
    const fa = by.get(a);
    const fb = by.get(b);
    if (!fa || !fb) continue;
    const unit = (f: FieldInfo): 'date' | 'clock' | 'number' | null => {
      const r = classifyField(f.type, f.name === 'first' || f.name === 'last' ? 'date' : f.name === 'from' || f.name === 'to' ? 'at' : f.name);
      if (isNumber(f.type) && (QTY_NAME.test(f.name) || /Min$|Max$/.test(f.name))) return 'number';
      if (r.kind !== 'times') return null;
      return isClockType(f.type) ? 'clock' : 'date';
    };
    const ua = unit(fa);
    if (ua && ua === unit(fb)) out.push({ from: a, to: b, unit: ua });
  }
  return out;
}

/** רשומה "מחכה": שדה status עם ערכים פתוחים, או done:boolean. אין ⇒ null. */
export function waitingOf(fields: readonly FieldInfo[]): { status: string; open: string[] } | { done: string } | null {
  for (const f of fields) {
    if (f.name !== 'status' && f.name !== 'stage') continue;
    const lits = stringLiterals(f.type);
    const open = lits.filter((l) => (OPEN_STATUS as readonly string[]).includes(l));
    // שדה שכל ערכיו "פתוחים" לא מבדיל כלום
    if (open.length && open.length < lits.length) return { status: f.name, open };
  }
  const done = fields.find((f) => f.name === 'done' && unionParts(f.type).every((p) => p === 'boolean'));
  return done ? { done: 'done' } : null;
}

/** שדה-הרגע שממנו "מחכה" — לפי סדר עדיפות. */
export const WAIT_SINCE = ['createdAt', 'addedAt', 'enrolledAt', 'date', 'nextTalk', 'updatedAt'] as const;

/** שדה-התאריך של פריט ברשימה (לרצף) — לפי סדר עדיפות. */
export function dateFieldOf(fields: readonly FieldInfo[]): string | null {
  const pref = ['date', 'd', 'at', 'checkIn', 'start', 'createdAt', 'addedAt'];
  for (const p of pref) {
    const f = fields.find((x) => x.name === p);
    if (f && classifyField(f.type, f.name).kind === 'times' && !isClockType(f.type)) return f.name;
  }
  const any = fields.find((f) => !arrayElement(f.type) && classifyField(f.type, f.name).kind === 'times' && !isClockType(f.type));
  return any ? any.name : null;
}

/**
 * ערך-חזרה שהוא רשומה (או רשימת רשומות) ⇒ סוג, לפי השדות שלה:
 * רשימה של רשומות מתוארכות ⇒ רצף · רשימה של רשומות עם שעה ⇒ זמנים · רשימה של חלונות (התחלה/סוף) ⇒ רצף ·
 * רשומה אחת עם התחלה/סוף ⇒ טווח.
 */
export function classifyStruct(fields: readonly FieldInfo[], isArray: boolean): KindVerdict {
  if (isArray) {
    if (dateFieldOf(fields)) return { kind: 'sequence', reason: 'מחזיר רשימה של רשומות מתוארכות' };
    if (fields.some((f) => isClockType(f.type) && f.name === 'time')) return { kind: 'times', reason: 'מחזיר רשימה של שעות' };
    if (spanPairs(fields).length) return { kind: 'sequence', reason: 'מחזיר רשימה של חלונות' };
    return { kind: null, reason: 'מחזיר רשימה של רשומות בלי זמן' };
  }
  if (spanPairs(fields).length) return { kind: 'span', reason: 'מחזיר התחלה וסוף' };
  return { kind: null, reason: 'מחזיר רשומה שאינה אחד מששת הסוגים' };
}

/**
 * ערך-חזרה של פונקציה ⇒ סוג (לפונקציות-גישה: מקבלות Db או רשומה ומחזירות ערך).
 * לפי הטיפוס המוצהר ושם הפונקציה. בלי טיפוס מוצהר ⇒ null (המפרק לא מנחש).
 */
export function classifyReturn(type: string, fnName: string): KindVerdict {
  const t = clean(type);
  const n = String(fnName ?? '');
  if (!t) return { kind: null, reason: 'אין טיפוס-חזרה מוצהר' };
  const el = arrayElement(t);
  if (el !== null) {
    if (isDateType(el)) return { kind: 'times', reason: 'מחזיר רשימת תאריכים' };
    if (isClockType(el)) return { kind: 'times', reason: 'מחזיר רשימת שעות' };
    if (el === 'boolean' || el === 'Run') return { kind: 'sequence', reason: 'מחזיר רשימה של כן/לא' };
    if (el === 'string' && /(dates?|days|times|moments)$/i.test(n)) return { kind: 'times', reason: 'מחזיר רשימת מועדים (לפי השם)' };
    return { kind: null, reason: 'מחזיר רשימה של משהו אחר' };
  }
  if (/^(Span|MinuteSpan|\{ ?from: (number|string); to: (number|string);? ?\})$/.test(t)) return { kind: 'span', reason: 'מחזיר התחלה וסוף' };
  if (isDateType(t)) return { kind: 'times', reason: 'מחזיר תאריך' };
  if (isNumber(t) && /(total|sum|balance|due|paid|amount|price|cost|ils|usd|debt|owed|income|revenue|budget|value|ltv)/i.test(n))
    return { kind: 'amount', reason: 'מחזיר סכום (לפי השם)' };
  if (isNumber(t) && /(count|qty|nights|left|remaining|stock|capacity|seats)/i.test(n)) return { kind: 'amount', reason: 'מחזיר כמות (לפי השם)' };
  if (isNumber(t)) return { kind: null, reason: 'מחזיר מספר בלי משמעות ברורה' };
  return { kind: null, reason: 'מחזיר משהו שאינו אחד מששת הסוגים' };
}
