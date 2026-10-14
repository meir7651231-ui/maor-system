// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/retrieve-screen.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HE = /[֐-׿][֐-׿״׳]*/g;
const definalize = (s) => String(s).replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ');
const norm = (w) => { let s = definalize(w); if (/^מה../.test(s))
    s = s.slice(2);
else if (/^ה./.test(s) && s.length > 2)
    s = s.slice(1); return s; };
const STOP = new Set(['של', 'עמ', 'את', 'או', 'גמ', 'אני', 'צריכ', 'רוצה', 'מסכ', 'זה', 'יש', 'על', 'לי', 'כל', 'הזה', 'שמציג', 'לנהל', 'לראות', 'עמוד', 'בשביל']);
const toks = (s) => (String(s).match(HE) || []).map(norm).filter((w) => w.length > 1 && !STOP.has(w));
function buildIdf(byScreen) {
    const N = Object.keys(byScreen).length, df = {};
    for (const words of Object.values(byScreen))
        for (const w of new Set(words))
            df[w] = (df[w] || 0) + 1;
    const idf = {};
    for (const w in df)
        idf[w] = Math.log(N / df[w]);
    return idf;
}
export function inner$norm$s(w) {
    let s = definalize(w);
    return s;
}
export function inner$screenAtomTerms$mm(f) {
    const mm = f.match(/^screens__(.+?)\.manifest\.json$/);
    return mm;
}
export function inner$loadScreens$m(f) {
    const m = f.match(/^screens__(.+?)_content2?\.dart$/);
    return m;
}
export function inner$buildIdf$N(byScreen) {
    const N = Object.keys(byScreen).length;
    return N;
}
export function inner$retrieveScreen$IDF(byScreen) {
    const IDF = buildIdf(byScreen);
    return IDF;
}
export function inner$retrieveScreen$q(need) {
    const q = new Set(toks(need));
    return q;
}
export function inner$screenAtomTerms$terms$$after_loop(PURPOSE, man) {
    const terms = [];
    for (const sec of man.sections || [])
        for (const t of PURPOSE[sec.atom] || [])
            terms.push(t);
    return terms;
}
export function inner$buildIdf$df$$after_loop(byScreen) {
    const df = {};
    for (const words of Object.values(byScreen))
        for (const w of new Set(words))
            df[w] = (df[w] || 0) + 1;
    return df;
}
export function inner$buildIdf$idf$$after_loop(byScreen) {
    const N = Object.keys(byScreen).length;
    const df = {};
    for (const words of Object.values(byScreen))
        for (const w of new Set(words))
            df[w] = (df[w] || 0) + 1;
    const idf = {};
    for (const w in df)
        idf[w] = Math.log(N / df[w]);
    return idf;
}
export function inner$retrieveScreen$s$$after_loop(need, byScreen, words) {
    const IDF = buildIdf(byScreen);
    const q = new Set(toks(need));
    const set = new Set(words);
    let s = 0;
    let hits = [];
    for (const w of q)
        if (set.has(w)) {
            s += IDF[w] || 0;
            hits.push(w);
        }
    return s;
}
export function inner$retrieveScreen$hits$$after_loop(need, byScreen, words) {
    const IDF = buildIdf(byScreen);
    const q = new Set(toks(need));
    const set = new Set(words);
    let s = 0;
    let hits = [];
    for (const w of q)
        if (set.has(w)) {
            s += IDF[w] || 0;
            hits.push(w);
        }
    return hits;
}

export const SIGS = {
  inner$norm$s: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$screenAtomTerms$mm: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$loadScreens$m: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$buildIdf$N: [{"name":"byScreen","d":{"t":"any"},"opt":false}],
  inner$retrieveScreen$IDF: [{"name":"byScreen","d":{"t":"obj","n":"byScreen","p":[]},"opt":false}],
  inner$retrieveScreen$q: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$screenAtomTerms$terms$$after_loop: [{"name":"PURPOSE","d":{"t":"obj","n":"PURPOSE","p":[]},"opt":false},{"name":"man","d":{"t":"any"},"opt":false}],
  inner$buildIdf$df$$after_loop: [{"name":"byScreen","d":{"t":"any"},"opt":false}],
  inner$buildIdf$idf$$after_loop: [{"name":"byScreen","d":{"t":"any"},"opt":false}],
  inner$retrieveScreen$s$$after_loop: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"byScreen","d":{"t":"obj","n":"byScreen","p":[]},"opt":false},{"name":"words","d":{"t":"any"},"opt":false}],
  inner$retrieveScreen$hits$$after_loop: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"byScreen","d":{"t":"obj","n":"byScreen","p":[]},"opt":false},{"name":"words","d":{"t":"any"},"opt":false}],
};
