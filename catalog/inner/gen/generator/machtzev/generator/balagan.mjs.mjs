// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/balagan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clsOf = (slug) => 'Gen' + slug.replace(/(^|_)([a-z0-9])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
const definal = (w) => w.replace(/ך$/, 'כ').replace(/ם$/, 'מ').replace(/ן$/, 'נ').replace(/ף$/, 'פ').replace(/ץ$/, 'צ');
const heWords = (s) => [...String(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => definal(m[0].replace(/[״׳]/g, ''))).filter((w) => w.length >= 2);
const variants = (w) => { const out = [w]; if (w.length >= 4 && /^[והבלמשכ]/.test(w))
    out.push(w.slice(1)); return out; };
function identify(ident, text, k = 3) {
    const toks = new Set();
    for (const w of heWords(text))
        for (const v of variants(w))
            toks.add(v);
    return ident.map((d, i) => ({ i, ns: d.ns, score: [...toks].reduce((s, v) => s + (d.weights[v] || 0), 0) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.i - b.i).slice(0, k);
}
function selfTest(mods, ident) {
    const bad = [];
    for (const m of mods) {
        for (const [what, q] of [['כותרת', m.title], ['הרגע', m.moment]]) {
            if (!q || (m.layer === 'base' && what === 'הרגע'))
                continue;
            const h = identify(ident, q, 1);
            if (!h.length || h[0].ns !== m.ns)
                bad.push(`${m.ns} · ${what} ⇒ ${h.length ? h[0].ns : '—'}`);
        }
    }
    return bad;
}
export function inner$buildIdentifier$idf$d(df, v) {
    const d = df.get(v) || 0;
    return d;
}
export function inner$selfTest$h(ident, q) {
    const h = identify(ident, q, 1);
    return h;
}
export function inner$topicOf$words(m) {
    const words = new Set([...heWords(m.title + ' ' + m.category + ' ' + m.moment)].flatMap(variants));
    return words;
}
export function inner$topicOf$n(m, t) {
    const words = new Set([...heWords(m.title + ' ' + m.category + ' ' + m.moment)].flatMap(variants));
    const n = t.words.reduce((s, w) => s + (heWords(w).every((x) => words.has(x)) ? 1 : 0), 0);
    return n;
}
export function inner$topicOf$n$$step(words, t) {
    const n = t.words.reduce((s, w) => s + (heWords(w).every((x) => words.has(x)) ? 1 : 0), 0);
    return n;
}
export function inner$topicOf$all(m) {
    const all = new Set([...heWords(m.doc)].flatMap(variants));
    return all;
}
export function inner$topicOf$n_L85(m, t) {
    const all = new Set([...heWords(m.doc)].flatMap(variants));
    const n = t.words.reduce((s, w) => s + (heWords(w).every((x) => all.has(x)) ? 1 : 0), 0);
    return n;
}
export function inner$topicOf$n_L85$$step(all, t) {
    const n = t.words.reduce((s, w) => s + (heWords(w).every((x) => all.has(x)) ? 1 : 0), 0);
    return n;
}
export function inner$buildBalagan$bad(mods, ident) {
    const bad = selfTest(mods, ident);
    return bad;
}
export function inner$buildBalagan$selfScores(mods, ident) {
    const selfScores = mods.map((m) => (identify(ident, m.title + ' ' + m.moment, 1)[0] || { score: 1 }).score);
    return selfScores;
}
export function inner$buildBalagan$titleConf(mods, ident) {
    const selfScores = mods.map((m) => (identify(ident, m.title + ' ' + m.moment, 1)[0] || { score: 1 }).score);
    const titleConf = mods.map((m, i) => { const h = identify(ident, m.title, 1)[0]; return h && h.ns === m.ns ? h.score / selfScores[i] : 1; });
    return titleConf;
}
export function inner$buildBalagan$titleConf$$step(mods, ident, selfScores) {
    const titleConf = mods.map((m, i) => { const h = identify(ident, m.title, 1)[0]; return h && h.ns === m.ns ? h.score / selfScores[i] : 1; });
    return titleConf;
}
export function inner$buildBalagan$map$h(ident, m) {
    const h = identify(ident, m.title, 1)[0];
    return h;
}
export function inner$buildBalagan$weak(mods, ident) {
    const selfScores = mods.map((m) => (identify(ident, m.title + ' ' + m.moment, 1)[0] || { score: 1 }).score);
    const titleConf = mods.map((m, i) => { const h = identify(ident, m.title, 1)[0]; return h && h.ns === m.ns ? h.score / selfScores[i] : 1; });
    const weak = Math.round(Math.min(...titleConf) * 0.5 * 1000) / 1000;
    return weak;
}
export function inner$buildBalagan$weak$$step(titleConf) {
    const weak = Math.round(Math.min(...titleConf) * 0.5 * 1000) / 1000;
    return weak;
}
export function inner$buildBalagan$baseMod(mods) {
    const baseMod = mods.find((m) => m.layer === 'base') || mods[0];
    return baseMod;
}
export function inner$buildBalagan$baseTodayCls(mods) {
    const baseMod = mods.find((m) => m.layer === 'base') || mods[0];
    const baseTodayCls = baseMod.home.cls + 'Today';
    return baseTodayCls;
}
export function inner$buildBalagan$baseTodayCls$$step(baseMod) {
    const baseTodayCls = baseMod.home.cls + 'Today';
    return baseTodayCls;
}
export function inner$buildBalagan$cls() {
    const slug = 'balagan_home';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$cls_L1578() {
    const slug = 'balagan_ask';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$cls_L1699() {
    const slug = 'balagan_confirm';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$cls_L1823() {
    const slug = 'balagan_keys';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$cls_L1947() {
    const slug = 'balagan_topics';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$order(TOPICS, mods, L) {
    const order = [L.topicsBase, ...TOPICS.map((t) => t.name), L.topicOther].filter((t) => mods.some((m) => m.topic === t));
    return order;
}
export function inner$buildBalagan$cls_L2071() {
    const slug = 'balagan_shell';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$cls_L2120() {
    const slug = 'balagan_main';
    const cls = clsOf(slug);
    return cls;
}
export function inner$buildBalagan$rel(mods) {
    const rel = mods.filter((m) => m.relations);
    return rel;
}
export function inner$buildIdentifier$map$boost$$after_loop(m) {
    const boost = new Set();
    for (const w of heWords(m.title + ' ' + m.moment))
        for (const v of variants(w))
            boost.add(v);
    return boost;
}
export function inner$identify$toks$$after_loop(text) {
    const toks = new Set();
    for (const w of heWords(text))
        for (const v of variants(w))
            toks.add(v);
    return toks;
}
export function inner$selfTest$bad$$after_loop(mods, ident) {
    const bad = [];
    for (const m of mods) {
        for (const [what, q] of [['כותרת', m.title], ['הרגע', m.moment]]) {
            if (!q || (m.layer === 'base' && what === 'הרגע'))
                continue;
            const h = identify(ident, q, 1);
            if (!h.length || h[0].ns !== m.ns)
                bad.push(`${m.ns} · ${what} ⇒ ${h.length ? h[0].ns : '—'}`);
        }
    }
    return bad;
}

export const SIGS = {
  inner$buildIdentifier$idf$d: [{"name":"df","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"v","d":{"t":"any"},"opt":false}],
  inner$selfTest$h: [{"name":"ident","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"any"},"opt":false}],
  inner$topicOf$words: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$topicOf$n: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$topicOf$n$$step: [{"name":"words","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$topicOf$all: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$topicOf$n_L85: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$topicOf$n_L85$$step: [{"name":"all","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$bad: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$selfScores: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$titleConf: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$titleConf$$step: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false},{"name":"selfScores","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildBalagan$map$h: [{"name":"ident","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$weak: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$weak$$step: [{"name":"titleConf","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$buildBalagan$baseMod: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildBalagan$baseTodayCls: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildBalagan$baseTodayCls$$step: [{"name":"baseMod","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$cls: [],
  inner$buildBalagan$cls_L1578: [],
  inner$buildBalagan$cls_L1699: [],
  inner$buildBalagan$cls_L1823: [],
  inner$buildBalagan$cls_L1947: [],
  inner$buildBalagan$order: [{"name":"TOPICS","d":{"t":"any"},"opt":false},{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$buildBalagan$cls_L2071: [],
  inner$buildBalagan$cls_L2120: [],
  inner$buildBalagan$rel: [{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildIdentifier$map$boost$$after_loop: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$identify$toks$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$selfTest$bad$$after_loop: [{"name":"mods","d":{"t":"any"},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false}],
};
