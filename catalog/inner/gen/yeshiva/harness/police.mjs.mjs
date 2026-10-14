// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך yeshiva:harness/police.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$opt$i(argv, k) {
    const i = argv.indexOf(k);
    return i;
}
export function inner$parse$map$i(l) {
    const i = l.indexOf(' ');
    return i;
}
export function inner$depNames$o(txt) {
    const o = JSON.parse(txt);
    return o;
}
export function inner$depNames$m(inDeps, l) {
    const m = inDeps && l.match(/^\s+['"]?([\w@.\/-]+)['"]?\s*[:=]/);
    return m;
}
export function inner$names$flatMap$m(EXP, l) {
    const m = ('+' + l).match(EXP);
    return m;
}
export function inner$depNames$out$$after_loop(txt) {
    const out = new Set();
    let inDeps = false;
    for (const l of txt.split('\n')) {
        if (/^\s*(\[.*dependencies.*\]|dependencies:|dev_dependencies:|require)/i.test(l)) {
            inDeps = true;
            continue;
        }
        if (/^\S/.test(l) && !/^\s/.test(l) && inDeps && !/^\s*[\w@.\/-]+\s*[:=]/.test(l))
            inDeps = false;
        const m = inDeps && l.match(/^\s+['"]?([\w@.\/-]+)['"]?\s*[:=]/);
        if (m)
            out.add(m[1]);
    }
    return out;
}
export function inner$depNames$inDeps$$after_loop(txt) {
    const out = new Set();
    let inDeps = false;
    for (const l of txt.split('\n')) {
        if (/^\s*(\[.*dependencies.*\]|dependencies:|dev_dependencies:|require)/i.test(l)) {
            inDeps = true;
            continue;
        }
        if (/^\S/.test(l) && !/^\s/.test(l) && inDeps && !/^\s*[\w@.\/-]+\s*[:=]/.test(l))
            inDeps = false;
        const m = inDeps && l.match(/^\s+['"]?([\w@.\/-]+)['"]?\s*[:=]/);
        if (m)
            out.add(m[1]);
    }
    return inDeps;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$parse$map$i: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$depNames$o: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$depNames$m: [{"name":"inDeps","d":{"t":"bool"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$names$flatMap$m: [{"name":"EXP","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$depNames$out$$after_loop: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$depNames$inDeps$$after_loop: [{"name":"txt","d":{"t":"any"},"opt":false}],
};
