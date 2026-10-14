// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/display-synth.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const text = (demo, fs, fw, tone = 'ink') => `<span style="font-size:${fs}px;font-weight:${fw};color:var(--${tone})">${demo}</span>`;
const cell = (demo, fs, fw, tone) => `<span style="flex:1;font-size:${fs}px;font-weight:${fw};color:var(--${tone})">${demo}</span>`;
export function inner$candidatesFor$L(lfs, lfw) {
    const L = text('Label', lfs, lfw, 'mut');
    return L;
}
export function inner$candidatesFor$V(vfs, vfw) {
    const V = text('248', vfs, vfw, 'ink');
    return V;
}
export function inner$candidatesFor$inner(lfs, lfw, vfs, vfw, first) {
    const L = text('Label', lfs, lfw, 'mut');
    const V = text('248', vfs, vfw, 'ink');
    const inner = first === 'label' ? L + V : V + L;
    return inner;
}
export function inner$candidatesFor$inner$$step(first, L, V) {
    const inner = first === 'label' ? L + V : V + L;
    return inner;
}
export function inner$candidatesFor$head(dec, hfs, cols) {
    const head = `<div style="display:flex;gap:12px;padding:10px 14px;${dec ? 'background:var(--raised2);' : ''}">${Array.from({ length: cols }, () => cell('Label', hfs, 700, 'mut')).join('')}</div>`;
    return head;
}
export function inner$candidatesFor$hs(n) {
    const hs = Array.from({ length: n }, (_, i) => 12 + Math.round(40 * ((i * 7) % n + 1) / n));
    return hs;
}
export function inner$candidatesFor$rects(n, w, gap) {
    const hs = Array.from({ length: n }, (_, i) => 12 + Math.round(40 * ((i * 7) % n + 1) / n));
    const rects = hs.map((h, i) => `<rect x="${4 + i * (w + gap)}" y="${60 - h}" width="${w}" height="${h}" rx="2" fill="var(--a)"/>`).join('');
    return rects;
}
export function inner$candidatesFor$rects$$step(w, gap, hs) {
    const rects = hs.map((h, i) => `<rect x="${4 + i * (w + gap)}" y="${60 - h}" width="${w}" height="${h}" rx="2" fill="var(--a)"/>`).join('');
    return rects;
}
export function inner$registerSynth$file(sc) {
    const file = `${sc.cls.toLowerCase()}.dart`;
    return file;
}

export const SIGS = {
  inner$candidatesFor$L: [{"name":"lfs","d":{"t":"any"},"opt":false},{"name":"lfw","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$V: [{"name":"vfs","d":{"t":"any"},"opt":false},{"name":"vfw","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$inner: [{"name":"lfs","d":{"t":"any"},"opt":false},{"name":"lfw","d":{"t":"any"},"opt":false},{"name":"vfs","d":{"t":"any"},"opt":false},{"name":"vfw","d":{"t":"any"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$inner$$step: [{"name":"first","d":{"t":"any"},"opt":false},{"name":"L","d":{"t":"str"},"opt":false},{"name":"V","d":{"t":"str"},"opt":false}],
  inner$candidatesFor$head: [{"name":"dec","d":{"t":"any"},"opt":false},{"name":"hfs","d":{"t":"any"},"opt":false},{"name":"cols","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$hs: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$candidatesFor$rects: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false},{"name":"gap","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$rects$$step: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"gap","d":{"t":"any"},"opt":false},{"name":"hs","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$registerSynth$file: [{"name":"sc","d":{"t":"any"},"opt":false}],
};
