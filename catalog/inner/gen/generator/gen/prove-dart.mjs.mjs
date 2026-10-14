// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/prove-dart.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$toDart$m(v) {
    const m = /^\s*(\w+)\s*=>\s*\1\.(\w+)\s*$/.exec(v.$fn);
    return m;
}
export function inner$proveDart$cands(shelf, argc) {
    const cands = shelf.filter((a) => a.n === argc);
    return cands;
}
export function inner$proveDart$failed(shelf, argc) {
    const failed = shelf.filter((a) => a.n !== argc).map((a) => ({ name: a.name, why: 'אורך-קריאה' }));
    return failed;
}
export function inner$proveDart$HEAD(imps) {
    const HEAD = 1 + imps.split('\n').length + 2;
    return HEAD;
}
export function inner$proveDart$err(r) {
    const err = String(r.stderr || r.stdout || '');
    return err;
}
export function inner$proveDart$key(need, k) {
    const key = Math.floor(k / need.examples.length) + ':' + (k % need.examples.length);
    return key;
}
export function inner$proveDart$i(tok) {
    const [i, j, b] = tok.split(':');
    return i;
}
export function inner$proveDart$j(tok) {
    const [i, j, b] = tok.split(':');
    return j;
}
export function inner$proveDart$b(tok) {
    const [i, j, b] = tok.split(':');
    return b;
}

export const SIGS = {
  inner$toDart$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$proveDart$cands: [{"name":"shelf","d":{"t":"any"},"opt":false},{"name":"argc","d":{"t":"any"},"opt":false}],
  inner$proveDart$failed: [{"name":"shelf","d":{"t":"any"},"opt":false},{"name":"argc","d":{"t":"any"},"opt":false}],
  inner$proveDart$HEAD: [{"name":"imps","d":{"t":"any"},"opt":false}],
  inner$proveDart$err: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$proveDart$key: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$proveDart$i: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$proveDart$j: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$proveDart$b: [{"name":"tok","d":{"t":"str"},"opt":false}],
};
