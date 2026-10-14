// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/verify/gen.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HE = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'];
const SURNAMES = ['קורנבליט', 'שטיינמץ', 'רוזנצווייג', 'גרינבאום', 'פפנהיים', 'וקסלבאום', 'הירשהורן', 'זילברשלג', 'אפפלבאום', 'מנדלבליט', 'טננבאום', 'קירשנבאום'];
export function inner$rng$a(seed) {
    let a = seed >>> 0 || 0x9e3779b9;
    return a;
}
export function inner$subSeed$h(seed) {
    let h = (seed ^ 0x811c9dc5) >>> 0;
    return h;
}
export function inner$farWord$pool(w) {
    const banned = new Set([...w, ...PREFIXES, 'י', 'ו']);
    const pool = HE.filter((c) => !banned.has(c));
    return pool;
}
export function inner$farWord$pool$$step(banned) {
    const pool = HE.filter((c) => !banned.has(c));
    return pool;
}
export function inner$genInput$span(steps) {
    const span = steps.reduce((a, s) => a + s.waitMin, 0) * 60_000 + 60_000;
    return span;
}
export function inner$genInput$cands(ex, others, own) {
    const cands = ex === 'far' ? [own] : [...others, own];
    return cands;
}
export function inner$randomOrgDb$today(nowMs) {
    const today = new Date(nowMs + 3 * 3_600_000).toISOString().slice(0, 10);
    return today;
}
export function inner$randomOrgDb$from$sur(seed, k) {
    const sur = SURNAMES[(seed + k * 7) % SURNAMES.length];
    return sur;
}
export function inner$randomOrgDb$from$em(seed, k) {
    const em = 'guest' + k + '_' + (seed % 997) + '@example.org';
    return em;
}
export function inner$randomOrgDb$prev(bookings, u) {
    const prev = bookings.filter((b) => b.unitId === u.id).at(-1);
    return prev;
}
export function inner$randomOrgDb$from$sur_L377(seed, k) {
    const sur = SURNAMES[(seed + 3 + k * 5) % SURNAMES.length];
    return sur;
}
export function inner$randomOrgDb$from$em_L380(k) {
    const em = 'req' + k + '@example.net';
    return em;
}
export function inner$randomOrgDb$from$sur_L407(seed, k) {
    const sur = SURNAMES[(seed + 9 + k) % SURNAMES.length];
    return sur;
}
export function inner$randomOrgDb$db(base, units, guests, bookings, faults, cleans, staff, listings, requests, ads, donors, hosting, parnasa) {
    const db = {
        ...base,
        savedAt: '2026-10-14T00:00:00.000Z',
        seq: 100,
        hostUnits: units,
        hostBookings: bookings,
        hostRecords: [...guests, ...faults, ...cleans, ...staff],
        prListings: listings,
        prRequests: requests,
        prAds: ads,
        supporters: [...(base.supporters ?? []), ...donors],
        families: [...(base.families ?? []), ...donors.map((d) => ({ ...d, id: 'fm' + d.id }))],
        ui: { ...base.ui, hosting: hosting, parnasa: parnasa },
    };
    return db;
}
export function inner$subSeed$h$$after_loop(seed, label) {
    let h = (seed ^ 0x811c9dc5) >>> 0;
    for (let i = 0; i < label.length; i++)
        h = Math.imul(h ^ label.charCodeAt(i), 16777619) >>> 0;
    return h;
}

export const SIGS = {
  inner$rng$a: [{"name":"seed","d":{"t":"num"},"opt":false}],
  inner$subSeed$h: [{"name":"seed","d":{"t":"num"},"opt":false}],
  inner$farWord$pool: [{"name":"w","d":{"t":"str"},"opt":false}],
  inner$farWord$pool$$step: [{"name":"banned","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$genInput$span: [{"name":"steps","d":{"t":"arr","of":{"t":"obj","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},"opt":false}],
  inner$genInput$cands: [{"name":"ex","d":{"t":"lit","v":["typo","exact","prefix","far"]},"opt":false},{"name":"others","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["text",{"t":"str"},false]]}},"opt":false},{"name":"own","d":{"t":"obj","p":[["id",{"t":"str"},false],["text",{"t":"str"},false]]},"opt":false}],
  inner$randomOrgDb$today: [{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$randomOrgDb$from$sur: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$randomOrgDb$from$em: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$randomOrgDb$prev: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$randomOrgDb$from$sur_L377: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$randomOrgDb$from$em_L380: [{"name":"k","d":{"t":"num"},"opt":false}],
  inner$randomOrgDb$from$sur_L407: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$randomOrgDb$db: [{"name":"base","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"units","d":{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"guests","d":{"t":"arr","of":{"t":"obj","n":"HostGuest","p":[["kind",{"t":"lit","v":["guest"]},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["notes",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"faults","d":{"t":"arr","of":{"t":"obj","n":"HostFault","p":[["kind",{"t":"lit","v":["fault"]},false],["unitId",{"t":"str"},false],["assetId",{"t":"str"},false],["category",{"t":"str"},false],["priority",{"t":"num"},false],["desc",{"t":"str"},false],["status",{"t":"lit","v":["done","open","inprogress"]},false],["safety",{"t":"bool"},false],["blocked",{"t":"bool"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"cleans","d":{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[["kind",{"t":"lit","v":["clean"]},false],["unitId",{"t":"str"},false],["type",{"t":"str"},false],["status",{"t":"lit","v":["done","open"]},false],["date",{"t":"str"},false],["bookingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"staff","d":{"t":"arr","of":{"t":"obj","n":"HostStaff","p":[["kind",{"t":"lit","v":["staff"]},false],["name",{"t":"str"},false],["role",{"t":"str"},false],["phone",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"requests","d":{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},"opt":false},{"name":"ads","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"donors","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["tz",{"t":"str"},false]]}},"opt":false},{"name":"hosting","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[["mode",{"t":"or","of":[{"t":"lit","v":["shabbat","prep","off","motzash"]},{"t":"undef"}]},true],["candle",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["havdalah",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["level",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["mashgiach",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]}]},"opt":false},{"name":"parnasa","d":{"t":"obj","p":[["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"any"}}]},false],["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["small",{"t":"any"},true],["board",{"t":"any"},true],["full",{"t":"any"},true],["half",{"t":"any"},true],["featured",{"t":"any"},true],["sponsor",{"t":"any"},true],["dedication",{"t":"any"},true],["job",{"t":"any"},true]]}]},true]]},"opt":false}],
  inner$subSeed$h$$after_loop: [{"name":"seed","d":{"t":"num"},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
};
