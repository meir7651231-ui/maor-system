// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/combine-screens.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$screenPerClause$prev(seen, best) {
    const prev = seen.get(best.name);
    return prev;
}
export function inner$combine$id(sections, s, sec) {
    const id = sections.some((x) => x.id === sec.id) ? `${s.name}__${sec.id}` : sec.id;
    return id;
}
export function inner$combine$merged(text, outName, contentSet, sections) {
    const merged = {
        generated: true,
        src: `combine:${text}`,
        screen: outName,
        content: [...contentSet],
        sections,
    };
    return merged;
}

export const SIGS = {
  inner$screenPerClause$prev: [{"name":"seen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"best","d":{"t":"obj","p":[["name",{"t":"str"},false],["score",{"t":"num"},false],["hits",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$combine$id: [{"name":"sections","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"sec","d":{"t":"any"},"opt":false}],
  inner$combine$merged: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"outName","d":{"t":"str"},"opt":false},{"name":"contentSet","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"sections","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
