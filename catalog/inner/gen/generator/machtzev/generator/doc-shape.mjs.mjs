// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/doc-shape.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HE = /[֐-׿]/;
function htmlToMd(h) {
    if (!/<(table|h[1-4]|p|div|li)\b/i.test(h))
        return h;
    let s = h.replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, '');
    for (let i = 1; i <= 4; i++)
        s = s.replace(new RegExp(`<h${i}[^>]*>`, 'gi'), '\n' + '#'.repeat(i) + ' ');
    s = s.replace(/<li[^>]*>/gi, '\n- ').replace(/<tr[^>]*>/gi, '\n| ').replace(/<\/t[dh]>/gi, ' | ').replace(/<(p|div|br|pre)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '');
    s = s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    return s.split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n');
}
const listOf = (cell) => { const sep = cell.includes('·') ? '·' : cell.includes(',') ? ',' : null; return sep ? cell.split(sep).map((x) => x.trim()).filter(Boolean) : null; };
const cleanField = (f) => ({ raw: f, name: f.replace(/\(.*?\)|\{.*?\}|→.*$/g, '').trim().replace(/\[\]$/, '').trim(), multi: /\[\]|\{.*\}\]?$|_ids$|s$/.test(f.replace(/\(.*?\)/g, '').trim()) });
export function inner$htmlToMd$s(h) {
    let s = h.replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, '');
    return s;
}
export function inner$listOf$sep(cell) {
    const sep = cell.includes('·') ? '·' : cell.includes(',') ? ',' : null;
    return sep;
}
export function inner$tablesOf$t(l) {
    const t = l.trim();
    return t;
}
export function inner$tablesOf$cells(l) {
    const t = l.trim();
    const cells = t.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
    return cells;
}
export function inner$tablesOf$cells$$step(t) {
    const cells = t.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
    return cells;
}
export function inner$entityTables$w(rows) {
    const w = Math.max(...rows.map((r) => r.length));
    return w;
}
export function inner$entityTables$isList$filter$l(ci, r) {
    const l = listOf(r[ci] || '');
    return l;
}
export function inner$entityTables$body(rows, fc) {
    const body = rows.filter((r) => { const l = listOf(r[fc] || ''); return l && l.length >= 2; });
    return body;
}
export function inner$entityTables$filter$l(fc, r) {
    const l = listOf(r[fc] || '');
    return l;
}
export function inner$entityTables$he(r) {
    const nameCell = r[0] || '';
    const he = nameCell.split(/\s+/).filter((x) => HE.test(x)).join(' ').replace(/[+/]/g, ' ').trim();
    return he;
}
export function inner$entityTables$he$$step(nameCell) {
    const he = nameCell.split(/\s+/).filter((x) => HE.test(x)).join(' ').replace(/[+/]/g, ' ').trim();
    return he;
}
export function inner$entityTables$alias(r) {
    const nameCell = r[0] || '';
    const alias = nameCell.split(/\s+/).filter((x) => /^[A-Za-z]+$/.test(x));
    return alias;
}
export function inner$entityTables$alias$$step(nameCell) {
    const alias = nameCell.split(/\s+/).filter((x) => /^[A-Za-z]+$/.test(x));
    return alias;
}
export function inner$entityTables$fields(fc, r) {
    const fields = listOf(r[fc]).map(cleanField).filter((f) => f.name).flatMap((f) => { const m = f.name.match(/^([A-Za-z]+)\/([A-Za-z]+)\s+([A-Za-z_]+?)s?$/); return m ? [m[1], m[2]].map((a) => ({ raw: f.raw, name: `${a}_${m[3]}`, multi: false })) : [f]; });
    return fields;
}
export function inner$entityTables$flatMap$m(f) {
    const m = f.name.match(/^([A-Za-z]+)\/([A-Za-z]+)\s+([A-Za-z_]+?)s?$/);
    return m;
}
export function inner$entityTables$states(sc, r) {
    const states = sc >= 0 ? (listOf(r[sc] || '') || []).map((x) => x.replace(/\(.*?\)/g, '').trim()).filter((x) => x && x !== '—') : [];
    return states;
}
export function inner$docToSpec$md(md0) {
    const md = htmlToMd(md0);
    return md;
}
export function inner$docToSpec$lines(md0, title) {
    const md = htmlToMd(md0);
    const lines = [`אפליקציה: ${title || (md.match(/^#\s+(.+)$/m) || [])[1] || 'מסמך'}`];
    return lines;
}
export function inner$docToSpec$lines$$step(title, md) {
    const lines = [`אפליקציה: ${title || (md.match(/^#\s+(.+)$/m) || [])[1] || 'מסמך'}`];
    return lines;
}
export function inner$docToSpec$map$toks(f) {
    const toks = f.name.toLowerCase().split(/[_\s]+/).map((t) => t.replace(/s$/, '').replace(/^id$/, ''));
    return toks;
}
export function inner$docToSpec$map$hit(byAlias, e, f) {
    const toks = f.name.toLowerCase().split(/[_\s]+/).map((t) => t.replace(/s$/, '').replace(/^id$/, ''));
    const hit = toks.map((t) => byAlias.get(t)).find((x) => x && x !== e.name);
    return hit;
}
export function inner$docToSpec$map$hit$$step(byAlias, e, toks) {
    const hit = toks.map((t) => byAlias.get(t)).find((x) => x && x !== e.name);
    return hit;
}
export function inner$docToSentence$md(md0) {
    const md = htmlToMd(md0);
    return md;
}
export function inner$docToSentence$head(md0, title) {
    const md = htmlToMd(md0);
    const head = (title || (md.match(/^#\s+(.+)$/m) || [])[1] || 'מסמך').replace(/[:.;]/g, ' ').split(/\s+[—–-]\s+/)[0].trim();
    return head;
}
export function inner$docToSentence$head$$step(title, md) {
    const head = (title || (md.match(/^#\s+(.+)$/m) || [])[1] || 'מסמך').replace(/[:.;]/g, ' ').split(/\s+[—–-]\s+/)[0].trim();
    return head;
}
export function inner$docToSentence$link$l(r, e, f) {
    const l = r.links.find((x) => x.ent === e.name && x.field === f.name);
    return l;
}
export function inner$docToSentence$flows(defs, r, LU) {
    const aliasHe = new Map();
    for (const e of r.ents)
        for (const a of e.alias)
            aliasHe.set(a.toLowerCase(), e.name);
    const flows = r.flows.map((f) => ({ ...f, he: aliasHe.get(f.ent.toLowerCase()) || null, clause: `התראה כש${defs[f.field.replace(/_/g, ' ')] || f.field.replace(/_/g, ' ')} ${f.op === '>' ? 'מעל' : 'מתחת ל-'}${f.op === '>' ? ' ' : ''}${f.n}${f.unit && LU[f.unit] ? ' ' + LU[f.unit] : ''}` }));
    return flows;
}
export function inner$docToSentence$flows$$step(defs, r, aliasHe, LU) {
    const flows = r.flows.map((f) => ({ ...f, he: aliasHe.get(f.ent.toLowerCase()) || null, clause: `התראה כש${defs[f.field.replace(/_/g, ' ')] || f.field.replace(/_/g, ' ')} ${f.op === '>' ? 'מעל' : 'מתחת ל-'}${f.op === '>' ? ' ' : ''}${f.n}${f.unit && LU[f.unit] ? ' ' + LU[f.unit] : ''}` }));
    return flows;
}
export function inner$docToSpec$byAlias$$after_loop(ents) {
    const byAlias = new Map();
    for (const e of ents)
        for (const a of e.alias)
            byAlias.set(a.toLowerCase(), e.name);
    return byAlias;
}
export function inner$docToSentence$aliasHe$$after_loop(r) {
    const aliasHe = new Map();
    for (const e of r.ents)
        for (const a of e.alias)
            aliasHe.set(a.toLowerCase(), e.name);
    return aliasHe;
}

export const SIGS = {
  inner$htmlToMd$s: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$listOf$sep: [{"name":"cell","d":{"t":"any"},"opt":false}],
  inner$tablesOf$t: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$tablesOf$cells: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$tablesOf$cells$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$entityTables$w: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$entityTables$isList$filter$l: [{"name":"ci","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$entityTables$body: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fc","d":{"t":"num"},"opt":false}],
  inner$entityTables$filter$l: [{"name":"fc","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$entityTables$he: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$entityTables$he$$step: [{"name":"nameCell","d":{"t":"any"},"opt":false}],
  inner$entityTables$alias: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$entityTables$alias$$step: [{"name":"nameCell","d":{"t":"any"},"opt":false}],
  inner$entityTables$fields: [{"name":"fc","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$entityTables$flatMap$m: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$entityTables$states: [{"name":"sc","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$docToSpec$md: [{"name":"md0","d":{"t":"any"},"opt":false}],
  inner$docToSpec$lines: [{"name":"md0","d":{"t":"any"},"opt":false},{"name":"title","d":{"t":"null"},"opt":false}],
  inner$docToSpec$lines$$step: [{"name":"title","d":{"t":"null"},"opt":false},{"name":"md","d":{"t":"any"},"opt":false}],
  inner$docToSpec$map$toks: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$docToSpec$map$hit: [{"name":"byAlias","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$docToSpec$map$hit$$step: [{"name":"byAlias","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]},"opt":false},{"name":"toks","d":{"t":"any"},"opt":false}],
  inner$docToSentence$md: [{"name":"md0","d":{"t":"any"},"opt":false}],
  inner$docToSentence$head: [{"name":"md0","d":{"t":"any"},"opt":false},{"name":"title","d":{"t":"null"},"opt":false}],
  inner$docToSentence$head$$step: [{"name":"title","d":{"t":"null"},"opt":false},{"name":"md","d":{"t":"any"},"opt":false}],
  inner$docToSentence$link$l: [{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["spec",{"t":"null"},false],["ents",{"t":"arr","of":{"t":"undef"}},false],["flows",{"t":"arr","of":{"t":"undef"}},false],["links",{"t":"arr","of":{"t":"undef"}},false]]},{"t":"obj","p":[["spec",{"t":"str"},false],["ents",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]}},false],["flows",{"t":"arr","of":{"t":"obj","p":[["ent",{"t":"any"},false],["field",{"t":"any"},false],["op",{"t":"any"},false],["n",{"t":"num"},false],["unit",{"t":"any"},false],["then",{"t":"any"},false]]}},false],["links",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"e","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$docToSentence$flows: [{"name":"defs","d":{"t":"obj","p":[]},"opt":false},{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["spec",{"t":"null"},false],["ents",{"t":"arr","of":{"t":"undef"}},false],["flows",{"t":"arr","of":{"t":"undef"}},false],["links",{"t":"arr","of":{"t":"undef"}},false]]},{"t":"obj","p":[["spec",{"t":"str"},false],["ents",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]}},false],["flows",{"t":"arr","of":{"t":"obj","p":[["ent",{"t":"any"},false],["field",{"t":"any"},false],["op",{"t":"any"},false],["n",{"t":"num"},false],["unit",{"t":"any"},false],["then",{"t":"any"},false]]}},false],["links",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"LU","d":{"t":"any"},"opt":false}],
  inner$docToSentence$flows$$step: [{"name":"defs","d":{"t":"obj","p":[]},"opt":false},{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["spec",{"t":"null"},false],["ents",{"t":"arr","of":{"t":"undef"}},false],["flows",{"t":"arr","of":{"t":"undef"}},false],["links",{"t":"arr","of":{"t":"undef"}},false]]},{"t":"obj","p":[["spec",{"t":"str"},false],["ents",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]}},false],["flows",{"t":"arr","of":{"t":"obj","p":[["ent",{"t":"any"},false],["field",{"t":"any"},false],["op",{"t":"any"},false],["n",{"t":"num"},false],["unit",{"t":"any"},false],["then",{"t":"any"},false]]}},false],["links",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"aliasHe","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"LU","d":{"t":"any"},"opt":false}],
  inner$docToSpec$byAlias$$after_loop: [{"name":"ents","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]}},"opt":false}],
  inner$docToSentence$aliasHe$$after_loop: [{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["spec",{"t":"null"},false],["ents",{"t":"arr","of":{"t":"undef"}},false],["flows",{"t":"arr","of":{"t":"undef"}},false],["links",{"t":"arr","of":{"t":"undef"}},false]]},{"t":"obj","p":[["spec",{"t":"str"},false],["ents",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["alias",{"t":"any"},false],["fields",{"t":"any"},false],["states",{"t":"any"},false]]}},false],["flows",{"t":"arr","of":{"t":"obj","p":[["ent",{"t":"any"},false],["field",{"t":"any"},false],["op",{"t":"any"},false],["n",{"t":"num"},false],["unit",{"t":"any"},false],["then",{"t":"any"},false]]}},false],["links",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
};
