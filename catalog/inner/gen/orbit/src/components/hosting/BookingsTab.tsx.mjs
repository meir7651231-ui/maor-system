// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/BookingsTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$BookingsTab$map$inWindow(today, b) {
    const inWindow = b.checkIn <= today && b.checkOut > today;
    return inWindow;
}

export const SIGS = {
  inner$BookingsTab$map$inWindow: [{"name":"today","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
};
