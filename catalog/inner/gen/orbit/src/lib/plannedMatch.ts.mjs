// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/plannedMatch.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DATE_WINDOW_DAYS = 3;
function dayDiff(a, b) {
    const [ay, am, ad] = a.split('-').map((n) => parseInt(n, 10));
    const [by, bm, bd] = b.split('-').map((n) => parseInt(n, 10));
    const da = new Date(ay, (am || 1) - 1, ad || 1, 12);
    const db = new Date(by, (bm || 1) - 1, bd || 1, 12);
    return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}
function normName(s) {
    return String(s || '')
        .replace(/[֑-ׇ]/g, '') // ניקוד עברי
        .replace(/["'.,\-()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
function nameMatches(a, b) {
    const na = normName(a);
    const nb = normName(b);
    if (!na || !nb)
        return false;
    if (na === nb)
        return true;
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    if (wa.size === 0 || wb.size === 0)
        return false;
    // חפיפה של-לפחות-שני-מילים (שם-פרטי+משפחה) או כל-המילים אם יש רק שם-יחיד
    let overlap = 0;
    for (const w of wa)
        if (wb.has(w))
            overlap++;
    // דורש 2-חופפות (שם-פרטי+משפחה); רק כשלשני-הצדדים שם-יחיד ⇒ די באחת (תואם-מלא)
    const need = wa.size === 1 && wb.size === 1 ? 1 : 2;
    return overlap >= need;
}
function matchIncomingToPlanned(inc, allOpen) {
    const targetCents = Math.round(inc.amount * 100);
    const incDate = (inc.at || '').slice(0, 10); // ISO
    const candidates = [];
    for (const ref of allOpen) {
        const planCents = Math.round(ref.plan.amount * 100);
        if (planCents !== targetCents)
            continue;
        if (!nameMatches(ref.name, inc.name || ''))
            continue;
        if (incDate && ref.plan.date && dayDiff(incDate, ref.plan.date) > DATE_WINDOW_DAYS)
            continue;
        // ציון-דירוג לניפוי-כפולות: תאריך-קרוב + שם-ארוך = יותר-בטוח
        const dd = incDate && ref.plan.date ? dayDiff(incDate, ref.plan.date) : 0;
        const conf = Math.max(60, 100 - dd * 10);
        candidates.push({ ...ref, incomingId: inc.id, confidence: conf });
    }
    if (candidates.length !== 1)
        return null;
    return candidates[0];
}
export function inner$dayDiff$ay(a) {
    const [ay, am, ad] = a.split('-').map((n) => parseInt(n, 10));
    return ay;
}
export function inner$dayDiff$am(a) {
    const [ay, am, ad] = a.split('-').map((n) => parseInt(n, 10));
    return am;
}
export function inner$dayDiff$ad(a) {
    const [ay, am, ad] = a.split('-').map((n) => parseInt(n, 10));
    return ad;
}
export function inner$dayDiff$by(b) {
    const [by, bm, bd] = b.split('-').map((n) => parseInt(n, 10));
    return by;
}
export function inner$dayDiff$bm(b) {
    const [by, bm, bd] = b.split('-').map((n) => parseInt(n, 10));
    return bm;
}
export function inner$dayDiff$bd(b) {
    const [by, bm, bd] = b.split('-').map((n) => parseInt(n, 10));
    return bd;
}
export function inner$dayDiff$da(a) {
    const [ay, am, ad] = a.split('-').map((n) => parseInt(n, 10));
    const da = new Date(ay, (am || 1) - 1, ad || 1, 12);
    return da;
}
export function inner$dayDiff$da$$step(ay, am, ad) {
    const da = new Date(ay, (am || 1) - 1, ad || 1, 12);
    return da;
}
export function inner$dayDiff$db(b) {
    const [by, bm, bd] = b.split('-').map((n) => parseInt(n, 10));
    const db = new Date(by, (bm || 1) - 1, bd || 1, 12);
    return db;
}
export function inner$dayDiff$db$$step(by, bm, bd) {
    const db = new Date(by, (bm || 1) - 1, bd || 1, 12);
    return db;
}
export function inner$nameMatches$na(a) {
    const na = normName(a);
    return na;
}
export function inner$nameMatches$nb(b) {
    const nb = normName(b);
    return nb;
}
export function inner$nameMatches$wa(a) {
    const na = normName(a);
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    return wa;
}
export function inner$nameMatches$wa$$step(na) {
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    return wa;
}
export function inner$nameMatches$wb(b) {
    const nb = normName(b);
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    return wb;
}
export function inner$nameMatches$wb$$step(nb) {
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    return wb;
}
export function inner$nameMatches$need(a, b) {
    const na = normName(a);
    const nb = normName(b);
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    const need = wa.size === 1 && wb.size === 1 ? 1 : 2;
    return need;
}
export function inner$nameMatches$need$$step(wa, wb) {
    const need = wa.size === 1 && wb.size === 1 ? 1 : 2;
    return need;
}
export function inner$findAllOpenPlans$fam(db, en) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    return fam;
}
export function inner$findAllOpenPlans$mem(db, en) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    const mem = fam?.members.find((m) => m.id === en.memberId);
    return mem;
}
export function inner$findAllOpenPlans$mem$$step(en, fam) {
    const mem = fam?.members.find((m) => m.id === en.memberId);
    return mem;
}
export function inner$findAllOpenPlans$nm(db, en) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    const mem = fam?.members.find((m) => m.id === en.memberId);
    const nm = ((mem?.first || '') + ' ' + (fam?.name || '')).trim();
    return nm;
}
export function inner$findAllOpenPlans$nm$$step(fam, mem) {
    const nm = ((mem?.first || '') + ' ' + (fam?.name || '')).trim();
    return nm;
}
export function inner$findAllOpenPlans$fam_L92(db, a) {
    const fam = db.families.find((f) => f.id === a.famId);
    return fam;
}
export function inner$matchIncomingToPlanned$targetCents(inc) {
    const targetCents = Math.round(inc.amount * 100);
    return targetCents;
}
export function inner$matchIncomingToPlanned$incDate(inc) {
    const incDate = (inc.at || '').slice(0, 10);
    return incDate;
}
export function inner$matchIncomingToPlanned$planCents(ref) {
    const planCents = Math.round(ref.plan.amount * 100);
    return planCents;
}
export function inner$matchIncomingToPlanned$dd(inc, ref) {
    const incDate = (inc.at || '').slice(0, 10);
    const dd = incDate && ref.plan.date ? dayDiff(incDate, ref.plan.date) : 0;
    return dd;
}
export function inner$matchIncomingToPlanned$dd$$step(incDate, ref) {
    const dd = incDate && ref.plan.date ? dayDiff(incDate, ref.plan.date) : 0;
    return dd;
}
export function inner$matchIncomingToPlanned$conf(inc, ref) {
    const incDate = (inc.at || '').slice(0, 10);
    const dd = incDate && ref.plan.date ? dayDiff(incDate, ref.plan.date) : 0;
    const conf = Math.max(60, 100 - dd * 10);
    return conf;
}
export function inner$matchIncomingToPlanned$conf$$step(dd) {
    const conf = Math.max(60, 100 - dd * 10);
    return conf;
}
export function inner$matchAll$stillOpen(allOpen, used) {
    const pool = [...allOpen];
    const stillOpen = pool.filter((r) => !used.has(r.plan.id));
    return stillOpen;
}
export function inner$matchAll$stillOpen$$step(used, pool) {
    const stillOpen = pool.filter((r) => !used.has(r.plan.id));
    return stillOpen;
}
export function inner$matchAll$m(allOpen, used, inc) {
    const pool = [...allOpen];
    const stillOpen = pool.filter((r) => !used.has(r.plan.id));
    const m = matchIncomingToPlanned(inc, stillOpen);
    return m;
}
export function inner$matchAll$m$$step(inc, stillOpen) {
    const m = matchIncomingToPlanned(inc, stillOpen);
    return m;
}
export function inner$nameMatches$overlap$$after_loop(a, b) {
    const na = normName(a);
    const nb = normName(b);
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    let overlap = 0;
    for (const w of wa)
        if (wb.has(w))
            overlap++;
    return overlap;
}
export function inner$matchIncomingToPlanned$candidates$$after_loop(inc, allOpen) {
    const targetCents = Math.round(inc.amount * 100);
    const incDate = (inc.at || '').slice(0, 10);
    const candidates = [];
    for (const ref of allOpen) {
        const planCents = Math.round(ref.plan.amount * 100);
        if (planCents !== targetCents)
            continue;
        if (!nameMatches(ref.name, inc.name || ''))
            continue;
        if (incDate && ref.plan.date && dayDiff(incDate, ref.plan.date) > DATE_WINDOW_DAYS)
            continue;
        // ציון-דירוג לניפוי-כפולות: תאריך-קרוב + שם-ארוך = יותר-בטוח
        const dd = incDate && ref.plan.date ? dayDiff(incDate, ref.plan.date) : 0;
        const conf = Math.max(60, 100 - dd * 10);
        candidates.push({ ...ref, incomingId: inc.id, confidence: conf });
    }
    return candidates;
}
export function inner$matchAll$out$$after_loop(incomings, allOpen) {
    const out = [];
    const used = new Set();
    const pool = [...allOpen];
    for (const inc of incomings) {
        const stillOpen = pool.filter((r) => !used.has(r.plan.id));
        const m = matchIncomingToPlanned(inc, stillOpen);
        if (m) {
            out.push(m);
            used.add(m.plan.id);
        }
    }
    return out;
}
export function inner$matchAll$used$$after_loop(incomings, allOpen) {
    const out = [];
    const used = new Set();
    const pool = [...allOpen];
    for (const inc of incomings) {
        const stillOpen = pool.filter((r) => !used.has(r.plan.id));
        const m = matchIncomingToPlanned(inc, stillOpen);
        if (m) {
            out.push(m);
            used.add(m.plan.id);
        }
    }
    return used;
}

export const SIGS = {
  inner$dayDiff$ay: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$dayDiff$am: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$dayDiff$ad: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$dayDiff$by: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$dayDiff$bm: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$dayDiff$bd: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$dayDiff$da: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$dayDiff$da$$step: [{"name":"ay","d":{"t":"num"},"opt":false},{"name":"am","d":{"t":"num"},"opt":false},{"name":"ad","d":{"t":"num"},"opt":false}],
  inner$dayDiff$db: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$dayDiff$db$$step: [{"name":"by","d":{"t":"num"},"opt":false},{"name":"bm","d":{"t":"num"},"opt":false},{"name":"bd","d":{"t":"num"},"opt":false}],
  inner$nameMatches$na: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$nameMatches$nb: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$nameMatches$wa: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$nameMatches$wa$$step: [{"name":"na","d":{"t":"str"},"opt":false}],
  inner$nameMatches$wb: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$nameMatches$wb$$step: [{"name":"nb","d":{"t":"str"},"opt":false}],
  inner$nameMatches$need: [{"name":"a","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$nameMatches$need$$step: [{"name":"wa","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"wb","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$findAllOpenPlans$fam: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"en","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findAllOpenPlans$mem: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"en","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findAllOpenPlans$mem$$step: [{"name":"en","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"fam","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]}]},"opt":false}],
  inner$findAllOpenPlans$nm: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"en","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findAllOpenPlans$nm$$step: [{"name":"fam","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]}]},"opt":false},{"name":"mem","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$findAllOpenPlans$fam_L92: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"a","d":{"t":"obj","n":"ShopAssignment","p":[["id",{"t":"str"},false],["productId",{"t":"str"},false],["famId",{"t":"str"},false],["memberId",{"t":"str"},false],["criterionIds",{"t":"arr","of":{"t":"str"}},false],["since",{"t":"str"},false],["status",{"t":"lit","v":["active","done","stopped"]},false],["notes",{"t":"str"},false],["redemptions",{"t":"arr","of":{"t":"obj","n":"ShopRedemption","p":[["id",{"t":"str"},false],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["voidedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["voidReason",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"str"},false],["date",{"t":"str"},false],["holiday",{"t":"str"},false],["paid",{"t":"num"},false],["value",{"t":"num"},false],["note",{"t":"str"},false]]}},false],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true]]},"opt":false}],
  inner$matchIncomingToPlanned$targetCents: [{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$matchIncomingToPlanned$incDate: [{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$matchIncomingToPlanned$planCents: [{"name":"ref","d":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]},"opt":false}],
  inner$matchIncomingToPlanned$dd: [{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"ref","d":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]},"opt":false}],
  inner$matchIncomingToPlanned$dd$$step: [{"name":"incDate","d":{"t":"str"},"opt":false},{"name":"ref","d":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]},"opt":false}],
  inner$matchIncomingToPlanned$conf: [{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"ref","d":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]},"opt":false}],
  inner$matchIncomingToPlanned$conf$$step: [{"name":"dd","d":{"t":"num"},"opt":false}],
  inner$matchAll$stillOpen: [{"name":"allOpen","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$matchAll$stillOpen$$step: [{"name":"used","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"pool","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false}],
  inner$matchAll$m: [{"name":"allOpen","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$matchAll$m$$step: [{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"stillOpen","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false}],
  inner$nameMatches$overlap$$after_loop: [{"name":"a","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$matchIncomingToPlanned$candidates$$after_loop: [{"name":"inc","d":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"allOpen","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false}],
  inner$matchAll$out$$after_loop: [{"name":"incomings","d":{"t":"arr","of":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"allOpen","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false}],
  inner$matchAll$used$$after_loop: [{"name":"incomings","d":{"t":"arr","of":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"allOpen","d":{"t":"arr","of":{"t":"obj","n":"OpenPlanRef","p":[["entityType",{"t":"lit","v":["supporter","enrollment","shopAssignment"]},false],["entityId",{"t":"str"},false],["plan",{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["name",{"t":"str"},false]]}},"opt":false}],
};
