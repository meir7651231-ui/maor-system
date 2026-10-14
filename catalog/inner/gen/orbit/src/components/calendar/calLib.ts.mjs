// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/calendar/calLib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function dateOf(iso) {
    return new Date(iso + 'T12:00:00');
}
export function inner$fmtD$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$fmtD$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$fmtD$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$hpOf$hp(hpCache, iso) {
    let hp = hpCache.get(iso);
    return hp;
}
export function inner$blockReason$dow(d) {
    const dow = d.getDay();
    return dow;
}
export function inner$roomClashError$hr(form) {
    const hr = parseInt(form.time, 10);
    return hr;
}
export function inner$roomClashError$clashEv(db, form, excludeEventId) {
    const hr = parseInt(form.time, 10);
    const clashEv = db.events.find((x) => !x.done &&
        x.id !== excludeEventId &&
        x.roomId === form.roomId &&
        x.date === form.date &&
        parseInt(x.time || '-1', 10) === hr);
    return clashEv;
}
export function inner$roomClashError$clashEv$$step(db, form, excludeEventId, hr) {
    const clashEv = db.events.find((x) => !x.done &&
        x.id !== excludeEventId &&
        x.roomId === form.roomId &&
        x.date === form.date &&
        parseInt(x.time || '-1', 10) === hr);
    return clashEv;
}
export function inner$roomClashError$dow(form) {
    const dow = dateOf(form.date).getDay();
    return dow;
}
export function inner$dayItems$age(hp, bh) {
    const age = hp.year - bh.year;
    return age;
}
export function inner$dayItems$n(iso, f) {
    const n = +iso.slice(0, 4) - +f.createdAt.slice(0, 4);
    return n;
}
export function inner$dayItems$x(e, f) {
    const x = f.members.find((mm) => mm.id === e.memberId);
    return x;
}
export function inner$dayItems$ec(db, e) {
    const ec = db.courses.find((x) => x.id === e.courseId);
    return ec;
}
export function inner$dayItems$dow(d) {
    const dow = d.getDay();
    return dow;
}
export function inner$dayItems$tName(db, c) {
    const tName = db.teachers.find((t) => t.id === c.teacherId)?.name;
    return tName;
}
export function inner$dayItems$rName(db, c) {
    const rName = db.rooms.find((r) => r.id === c.roomId)?.name;
    return rName;
}
export function inner$dayItems$nEnrolled(db, c) {
    const nEnrolled = db.enrollments.filter((e) => e.courseId === c.id && e.status !== 'ended' && e.status !== 'wait').length;
    return nEnrolled;
}
export function inner$buildGregorianGrid$gridStart(year, month) {
    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    return gridStart;
}
export function inner$buildGregorianGrid$gridStart$$step(year, month, first) {
    const gridStart = new Date(year, month, 1 - first.getDay());
    return gridStart;
}
export function inner$buildGregorianGrid$d(year, month, i) {
    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return d;
}
export function inner$buildGregorianGrid$d$$step(gridStart, i) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return d;
}
export function inner$buildGregorianGrid$last(year, month) {
    const last = new Date(year, month + 1, 0);
    return last;
}
export function inner$buildHebrewGrid$anchor(anchorIso) {
    const anchor = dateOf(anchorIso);
    return anchor;
}
export function inner$buildHebrewGrid$count(anchorIso, dim) {
    const anchor = dateOf(anchorIso);
    const first = new Date(anchor);
    const count = Math.ceil((first.getDay() + dim) / 7) * 7;
    return count;
}
export function inner$buildHebrewGrid$count$$step(first, dim) {
    const count = Math.ceil((first.getDay() + dim) / 7) * 7;
    return count;
}
export function inner$buildHebrewGrid$d(anchorIso, i) {
    const anchor = dateOf(anchorIso);
    const first = new Date(anchor);
    const gridStart = new Date(first);
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return d;
}
export function inner$buildHebrewGrid$d$$step(gridStart, i) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return d;
}
export function inner$buildWeekGrid$anchor(anchorIso) {
    const anchor = dateOf(anchorIso);
    return anchor;
}
export function inner$buildWeekGrid$sunday(anchorIso) {
    const anchor = dateOf(anchorIso);
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    return sunday;
}
export function inner$buildWeekGrid$sunday$$step(anchor) {
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    return sunday;
}
export function inner$buildWeekGrid$d(anchorIso, i) {
    const anchor = dateOf(anchorIso);
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    return d;
}
export function inner$buildWeekGrid$d$$step(sunday, i) {
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    return d;
}
export function inner$buildWeekGrid$sat(anchorIso) {
    const anchor = dateOf(anchorIso);
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    const sat = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    return sat;
}
export function inner$buildWeekGrid$sat$$step(sunday) {
    const sat = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    return sat;
}
export function inner$buildDayGrid$anchor(anchorIso) {
    const anchor = dateOf(anchorIso);
    return anchor;
}
export function inner$softClashSuffix$other(events, date, time, excludeId) {
    const other = events.find((ev) => ev.id !== excludeId && !ev.done && ev.date === date && ev.time === time);
    return other;
}
export function inner$nextOccurIso$from(fromIso) {
    const from = new Date(fromIso + 'T12:00:00');
    return from;
}
export function inner$nextOccurIso$d(fromIso, i) {
    const from = new Date(fromIso + 'T12:00:00');
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return d;
}
export function inner$nextOccurIso$d$$step(from, i) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return d;
}
export function inner$icsWindowEvents$rooms(db) {
    const rooms = new Map(db.rooms.map((r) => [r.id, r.name]));
    return rooms;
}
export function inner$icsWindowEvents$from(fromIso) {
    const from = new Date(fromIso + 'T12:00:00');
    return from;
}
export function inner$icsWindowEvents$d(fromIso, i) {
    const from = new Date(fromIso + 'T12:00:00');
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return d;
}
export function inner$icsWindowEvents$d$$step(from, i) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return d;
}
export function inner$icsWindowEvents$dow(fromIso, i) {
    const from = new Date(fromIso + 'T12:00:00');
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const dow = d.getDay();
    return dow;
}
export function inner$icsWindowEvents$dow$$step(d) {
    const dow = d.getDay();
    return dow;
}
export function inner$quickDate$d(base) {
    const d = new Date(base + 'T12:00:00');
    return d;
}
export function inner$upcomingItems$d(now, i) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return d;
}
export function inner$upcomingRows$d(start, i) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$dayItems$em$$after_loop(db, e) {
    let em = null;
    let ef = null;
    for (const f of db.families) {
        const x = f.members.find((mm) => mm.id === e.memberId);
        if (x) {
            em = x;
            ef = f;
            break;
        }
    }
    return em;
}
export function inner$dayItems$ef$$after_loop(db, e) {
    let em = null;
    let ef = null;
    for (const f of db.families) {
        const x = f.members.find((mm) => mm.id === e.memberId);
        if (x) {
            em = x;
            ef = f;
            break;
        }
    }
    return ef;
}

export const SIGS = {
  inner$fmtD$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtD$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtD$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$hpOf$hp: [{"name":"hpCache","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]}},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$blockReason$dow: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$roomClashError$hr: [{"name":"form","d":{"t":"obj","p":[["date",{"t":"str"},false],["time",{"t":"str"},false],["roomId",{"t":"str"},false]]},"opt":false}],
  inner$roomClashError$clashEv: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"form","d":{"t":"obj","p":[["date",{"t":"str"},false],["time",{"t":"str"},false],["roomId",{"t":"str"},false]]},"opt":false},{"name":"excludeEventId","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$roomClashError$clashEv$$step: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"form","d":{"t":"obj","p":[["date",{"t":"str"},false],["time",{"t":"str"},false],["roomId",{"t":"str"},false]]},"opt":false},{"name":"excludeEventId","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"hr","d":{"t":"num"},"opt":false}],
  inner$roomClashError$dow: [{"name":"form","d":{"t":"obj","p":[["date",{"t":"str"},false],["time",{"t":"str"},false],["roomId",{"t":"str"},false]]},"opt":false}],
  inner$dayItems$age: [{"name":"hp","d":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]},"opt":false},{"name":"bh","d":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]},"opt":false}],
  inner$dayItems$n: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"f","d":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]},"opt":false}],
  inner$dayItems$x: [{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"f","d":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]},"opt":false}],
  inner$dayItems$ec: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$dayItems$dow: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$dayItems$tName: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$dayItems$rName: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$dayItems$nEnrolled: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildGregorianGrid$gridStart: [{"name":"year","d":{"t":"num"},"opt":false},{"name":"month","d":{"t":"num"},"opt":false}],
  inner$buildGregorianGrid$gridStart$$step: [{"name":"year","d":{"t":"num"},"opt":false},{"name":"month","d":{"t":"num"},"opt":false},{"name":"first","d":{"t":"date"},"opt":false}],
  inner$buildGregorianGrid$d: [{"name":"year","d":{"t":"num"},"opt":false},{"name":"month","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildGregorianGrid$d$$step: [{"name":"gridStart","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildGregorianGrid$last: [{"name":"year","d":{"t":"num"},"opt":false},{"name":"month","d":{"t":"num"},"opt":false}],
  inner$buildHebrewGrid$anchor: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildHebrewGrid$count: [{"name":"anchorIso","d":{"t":"str"},"opt":false},{"name":"dim","d":{"t":"lit","v":[30,29]},"opt":false}],
  inner$buildHebrewGrid$count$$step: [{"name":"first","d":{"t":"date"},"opt":false},{"name":"dim","d":{"t":"lit","v":[30,29]},"opt":false}],
  inner$buildHebrewGrid$d: [{"name":"anchorIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildHebrewGrid$d$$step: [{"name":"gridStart","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildWeekGrid$anchor: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildWeekGrid$sunday: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildWeekGrid$sunday$$step: [{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$buildWeekGrid$d: [{"name":"anchorIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildWeekGrid$d$$step: [{"name":"sunday","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildWeekGrid$sat: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildWeekGrid$sat$$step: [{"name":"sunday","d":{"t":"date"},"opt":false}],
  inner$buildDayGrid$anchor: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$softClashSuffix$other: [{"name":"events","d":{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[["id",{"t":"str"},false],["title",{"t":"str"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["type",{"t":"lit","v":["org","call","reminder","wedding","memorial","anniversary","bday","custom"]},false],["customType",{"t":"str"},false],["notes",{"t":"str"},false],["price",{"t":"num"},false],["roomId",{"t":"str"},false],["famId",{"t":"str"},false],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["priority",{"t":"lit","v":["red","orange","green"]},false],["done",{"t":"bool"},false]]}},"opt":false},{"name":"date","d":{"t":"str"},"opt":false},{"name":"time","d":{"t":"str"},"opt":false},{"name":"excludeId","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$nextOccurIso$from: [{"name":"fromIso","d":{"t":"str"},"opt":false}],
  inner$nextOccurIso$d: [{"name":"fromIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$nextOccurIso$d$$step: [{"name":"from","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$icsWindowEvents$rooms: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false}],
  inner$icsWindowEvents$from: [{"name":"fromIso","d":{"t":"str"},"opt":false}],
  inner$icsWindowEvents$d: [{"name":"fromIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$icsWindowEvents$d$$step: [{"name":"from","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$icsWindowEvents$dow: [{"name":"fromIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$icsWindowEvents$dow$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$quickDate$d: [{"name":"base","d":{"t":"str"},"opt":false}],
  inner$upcomingItems$d: [{"name":"now","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$upcomingRows$d: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$dayItems$em$$after_loop: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$dayItems$ef$$after_loop: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
};
