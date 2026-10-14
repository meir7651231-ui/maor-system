// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/tzedaka/TzedakaView.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$TzedakaView$active(tab, tabs) {
    const active = tabs.find((t) => t.key === tab && t.on) ? tab : 'coordinators';
    return active;
}

export const SIGS = {
  inner$TzedakaView$active: [{"name":"tab","d":{"t":"lit","v":["calendar","care","showcase","coordinators"]},"opt":false},{"name":"tabs","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"lit","v":["calendar","care","showcase","coordinators"]},false],["label",{"t":"str"},false],["on",{"t":"bool"},false]]}},"opt":false}],
};
