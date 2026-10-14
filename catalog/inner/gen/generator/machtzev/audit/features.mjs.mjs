// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/audit/features.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HARD = [
    ['background-clip:text', /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text/i],
    ['transform-3d', /transform\s*:[^;}]*(rotate[xy]|perspective|rotate3d|translatez)/i],
    ['transform-2d', /transform\s*:[^;}]*(rotate|skew|matrix)/i],
    ['object-fit', /object-fit\s*:/i],
    ['clip-path', /clip-path\s*:/i],
    ['mask', /(-webkit-)?mask(-image)?\s*:/i],
    ['mix-blend', /mix-blend-mode\s*:|background-blend-mode\s*:/i],
    ['conic-gradient', /conic-gradient\(/i],
    ['radial-gradient', /radial-gradient\(/i],
    ['filter', /(?<!backdrop-)\bfilter\s*:/i],
    ['backdrop-filter', /backdrop-filter\s*:/i],
    ['aspect-ratio', /aspect-ratio\s*:/i],
    ['position-sticky', /position\s*:\s*sticky/i],
    ['bg-image-url', /background(-image)?\s*:[^;}]*url\(/i],
    ['img-tag', /<img\b/i],
    ['scroll-snap', /scroll-snap-/i],
    ['writing-mode', /writing-mode\s*:/i],
    ['grid-areas', /grid-template-areas\s*:/i],
    ['sticky-overlay', /position\s*:\s*absolute[^;}]*;[^}]*inset\s*:\s*(auto\s+)?0/i],
];
export function inner$fingerprint$scoped(body) {
    let scoped = body.match(/style="[^"]*"/g)?.join(';') || '';
    return scoped;
}
export function inner$fingerprint$feats$$after_loop(body, scoped) {
    const feats = [];
    for (const [name, re] of HARD)
        if (re.test(scoped) || re.test(body))
            feats.push(name);
    return feats;
}

export const SIGS = {
  inner$fingerprint$scoped: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$fingerprint$feats$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"scoped","d":{"t":"any"},"opt":false}],
};
