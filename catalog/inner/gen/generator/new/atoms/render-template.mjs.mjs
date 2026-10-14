// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/render-template.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$renderTemplate$def(key, defs) {
    const def = defs.find((d) => d.key === key)?.def ?? '';
    return def;
}
export function inner$renderTemplate$t(cfg, key, defs) {
    const def = defs.find((d) => d.key === key)?.def ?? '';
    let t = (cfg?.templates?.[key] ?? '').trim() || def;
    return t;
}
export function inner$renderTemplate$t$$step(cfg, key, def) {
    let t = (cfg?.templates?.[key] ?? '').trim() || def;
    return t;
}
export function inner$renderTemplate$t$$after_loop(cfg, key, vars, defs) {
    const def = defs.find((d) => d.key === key)?.def ?? '';
    let t = (cfg?.templates?.[key] ?? '').trim() || def;
    for (const [k, v] of Object.entries(vars))
        t = t.split('{' + k + '}').join(v);
    return t;
}

export const SIGS = {
  inner$renderTemplate$def: [{"name":"key","d":{"t":"any"},"opt":false},{"name":"defs","d":{"t":"any"},"opt":false}],
  inner$renderTemplate$t: [{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false},{"name":"defs","d":{"t":"any"},"opt":false}],
  inner$renderTemplate$t$$step: [{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false},{"name":"def","d":{"t":"any"},"opt":false}],
  inner$renderTemplate$t$$after_loop: [{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false},{"name":"vars","d":{"t":"any"},"opt":false},{"name":"defs","d":{"t":"any"},"opt":false}],
};
