// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/empire-coverage.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$empireFns$ext(kind) {
    const ext = kind === 'dart' ? /\.dart$/ : /\.(ts|tsx|js|mjs)$/;
    return ext;
}
export function inner$empireFns$base(root) {
    const base = root.replace(/\/(src|lib)$/, '/');
    return base;
}
export function inner$empireFns$rel(root, f) {
    const base = root.replace(/\/(src|lib)$/, '/');
    const rel = f.replace(base, '');
    return rel;
}
export function inner$empireFns$rel$$step(base, f) {
    const rel = f.replace(base, '');
    return rel;
}
export function inner$empireFns$rel_L55(root, f) {
    const base = root.replace(/\/(src|lib)$/, '/');
    const rel = f.replace(base, '');
    return rel;
}
export function inner$empireFns$rel_L55$$step(base, f) {
    const rel = f.replace(base, '');
    return rel;
}
export function inner$shelfNames$nm(n) {
    const nm = n.trim().split(/\s+as\s+/)[0].trim();
    return nm;
}
export function inner$wiredSection$opOf(ops) {
    const opOf = new Map(ops.map((a) => [a.id, a.op]));
    return opOf;
}
export function inner$wiredSection$op(ops, e) {
    const opOf = new Map(ops.map((a) => [a.id, a.op]));
    const op = opOf.get(e.name) || '?';
    return op;
}
export function inner$wiredSection$op$$step(opOf, e) {
    const op = opOf.get(e.name) || '?';
    return op;
}
export function inner$wiredSection$W(lc, wired) {
    const W = [...lc].filter((e) => wired.has(e.name)).length;
    return W;
}
export function inner$wiredSection$out(lc, ops, wired) {
    const opOf = new Map(ops.map((a) => [a.id, a.op]));
    const byOp = {};
    for (const e of lc) {
        const op = opOf.get(e.name) || '?';
        const b = (byOp[op] ||= { n: 0, w: 0 });
        b.n++;
        if (wired.has(e.name))
            b.w++;
    }
    const W = [...lc].filter((e) => wired.has(e.name)).length;
    const src = {};
    for (const v of wired.values())
        src[v] = (src[v] || 0) + 1;
    const out = ['## מקסימליות · חיווט-בפועל (G62 · #7)', '',
        `- מנועים במדף (logic-census): **${lc.length}** · מחווטים-בפועל **${W}** (${Math.round(W / (lc.length || 1) * 100)}%) · **נמשכו-אך-לא-חוּוטו ${lc.length - W}** (pulled-not-wired)`,
        `- מקורות-החיווט: ${Object.entries(src).map(([k, v]) => k + ' ' + v).join(' · ')} · הרצפה-המצרפית: truth.mjs wiring-floor (רק-עולה)`,
        `- פסק-כנות: «מחווט» = נבחר-בפועל/נקרא-בפועל, לא «נגיש-לבורר». «פער-מאמת» לפי מילות-שם נדחה (342/957 שווא; חוק-4).`, '',
        '| op | מנועים | מחווטים | לא-מחווטים |', '|---|---|---|---|',
        ...Object.entries(byOp).sort((a, b) => b[1].n - a[1].n).map(([op, b]) => `| ${op} | ${b.n} | ${b.w} | ${b.n - b.w} |`), ''];
    return out;
}
export function inner$wiredSection$out$$step(lc, byOp, W, src) {
    const out = ['## מקסימליות · חיווט-בפועל (G62 · #7)', '',
        `- מנועים במדף (logic-census): **${lc.length}** · מחווטים-בפועל **${W}** (${Math.round(W / (lc.length || 1) * 100)}%) · **נמשכו-אך-לא-חוּוטו ${lc.length - W}** (pulled-not-wired)`,
        `- מקורות-החיווט: ${Object.entries(src).map(([k, v]) => k + ' ' + v).join(' · ')} · הרצפה-המצרפית: truth.mjs wiring-floor (רק-עולה)`,
        `- פסק-כנות: «מחווט» = נבחר-בפועל/נקרא-בפועל, לא «נגיש-לבורר». «פער-מאמת» לפי מילות-שם נדחה (342/957 שווא; חוק-4).`, '',
        '| op | מנועים | מחווטים | לא-מחווטים |', '|---|---|---|---|',
        ...Object.entries(byOp).sort((a, b) => b[1].n - a[1].n).map(([op, b]) => `| ${op} | ${b.n} | ${b.w} | ${b.n - b.w} |`), ''];
    return out;
}
export function inner$wiredSection$byOp$$after_loop(lc, ops, wired) {
    const opOf = new Map(ops.map((a) => [a.id, a.op]));
    const byOp = {};
    for (const e of lc) {
        const op = opOf.get(e.name) || '?';
        const b = (byOp[op] ||= { n: 0, w: 0 });
        b.n++;
        if (wired.has(e.name))
            b.w++;
    }
    return byOp;
}
export function inner$wiredSection$src$$after_loop(wired) {
    const src = {};
    for (const v of wired.values())
        src[v] = (src[v] || 0) + 1;
    return src;
}

export const SIGS = {
  inner$empireFns$ext: [{"name":"kind","d":{"t":"any"},"opt":false}],
  inner$empireFns$base: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$empireFns$rel: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$empireFns$rel$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$empireFns$rel_L55: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$empireFns$rel_L55$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$shelfNames$nm: [{"name":"n","d":{"t":"str"},"opt":false}],
  inner$wiredSection$opOf: [{"name":"ops","d":{"t":"any"},"opt":false}],
  inner$wiredSection$op: [{"name":"ops","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$wiredSection$op$$step: [{"name":"opOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$wiredSection$W: [{"name":"lc","d":{"t":"any"},"opt":false},{"name":"wired","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$wiredSection$out: [{"name":"lc","d":{"t":"any"},"opt":false},{"name":"ops","d":{"t":"any"},"opt":false},{"name":"wired","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$wiredSection$out$$step: [{"name":"lc","d":{"t":"any"},"opt":false},{"name":"byOp","d":{"t":"obj","n":"byOp","p":[]},"opt":false},{"name":"W","d":{"t":"num"},"opt":false},{"name":"src","d":{"t":"obj","n":"src","p":[]},"opt":false}],
  inner$wiredSection$byOp$$after_loop: [{"name":"lc","d":{"t":"any"},"opt":false},{"name":"ops","d":{"t":"any"},"opt":false},{"name":"wired","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$wiredSection$src$$after_loop: [{"name":"wired","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
};
