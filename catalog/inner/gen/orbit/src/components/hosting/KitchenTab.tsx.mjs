// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/KitchenTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$KTimer$at(props) {
    const at = Date.parse(props.serveAt);
    return at;
}
export function inner$KitchenTab$nowMin(nowMs) {
    const nowD = new Date(nowMs);
    const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
    return nowMin;
}
export function inner$KitchenTab$nowMin$$step(nowD) {
    const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
    return nowMin;
}
export function inner$KitchenTab$map$li(active, k) {
    const li = active.filter((m) => m.status === k);
    return li;
}

export const SIGS = {
  inner$KTimer$at: [{"name":"props","d":{"t":"obj","p":[["serveAt",{"t":"str"},false],["style",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CSSProperties","p":[]}]},true]]},"opt":false}],
  inner$KitchenTab$nowMin: [{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$KitchenTab$nowMin$$step: [{"name":"nowD","d":{"t":"date"},"opt":false}],
  inner$KitchenTab$map$li: [{"name":"active","d":{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"k","d":{"t":"lit","v":["ready","new","prep","qc"]},"opt":false}],
};
