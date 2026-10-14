// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/vcard-import.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEX2 = /^[0-9A-Fa-f]{2}$/;
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
export function inner$decodeQuotedPrintable$bytes$$after_loop(s) {
    const bytes = [];
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '=' && i + 2 < s.length && HEX2.test(s.slice(i + 1, i + 3))) {
            bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
            i += 2;
        }
        else {
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
        if (out.length && (line.startsWith(' ') || line.startsWith('\t'))) {
            out[out.length - 1] += line.slice(1);
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        if (out.length && qpActive && out[out.length - 1].endsWith('=')) {
            out[out.length - 1] = out[out.length - 1].slice(0, -1) + line;
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
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
        if (out.length && (line.startsWith(' ') || line.startsWith('\t'))) {
            out[out.length - 1] += line.slice(1);
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        if (out.length && qpActive && out[out.length - 1].endsWith('=')) {
            out[out.length - 1] = out[out.length - 1].slice(0, -1) + line;
            if (!out[out.length - 1].endsWith('='))
                qpActive = false;
            continue;
        }
        out.push(line);
        qpActive = /ENCODING=QUOTED-PRINTABLE/i.test(line) && line.endsWith('=');
    }
    return qpActive;
}

export const SIGS = {
  inner$decodeQuotedPrintable$cp: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$unfoldLines$raw: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$splitProperty$colon: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$splitProperty$head: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$splitProperty$head$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"colon","d":{"t":"any"},"opt":false}],
  inner$splitProperty$value: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$splitProperty$value$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"colon","d":{"t":"num"},"opt":false}],
  inner$splitProperty$segs: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$splitProperty$segs$$step: [{"name":"head","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$up: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$inner: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$parts: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$parts$$step: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$last: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$last$$step: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$phoneLabel$key: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$decodeQuotedPrintable$bytes$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$unfoldLines$out$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$unfoldLines$qpActive$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
};
