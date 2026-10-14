// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/lenses.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyLenses$map$seen(e, ctx, L) {
    const seen = (ctx.roles || []).filter((r) => !r.all && L.roles.includes(r.name) && r.ents.includes(e.name)).map((r) => r.name);
    return seen;
}

export const SIGS = {
  inner$applyLenses$map$seen: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
};
