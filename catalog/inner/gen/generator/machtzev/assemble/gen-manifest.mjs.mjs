// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/gen-manifest.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pickRec$pref(atom) {
    const pref = atom[0].toLowerCase() + atom.slice(1) + 'Content';
    return pref;
}
export function inner$pickRec$hit(recs, atom, field) {
    const pref = atom[0].toLowerCase() + atom.slice(1) + 'Content';
    const hit = recs.find(r => r.rec === pref && r.fields.has(field));
    return hit;
}
export function inner$pickRec$hit$$step(recs, field, pref) {
    const hit = recs.find(r => r.rec === pref && r.fields.has(field));
    return hit;
}
export function inner$pickRec$all(recs, field) {
    const all = recs.filter(r => r.fields.has(field));
    return all;
}
export function inner$buildSection$argE(args, p) {
    const argE = args ? (args.named[p.name] ?? null) : null;
    return argE;
}
export function inner$buildSection$litE(cs, p) {
    const litE = p.type.startsWith('String') ? String(cs?.named[p.name] ?? '').trim() : '';
    return litE;
}

export const SIGS = {
  inner$pickRec$pref: [{"name":"atom","d":{"t":"any"},"opt":false}],
  inner$pickRec$hit: [{"name":"recs","d":{"t":"any"},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$pickRec$hit$$step: [{"name":"recs","d":{"t":"any"},"opt":false},{"name":"field","d":{"t":"any"},"opt":false},{"name":"pref","d":{"t":"str"},"opt":false}],
  inner$pickRec$all: [{"name":"recs","d":{"t":"any"},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$buildSection$argE: [{"name":"args","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["named",{"t":"obj","n":"named","p":[]},false],["positional",{"t":"arr","of":{"t":"any"}},false],["index",{"t":"num"},false]]}]},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$buildSection$litE: [{"name":"cs","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["named",{"t":"obj","n":"named","p":[]},false],["positional",{"t":"arr","of":{"t":"any"}},false],["index",{"t":"num"},false]]}]},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
};
