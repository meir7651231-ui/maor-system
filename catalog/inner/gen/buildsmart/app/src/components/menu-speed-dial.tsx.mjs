// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/menu-speed-dial.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$MenuSpeedDial$activeDef(TABS, active) {
    const activeDef = active ? TABS.find((t) => t.id === active) ?? null : null;
    return activeDef;
}

export const SIGS = {
  inner$MenuSpeedDial$activeDef: [{"name":"TABS","d":{"t":"arr","of":{"t":"obj","n":"Tab","p":[["id",{"t":"lit","v":["home","projects","cart","settings"]},false],["label",{"t":"str"},false],["icon",{"t":"any"},false]]}},"opt":false},{"name":"active","d":{"t":"any"},"opt":false}],
};
