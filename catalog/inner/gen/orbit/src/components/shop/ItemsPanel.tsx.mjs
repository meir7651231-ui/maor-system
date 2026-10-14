// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/shop/ItemsPanel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const KIND_OPTIONS = [
    { value: 'meeting', label: '🤝 פגישת ליווי' },
    { value: 'coupon', label: '🎟 קופון לחנות שותפה' },
    { value: 'gift', label: '🎁 מתנה' },
    { value: 'holidayGift', label: '🕎 מתנת-חג (מחזורית)' },
];
export function inner$ItemsPanel$save$value(f) {
    const value = f.value.trim() === '' ? 0 : +f.value;
    return value;
}
export function inner$ItemsPanel$save$basePrice(f) {
    const basePrice = f.basePrice.trim() === '' ? 0 : +f.basePrice;
    return basePrice;
}
export function inner$ItemsPanel$save$existing(db, editId) {
    const existing = editId ? db.shopItems.find((x) => x.id === editId) : undefined;
    return existing;
}
export function inner$ItemsPanel$save$saved(db, editId, f) {
    const value = f.value.trim() === '' ? 0 : +f.value;
    const basePrice = f.basePrice.trim() === '' ? 0 : +f.basePrice;
    const existing = editId ? db.shopItems.find((x) => x.id === editId) : undefined;
    const saved = {
        ...existing,
        id: editId ?? '',
        name: f.name.trim(),
        kind: f.kind,
        storeId: f.kind === 'coupon' ? f.storeId : '',
        value: Math.round(value),
        basePrice: Math.round(basePrice),
        active: f.active,
        notes: f.notes.trim(),
    };
    return saved;
}
export function inner$ItemsPanel$save$saved$$step(editId, f, value, basePrice, existing) {
    const saved = {
        ...existing,
        id: editId ?? '',
        name: f.name.trim(),
        kind: f.kind,
        storeId: f.kind === 'coupon' ? f.storeId : '',
        value: Math.round(value),
        basePrice: Math.round(basePrice),
        active: f.active,
        notes: f.notes.trim(),
    };
    return saved;
}
export function inner$ItemsPanel$map$kindLabel(i) {
    const kindLabel = KIND_OPTIONS.find((k) => k.value === i.kind)?.label ?? i.kind;
    return kindLabel;
}
export function inner$ItemsPanel$map$map$wf(db, w) {
    const wf = db.families.find((f) => f.id === w.famId);
    return wf;
}

export const SIGS = {
  inner$ItemsPanel$save$value: [{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"str"},false],["basePrice",{"t":"str"},false],["stock",{"t":"str"},false],["minStock",{"t":"str"},false],["validDays",{"t":"str"},false],["holidays",{"t":"arr","of":{"t":"str"}},false],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]},"opt":false}],
  inner$ItemsPanel$save$basePrice: [{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"str"},false],["basePrice",{"t":"str"},false],["stock",{"t":"str"},false],["minStock",{"t":"str"},false],["validDays",{"t":"str"},false],["holidays",{"t":"arr","of":{"t":"str"}},false],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]},"opt":false}],
  inner$ItemsPanel$save$existing: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"editId","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$ItemsPanel$save$saved: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"editId","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"str"},false],["basePrice",{"t":"str"},false],["stock",{"t":"str"},false],["minStock",{"t":"str"},false],["validDays",{"t":"str"},false],["holidays",{"t":"arr","of":{"t":"str"}},false],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]},"opt":false}],
  inner$ItemsPanel$save$saved$$step: [{"name":"editId","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"str"},false],["basePrice",{"t":"str"},false],["stock",{"t":"str"},false],["minStock",{"t":"str"},false],["validDays",{"t":"str"},false],["holidays",{"t":"arr","of":{"t":"str"}},false],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]},"opt":false},{"name":"value","d":{"t":"num"},"opt":false},{"name":"basePrice","d":{"t":"num"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ShopItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"num"},false],["basePrice",{"t":"num"},false],["stock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["minStock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["validDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["holidays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["waits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["famId",{"t":"str"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}}]},true],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]}]},"opt":false}],
  inner$ItemsPanel$map$kindLabel: [{"name":"i","d":{"t":"obj","n":"ShopItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["meeting","coupon","gift","holidayGift"]},false],["storeId",{"t":"str"},false],["value",{"t":"num"},false],["basePrice",{"t":"num"},false],["stock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["minStock",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["validDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["holidays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["waits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["famId",{"t":"str"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}}]},true],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]},"opt":false}],
  inner$ItemsPanel$map$map$wf: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"w","d":{"t":"obj","p":[["famId",{"t":"str"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
};
