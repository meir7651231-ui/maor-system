// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/families/FamilyFinder.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const WHEEL_COLORS = ['#f3c76b', '#b45309', '#7c3aed', '#0f766e', '#be185d'];
export function inner$FamilyFinder$matched(db) {
    let matched = db.families.slice();
    return matched;
}
export function inner$FamilyFinder$opts(counts) {
    const opts = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return opts;
}
export function inner$FamilyFinder$seg(wheelOpts) {
    const seg = Math.max(wheelOpts.length, 1);
    return seg;
}
export function inner$FamilyFinder$stops(wheelOpts) {
    const seg = Math.max(wheelOpts.length, 1);
    const stops = Array.from({ length: seg }, (_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${(i * 100) / seg}% ${((i + 1) * 100) / seg}%`);
    return stops;
}
export function inner$FamilyFinder$stops$$step(seg) {
    const stops = Array.from({ length: seg }, (_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${(i * 100) / seg}% ${((i + 1) * 100) / seg}%`);
    return stops;
}
export function inner$FamilyFinder$ring(wheelOpts) {
    const seg = Math.max(wheelOpts.length, 1);
    const stops = Array.from({ length: seg }, (_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${(i * 100) / seg}% ${((i + 1) * 100) / seg}%`);
    const ring = `conic-gradient(from -90deg, ${stops.join(', ')})`;
    return ring;
}
export function inner$FamilyFinder$ring$$step(stops) {
    const ring = `conic-gradient(from -90deg, ${stops.join(', ')})`;
    return ring;
}
export function inner$FamilyFinder$results(matched) {
    const results = matched.slice(0, 8);
    return results;
}
export function inner$FamilyFinder$map$ang(wheelOpts, i) {
    const ang = Math.round(-90 + (i * 360) / wheelOpts.length);
    return ang;
}
export function inner$FamilyFinder$removeLock$next$$after_loop(locks, axes, key) {
    const next = {};
    for (const [k] of axes) {
        if (k === key)
            break;
        if (locks[k] !== undefined)
            next[k] = locks[k];
    }
    return next;
}

export const SIGS = {
  inner$FamilyFinder$matched: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false}],
  inner$FamilyFinder$opts: [{"name":"counts","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$FamilyFinder$seg: [{"name":"wheelOpts","d":{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["value",{"t":"str"},false]]}},"opt":false}],
  inner$FamilyFinder$stops: [{"name":"wheelOpts","d":{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["value",{"t":"str"},false]]}},"opt":false}],
  inner$FamilyFinder$stops$$step: [{"name":"seg","d":{"t":"num"},"opt":false}],
  inner$FamilyFinder$ring: [{"name":"wheelOpts","d":{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["value",{"t":"str"},false]]}},"opt":false}],
  inner$FamilyFinder$ring$$step: [{"name":"stops","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$FamilyFinder$results: [{"name":"matched","d":{"t":"arr","of":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]}},"opt":false}],
  inner$FamilyFinder$map$ang: [{"name":"wheelOpts","d":{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["value",{"t":"str"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$FamilyFinder$removeLock$next$$after_loop: [{"name":"locks","d":{"t":"rec","of":{"t":"str"}},"opt":false},{"name":"axes","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
};
