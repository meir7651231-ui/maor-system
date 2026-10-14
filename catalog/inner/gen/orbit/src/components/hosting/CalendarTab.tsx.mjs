// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/CalendarTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CalendarTab$map$rowH(lanes, u) {
    const rowH = Math.max(38, (lanes[u.id] ?? 1) * 19 + 6);
    return rowH;
}
export function inner$CalendarTab$map$ubars(bars, u) {
    const ubars = bars.filter((b) => b.unitId === u.id);
    return ubars;
}

export const SIGS = {
  inner$CalendarTab$map$rowH: [{"name":"lanes","d":{"t":"rec","of":{"t":"num"}},"opt":false},{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$CalendarTab$map$ubars: [{"name":"bars","d":{"t":"arr","of":{"t":"obj","n":"HostCalBar","p":[["id",{"t":"str"},false],["unitId",{"t":"str"},false],["start",{"t":"num"},false],["span",{"t":"num"},false],["lane",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
};
