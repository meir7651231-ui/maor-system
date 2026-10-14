// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/enginebox/linkShape.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const MAX_LINK_SHAPES = 500;
const ID = '[a-z][a-z0-9._-]{0,39}';
const LINK_SHAPE = new RegExp('^' + ID + '>' + ID + '>' + ID + '$');
function sanitizeLinkShapes(x) {
    if (!Array.isArray(x))
        return undefined;
    const seen = new Set();
    for (const k of x) {
        if (typeof k !== 'string')
            continue;
        const t = k.trim();
        if (LINK_SHAPE.test(t))
            seen.add(t);
    }
    return [...seen].sort().slice(0, MAX_LINK_SHAPES);
}
export function inner$sanitizeLinkShapes$t(k) {
    const t = k.trim();
    return t;
}
export function inner$healEngineLinksIn$clean(cur) {
    const clean = sanitizeLinkShapes(cur);
    return clean;
}
export function inner$sanitizeLinkShapes$seen$$after_loop(x) {
    const seen = new Set();
    for (const k of x) {
        if (typeof k !== 'string')
            continue;
        const t = k.trim();
        if (LINK_SHAPE.test(t))
            seen.add(t);
    }
    return seen;
}

export const SIGS = {
  inner$sanitizeLinkShapes$t: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$healEngineLinksIn$clean: [{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$sanitizeLinkShapes$seen$$after_loop: [{"name":"x","d":{"t":"any"},"opt":false}],
};
