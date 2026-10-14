// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/match.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const definal = (w) => w.replace(/ך$/, 'כ').replace(/ם$/, 'מ').replace(/ן$/, 'נ').replace(/ף$/, 'פ').replace(/ץ$/, 'צ');
const stem = (w) => definal(w.replace(/^[בלהומשכ](?=..)/, '').replace(/(יות|ים|ות)$/, '').replace(/[התי]$/, ''));
const heTokens = (s) => [...(s || '').matchAll(/[֐-׿]{2,}/g)].map((m) => stem(m[0])).filter((w) => w.length > 1);
const clsWords = (cls) => cls.replace(/^_+/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(Boolean);
export function inner$retrieve$q(phrase) {
    const q = [...new Set(heTokens(phrase))];
    return q;
}
export function inner$retrieveLogic$q(phrase) {
    const q = [...new Set(heTokens(phrase))];
    return q;
}
export function inner$matchClass$q(name) {
    const q = clsWords(name);
    return q;
}
export function inner$matchClass$ranked(WCLS, name) {
    const q = clsWords(name);
    const ranked = WCLS.map((w) => { let s = 0; for (const t of q)
        if (w.words.includes(t))
            s++; return { cls: w.cls, s }; })
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    return ranked;
}
export function inner$matchClass$ranked$$step(WCLS, q) {
    const ranked = WCLS.map((w) => { let s = 0; for (const t of q)
        if (w.words.includes(t))
            s++; return { cls: w.cls, s }; })
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    return ranked;
}
export function inner$matchClass$map$s$$after_loop(q, w) {
    let s = 0;
    for (const t of q)
        if (w.words.includes(t))
            s++;
    return s;
}

export const SIGS = {
  inner$retrieve$q: [{"name":"phrase","d":{"t":"any"},"opt":false}],
  inner$retrieveLogic$q: [{"name":"phrase","d":{"t":"any"},"opt":false}],
  inner$matchClass$q: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$matchClass$ranked: [{"name":"WCLS","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$matchClass$ranked$$step: [{"name":"WCLS","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"any"},"opt":false}],
  inner$matchClass$map$s$$after_loop: [{"name":"q","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
};
