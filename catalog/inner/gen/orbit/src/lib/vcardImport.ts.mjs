// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/vcardImport.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEX2 = /^[0-9A-Fa-f]{2}$/;
function unfoldLines(text) {
    const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const out = [];
    let qpActive = false; // השורה-הלוגית הנוכחית היא QP וממתינה להמשך רך
    for (const line of raw) {
        // קיפול-vCard רגיל: המשך בהזחה מצטרף לקודמת.
        if (out.length && (line.startsWith(' ') || line.startsWith('\t'))) {
            out[out.length - 1] += line.slice(1);
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        // ריכוך-QP: רק כשהשורה-הלוגית הנוכחית היא QP ונגמרת ב-'='.
        if (out.length && qpActive && out[out.length - 1].endsWith('=')) {
            out[out.length - 1] = out[out.length - 1].slice(0, -1) + line;
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        // שורה-לוגית חדשה — QP-פעיל אם היא שדה-QP שנגמר ב-'=' (ממתין להמשך).
        out.push(line);
        qpActive = /ENCODING=QUOTED-PRINTABLE/i.test(line) && line.endsWith('=');
    }
    return out;
}
function splitProperty(line) {
    const colon = line.indexOf(':');
    if (colon < 0)
        return null;
    const head = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const segs = head.split(';');
    const name = (segs.shift() || '').trim().toUpperCase();
    if (!name)
        return null;
    return { name, params: segs, value };
}
const digitsOnly = (s) => (s || '').replace(/\D/g, '');
export function inner$decodeQuotedPrintable$cp(s, i) {
    const cp = s.charCodeAt(i);
    return cp;
}
export function inner$unfoldLines$raw(text) {
    const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    return raw;
}
export function inner$splitProperty$colon(line) {
    const colon = line.indexOf(':');
    return colon;
}
export function inner$splitProperty$head(line) {
    const colon = line.indexOf(':');
    const head = line.slice(0, colon);
    return head;
}
export function inner$splitProperty$head$$step(line, colon) {
    const head = line.slice(0, colon);
    return head;
}
export function inner$splitProperty$value(line) {
    const colon = line.indexOf(':');
    const value = line.slice(colon + 1);
    return value;
}
export function inner$splitProperty$value$$step(line, colon) {
    const value = line.slice(colon + 1);
    return value;
}
export function inner$splitProperty$segs(line) {
    const colon = line.indexOf(':');
    const head = line.slice(0, colon);
    const segs = head.split(';');
    return segs;
}
export function inner$splitProperty$segs$$step(head) {
    const segs = head.split(';');
    return segs;
}
export function inner$phoneLabel$up(p) {
    const up = p.toUpperCase();
    return up;
}
export function inner$phoneLabel$inner(p) {
    const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
    return inner;
}
export function inner$phoneLabel$parts(p) {
    const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
    const parts = inner.split(',');
    return parts;
}
export function inner$phoneLabel$parts$$step(inner) {
    const parts = inner.split(',');
    return parts;
}
export function inner$phoneLabel$last(p) {
    const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
    const parts = inner.split(',');
    const last = parts[parts.length - 1] || '';
    return last;
}
export function inner$phoneLabel$last$$step(parts) {
    const last = parts[parts.length - 1] || '';
    return last;
}
export function inner$phoneLabel$key(p) {
    const key = p.toUpperCase().trim();
    return key;
}
export function inner$parseVcards$lines(text) {
    const lines = unfoldLines(text || '');
    return lines;
}
export function inner$parseVcards$trimmed(line) {
    const trimmed = line.trim();
    return trimmed;
}
export function inner$parseVcards$prop(line) {
    const prop = splitProperty(line);
    return prop;
}
export function inner$parseVcards$segs(decoded) {
    const segs = decoded.split(';');
    return segs;
}
export function inner$parseVcards$v(value) {
    const v = value.trim();
    return v;
}
export function inner$isJunkContact$realPhone(c) {
    const realPhone = c.phones.some((p) => digitsOnly(p.value).length >= 5);
    return realPhone;
}
export function inner$contactToRow$notes(c) {
    const notes = [c.org ? '🏢 ' + c.org : '', c.title, c.note].filter(Boolean).join(' · ');
    return notes;
}
export function inner$decodeQuotedPrintable$bytes$$after_loop(s) {
    const bytes = [];
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '=' && i + 2 < s.length && HEX2.test(s.slice(i + 1, i + 3))) {
            bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
            i += 2;
        }
        else {
            // תו ASCII רגיל — code-point בטווח בית בודד; מעל 0xFF נשמר כמות-שהוא (נדיר).
            const cp = s.charCodeAt(i);
            bytes.push(cp <= 0xff ? cp : 0x3f /* '?' */);
        }
    }
    return bytes;
}
export function inner$unfoldLines$out$$after_loop(text) {
    const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const out = [];
    let qpActive = false;
    for (const line of raw) {
        // קיפול-vCard רגיל: המשך בהזחה מצטרף לקודמת.
        if (out.length && (line.startsWith(' ') || line.startsWith('\t'))) {
            out[out.length - 1] += line.slice(1);
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        // ריכוך-QP: רק כשהשורה-הלוגית הנוכחית היא QP ונגמרת ב-'='.
        if (out.length && qpActive && out[out.length - 1].endsWith('=')) {
            out[out.length - 1] = out[out.length - 1].slice(0, -1) + line;
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        // שורה-לוגית חדשה — QP-פעיל אם היא שדה-QP שנגמר ב-'=' (ממתין להמשך).
        out.push(line);
        qpActive = /ENCODING=QUOTED-PRINTABLE/i.test(line) && line.endsWith('=');
    }
    return out;
}
export function inner$unfoldLines$qpActive$$after_loop(text) {
    const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const out = [];
    let qpActive = false;
    for (const line of raw) {
        // קיפול-vCard רגיל: המשך בהזחה מצטרף לקודמת.
        if (out.length && (line.startsWith(' ') || line.startsWith('\t'))) {
            out[out.length - 1] += line.slice(1);
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        // ריכוך-QP: רק כשהשורה-הלוגית הנוכחית היא QP ונגמרת ב-'='.
        if (out.length && qpActive && out[out.length - 1].endsWith('=')) {
            out[out.length - 1] = out[out.length - 1].slice(0, -1) + line;
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        // שורה-לוגית חדשה — QP-פעיל אם היא שדה-QP שנגמר ב-'=' (ממתין להמשך).
        out.push(line);
        qpActive = /ENCODING=QUOTED-PRINTABLE/i.test(line) && line.endsWith('=');
    }
    return qpActive;
}

export const SIGS = {
  inner$decodeQuotedPrintable$cp: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$unfoldLines$raw: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$splitProperty$colon: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitProperty$head: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitProperty$head$$step: [{"name":"line","d":{"t":"str"},"opt":false},{"name":"colon","d":{"t":"num"},"opt":false}],
  inner$splitProperty$value: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitProperty$value$$step: [{"name":"line","d":{"t":"str"},"opt":false},{"name":"colon","d":{"t":"num"},"opt":false}],
  inner$splitProperty$segs: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$splitProperty$segs$$step: [{"name":"head","d":{"t":"str"},"opt":false}],
  inner$phoneLabel$up: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$phoneLabel$inner: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$phoneLabel$parts: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$phoneLabel$parts$$step: [{"name":"inner","d":{"t":"str"},"opt":false}],
  inner$phoneLabel$last: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$phoneLabel$last$$step: [{"name":"parts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$phoneLabel$key: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$parseVcards$lines: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseVcards$trimmed: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$parseVcards$prop: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$parseVcards$segs: [{"name":"decoded","d":{"t":"str"},"opt":false}],
  inner$parseVcards$v: [{"name":"value","d":{"t":"str"},"opt":false}],
  inner$isJunkContact$realPhone: [{"name":"c","d":{"t":"obj","n":"VCardContact","p":[["fullName",{"t":"str"},false],["family",{"t":"str"},false],["given",{"t":"str"},false],["phones",{"t":"arr","of":{"t":"obj","n":"VCardPhone","p":[["value",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["org",{"t":"str"},false],["title",{"t":"str"},false],["address",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
  inner$contactToRow$notes: [{"name":"c","d":{"t":"obj","n":"VCardContact","p":[["fullName",{"t":"str"},false],["family",{"t":"str"},false],["given",{"t":"str"},false],["phones",{"t":"arr","of":{"t":"obj","n":"VCardPhone","p":[["value",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["org",{"t":"str"},false],["title",{"t":"str"},false],["address",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
  inner$decodeQuotedPrintable$bytes$$after_loop: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$unfoldLines$out$$after_loop: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$unfoldLines$qpActive$$after_loop: [{"name":"text","d":{"t":"str"},"opt":false}],
};
