// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/diary/lib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function pad2(n) {
    return String(n).padStart(2, '0');
}
function timeToMin(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
    if (!m)
        return NaN;
    return +m[1] * 60 + +m[2];
}
function minToHM(min) {
    return pad2(Math.floor(min / 60)) + ':' + pad2(min % 60);
}
function groupLabelOf(ss, i) {
    return ss.label || 'קבוצה ' + (i + 1);
}
function courseOnDate(c, iso) {
    return (!c.start || iso >= c.start) && (!c.end || iso <= c.end);
}
export function inner$fmtDate$y(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return y;
}
export function inner$fmtDate$m(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return m;
}
export function inner$fmtDate$d(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return d;
}
export function inner$timeToMin$m(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
    return m;
}
export function inner$makeupEligibility$earlyCancel(rawHrs) {
    const earlyCancel = rawHrs != null && rawHrs >= 48;
    return earlyCancel;
}
export function inner$blockReason$dow(d) {
    const dow = d.getDay();
    return dow;
}
export function inner$blockReason$hol(hp, HOLIDAYS) {
    const hol = HOLIDAYS[`${hp.month} ${hp.day}`];
    return hol;
}
export function inner$buildSlots$from(room) {
    const from = Number.isNaN(timeToMin(room.from)) ? 8 * 60 : timeToMin(room.from);
    return from;
}
export function inner$buildSlots$to(room) {
    const to = Number.isNaN(timeToMin(room.to)) ? 20 * 60 : timeToMin(room.to);
    return to;
}
export function inner$buildSlots$step(room) {
    const step = room.slot > 0 ? room.slot : 60;
    return step;
}
export function inner$buildSlots$wd(iso) {
    const wd = new Date(iso + 'T12:00:00').getDay();
    return wd;
}
export function inner$buildSlots$dayCourses(db, room, iso) {
    const dayCourses = db.courses.filter((c) => c.roomId === room.id && courseOnDate(c, iso));
    return dayCourses;
}
export function inner$buildSlots$hh(t) {
    const hh = minToHM(t);
    return hh;
}
export function inner$buildSlots$tm(ss, i) {
    const tm = timeToMin(ss[i].time || '');
    return tm;
}
export function inner$buildSlots$oe(db, room, iso, t) {
    const step = room.slot > 0 ? room.slot : 60;
    const oe = db.events.find((ev) => {
        if (ev.done || ev.roomId !== room.id || ev.date !== iso)
            return false;
        const tm = timeToMin(ev.time || '');
        return !Number.isNaN(tm) && tm >= t && tm < t + step;
    });
    return oe;
}
export function inner$buildSlots$oe$$step(db, room, iso, step, t) {
    const oe = db.events.find((ev) => {
        if (ev.done || ev.roomId !== room.id || ev.date !== iso)
            return false;
        const tm = timeToMin(ev.time || '');
        return !Number.isNaN(tm) && tm >= t && tm < t + step;
    });
    return oe;
}
export function inner$buildSlots$find$tm(ev) {
    const tm = timeToMin(ev.time || '');
    return tm;
}
export function inner$enrollmentsForSession$all(db, c) {
    const all = db.enrollments.filter((e) => e.courseId === c.id);
    return all;
}
export function inner$enrollmentsForSession$label(sessionIndex, ss) {
    const label = groupLabelOf(ss[Math.min(sessionIndex, ss.length - 1)], sessionIndex);
    return label;
}
export function inner$inactiveRoomCourses$room(db, c) {
    const room = db.rooms.find((r) => r.id === c.roomId);
    return room;
}
export function inner$roomInfoLabel$eqOn(room) {
    const eqOn = Object.entries(room.eq || {})
        .filter(([, v]) => v)
        .map(([k]) => k);
    return eqOn;
}

export const SIGS = {
  inner$fmtDate$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtDate$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtDate$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$timeToMin$m: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$makeupEligibility$earlyCancel: [{"name":"rawHrs","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$blockReason$dow: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$blockReason$hol: [{"name":"hp","d":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]},"opt":false},{"name":"HOLIDAYS","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
  inner$buildSlots$from: [{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$buildSlots$to: [{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$buildSlots$step: [{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$buildSlots$wd: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$buildSlots$dayCourses: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$buildSlots$hh: [{"name":"t","d":{"t":"num"},"opt":false}],
  inner$buildSlots$tm: [{"name":"ss","d":{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildSlots$oe: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$buildSlots$oe$$step: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$buildSlots$find$tm: [{"name":"ev","d":{"t":"obj","n":"OrgEvent","p":[["id",{"t":"str"},false],["title",{"t":"str"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["type",{"t":"lit","v":["org","call","reminder","wedding","memorial","anniversary","bday","custom"]},false],["customType",{"t":"str"},false],["notes",{"t":"str"},false],["price",{"t":"num"},false],["roomId",{"t":"str"},false],["famId",{"t":"str"},false],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["priority",{"t":"lit","v":["red","orange","green"]},false],["done",{"t":"bool"},false]]},"opt":false}],
  inner$enrollmentsForSession$all: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$enrollmentsForSession$label: [{"name":"sessionIndex","d":{"t":"num"},"opt":false},{"name":"ss","d":{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false}],
  inner$inactiveRoomCourses$room: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$roomInfoLabel$eqOn: [{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
};
