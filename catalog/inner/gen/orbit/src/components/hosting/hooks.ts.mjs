// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/hooks.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$useHostData$useMemo$uMap(units) {
    const uMap = new Map(units.map((u) => [u.id, u]));
    return uMap;
}
export function inner$useHostData$useMemo$gMap(guests) {
    const gMap = new Map(guests.map((g) => [g.id, g]));
    return gMap;
}
export function inner$useHostData$useMemo$bMap(bookings) {
    const bMap = new Map(bookings.map((b) => [b.id, b]));
    return bMap;
}
export function inner$useHostData$useMemo$sMap(staff) {
    const sMap = new Map(staff.map((s) => [s.id, s]));
    return sMap;
}

export const SIGS = {
  inner$useHostData$useMemo$uMap: [{"name":"units","d":{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$useHostData$useMemo$gMap: [{"name":"guests","d":{"t":"arr","of":{"t":"obj","n":"HostGuest","p":[["kind",{"t":"lit","v":["guest"]},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["notes",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$useHostData$useMemo$bMap: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$useHostData$useMemo$sMap: [{"name":"staff","d":{"t":"arr","of":{"t":"obj","n":"HostStaff","p":[["kind",{"t":"lit","v":["staff"]},false],["name",{"t":"str"},false],["role",{"t":"str"},false],["phone",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
};
