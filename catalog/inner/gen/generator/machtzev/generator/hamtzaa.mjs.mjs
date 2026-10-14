// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/hamtzaa.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heWords = (s) => [...String(s || '').matchAll(/[א-ת][א-ת'"״׳]*/g)]
    .map((m) => m[0]).filter((w) => w.length >= 2);
const KEY_RE = /'([A-Za-z_][A-Za-z0-9_]*)'\s*:|\[\s*'([A-Za-z_][A-Za-z0-9_]*)'\s*\]/g;
const unq = (t) => String(t).replace(/^['"]|['"]$/g, '');
function needTokens(need) {
    const out = new Map();
    for (const c of (need.consts || []))
        out.set(String(c), 'consts');
    const walk = (v) => {
        if (typeof v === 'string') {
            for (const m of v.matchAll(KEY_RE)) {
                const k = "'" + (m[1] || m[2]) + "'";
                if (!out.has(k))
                    out.set(k, 'examples');
            }
        }
        else if (Array.isArray(v))
            v.forEach(walk);
    };
    (need.examples || []).forEach(walk);
    return out;
}
export function inner$detectInvented$entRe(lang) {
    const entRe = new RegExp('^\\s*(?:' + lang.createVerbs.join('|') + ')?\\s*(?:' + lang.entityNouns.join('|') + ')\\s+');
    return entRe;
}
export function inner$detectInvented$t(line) {
    const t = line.trim();
    return t;
}
export function inner$detectInvented$a(byEnt, r) {
    const a = byEnt.get(r.entity) || [];
    return a;
}
export function inner$detectInvented$entsAllInvented(rows) {
    const byEnt = new Map();
    for (const r of rows) {
        const a = byEnt.get(r.entity) || [];
        a.push(r);
        byEnt.set(r.entity, a);
    }
    const entsAllInvented = [...byEnt].filter(([, a]) => a.every((x) => !x.source)).map(([e]) => e);
    return entsAllInvented;
}
export function inner$detectInvented$entsAllInvented$$step(byEnt) {
    const entsAllInvented = [...byEnt].filter(([, a]) => a.every((x) => !x.source)).map(([e]) => e);
    return entsAllInvented;
}
export function inner$goalChain$words(goalText, lang) {
    const words = [...new Set(heWords(goalText).filter((w) => !lang.scaffold.has(w)))];
    return words;
}
export function inner$needTokens$walk$k(m) {
    const k = "'" + (m[1] || m[2]) + "'";
    return k;
}
export function inner$tokenSource$raw(tok) {
    const raw = unq(tok);
    return raw;
}
export function inner$tokenSource$inGoal(tok, goalText) {
    const raw = unq(tok);
    const inGoal = String(goalText).includes(raw);
    return inGoal;
}
export function inner$tokenSource$inGoal$$step(goalText, raw) {
    const inGoal = String(goalText).includes(raw);
    return inGoal;
}
export function inner$tokenSource$he(tok) {
    const raw = unq(tok);
    const he = heWords(raw);
    return he;
}
export function inner$tokenSource$he$$step(raw) {
    const he = heWords(raw);
    return he;
}
export function inner$tokenSource$ok(hits) {
    const ok = hits.every(Boolean);
    return ok;
}
export function inner$tokenSource$miss(tok, hits) {
    const raw = unq(tok);
    const he = heWords(raw);
    const miss = he.filter((w, i) => !hits[i]);
    return miss;
}
export function inner$tokenSource$miss$$step(he, hits) {
    const miss = he.filter((w, i) => !hits[i]);
    return miss;
}
export function inner$tokenSource$sl(tok, chain) {
    const raw = unq(tok);
    const sl = chain.slots.get(raw);
    return sl;
}
export function inner$tokenSource$sl$$step(chain, raw) {
    const sl = chain.slots.get(raw);
    return sl;
}
export function inner$detectInventedNeeds$inputWords(goalText, lang) {
    const inputWords = [...new Set(heWords(goalText).filter((w) => !lang.scaffold.has(w)))];
    return inputWords;
}
export function inner$detectInventedNeeds$toks(need) {
    const toks = needTokens(need || {});
    return toks;
}
export function inner$routePeruks$dir(GEN) {
    const dir = GEN + 'peruks';
    return dir;
}
export function inner$routePeruks$m(f) {
    const m = f.match(/(\d+)/);
    return m;
}
export function inner$routeNl$t(line) {
    const t = line.trim();
    return t;
}
export function inner$assertRan$f(rs) {
    const f = rs.reduce((a, r) => a + r.fields, 0);
    return f;
}
export function inner$assertRan$w(rs) {
    const w = rs.reduce((a, r) => a + r.inputWords, 0);
    return w;
}
export function inner$assertRan$p(rs) {
    const p = rs.reduce((a, r) => a + r.pairs, 0);
    return p;
}
export function inner$assertRan$broken(rs) {
    const broken = rs.flatMap((r) => (r.broken || []).map((b) => `${r.route}/${b.id} (${b.fields} fields · ${b.inputWords} words)`));
    return broken;
}
export function inner$selftest$bad(T) {
    const bad = T.filter((t) => !t.pass);
    return bad;
}
export function inner$detectInvented$byEnt$$after_loop(rows) {
    const byEnt = new Map();
    for (const r of rows) {
        const a = byEnt.get(r.entity) || [];
        a.push(r);
        byEnt.set(r.entity, a);
    }
    return byEnt;
}

export const SIGS = {
  inner$detectInvented$entRe: [{"name":"lang","d":{"t":"obj","p":[["scaffold",{"t":"set","of":{"t":"any"}},false],["prefixLetters",{"t":"any"},false],["entityNouns",{"t":"any"},false],["createVerbs",{"t":"any"},false]]},"opt":false}],
  inner$detectInvented$t: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$detectInvented$a: [{"name":"byEnt","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"obj","p":[["entity",{"t":"any"},false],["field",{"t":"any"},false],["source",{"t":"any"},false]]},"opt":false}],
  inner$detectInvented$entsAllInvented: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$detectInvented$entsAllInvented$$step: [{"name":"byEnt","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$goalChain$words: [{"name":"goalText","d":{"t":"any"},"opt":false},{"name":"lang","d":{"t":"obj","p":[["scaffold",{"t":"set","of":{"t":"any"}},false],["prefixLetters",{"t":"any"},false],["entityNouns",{"t":"any"},false],["createVerbs",{"t":"any"},false]]},"opt":false}],
  inner$needTokens$walk$k: [{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$tokenSource$raw: [{"name":"tok","d":{"t":"any"},"opt":false}],
  inner$tokenSource$inGoal: [{"name":"tok","d":{"t":"any"},"opt":false},{"name":"goalText","d":{"t":"any"},"opt":false}],
  inner$tokenSource$inGoal$$step: [{"name":"goalText","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$tokenSource$he: [{"name":"tok","d":{"t":"any"},"opt":false}],
  inner$tokenSource$he$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$tokenSource$ok: [{"name":"hits","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$tokenSource$miss: [{"name":"tok","d":{"t":"any"},"opt":false},{"name":"hits","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$tokenSource$miss$$step: [{"name":"he","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"hits","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$tokenSource$sl: [{"name":"tok","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"any"},"opt":false}],
  inner$tokenSource$sl$$step: [{"name":"chain","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$detectInventedNeeds$inputWords: [{"name":"goalText","d":{"t":"any"},"opt":false},{"name":"lang","d":{"t":"obj","p":[["scaffold",{"t":"set","of":{"t":"any"}},false],["prefixLetters",{"t":"any"},false],["entityNouns",{"t":"any"},false],["createVerbs",{"t":"any"},false]]},"opt":false}],
  inner$detectInventedNeeds$toks: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$routePeruks$dir: [{"name":"GEN","d":{"t":"str"},"opt":false}],
  inner$routePeruks$m: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$routeNl$t: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$assertRan$f: [{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$assertRan$w: [{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$assertRan$p: [{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$assertRan$broken: [{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$selftest$bad: [{"name":"T","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$detectInvented$byEnt$$after_loop: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
