// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/SupportersViewSwitcher.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SupportersViewSwitcher$map$on(props, o) {
    const on = o.key === props.active;
    return on;
}

export const SIGS = {
  inner$SupportersViewSwitcher$map$on: [{"name":"props","d":{"t":"obj","p":[["options",{"t":"arr","of":{"t":"obj","n":"ViewOption","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["title",{"t":"str"},false]]}},false],["active",{"t":"str"},false],["onSelect",{"t":"fn"},false]]},"opt":false},{"name":"o","d":{"t":"obj","n":"ViewOption","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["title",{"t":"str"},false]]},"opt":false}],
};
