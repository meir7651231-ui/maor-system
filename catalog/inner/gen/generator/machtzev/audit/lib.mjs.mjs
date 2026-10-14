// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/audit/lib.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$rootHug$disp(rs) {
    const disp = (rs['display'] || '').trim();
    return disp;
}
export function inner$rootHug$fixedW(rs) {
    const fixedW = /^\d/.test(rs['width'] || '') && !/%/.test(rs['width'] || '');
    return fixedW;
}
export function inner$atomsOf$origBody(c, th) {
    const origBody = th ? th[0].html : c.body;
    return origBody;
}
export function inner$frameOrig$style(html) {
    const style = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
    return style;
}
export function inner$frameOrig$defs(html) {
    const defs = (html.match(/<defs>[\s\S]*?<\/defs>/g) || []).join('');
    return defs;
}

export const SIGS = {
  inner$rootHug$disp: [{"name":"rs","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$rootHug$fixedW: [{"name":"rs","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$atomsOf$origBody: [{"name":"c","d":{"t":"obj","p":[["name",{"t":"any"},false],["seam",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false},{"name":"th","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["label",{"t":"any"},false],["html",{"t":"any"},false]]}}]},"opt":false}],
  inner$frameOrig$style: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$frameOrig$defs: [{"name":"html","d":{"t":"any"},"opt":false}],
};
