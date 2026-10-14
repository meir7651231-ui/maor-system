// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/search/submenu-sort.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SortSubmenu$map$on(active, o) {
    const on = active === o.id;
    return on;
}

export const SIGS = {
  inner$SortSubmenu$map$on: [{"name":"active","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"obj","n":"Opt","p":[["id",{"t":"lit","v":["default","name_asc","name_desc","price_asc","price_desc"]},false],["label",{"t":"str"},false],["icon",{"t":"any"},false]]},"opt":false}],
};
