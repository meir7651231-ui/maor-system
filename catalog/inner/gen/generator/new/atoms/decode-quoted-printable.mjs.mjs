// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/decode-quoted-printable.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$decodeQuotedPrintable$unfoldLines$raw(text) {
    const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    return raw;
}
export function inner$decodeQuotedPrintable$splitProperty$colon(line) {
    const colon = line.indexOf(':');
    return colon;
}
export function inner$decodeQuotedPrintable$splitProperty$head(line) {
    const colon = line.indexOf(':');
    const head = line.slice(0, colon);
    return head;
}
export function inner$decodeQuotedPrintable$splitProperty$head$$step(line, colon) {
    const head = line.slice(0, colon);
    return head;
}
export function inner$decodeQuotedPrintable$splitProperty$value(line) {
    const colon = line.indexOf(':');
    const value = line.slice(colon + 1);
    return value;
}
export function inner$decodeQuotedPrintable$splitProperty$value$$step(line, colon) {
    const value = line.slice(colon + 1);
    return value;
}
export function inner$decodeQuotedPrintable$splitProperty$segs(line) {
    const colon = line.indexOf(':');
    const head = line.slice(0, colon);
    const segs = head.split(';');
    return segs;
}
export function inner$decodeQuotedPrintable$splitProperty$segs$$step(head) {
    const segs = head.split(';');
    return segs;
}
export function inner$decodeQuotedPrintable$phoneLabel$up(p) {
    const up = p.toUpperCase();
    return up;
}
export function inner$decodeQuotedPrintable$phoneLabel$inner(p) {
    const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
    return inner;
}
export function inner$decodeQuotedPrintable$phoneLabel$parts(p) {
    const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
    const parts = inner.split(',');
    return parts;
}
export function inner$decodeQuotedPrintable$phoneLabel$parts$$step(inner) {
    const parts = inner.split(',');
    return parts;
}
export function inner$decodeQuotedPrintable$phoneLabel$last(p) {
    const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
    const parts = inner.split(',');
    const last = parts[parts.length - 1] || '';
    return last;
}
export function inner$decodeQuotedPrintable$phoneLabel$last$$step(parts) {
    const last = parts[parts.length - 1] || '';
    return last;
}
export function inner$decodeQuotedPrintable$phoneLabel$key(p) {
    const key = p.toUpperCase().trim();
    return key;
}
export function inner$decodeQuotedPrintable$cp(s, i) {
    const cp = s.charCodeAt(i);
    return cp;
}
export function inner$decodeQuotedPrintable$unfoldLines$out$$after_loop(text) {
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
export function inner$decodeQuotedPrintable$unfoldLines$qpActive$$after_loop(text) {
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
export function inner$decodeQuotedPrintable$bytes$$after_loop(s, T, HEX2) {
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
            bytes.push(cp <= T.k9 ? cp : T.k10 /* '?' */);
        }
    }
    return bytes;
}

export const SIGS = {
  inner$decodeQuotedPrintable$unfoldLines$raw: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$colon: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$head: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$head$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"colon","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$value: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$value$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"colon","d":{"t":"num"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$segs: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$splitProperty$segs$$step: [{"name":"head","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$up: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$inner: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$parts: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$parts$$step: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$last: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$last$$step: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$phoneLabel$key: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$cp: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$decodeQuotedPrintable$unfoldLines$out$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$unfoldLines$qpActive$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$bytes$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"HEX2","d":{"t":"any"},"opt":false}],
};
