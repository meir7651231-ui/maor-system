// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/search/tools-dial.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ToolsRail$activeDef(TOOLS, active) {
    const activeDef = active ? TOOLS.find((t) => t.id === active) : null;
    return activeDef;
}

export const SIGS = {
  inner$ToolsRail$activeDef: [{"name":"TOOLS","d":{"t":"arr","of":{"t":"obj","n":"Tool","p":[["id",{"t":"lit","v":["voice","barcode","filters","sort","catalog"]},false],["label",{"t":"str"},false],["icon",{"t":"any"},false]]}},"opt":false},{"name":"active","d":{"t":"any"},"opt":false}],
};
