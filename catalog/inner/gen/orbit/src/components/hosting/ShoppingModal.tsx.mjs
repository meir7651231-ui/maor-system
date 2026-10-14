// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/ShoppingModal.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ShopDialog$shelf$li(list, sec) {
    const li = list.products.filter((p) => p.sec === sec);
    return li;
}
export function inner$ShopDialog$shelf$g(list, sec) {
    const li = list.products.filter((p) => p.sec === sec);
    const g = li.filter((p) => p.got).length;
    return g;
}
export function inner$ShopDialog$shelf$g$$step(li) {
    const g = li.filter((p) => p.got).length;
    return g;
}
export function inner$ShopDialog$curEmoji(d, pick, addEmoji) {
    const curEmoji = pick ? (pick.key === null ? (addEmoji ?? '') : (d.prefs.shopEmoji?.[pick.key] ?? '')) : '';
    return curEmoji;
}
export function inner$TablesetDialog$N(items) {
    const N = Math.min(7, Math.max(1, items.length));
    return N;
}
export function inner$TablesetDialog$map$a(N, i) {
    const a = ((-90 + (i * 360) / N) * Math.PI) / 180;
    return a;
}

export const SIGS = {
  inner$ShopDialog$shelf$li: [{"name":"list","d":{"t":"obj","p":[["products",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"str"},false],["sec",{"t":"lit","v":["sup","ing","tbl"]},false],["supplyId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["got",{"t":"bool"},false]]}},false],["mealsN",{"t":"num"},false],["totalDiners",{"t":"num"},false],["gotN",{"t":"num"},false],["total",{"t":"num"},false],["pct",{"t":"num"},false],["done",{"t":"bool"},false]]},"opt":false},{"name":"sec","d":{"t":"lit","v":["sup","ing","tbl"]},"opt":false}],
  inner$ShopDialog$shelf$g: [{"name":"list","d":{"t":"obj","p":[["products",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"str"},false],["sec",{"t":"lit","v":["sup","ing","tbl"]},false],["supplyId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["got",{"t":"bool"},false]]}},false],["mealsN",{"t":"num"},false],["totalDiners",{"t":"num"},false],["gotN",{"t":"num"},false],["total",{"t":"num"},false],["pct",{"t":"num"},false],["done",{"t":"bool"},false]]},"opt":false},{"name":"sec","d":{"t":"lit","v":["sup","ing","tbl"]},"opt":false}],
  inner$ShopDialog$shelf$g$$step: [{"name":"li","d":{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"str"},false],["sec",{"t":"lit","v":["sup","ing","tbl"]},false],["supplyId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["got",{"t":"bool"},false]]}},"opt":false}],
  inner$ShopDialog$curEmoji: [{"name":"d","d":{"t":"obj","n":"HostData","p":[["units",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["bookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["records",{"t":"arr","of":{"t":"any"}},false],["prefs",{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},false],["settings",{"t":"obj","n":"HostSettings","p":[["checkin",{"t":"str"},false],["checkout",{"t":"str"},false],["cleaningFee",{"t":"num"},false],["taxPct",{"t":"num"},false],["orderLeadDays",{"t":"num"},false],["familyTerm",{"t":"bool"},false]]},false],["guests",{"t":"arr","of":{"t":"obj","n":"HostGuest","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[]}},false],["meals",{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[]}},false],["dishes",{"t":"arr","of":{"t":"obj","n":"HostDish","p":[]}},false],["staff",{"t":"arr","of":{"t":"obj","n":"HostStaff","p":[]}},false],["supplies",{"t":"arr","of":{"t":"obj","n":"HostSupply","p":[]}},false],["tableItems",{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[]}},false],["temps",{"t":"arr","of":{"t":"obj","n":"HostTempLog","p":[]}},false],["faults",{"t":"arr","of":{"t":"obj","n":"HostFault","p":[]}},false],["assets",{"t":"arr","of":{"t":"obj","n":"HostAsset","p":[]}},false],["plans",{"t":"arr","of":{"t":"obj","n":"HostPlan","p":[]}},false],["unitOf",{"t":"fn"},false],["guestOf",{"t":"fn"},false],["bookingOf",{"t":"fn"},false],["guestName",{"t":"fn"},false],["unitName",{"t":"fn"},false],["staffName",{"t":"fn"},false]]},"opt":false},{"name":"pick","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["key",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}]},"opt":false},{"name":"addEmoji","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$TablesetDialog$N: [{"name":"items","d":{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[["kind",{"t":"lit","v":["tableItem"]},false],["name",{"t":"str"},false],["perGuest",{"t":"num"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$TablesetDialog$map$a: [{"name":"N","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
