// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/MenuModals.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$MenuDialog$map$stats(m) {
    const stats = [
        m.ingredients.length ? '🥕 ' + m.ingredients.length + ' רכיבים' : '',
        m.steps.length ? '👨‍🍳 ' + m.steps.length + ' שלבים' : '',
        m.prepTime ? '⏱ ' + m.prepTime + 'ד׳' : '',
        m.cookTemp ? '🌡 ' + m.cookTemp + '°' : '',
        '🍽️ ' + (m.baseServings || 4),
    ].filter(Boolean);
    return stats;
}
export function inner$DishDialog$src(props, d) {
    const src = props.id ? d.dishes.find((x) => x.id === props.id) : undefined;
    return src;
}
export function inner$DishDialog$emo(meta, icon) {
    const emo = icon !== '🛒' ? icon : meta[0];
    return emo;
}
export function inner$DishDialog$pmeta(m) {
    const pmeta = [
        m.prepTime ? '⏱ ' + m.prepTime + 'ד׳' : '',
        m.cookTime ? '🔥 ' + m.cookTime + 'ד׳' : '',
        m.cookTemp ? '🌡 ' + m.cookTemp + '°' : '',
        '🍽️ ' + (Number(m.baseServings) || 4),
        '🥕 ' + m.ingredients.length,
        '👨‍🍳 ' + m.steps.length,
    ].filter(Boolean);
    return pmeta;
}
export function inner$DishDialog$staffOpts(d) {
    const staffOpts = [['', '— לא שויך —'], ...d.staff.map((s) => [s.id, s.name + (s.role ? ' · ' + s.role : '')])];
    return staffOpts;
}
export function inner$DishDialog$moveStep$j(i, dir) {
    const j = i + dir;
    return j;
}
export function inner$DishDialog$moveStep$s(m) {
    const s = m.steps.slice();
    return s;
}

export const SIGS = {
  inner$MenuDialog$map$stats: [{"name":"m","d":{"t":"obj","n":"HostDish","p":[["kind",{"t":"lit","v":["dish"]},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["price",{"t":"num"},false],["allergens",{"t":"str"},false],["prepTime",{"t":"str"},false],["cookTime",{"t":"str"},false],["cookTemp",{"t":"str"},false],["baseServings",{"t":"num"},false],["ingredients",{"t":"arr","of":{"t":"str"}},false],["steps",{"t":"arr","of":{"t":"str"}},false],["notes",{"t":"str"},false],["defBy",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$DishDialog$src: [{"name":"props","d":{"t":"obj","p":[["id",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"d","d":{"t":"obj","n":"HostData","p":[["units",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["bookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["records",{"t":"arr","of":{"t":"any"}},false],["prefs",{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},false],["settings",{"t":"obj","n":"HostSettings","p":[["checkin",{"t":"str"},false],["checkout",{"t":"str"},false],["cleaningFee",{"t":"num"},false],["taxPct",{"t":"num"},false],["orderLeadDays",{"t":"num"},false],["familyTerm",{"t":"bool"},false]]},false],["guests",{"t":"arr","of":{"t":"obj","n":"HostGuest","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[]}},false],["meals",{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[]}},false],["dishes",{"t":"arr","of":{"t":"obj","n":"HostDish","p":[]}},false],["staff",{"t":"arr","of":{"t":"obj","n":"HostStaff","p":[]}},false],["supplies",{"t":"arr","of":{"t":"obj","n":"HostSupply","p":[]}},false],["tableItems",{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[]}},false],["temps",{"t":"arr","of":{"t":"obj","n":"HostTempLog","p":[]}},false],["faults",{"t":"arr","of":{"t":"obj","n":"HostFault","p":[]}},false],["assets",{"t":"arr","of":{"t":"obj","n":"HostAsset","p":[]}},false],["plans",{"t":"arr","of":{"t":"obj","n":"HostPlan","p":[]}},false],["unitOf",{"t":"fn"},false],["guestOf",{"t":"fn"},false],["bookingOf",{"t":"fn"},false],["guestName",{"t":"fn"},false],["unitName",{"t":"fn"},false],["staffName",{"t":"fn"},false]]},"opt":false}],
  inner$DishDialog$emo: [{"name":"meta","d":{"t":"tup","of":[{"t":"str"},{"t":"str"}]},"opt":false},{"name":"icon","d":{"t":"str"},"opt":false}],
  inner$DishDialog$pmeta: [{"name":"m","d":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["price",{"t":"str"},false],["prepTime",{"t":"str"},false],["cookTime",{"t":"str"},false],["cookTemp",{"t":"str"},false],["baseServings",{"t":"str"},false],["allergens",{"t":"str"},false],["ingredients",{"t":"arr","of":{"t":"obj","n":"IngRow","p":[["name",{"t":"str"},false],["qty",{"t":"str"},false]]}},false],["steps",{"t":"arr","of":{"t":"str"}},false],["notes",{"t":"str"},false],["defBy",{"t":"str"},false]]},"opt":false}],
  inner$DishDialog$staffOpts: [{"name":"d","d":{"t":"obj","n":"HostData","p":[["units",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["bookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["records",{"t":"arr","of":{"t":"any"}},false],["prefs",{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},false],["settings",{"t":"obj","n":"HostSettings","p":[["checkin",{"t":"str"},false],["checkout",{"t":"str"},false],["cleaningFee",{"t":"num"},false],["taxPct",{"t":"num"},false],["orderLeadDays",{"t":"num"},false],["familyTerm",{"t":"bool"},false]]},false],["guests",{"t":"arr","of":{"t":"obj","n":"HostGuest","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[]}},false],["meals",{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[]}},false],["dishes",{"t":"arr","of":{"t":"obj","n":"HostDish","p":[]}},false],["staff",{"t":"arr","of":{"t":"obj","n":"HostStaff","p":[]}},false],["supplies",{"t":"arr","of":{"t":"obj","n":"HostSupply","p":[]}},false],["tableItems",{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[]}},false],["temps",{"t":"arr","of":{"t":"obj","n":"HostTempLog","p":[]}},false],["faults",{"t":"arr","of":{"t":"obj","n":"HostFault","p":[]}},false],["assets",{"t":"arr","of":{"t":"obj","n":"HostAsset","p":[]}},false],["plans",{"t":"arr","of":{"t":"obj","n":"HostPlan","p":[]}},false],["unitOf",{"t":"fn"},false],["guestOf",{"t":"fn"},false],["bookingOf",{"t":"fn"},false],["guestName",{"t":"fn"},false],["unitName",{"t":"fn"},false],["staffName",{"t":"fn"},false]]},"opt":false}],
  inner$DishDialog$moveStep$j: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"dir","d":{"t":"lit","v":[1,-1]},"opt":false}],
  inner$DishDialog$moveStep$s: [{"name":"m","d":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["price",{"t":"str"},false],["prepTime",{"t":"str"},false],["cookTime",{"t":"str"},false],["cookTemp",{"t":"str"},false],["baseServings",{"t":"str"},false],["allergens",{"t":"str"},false],["ingredients",{"t":"arr","of":{"t":"obj","n":"IngRow","p":[["name",{"t":"str"},false],["qty",{"t":"str"},false]]}},false],["steps",{"t":"arr","of":{"t":"str"}},false],["notes",{"t":"str"},false],["defBy",{"t":"str"},false]]},"opt":false}],
};
