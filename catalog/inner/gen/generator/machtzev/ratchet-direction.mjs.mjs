// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/ratchet-direction.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const key = (x) => (typeof x === 'string' ? x : JSON.stringify(x));
function weaken(A, B, dir, p = '') {
    const out = [];
    if (isObj(A) && isObj(B)) {
        for (const k of Object.keys(A)) {
            if (!(k in B)) {
                if (dir === 'grow')
                    out.push(`${p}${k} הוסר`);
                continue;
            }
            out.push(...weaken(A[k], B[k], dir, `${p}${k}.`));
        }
        for (const k of Object.keys(B))
            if (!(k in A) && dir === 'shrink')
                out.push(`${p}${k} נוסף`);
    }
    else if (Array.isArray(A) && Array.isArray(B)) {
        const sa = new Set(A.map(key)), sb = new Set(B.map(key));
        if (dir === 'shrink') {
            const g = [...sb].filter((x) => !sa.has(x));
            if (g.length)
                out.push(`${p || 'רשימה'} +${g.length} (${g.slice(0, 3).join(', ').slice(0, 120)})`);
        }
        else {
            const s = [...sa].filter((x) => !sb.has(x));
            if (s.length)
                out.push(`${p || 'רשימה'} −${s.length} (${s.slice(0, 3).join(', ').slice(0, 120)})`);
        }
    }
    else if (typeof A === 'number' && typeof B === 'number') {
        if (dir === 'shrink' && B > A)
            out.push(`${p.replace(/\.$/, '')}: ${A} → ${B} (עלה)`);
        if (dir === 'grow' && B < A)
            out.push(`${p.replace(/\.$/, '')}: ${A} → ${B}`);
    }
    else if (typeof A !== typeof B || Array.isArray(A) !== Array.isArray(B))
        out.push(`${p || 'שורש'} שינה-צורה`);
    return out;
}
export function inner$opt$i(argv, f) {
    const i = argv.indexOf(f);
    return i;
}
export function inner$manifest$p(l) {
    const p = l.split('\t');
    return p;
}
export function inner$manifest$b(l) {
    const p = l.split('\t');
    const b = (p[3] || '').match(/^(?:baseline=)?([^;]+);(?:dir=)?(shrink|grow)$/);
    return b;
}
export function inner$manifest$b$$step(p) {
    const b = (p[3] || '').match(/^(?:baseline=)?([^;]+);(?:dir=)?(shrink|grow)$/);
    return b;
}
export function inner$weaken$sa(A) {
    const sa = new Set(A.map(key));
    return sa;
}
export function inner$weaken$sb(B) {
    const sb = new Set(B.map(key));
    return sb;
}
export function inner$weaken$g(A, B) {
    const sa = new Set(A.map(key));
    const sb = new Set(B.map(key));
    const g = [...sb].filter((x) => !sa.has(x));
    return g;
}
export function inner$weaken$g$$step(sa, sb) {
    const g = [...sb].filter((x) => !sa.has(x));
    return g;
}
export function inner$weaken$s(A, B) {
    const sa = new Set(A.map(key));
    const sb = new Set(B.map(key));
    const s = [...sa].filter((x) => !sb.has(x));
    return s;
}
export function inner$weaken$s$$step(sa, sb) {
    const s = [...sa].filter((x) => !sb.has(x));
    return s;
}
export function inner$compare$w(bl, A, B) {
    const w = weaken(A, B, bl.dir);
    return w;
}
export function inner$manifest$m$$after_loop(src) {
    const m = {};
    for (const l of (src || '').split('\n')) {
        if (!l || l.startsWith('#'))
            continue;
        const p = l.split('\t');
        const b = (p[3] || '').match(/^(?:baseline=)?([^;]+);(?:dir=)?(shrink|grow)$/);
        m[p[0]] = b ? { file: 'machtzev/' + b[1], dir: b[2] } : null;
    }
    return m;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$manifest$p: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$manifest$b: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$manifest$b$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$weaken$sa: [{"name":"A","d":{"t":"any"},"opt":false}],
  inner$weaken$sb: [{"name":"B","d":{"t":"any"},"opt":false}],
  inner$weaken$g: [{"name":"A","d":{"t":"any"},"opt":false},{"name":"B","d":{"t":"any"},"opt":false}],
  inner$weaken$g$$step: [{"name":"sa","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"sb","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$weaken$s: [{"name":"A","d":{"t":"any"},"opt":false},{"name":"B","d":{"t":"any"},"opt":false}],
  inner$weaken$s$$step: [{"name":"sa","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"sb","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$compare$w: [{"name":"bl","d":{"t":"any"},"opt":false},{"name":"A","d":{"t":"any"},"opt":false},{"name":"B","d":{"t":"any"},"opt":false}],
  inner$manifest$m$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
