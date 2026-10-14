// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/chaser.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$resolveAll$rs(REG, g) {
    const rs = REG.get(g.kind) || [];
    return rs;
}
export function inner$summary$c$$after_loop(resolved) {
    const c = {};
    for (const x of resolved)
        c[x.outcome || 'silent'] = (c[x.outcome || 'silent'] || 0) + 1;
    return c;
}

export const SIGS = {
  inner$resolveAll$rs: [{"name":"REG","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$summary$c$$after_loop: [{"name":"resolved","d":{"t":"any"},"opt":false}],
};
