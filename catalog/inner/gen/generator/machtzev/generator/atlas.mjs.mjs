// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/atlas.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const splitTop = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s.replace(/[\[\]]/g, ' ')) {
    if ('<('.includes(ch))
        d++;
    else if ('>)'.includes(ch))
        d--;
    if (ch === ',' && d === 0) {
        out.push(cur);
        cur = '';
    }
    else
        cur += ch;
} if (cur.trim())
    out.push(cur); return out; };
export function inner$buildAtlas$heHead$head(raw) {
    const head = raw.split('\n').slice(0, 6).filter(l => /^\s*\/\//.test(l)).join(' ');
    return head;
}
export function inner$buildAtlas$heHead$desc(raw) {
    const head = raw.split('\n').slice(0, 6).filter(l => /^\s*\/\//.test(l)).join(' ');
    const desc = (head.split('—')[1] || head).replace(/\(חוק[^)]*\)/g, '');
    return desc;
}
export function inner$buildAtlas$heHead$desc$$step(head) {
    const desc = (head.split('—')[1] || head).replace(/\(חוק[^)]*\)/g, '');
    return desc;
}
export function inner$buildAtlas$ctm(cls, body) {
    const ctm = body.match(new RegExp('(?:const\\s+)?' + cls + '\\s*\\(([\\s\\S]*?)\\)\\s*[;:{]'));
    return ctm;
}
export function inner$buildAtlas$namedPart(sig) {
    const namedPart = sig.includes('{') ? sig.slice(sig.indexOf('{')) : '';
    return namedPart;
}
export function inner$buildAtlas$mm(pp) {
    const mm = pp.match(/this\.(\w+)/);
    return mm;
}
export function inner$buildAtlas$headLines(raw) {
    const headLines = raw.split('\n').slice(0, 14).filter(l => /^\s*\/\//.test(l));
    return headLines;
}
export function inner$buildAtlas$ret(fm) {
    const ret = fm[1].split(/\s+/)[0];
    return ret;
}
export function inner$buildAtlas$params(fm) {
    const params = splitTop(fm[3]).map(p => p.trim()).filter(Boolean).map(p => {
        const mm = p.match(/^([\w<>,?() ]+?)\s+(\w+)$/);
        return mm ? { type: mm[1].trim(), name: mm[2] } : { type: p, name: '' };
    });
    return params;
}
export function inner$buildAtlas$map$mm(p) {
    const mm = p.match(/^([\w<>,?() ]+?)\s+(\w+)$/);
    return mm;
}
export function inner$buildAtlas$heD(rawD) {
    const heD = [...(rawD.split('\n')[0] || '').matchAll(/[֐-׿][֐-׿]*/g)].map(m => m[0].replace(/^ה(?=..)/, '')).filter(w => w.length > 1);
    return heD;
}
export function inner$buildAtlas$at(dm) {
    const at = dm.index + dm[0].length;
    return at;
}
export function inner$buildAtlas$seg(src, dm) {
    const at = dm.index + dm[0].length;
    const seg = src.slice(at, src.indexOf(';', at));
    return seg;
}
export function inner$buildAtlas$seg$$step(src, at) {
    const seg = src.slice(at, src.indexOf(';', at));
    return seg;
}
export function inner$buildAtlas$types$$after_loop(body) {
    const types = new Map();
    for (const fm of body.matchAll(/final\s+([^;=]+?)\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*;/g))
        for (const nm of fm[2].split(','))
            types.set(nm.trim(), fm[1].trim());
    return types;
}
export function inner$buildAtlas$positional$$after_loop(sig) {
    const positional = [];
    for (const pp of (sig.includes('{') ? sig.slice(0, sig.indexOf('{')) : sig).split(',')) {
        const mm = pp.match(/this\.(\w+)/);
        if (mm)
            positional.push(mm[1]);
    }
    return positional;
}

export const SIGS = {
  inner$buildAtlas$heHead$head: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$heHead$desc: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$heHead$desc$$step: [{"name":"head","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$ctm: [{"name":"cls","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$namedPart: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$mm: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$headLines: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$ret: [{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$params: [{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$map$mm: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$buildAtlas$heD: [{"name":"rawD","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$at: [{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$seg: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$seg$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$types$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$buildAtlas$positional$$after_loop: [{"name":"sig","d":{"t":"any"},"opt":false}],
};
