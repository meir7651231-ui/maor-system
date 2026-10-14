// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/decompose/kinds.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SENSITIVE_FIELD = /^(phone\d?|phones|whatsapp|email|idNum|fatherId|motherId|health|address|last4|txn|ref|receipt|clearer|brand|security|pin|password|hash|salt|signature|photos?|logo|img|data|url|promoUrl|mime|extId|kevaId|dialCode)$/i;
const ID_FIELD = /^(id|rid|chargedRid|[a-z]+Id|[a-z]+Ids|by|defBy|cook|server|clearer|tableSetter|listingId)$/;
const TECH_FIELD = /^(updatedAt|reviewedAt|savedAt)$/;
const DATE_NAME = /(^date$|Date$|At$|^at$|^d$|^iso$|Iso$|^birth$|^until$|^nextTalk$|^lastTouch$|^featuredUntil$)/;
const MONEY_NAME = /^(amount|price\d?|total|totalDue|sum|cost|rate|ils|usd|budget|due|balance|carryBalance|fee|goal|orgGoal|lessonPrice\d?|promoPrice|shopValue|value|a)$/;
const QTY_NAME = /^(qty|count|beds|cap|purchased|used|size|maxStudents|stock|minStock|kids|adults|perGuest|dinerCount|hours|eyes|days|baseServings|score|kidsHome|kidsMarried|pays|termMonths|freq|years|temp)$/;
const TEXT_NAME = /^(name|first|title|text|desc|description|notes?|headline|body|label|cat|category|mealName|tagline|reason|forWho|community|city|area|school|grade|semester|sector|audience|role|type|customType|kashrut|hoursNote|allergens|alg|place|prayer|advertiser|designation|purpose|method|nextNote|answeredNote|q|unit|device|chair|noticeKind|target|languages|ingredients|steps|services)$/;
const PERSON_TEXT_NAME = /^(first|father|mother|advertiser|requester|forWho|designation)$/;
const OPEN_STATUS = ['open', 'pending', 'wait', 'new', 'inprogress', 'pickup', 'enroute', 'lead', 'eyes', 'answer'];
const SPAN_PAIRS = [
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
const clean = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
function arrayElement(type) {
    const t = clean(type).replace(/^readonly /, '');
    let m = /^Array<(.+)>$/.exec(t);
    if (m)
        return clean(m[1]);
    m = /^\((.+)\)\[\]$/.exec(t);
    if (m)
        return clean(m[1]);
    m = /^([A-Za-z_][\w.]*)\[\]$/.exec(t);
    if (m)
        return m[1];
    m = /^(\{.*\})\[\]$/.exec(t);
    if (m)
        return m[1];
    return null;
}
function unionParts(type) {
    const t = clean(type);
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of t) {
        if (ch === '<' || ch === '{' || ch === '(' || ch === '[')
            depth++;
        if (ch === '>' || ch === '}' || ch === ')' || ch === ']')
            depth--;
        if (ch === '|' && depth === 0) {
            out.push(cur.trim());
            cur = '';
        }
        else
            cur += ch;
    }
    out.push(cur.trim());
    return out.filter((p) => p && p !== 'null' && p !== 'undefined' && p !== "''" && p !== '""');
}
function stringLiterals(type) {
    const parts = unionParts(type);
    if (!parts.length)
        return [];
    const out = [];
    for (const p of parts) {
        const m = /^'([^']*)'$/.exec(p) ?? /^"([^"]*)"$/.exec(p);
        if (!m)
            return [];
        out.push(m[1]);
    }
    return out;
}
const isDateType = (t) => unionParts(t).some((p) => p === 'IsoDate');
const isClockType = (t) => unionParts(t).some((p) => p === 'TimeHM');
const isNumber = (t) => unionParts(t).length > 0 && unionParts(t).every((p) => p === 'number');
const isString = (t) => unionParts(t).length > 0 && unionParts(t).every((p) => p === 'string');
function classifyField(type, field) {
    const t = clean(type);
    const f = String(field ?? '');
    if (SENSITIVE_FIELD.test(f))
        return { kind: null, reason: 'פרטי קשר, מזהה אישי או מידע רגיש — לא מקום' };
    if (ID_FIELD.test(f))
        return { kind: null, reason: 'הפניה לרשומה אחרת — לא נתון' };
    if (TECH_FIELD.test(f))
        return { kind: null, reason: 'רגע טכני (עדכון/בדיקה) — לא נתון של העבודה' };
    const el = arrayElement(t);
    if (el !== null) {
        if (isDateType(el))
            return { kind: 'times', reason: 'רשימת תאריכים' };
        if (isClockType(el))
            return { kind: 'times', reason: 'רשימת שעות' };
        if (el === 'string' && TEXT_NAME.test(f))
            return { kind: 'text', reason: 'רשימת מילים' };
        return { kind: null, reason: 'רשימה — נבדקת לפי הפריט שבה' };
    }
    if (isDateType(t))
        return { kind: 'times', reason: 'תאריך (IsoDate)' };
    if (isClockType(t))
        return { kind: 'times', reason: 'שעה ביום (TimeHM)' };
    if (isString(t) && DATE_NAME.test(f))
        return { kind: 'times', reason: 'רגע לפי שם השדה' };
    if (isNumber(t) && MONEY_NAME.test(f))
        return { kind: 'amount', reason: 'סכום כסף לפי שם השדה' };
    if (isNumber(t) && QTY_NAME.test(f))
        return { kind: 'amount', reason: 'כמות לפי שם השדה' };
    if (isNumber(t))
        return { kind: null, reason: 'מספר בלי משמעות ברורה (לא כסף ולא כמות)' };
    if (stringLiterals(t).length)
        return { kind: null, reason: 'בחירה מתוך רשימה קבועה — נבדקת כסטטוס' };
    if (isString(t) && (TEXT_NAME.test(f) || PERSON_TEXT_NAME.test(f)))
        return { kind: 'text', reason: 'טקסט חופשי' };
    if (isString(t))
        return { kind: null, reason: 'טקסט טכני (לא שם ולא תיאור)' };
    if (unionParts(t).every((p) => p === 'boolean'))
        return { kind: null, reason: 'כן/לא בודד' };
    return { kind: null, reason: 'טיפוס מורכב — לא אחד מששת הסוגים' };
}
const unit = (f) => {
    const r = classifyField(f.type, f.name === 'first' || f.name === 'last' ? 'date' : f.name === 'from' || f.name === 'to' ? 'at' : f.name);
    if (isNumber(f.type) && (QTY_NAME.test(f.name) || /Min$|Max$/.test(f.name)))
        return 'number';
    if (r.kind !== 'times')
        return null;
    return isClockType(f.type) ? 'clock' : 'date';
};
export function inner$arrayElement$t(type) {
    const t = clean(type).replace(/^readonly /, '');
    return t;
}
export function inner$arrayElement$m(type) {
    const t = clean(type).replace(/^readonly /, '');
    let m = /^Array<(.+)>$/.exec(t);
    return m;
}
export function inner$arrayElement$m$$step(t) {
    let m = /^Array<(.+)>$/.exec(t);
    return m;
}
export function inner$unionParts$t(type) {
    const t = clean(type);
    return t;
}
export function inner$stringLiterals$parts(type) {
    const parts = unionParts(type);
    return parts;
}
export function inner$stringLiterals$m(p) {
    const m = /^'([^']*)'$/.exec(p) ?? /^"([^"]*)"$/.exec(p);
    return m;
}
export function inner$classifyField$t(type) {
    const t = clean(type);
    return t;
}
export function inner$classifyField$f(field) {
    const f = String(field ?? '');
    return f;
}
export function inner$classifyField$el(type) {
    const t = clean(type);
    const el = arrayElement(t);
    return el;
}
export function inner$classifyField$el$$step(t) {
    const el = arrayElement(t);
    return el;
}
export function inner$spanPairs$by(fields) {
    const by = new Map(fields.map((f) => [f.name, f]));
    return by;
}
export function inner$spanPairs$fa(fields, a) {
    const by = new Map(fields.map((f) => [f.name, f]));
    const fa = by.get(a);
    return fa;
}
export function inner$spanPairs$fa$$step(by, a) {
    const fa = by.get(a);
    return fa;
}
export function inner$spanPairs$fb(fields, b) {
    const by = new Map(fields.map((f) => [f.name, f]));
    const fb = by.get(b);
    return fb;
}
export function inner$spanPairs$fb$$step(by, b) {
    const fb = by.get(b);
    return fb;
}
export function inner$spanPairs$unit$r(f) {
    const r = classifyField(f.type, f.name === 'first' || f.name === 'last' ? 'date' : f.name === 'from' || f.name === 'to' ? 'at' : f.name);
    return r;
}
export function inner$spanPairs$ua(fields, a) {
    const by = new Map(fields.map((f) => [f.name, f]));
    const fa = by.get(a);
    const ua = unit(fa);
    return ua;
}
export function inner$spanPairs$ua$$step(fa) {
    const ua = unit(fa);
    return ua;
}
export function inner$waitingOf$lits(f) {
    const lits = stringLiterals(f.type);
    return lits;
}
export function inner$waitingOf$open(f) {
    const lits = stringLiterals(f.type);
    const open = lits.filter((l) => OPEN_STATUS.includes(l));
    return open;
}
export function inner$waitingOf$open$$step(lits) {
    const open = lits.filter((l) => OPEN_STATUS.includes(l));
    return open;
}
export function inner$waitingOf$done(fields) {
    const done = fields.find((f) => f.name === 'done' && unionParts(f.type).every((p) => p === 'boolean'));
    return done;
}
export function inner$dateFieldOf$f(fields, p) {
    const f = fields.find((x) => x.name === p);
    return f;
}
export function inner$dateFieldOf$any(fields) {
    const any = fields.find((f) => !arrayElement(f.type) && classifyField(f.type, f.name).kind === 'times' && !isClockType(f.type));
    return any;
}
export function inner$classifyReturn$t(type) {
    const t = clean(type);
    return t;
}
export function inner$classifyReturn$n(fnName) {
    const n = String(fnName ?? '');
    return n;
}
export function inner$classifyReturn$el(type) {
    const t = clean(type);
    const el = arrayElement(t);
    return el;
}
export function inner$classifyReturn$el$$step(t) {
    const el = arrayElement(t);
    return el;
}
export function inner$spanPairs$out$$after_loop(fields) {
    const by = new Map(fields.map((f) => [f.name, f]));
    const out = [];
    for (const [a, b] of SPAN_PAIRS) {
        const fa = by.get(a);
        const fb = by.get(b);
        if (!fa || !fb)
            continue;
        const unit = (f) => {
            const r = classifyField(f.type, f.name === 'first' || f.name === 'last' ? 'date' : f.name === 'from' || f.name === 'to' ? 'at' : f.name);
            if (isNumber(f.type) && (QTY_NAME.test(f.name) || /Min$|Max$/.test(f.name)))
                return 'number';
            if (r.kind !== 'times')
                return null;
            return isClockType(f.type) ? 'clock' : 'date';
        };
        const ua = unit(fa);
        if (ua && ua === unit(fb))
            out.push({ from: a, to: b, unit: ua });
    }
    return out;
}

export const SIGS = {
  inner$arrayElement$t: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$arrayElement$m: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$arrayElement$m$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$unionParts$t: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$stringLiterals$parts: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$stringLiterals$m: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$classifyField$t: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$classifyField$f: [{"name":"field","d":{"t":"str"},"opt":false}],
  inner$classifyField$el: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$classifyField$el$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$spanPairs$by: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$spanPairs$fa: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"a","d":{"t":"str"},"opt":false}],
  inner$spanPairs$fa$$step: [{"name":"by","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"a","d":{"t":"str"},"opt":false}],
  inner$spanPairs$fb: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$spanPairs$fb$$step: [{"name":"by","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$spanPairs$unit$r: [{"name":"f","d":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$spanPairs$ua: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"a","d":{"t":"str"},"opt":false}],
  inner$spanPairs$ua$$step: [{"name":"fa","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$waitingOf$lits: [{"name":"f","d":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$waitingOf$open: [{"name":"f","d":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$waitingOf$open$$step: [{"name":"lits","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waitingOf$done: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$dateFieldOf$f: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"p","d":{"t":"str"},"opt":false}],
  inner$dateFieldOf$any: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$classifyReturn$t: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$classifyReturn$n: [{"name":"fnName","d":{"t":"str"},"opt":false}],
  inner$classifyReturn$el: [{"name":"type","d":{"t":"str"},"opt":false}],
  inner$classifyReturn$el$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$spanPairs$out$$after_loop: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","n":"FieldInfo","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["raw",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["optional",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
};
