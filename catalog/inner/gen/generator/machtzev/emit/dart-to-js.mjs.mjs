// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/dart-to-js.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$stripParams$map$m(p) {
    const m = p.match(/([a-z_]\w*)\s*$/);
    return m;
}
export function inner$emitBody$replace$names(inner) {
    const names = [...inner.matchAll(/(\w+)\s*(?:,|$)/g)].map(x => x[1]).filter(n => n !== 'required' && n !== 'Function');
    return names;
}
export function inner$emitBody$replace$nm(inner) {
    const nm = [...inner.split(',')].map(x => (x.trim().match(/([a-z_]\w*)\s*$/) || [])[1]).filter(Boolean);
    return nm;
}
export function inner$emitBody$replace$mm(pt) {
    const mm = pt.match(/^\s*([a-z_]\w*)\s*:\s*([^]*)$/);
    return mm;
}
export function inner$emitBody$replace$pos$$after_loop(parts) {
    const pos = [];
    const named = [];
    for (const pt of parts) {
        const mm = pt.match(/^\s*([a-z_]\w*)\s*:\s*([^]*)$/);
        if (mm)
            named.push(`${mm[1]}: ${mm[2].trim()}`);
        else
            pos.push(pt.trim());
    }
    return pos;
}
export function inner$emitBody$replace$named$$after_loop(parts) {
    const pos = [];
    const named = [];
    for (const pt of parts) {
        const mm = pt.match(/^\s*([a-z_]\w*)\s*:\s*([^]*)$/);
        if (mm)
            named.push(`${mm[1]}: ${mm[2].trim()}`);
        else
            pos.push(pt.trim());
    }
    return named;
}

export const SIGS = {
  inner$stripParams$map$m: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$emitBody$replace$names: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$emitBody$replace$nm: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$emitBody$replace$mm: [{"name":"pt","d":{"t":"str"},"opt":false}],
  inner$emitBody$replace$pos$$after_loop: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emitBody$replace$named$$after_loop: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
