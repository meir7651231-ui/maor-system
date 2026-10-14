// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/kashe.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function parseSeed(line) {
    const i = line.indexOf(':');
    if (i < 0)
        return null;
    const kind = line.slice(0, i).trim();
    let text = line.slice(i + 1).trim();
    let page = null;
    const m = text.match(/\s*\[([^\]]+)\]\s*$/); // תגית-מקור בסוף: [זרע מהדף] / [זרע מרש"י …]
    if (m) {
        page = m[1].trim();
        text = text.slice(0, m.index).trim();
    }
    return { kind, text, page };
}
const quoted = (t) => [...String(t).matchAll(/«([^»]+)»/g)].map((m) => m[1]);
export function inner$parseSeed$i(line) {
    const i = line.indexOf(':');
    return i;
}
export function inner$parseSeed$kind(line) {
    const i = line.indexOf(':');
    const kind = line.slice(0, i).trim();
    return kind;
}
export function inner$parseSeed$kind$$step(line, i) {
    const kind = line.slice(0, i).trim();
    return kind;
}
export function inner$parseSeed$text(line) {
    const i = line.indexOf(':');
    let text = line.slice(i + 1).trim();
    return text;
}
export function inner$parseSeed$text$$step(line, i) {
    let text = line.slice(i + 1).trim();
    return text;
}
export function inner$parseSeed$m(text) {
    const m = text.match(/\s*\[([^\]]+)\]\s*$/);
    return m;
}
export function inner$askMaimatai$seeds(r) {
    const seeds = String(r.stdout || '').split('\n').map((l) => l.trimEnd()).filter(Boolean).map(parseSeed).filter(Boolean);
    return seeds;
}
export function inner$kasheQuestions$key(sentence) {
    const key = String(sentence);
    return key;
}
export function inner$kasheQuestions$cands(k) {
    const cands = k.seeds.map((sd) => ({ sd, w: quoted(sd.text) })).filter((x) => x.w.length);
    return cands;
}
export function inner$askFor$w(word) {
    const w = String(word);
    return w;
}

export const SIGS = {
  inner$parseSeed$i: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseSeed$kind: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseSeed$kind$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$parseSeed$text: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseSeed$text$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parseSeed$m: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$askMaimatai$seeds: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$kasheQuestions$key: [{"name":"sentence","d":{"t":"any"},"opt":false}],
  inner$kasheQuestions$cands: [{"name":"k","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["ok",{"t":"bool"},false],["reason",{"t":"any"},false],["seeds",{"t":"arr","of":{"t":"undef"}},false],["engine",{"t":"undef"},true],["wall",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["ok",{"t":"bool"},false],["engine",{"t":"any"},false],["seeds",{"t":"arr","of":{"t":"undef"}},false],["wall",{"t":"num"},false],["reason",{"t":"str"},false]]},{"t":"obj","p":[["available",{"t":"bool"},false],["ok",{"t":"bool"},false],["engine",{"t":"any"},false],["seeds",{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["kind",{"t":"any"},false],["text",{"t":"any"},false],["page",{"t":"any"},false]]}]}},false],["wall",{"t":"num"},false],["reason",{"t":"undef"},true]]}]},"opt":false}],
  inner$askFor$w: [{"name":"word","d":{"t":"any"},"opt":false}],
};
