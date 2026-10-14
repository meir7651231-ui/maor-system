// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/decompose/genericPreview.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const minOf = (t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    return m ? +m[1] * 60 + +m[2] : null;
};
const num = (p, k, d) => (typeof p[k] === 'number' && Number.isFinite(p[k]) ? p[k] : d);
const str = (p, k, d) => (typeof p[k] === 'string' ? p[k] : d);
const uniq = (xs) => [...new Set(xs)];
const leaf = (path) => path.replace(/\[\]/g, '').split('.').pop() ?? '';
function typoOf(word) {
    const i = Math.min(2, word.length - 2);
    const c = word[i];
    return word.slice(0, i) + (c === 'ק' ? 'כ' : 'ק') + word.slice(i + 1);
}
function genPlaceLabel(name) {
    const s = String(name ?? '').split(/ של |, | \(/)[0].trim();
    return s || 'מועד';
}
export function inner$israelMs$guess(iso, minute) {
    const guess = Date.parse(iso + 'T00:00:00Z') + minute * 60_000;
    return guess;
}
export function inner$hm$m(min) {
    const m = ((Math.round(min) % 1440) + 1440) % 1440;
    return m;
}
export function inner$dm$m(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m;
}
export function inner$minOf$m(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    return m;
}
export function inner$amountPreview$pos(values) {
    const pos = values.filter((v) => v > 0);
    return pos;
}
export function inner$amountPreview$what(cur) {
    const what = cur ? 'סכומים' : 'ערכים';
    return what;
}
export function inner$amountPreview$picks(sorted) {
    const picks = uniq([sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]]);
    return picks;
}
export function inner$amountPreview$g(groups) {
    const g = groups[groups.length - 1];
    return g;
}
export function inner$amountPreview$step(p) {
    const step = num(p, 'step', 1);
    return step;
}
export function inner$amountPreview$dir(p) {
    const dir = str(p, 'dir', 'down');
    return dir;
}
export function inner$timesPreview$d(p) {
    const d = num(p, 'minutes', -10);
    return d;
}
export function inner$timesPreview$use(mins, base) {
    const use = base.length ? base : mins.slice(0, 3);
    return use;
}
export function inner$timesPreview$step(p) {
    const step = num(p, 'step', 1);
    return step;
}
export function inner$timesPreview$dir(p) {
    const dir = str(p, 'dir', 'down');
    return dir;
}
export function inner$timesPreview$d_L173(p) {
    const d = num(p, 'minutes', -10);
    return d;
}
export function inner$spanPreview$sorted(rows) {
    const sorted = [...rows].sort((a, b) => a.from - b.from || a.to - b.to);
    return sorted;
}
export function inner$grainOf$pos(gaps) {
    const pos = gaps.filter((x) => x > 0).sort((a, b) => a - b);
    return pos;
}
export function inner$grainOf$med(gaps) {
    const pos = gaps.filter((x) => x > 0).sort((a, b) => a - b);
    const med = pos.length ? pos[Math.floor(pos.length / 2)] : 1;
    return med;
}
export function inner$grainOf$med$$step(pos) {
    const med = pos.length ? pos[Math.floor(pos.length / 2)] : 1;
    return med;
}
export function inner$sequencePreview$maxGap(p) {
    const maxGap = num(p, 'maxGap', 0);
    return maxGap;
}
export function inner$sequencePreview$minLength(p) {
    const minLength = Math.max(2, num(p, 'minLength', 1));
    return minLength;
}
export function inner$sequencePreview$items(idx, lo) {
    const present = new Set(idx);
    const items = Array.from({ length: Math.min(idx[idx.length - 1] - lo + 1, 5000) }, (_, i) => present.has(lo + i));
    return items;
}
export function inner$sequencePreview$items$$step(idx, lo, present) {
    const items = Array.from({ length: Math.min(idx[idx.length - 1] - lo + 1, 5000) }, (_, i) => present.has(lo + i));
    return items;
}
export function inner$waitingPreview$sinceMs$t(s) {
    const t = Date.parse(s);
    return t;
}
export function inner$waitingPreview$steps(p) {
    const steps = [
        { to: ['האחראי'], waitMin: num(p, 'waitMin', 180) },
        { to: ['המנהל'], waitMin: num(p, 'waitMin', 180) },
        { to: ['כל הצוות'], waitMin: num(p, 'waitMin', 180) },
    ];
    return steps;
}
export function inner$waitingPreview$lines(items) {
    const lines = [`${items.length} מחכים לתשובה`];
    return lines;
}
export function inner$typoOf$i(word) {
    const i = Math.min(2, word.length - 2);
    return i;
}
export function inner$textPreview$vals(values) {
    const vals = uniq(values).slice(0, 5000);
    return vals;
}
export function inner$textPreview$best(freq) {
    const best = [...freq].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))[0];
    return best;
}
export function inner$textPreview$typo(word) {
    const typo = typoOf(word);
    return typo;
}
export function inner$textPreview$cands(values) {
    const vals = uniq(values).slice(0, 5000);
    const cands = vals.map((text, i) => ({ id: String(i), text }));
    return cands;
}
export function inner$textPreview$cands$$step(vals) {
    const cands = vals.map((text, i) => ({ id: String(i), text }));
    return cands;
}
export function inner$textPreview$maxTypos(p) {
    const maxTypos = num(p, 'maxTypos', 1);
    return maxTypos;
}
export function inner$genPlaceLabel$s(name) {
    const s = String(name ?? '').split(/ של |, | \(/)[0].trim();
    return s;
}
export function inner$genericMoments$label(place) {
    const label = genPlaceLabel(place.name);
    return label;
}
export function inner$genericMoments$mins(ex) {
    const mins = uniq(ex.values.map(minOf).filter((x) => x !== null));
    return mins;
}
export function inner$genericMoments$vals(ex) {
    const vals = ex.kind === 'times' ? ex.values : ex.groups.flat();
    return vals;
}
export function inner$genericClockSpan$f(s) {
    const f = minOf(String(s.from));
    return f;
}
export function inner$genericClockSpan$t(s) {
    const t = minOf(String(s.to));
    return t;
}
export function inner$genericPieces$v(ex) {
    const v = ex.values.filter((x) => x > 0).sort((a, b) => b - a)[0];
    return v;
}
export function inner$genericPieces$leafName(place) {
    const leafName = leaf(place.spec.path);
    return leafName;
}
export function inner$amountPreview$groups$$after_loop(pieces) {
    const groups = [];
    for (const x of pieces) {
        const g = groups[groups.length - 1];
        if (g && g.v === x)
            g.n++;
        else
            groups.push({ v: x, n: 1 });
    }
    return groups;
}

export const SIGS = {
  inner$israelMs$guess: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"minute","d":{"t":"num"},"opt":false}],
  inner$hm$m: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$dm$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$minOf$m: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$amountPreview$pos: [{"name":"values","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$amountPreview$what: [{"name":"cur","d":{"t":"lit","v":["","₪","$"]},"opt":false}],
  inner$amountPreview$picks: [{"name":"sorted","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$amountPreview$g: [{"name":"groups","d":{"t":"arr","of":{"t":"obj","p":[["v",{"t":"num"},false],["n",{"t":"num"},false]]}},"opt":false}],
  inner$amountPreview$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$amountPreview$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesPreview$d: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesPreview$use: [{"name":"mins","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"base","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$timesPreview$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesPreview$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesPreview$d_L173: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$spanPreview$sorted: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},"opt":false}],
  inner$grainOf$pos: [{"name":"gaps","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$grainOf$med: [{"name":"gaps","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$grainOf$med$$step: [{"name":"pos","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$sequencePreview$maxGap: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$sequencePreview$minLength: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$sequencePreview$items: [{"name":"idx","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"lo","d":{"t":"num"},"opt":false}],
  inner$sequencePreview$items$$step: [{"name":"idx","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"lo","d":{"t":"num"},"opt":false},{"name":"present","d":{"t":"set","of":{"t":"num"}},"opt":false}],
  inner$waitingPreview$sinceMs$t: [{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$waitingPreview$steps: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$waitingPreview$lines: [{"name":"items","d":{"t":"arr","of":{"t":"obj","p":[["since",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false}],
  inner$typoOf$i: [{"name":"word","d":{"t":"str"},"opt":false}],
  inner$textPreview$vals: [{"name":"values","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$textPreview$best: [{"name":"freq","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$textPreview$typo: [{"name":"word","d":{"t":"str"},"opt":false}],
  inner$textPreview$cands: [{"name":"values","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$textPreview$cands$$step: [{"name":"vals","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$textPreview$maxTypos: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$genPlaceLabel$s: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$genericMoments$label: [{"name":"place","d":{"t":"obj","n":"GenPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false],["spec",{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["personal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$genericMoments$mins: [{"name":"ex","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["kind",{"t":"lit","v":["times"]},false],["values",{"t":"arr","of":{"t":"str"}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["amount"]},false],["values",{"t":"arr","of":{"t":"num"}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["span"]},false],["unit",{"t":"lit","v":["number","date","clock"]},false],["spans",{"t":"arr","of":{"t":"obj","p":[["from",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false],["to",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["sequence"]},false],["groups",{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["waiting"]},false],["items",{"t":"arr","of":{"t":"obj","p":[["since",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["total",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["text"]},false],["values",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false}],
  inner$genericMoments$vals: [{"name":"ex","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["kind",{"t":"lit","v":["times"]},false],["values",{"t":"arr","of":{"t":"str"}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["amount"]},false],["values",{"t":"arr","of":{"t":"num"}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["span"]},false],["unit",{"t":"lit","v":["number","date","clock"]},false],["spans",{"t":"arr","of":{"t":"obj","p":[["from",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false],["to",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["sequence"]},false],["groups",{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["waiting"]},false],["items",{"t":"arr","of":{"t":"obj","p":[["since",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["total",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["text"]},false],["values",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false}],
  inner$genericClockSpan$f: [{"name":"s","d":{"t":"obj","p":[["from",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false],["to",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]},"opt":false}],
  inner$genericClockSpan$t: [{"name":"s","d":{"t":"obj","p":[["from",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false],["to",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]},"opt":false}],
  inner$genericPieces$v: [{"name":"ex","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["kind",{"t":"lit","v":["times"]},false],["values",{"t":"arr","of":{"t":"str"}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["amount"]},false],["values",{"t":"arr","of":{"t":"num"}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["span"]},false],["unit",{"t":"lit","v":["number","date","clock"]},false],["spans",{"t":"arr","of":{"t":"obj","p":[["from",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false],["to",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["sequence"]},false],["groups",{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["waiting"]},false],["items",{"t":"arr","of":{"t":"obj","p":[["since",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["total",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["text"]},false],["values",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false}],
  inner$genericPieces$leafName: [{"name":"place","d":{"t":"obj","n":"GenPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false],["spec",{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["personal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$amountPreview$groups$$after_loop: [{"name":"pieces","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
};
