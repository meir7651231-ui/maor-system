// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/ui.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$Btn$cls(props) {
    const cls = ['btn', props.kind === 'primary' && 'primary', props.kind === 'danger' && 'danger', props.sm && 'sm']
        .filter(Boolean)
        .join(' ');
    return cls;
}
export function inner$Modal$useEffect$onKey$last(items) {
    const last = items[items.length - 1];
    return last;
}
export function inner$ActionsMenu$items(props) {
    const items = props.items.filter((x) => !!x);
    return items;
}

export const SIGS = {
  inner$Btn$cls: [{"name":"props","d":{"t":"obj","p":[["children",{"t":"any"},false],["onClick",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["kind",{"t":"or","of":[{"t":"lit","v":["primary","danger","plain"]},{"t":"undef"}]},true],["sm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["type",{"t":"or","of":[{"t":"lit","v":["button","submit"]},{"t":"undef"}]},true],["title",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["disabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$Modal$useEffect$onKey$last: [{"name":"items","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$ActionsMenu$items: [{"name":"props","d":{"t":"obj","p":[["title",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["items",{"t":"arr","of":{"t":"or","of":[{"t":"lit","v":[false]},{"t":"undef"},{"t":"null"},{"t":"obj","p":[["label",{"t":"str"},false],["onClick",{"t":"fn"},false],["title",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]}},false]]},"opt":false}],
};
