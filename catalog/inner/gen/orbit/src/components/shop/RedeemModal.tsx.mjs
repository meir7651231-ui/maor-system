// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/shop/RedeemModal.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$RedeemModal$shopPlannedOn(config) {
    const shopPlannedOn = config.features?.['shop.plannedcharges'] === true;
    return shopPlannedOn;
}
export function inner$RedeemModal$isMeeting(ri) {
    const isMeeting = ri.kind === 'meeting';
    return isMeeting;
}
export function inner$RedeemModal$isCoupon(ri) {
    const isCoupon = ri.kind === 'coupon';
    return isCoupon;
}
export function inner$RedeemModal$save$paid(isMeeting, f) {
    const paid = isMeeting ? 0 : f.paid.trim() === '' ? 0 : Math.round(+f.paid);
    return paid;
}
export function inner$RedeemModal$save$value(ri, isMeeting, isCoupon, f) {
    const value = isMeeting ? 0 : isCoupon ? ri.value : f.value.trim() === '' ? 0 : Math.round(+f.value);
    return value;
}

export const SIGS = {
  inner$RedeemModal$shopPlannedOn: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$RedeemModal$isMeeting: [{"name":"ri","d":{"t":"obj","n":"ResolvedItem","p":[["itemId",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"num"},false],["basePrice",{"t":"num"},false],["stock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["validDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["holidays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["active",{"t":"bool"},false]]},"opt":false}],
  inner$RedeemModal$isCoupon: [{"name":"ri","d":{"t":"obj","n":"ResolvedItem","p":[["itemId",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"num"},false],["basePrice",{"t":"num"},false],["stock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["validDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["holidays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["active",{"t":"bool"},false]]},"opt":false}],
  inner$RedeemModal$save$paid: [{"name":"isMeeting","d":{"t":"bool"},"opt":false},{"name":"f","d":{"t":"obj","p":[["date",{"t":"str"},false],["holiday",{"t":"str"},false],["paid",{"t":"str"},false],["value",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
  inner$RedeemModal$save$value: [{"name":"ri","d":{"t":"obj","n":"ResolvedItem","p":[["itemId",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"num"},false],["basePrice",{"t":"num"},false],["stock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["validDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["holidays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["active",{"t":"bool"},false]]},"opt":false},{"name":"isMeeting","d":{"t":"bool"},"opt":false},{"name":"isCoupon","d":{"t":"bool"},"opt":false},{"name":"f","d":{"t":"obj","p":[["date",{"t":"str"},false],["holiday",{"t":"str"},false],["paid",{"t":"str"},false],["value",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
};
