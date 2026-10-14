// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/GuestsTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$GuestsTab$fam(d) {
    const fam = d.prefs.familyTerm === true;
    return fam;
}
export function inner$GuestsTab$repeat(all) {
    const repeat = all.filter((x) => x.s.stays > 1).length;
    return repeat;
}
export function inner$GuestsTab$spend(all) {
    const spend = all.reduce((s, x) => s + x.s.spend, 0);
    return spend;
}

export const SIGS = {
  inner$GuestsTab$fam: [{"name":"d","d":{"t":"obj","n":"HostData","p":[["units",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["bookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["records",{"t":"arr","of":{"t":"any"}},false],["prefs",{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},false],["settings",{"t":"obj","n":"HostSettings","p":[["checkin",{"t":"str"},false],["checkout",{"t":"str"},false],["cleaningFee",{"t":"num"},false],["taxPct",{"t":"num"},false],["orderLeadDays",{"t":"num"},false],["familyTerm",{"t":"bool"},false]]},false],["guests",{"t":"arr","of":{"t":"obj","n":"HostGuest","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[]}},false],["meals",{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[]}},false],["dishes",{"t":"arr","of":{"t":"obj","n":"HostDish","p":[]}},false],["staff",{"t":"arr","of":{"t":"obj","n":"HostStaff","p":[]}},false],["supplies",{"t":"arr","of":{"t":"obj","n":"HostSupply","p":[]}},false],["tableItems",{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[]}},false],["temps",{"t":"arr","of":{"t":"obj","n":"HostTempLog","p":[]}},false],["faults",{"t":"arr","of":{"t":"obj","n":"HostFault","p":[]}},false],["assets",{"t":"arr","of":{"t":"obj","n":"HostAsset","p":[]}},false],["plans",{"t":"arr","of":{"t":"obj","n":"HostPlan","p":[]}},false],["unitOf",{"t":"fn"},false],["guestOf",{"t":"fn"},false],["bookingOf",{"t":"fn"},false],["guestName",{"t":"fn"},false],["unitName",{"t":"fn"},false],["staffName",{"t":"fn"},false]]},"opt":false}],
  inner$GuestsTab$repeat: [{"name":"all","d":{"t":"arr","of":{"t":"obj","p":[["g",{"t":"obj","n":"HostGuest","p":[["kind",{"t":"lit","v":["guest"]},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["notes",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},false],["s",{"t":"obj","n":"HostGuestStats","p":[["stays",{"t":"num"},false],["spend",{"t":"num"},false],["last",{"t":"str"},false]]},false]]}},"opt":false}],
  inner$GuestsTab$spend: [{"name":"all","d":{"t":"arr","of":{"t":"obj","p":[["g",{"t":"obj","n":"HostGuest","p":[["kind",{"t":"lit","v":["guest"]},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["notes",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},false],["s",{"t":"obj","n":"HostGuestStats","p":[["stays",{"t":"num"},false],["spend",{"t":"num"},false],["last",{"t":"str"},false]]},false]]}},"opt":false}],
};
