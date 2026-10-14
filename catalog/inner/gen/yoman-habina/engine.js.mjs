// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך yoman-habina:engine.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fn$srcLine$links(src) {
    let links = src.map(function (s) {
        return '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.t + " ↗</a>";
    }).join(" · ");
    return links;
}
export function inner$fn$tag$cls(t) {
    let cls = "tag" + (t.fill ? " fill" : "") + (t.ink ? " ink" : "");
    return cls;
}

export const SIGS = {
  inner$fn$srcLine$links: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$fn$tag$cls: [{"name":"t","d":{"t":"any"},"opt":false}],
};
