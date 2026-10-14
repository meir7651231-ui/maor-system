// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/preview.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DAY_MS = 86_400_000;
const pad = (n) => String(n).padStart(2, '0');
function hm(min) {
    const m = ((Math.round(min) % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
}
function dm(iso) {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
    return m ? +m[2] + '/' + +m[1] : iso;
}
const isoOfDay = (day) => new Date(day * DAY_MS).toISOString().slice(0, 10);
const shekel = (n) => '₪' + (Math.round(n * 100) / 100).toLocaleString('en-US');
const unitsOf = (db) => (Array.isArray(db?.hostUnits) ? db.hostUnits : [])
    .filter((u) => !!u && typeof u.id === 'string')
    .map((u) => ({ id: u.id, name: typeof u.name === 'string' && u.name.trim() ? u.name.trim() : 'יחידה' }));
const unitNameMap = (db) => new Map(unitsOf(db).map((u) => [u.id, u.name]));
const bookingUnit = (db) => {
    const names = unitNameMap(db);
    const out = new Map();
    for (const b of Array.isArray(db?.hostBookings) ? db.hostBookings : [])
        if (b && typeof b.id === 'string')
            out.set(b.id, names.get(b.unitId) ?? 'יחידה');
    return out;
};
const num = (p, k, d) => (typeof p[k] === 'number' && Number.isFinite(p[k]) ? p[k] : d);
const str = (p, k, d) => (typeof p[k] === 'string' ? p[k] : d);
function staffLabels(list) {
    const base = list.map((r) => (typeof r.name === 'string' && r.name.trim()) || (typeof r.role === 'string' && r.role.trim()) || 'איש צוות');
    const total = new Map();
    for (const b of base)
        total.set(b, (total.get(b) ?? 0) + 1);
    const seen = new Map();
    return base.map((b) => {
        if ((total.get(b) ?? 0) < 2)
            return b;
        const k = (seen.get(b) ?? 0) + 1;
        seen.set(b, k);
        return b + ' ' + k;
    });
}
function staffPeople(list) {
    return staffLabels([...new Map(list.map((r) => [r.id, r])).values()]);
}
const WAIT_TITLE = { cleaning: 'משימת ניקיון', faults: 'תקלה', unpaid: 'יתרה' };
const absLine = (abs) => dm(isoOfDay(Math.floor(abs / 1440))) + ' ' + hm(abs - Math.floor(abs / 1440) * 1440);
export function inner$israelMs$guess(iso, minute) {
    const guess = Date.parse(iso + 'T00:00:00Z') + minute * 60_000;
    return guess;
}
export function inner$israelMs$wall(p) {
    const wall = Date.parse(p.iso + 'T00:00:00Z') + p.minute * 60_000;
    return wall;
}
export function inner$hm$m(min) {
    const m = ((Math.round(min) % 1440) + 1440) % 1440;
    return m;
}
export function inner$dm$m(iso) {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
    return m;
}
export function inner$bookingUnit$names(db) {
    const names = unitNameMap(db);
    return names;
}
export function inner$installmentsLine$g(groups) {
    const g = groups[groups.length - 1];
    return g;
}
export function inner$runLine$open(nights, r) {
    const open = r.to === nights.length - 1;
    return open;
}
export function inner$staffLabels$base(list) {
    const base = list.map((r) => (typeof r.name === 'string' && r.name.trim()) || (typeof r.role === 'string' && r.role.trim()) || 'איש צוות');
    return base;
}
export function inner$staffLabels$map$k(seen, b) {
    const k = (seen.get(b) ?? 0) + 1;
    return k;
}
export function inner$waitingSafe$names(db) {
    const names = unitNameMap(db);
    return names;
}
export function inner$waitingSafe$items(db, kind, w) {
    const names = unitNameMap(db);
    const recs = new Map();
    for (const r of Array.isArray(db?.hostRecords) ? db.hostRecords : [])
        if (r && typeof r.id === 'string')
            recs.set(r.id, r);
    const items = w.items.map((it) => {
        const unit = names.get(it.unitId);
        // VERIFY 14.10: תקלה ⇒ התחום שלה, לא התיאור החופשי — התיאור נכתב ביד ("משפחת לוי דיווחו…, טלפון 050…") ודלף לתצוגה
        const cat = recs.get(it.id)?.category;
        const faultLabel = (typeof cat === 'string' && cat.trim() ? cat.trim() : 'תקלה') + (unit ? ' · ' + unit : '');
        const label = kind === 'unpaid' ? shekel(it.amount ?? 0) + (unit ? ' · ' + unit : '') : kind === 'cleaning' ? unit || it.label : faultLabel;
        const ca = recs.get(it.id)?.createdAt;
        const createdMs = typeof ca === 'string' && Number.isFinite(Date.parse(ca)) ? Date.parse(ca) : null;
        return { id: it.id, label, since: it.since, createdMs, urgent: kind === 'faults' && (it.priority ?? 4) <= 1 };
    });
    return items;
}
export function inner$waitingSafe$items$$step(kind, w, names, recs) {
    const items = w.items.map((it) => {
        const unit = names.get(it.unitId);
        // VERIFY 14.10: תקלה ⇒ התחום שלה, לא התיאור החופשי — התיאור נכתב ביד ("משפחת לוי דיווחו…, טלפון 050…") ודלף לתצוגה
        const cat = recs.get(it.id)?.category;
        const faultLabel = (typeof cat === 'string' && cat.trim() ? cat.trim() : 'תקלה') + (unit ? ' · ' + unit : '');
        const label = kind === 'unpaid' ? shekel(it.amount ?? 0) + (unit ? ' · ' + unit : '') : kind === 'cleaning' ? unit || it.label : faultLabel;
        const ca = recs.get(it.id)?.createdAt;
        const createdMs = typeof ca === 'string' && Number.isFinite(Date.parse(ca)) ? Date.parse(ca) : null;
        return { id: it.id, label, since: it.since, createdMs, urgent: kind === 'faults' && (it.priority ?? 4) <= 1 };
    });
    return items;
}
export function inner$waitingSafe$map$unit(names, it) {
    const unit = names.get(it.unitId);
    return unit;
}
export function inner$waitingSafe$map$cat(recs, it) {
    const cat = recs.get(it.id)?.category;
    return cat;
}
export function inner$waitingSafe$map$faultLabel(names, recs, it) {
    const unit = names.get(it.unitId);
    const cat = recs.get(it.id)?.category;
    const faultLabel = (typeof cat === 'string' && cat.trim() ? cat.trim() : 'תקלה') + (unit ? ' · ' + unit : '');
    return faultLabel;
}
export function inner$waitingSafe$map$faultLabel$$step(unit, cat) {
    const faultLabel = (typeof cat === 'string' && cat.trim() ? cat.trim() : 'תקלה') + (unit ? ' · ' + unit : '');
    return faultLabel;
}
export function inner$waitingSafe$map$label(kind, names, recs, it) {
    const unit = names.get(it.unitId);
    const cat = recs.get(it.id)?.category;
    const faultLabel = (typeof cat === 'string' && cat.trim() ? cat.trim() : 'תקלה') + (unit ? ' · ' + unit : '');
    const label = kind === 'unpaid' ? shekel(it.amount ?? 0) + (unit ? ' · ' + unit : '') : kind === 'cleaning' ? unit || it.label : faultLabel;
    return label;
}
export function inner$waitingSafe$map$label$$step(kind, it, unit, faultLabel) {
    const label = kind === 'unpaid' ? shekel(it.amount ?? 0) + (unit ? ' · ' + unit : '') : kind === 'cleaning' ? unit || it.label : faultLabel;
    return label;
}
export function inner$waitingSafe$map$ca(recs, it) {
    const ca = recs.get(it.id)?.createdAt;
    return ca;
}
export function inner$waitingSafe$map$createdMs(recs, it) {
    const ca = recs.get(it.id)?.createdAt;
    const createdMs = typeof ca === 'string' && Number.isFinite(Date.parse(ca)) ? Date.parse(ca) : null;
    return createdMs;
}
export function inner$waitingSafe$map$createdMs$$step(ca) {
    const createdMs = typeof ca === 'string' && Number.isFinite(Date.parse(ca)) ? Date.parse(ca) : null;
    return createdMs;
}
export function inner$escalatePreview$title(items) {
    const title = 'מעביר הלאה · ' + (items.length === 1 ? 'ממתין אחד' : items.length + ' ממתינים');
    return title;
}
export function inner$escalatePreview$waitMin(p) {
    const waitMin = num(p, 'waitMin', 180);
    return waitMin;
}
export function inner$escalatePreview$steps(p, recipients) {
    const waitMin = num(p, 'waitMin', 180);
    const steps = recipients.map((r) => ({ to: [r.id], waitMin }));
    return steps;
}
export function inner$escalatePreview$steps$$step(recipients, waitMin) {
    const steps = recipients.map((r) => ({ to: [r.id], waitMin }));
    return steps;
}
export function inner$escalatePreview$labels(recipients) {
    const labels = staffLabels(recipients);
    return labels;
}
export function inner$escalatePreview$nameOf(recipients) {
    const labels = staffLabels(recipients);
    const nameOf = new Map(recipients.map((r, i) => [r.id, labels[i]]));
    return nameOf;
}
export function inner$escalatePreview$nameOf$$step(recipients, labels) {
    const nameOf = new Map(recipients.map((r, i) => [r.id, labels[i]]));
    return nameOf;
}
export function inner$escalatePreview$who(recipients, st) {
    const labels = staffLabels(recipients);
    const nameOf = new Map(recipients.map((r, i) => [r.id, labels[i]]));
    const who = nameOf.get(st.currentTo[0] ?? '') ?? '';
    return who;
}
export function inner$escalatePreview$who$$step(nameOf, st) {
    const who = nameOf.get(st.currentTo[0] ?? '') ?? '';
    return who;
}
export function inner$escalatePreview$head(kind, recipients, it, st) {
    const labels = staffLabels(recipients);
    const nameOf = new Map(recipients.map((r, i) => [r.id, labels[i]]));
    const who = nameOf.get(st.currentTo[0] ?? '') ?? '';
    const head = WAIT_TITLE[kind] + ' · ' + it.label + ' — עכשיו אצל ' + who;
    return head;
}
export function inner$escalatePreview$head$$step(kind, it, who) {
    const head = WAIT_TITLE[kind] + ' · ' + it.label + ' — עכשיו אצל ' + who;
    return head;
}
export function inner$rotatePreview$names(recipients) {
    const names = staffLabels(recipients);
    return names;
}
export function inner$rotatePreview$lines(kind, assigned) {
    const lines = assigned.map((a) => WAIT_TITLE[kind] + ' · ' + a.item.label + ' ⇒ ' + a.person);
    return lines;
}
export function inner$turnoverDivide$lines(pieces, who) {
    const lines = pieces.map((x, i) => hm(x.from) + '–' + hm(x.to) + (who[i] ? ' · ' + who[i].person : ''));
    return lines;
}
export function inner$stayDivide$names(ctx) {
    const names = unitNameMap(ctx.db);
    return names;
}
export function inner$stayDivide$d(x) {
    const d = Math.round(x.from);
    return d;
}
export function inner$untilArrivalDivide$unitOf(ctx) {
    const unitOf = bookingUnit(ctx.db);
    return unitOf;
}
export function inner$untilArrivalDivide$d(x) {
    const d = Math.round(x.from);
    return d;
}
export function inner$amountDivide$fn$unitOf(ctx) {
    const unitOf = bookingUnit(ctx.db);
    return unitOf;
}
export function inner$amountRound$fn$unitOf(ctx) {
    const unitOf = bookingUnit(ctx.db);
    return unitOf;
}
export function inner$amountRound$fn$step(p) {
    const step = num(p, 'step', 1);
    return step;
}
export function inner$amountRound$fn$dir(p) {
    const dir = str(p, 'dir', 'down');
    return dir;
}
export function inner$nightsNext$min(p) {
    const min = num(p, 'minLength', 1);
    return min;
}
export function inner$nightsNext$count(p) {
    const count = num(p, 'count', 1);
    return count;
}
export function inner$nightsNext$free(p, nights) {
    const count = num(p, 'count', 1);
    const free = nights.filter((n) => n.free).slice(0, count);
    return free;
}
export function inner$nightsNext$free$$step(count, nights) {
    const free = nights.filter((n) => n.free).slice(0, count);
    return free;
}
export function inner$arrivalMoments$names(ctx) {
    const names = unitNameMap(ctx.db);
    return names;
}
export function inner$arrivalsOffset$minutes(p) {
    const minutes = num(p, 'minutes', -10);
    return minutes;
}
export function inner$arrivalsOffset$lines(list, moved) {
    const lines = list.map((a, i) => a.unit + ' · הגעה ' + absLine(a.abs) + ' ⇒ תזכורת ' + absLine(moved[i]));
    return lines;
}
export function inner$arrivalsOffset$rel(p) {
    const minutes = num(p, 'minutes', -10);
    const rel = minutes === 0 ? 'ברגע ההגעה' : Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' כל הגעה';
    return rel;
}
export function inner$arrivalsOffset$rel$$step(minutes) {
    const rel = minutes === 0 ? 'ברגע ההגעה' : Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' כל הגעה';
    return rel;
}
export function inner$arrivalsNext$keyed(list) {
    const keyed = new Map(list.map((a) => [a.iso + ' ' + hm(a.minute) + ' ' + a.id, a]));
    return keyed;
}
export function inner$arrivalsNext$lines(now, list, next) {
    const keyed = new Map(list.map((a) => [a.iso + ' ' + hm(a.minute) + ' ' + a.id, a]));
    const lines = next.map((k) => {
        const a = keyed.get(k);
        return (a.iso === now.iso ? 'היום ' + hm(a.minute) : absLine(a.abs)) + ' · ' + a.unit;
    });
    return lines;
}
export function inner$arrivalsNext$lines$$step(now, keyed, next) {
    const lines = next.map((k) => {
        const a = keyed.get(k);
        return (a.iso === now.iso ? 'היום ' + hm(a.minute) : absLine(a.abs)) + ' · ' + a.unit;
    });
    return lines;
}
export function inner$arrivalsNext$map$a(keyed, k) {
    const a = keyed.get(k);
    return a;
}
export function inner$arrivalsRound$step(p) {
    const step = num(p, 'step', 1);
    return step;
}
export function inner$arrivalsRound$dir(p) {
    const dir = str(p, 'dir', 'down');
    return dir;
}
export function inner$previewStrict$key(cap) {
    const key = cap.place + ':' + cap.atom;
    return key;
}
export function inner$capParams$c(caps, place, atom) {
    const c = (caps ?? []).find((x) => x && x.place === place && x.atom === atom);
    return c;
}
export function inner$divideMergeLines$size(base) {
    const size = str(base, 'by', 'parts') === 'size' ? num(base, 'size', 20) : 20;
    return size;
}
export function inner$divideMergeLines$lines(span, base, slots) {
    const size = str(base, 'by', 'parts') === 'size' ? num(base, 'size', 20) : 20;
    const lines = [slots.length + ' משבצות של ' + size + ' דקות בחלון ' + span.fromHm + '–' + span.toHm];
    return lines;
}
export function inner$divideMergeLines$lines$$step(span, size, slots) {
    const lines = [slots.length + ' משבצות של ' + size + ' דקות בחלון ' + span.fromHm + '–' + span.toHm];
    return lines;
}
export function inner$mergeDivideLines$people(staff) {
    const people = staffPeople(staff);
    return people;
}
export function inner$mergeDivideLines$parts(staff) {
    const people = staffPeople(staff);
    const parts = Math.max(2, people.length);
    return parts;
}
export function inner$mergeDivideLines$parts$$step(people) {
    const parts = Math.max(2, people.length);
    return parts;
}
export function inner$mergeDivideLines$r(staff, nights, runs) {
    const people = staffPeople(staff);
    const parts = Math.max(2, people.length);
    const r = runs.find((x) => x.length >= parts && x.to < nights.length - 1);
    return r;
}
export function inner$mergeDivideLines$r$$step(parts, nights, runs) {
    const r = runs.find((x) => x.length >= parts && x.to < nights.length - 1);
    return r;
}
export function inner$mergeDivideLines$shares(staff, nights, runs, pieces) {
    const people = staffPeople(staff);
    const parts = Math.max(2, people.length);
    const r = runs.find((x) => x.length >= parts && x.to < nights.length - 1);
    const shares = pieces.map((x, i) => {
        const a = nights[Math.round(x.from)].iso;
        const z = nights[Math.round(x.to) - 1]?.iso ?? nights[r.to].iso;
        return (people[i] ?? 'חלק ' + (i + 1)) + ' ' + (a === z ? dm(a) : dm(a) + '–' + dm(z));
    });
    return shares;
}
export function inner$mergeDivideLines$shares$$step(people, nights, r, pieces) {
    const shares = pieces.map((x, i) => {
        const a = nights[Math.round(x.from)].iso;
        const z = nights[Math.round(x.to) - 1]?.iso ?? nights[r.to].iso;
        return (people[i] ?? 'חלק ' + (i + 1)) + ' ' + (a === z ? dm(a) : dm(a) + '–' + dm(z));
    });
    return shares;
}
export function inner$mergeDivideLines$map$a(nights, x) {
    const a = nights[Math.round(x.from)].iso;
    return a;
}
export function inner$mergeDivideLines$map$z(nights, r, x) {
    const z = nights[Math.round(x.to) - 1]?.iso ?? nights[r.to].iso;
    return z;
}
export function inner$chainsFor$n(mergeP) {
    const n = Math.max(2, num(mergeP, 'minLength', 1) > 1 ? num(mergeP, 'minLength', 3) : 3);
    return n;
}
export function inner$bookingUnit$out$$after_loop(db) {
    const names = unitNameMap(db);
    const out = new Map();
    for (const b of Array.isArray(db?.hostBookings) ? db.hostBookings : [])
        if (b && typeof b.id === 'string')
            out.set(b.id, names.get(b.unitId) ?? 'יחידה');
    return out;
}
export function inner$installmentsLine$groups$$after_loop(pieces) {
    const groups = [];
    for (const v of pieces) {
        const g = groups[groups.length - 1];
        if (g && g.v === v)
            g.n++;
        else
            groups.push({ v, n: 1 });
    }
    return groups;
}
export function inner$staffLabels$total$$after_loop(list) {
    const base = list.map((r) => (typeof r.name === 'string' && r.name.trim()) || (typeof r.role === 'string' && r.role.trim()) || 'איש צוות');
    const total = new Map();
    for (const b of base)
        total.set(b, (total.get(b) ?? 0) + 1);
    return total;
}
export function inner$waitingSafe$recs$$after_loop(db) {
    const recs = new Map();
    for (const r of Array.isArray(db?.hostRecords) ? db.hostRecords : [])
        if (r && typeof r.id === 'string')
            recs.set(r.id, r);
    return recs;
}

export const SIGS = {
  inner$israelMs$guess: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"minute","d":{"t":"num"},"opt":false}],
  inner$israelMs$wall: [{"name":"p","d":{"t":"obj","p":[["iso",{"t":"str"},false],["minute",{"t":"num"},false]]},"opt":false}],
  inner$hm$m: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$dm$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$bookingUnit$names: [{"name":"db","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$installmentsLine$g: [{"name":"groups","d":{"t":"arr","of":{"t":"obj","p":[["v",{"t":"num"},false],["n",{"t":"num"},false]]}},"opt":false}],
  inner$runLine$open: [{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false]]}},"opt":false},{"name":"r","d":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$staffLabels$base: [{"name":"list","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["role",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$staffLabels$map$k: [{"name":"seen","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$waitingSafe$names: [{"name":"db","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$waitingSafe$items: [{"name":"db","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false},{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"w","d":{"t":"obj","p":[["items",{"t":"arr","of":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},false],["recipients",{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$waitingSafe$items$$step: [{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"w","d":{"t":"obj","p":[["items",{"t":"arr","of":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},false],["recipients",{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},false]]},"opt":false},{"name":"names","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"recs","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["createdAt",{"t":"any"},true],["category",{"t":"any"},true]]}},"opt":false}],
  inner$waitingSafe$map$unit: [{"name":"names","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$waitingSafe$map$cat: [{"name":"recs","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["createdAt",{"t":"any"},true],["category",{"t":"any"},true]]}},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$waitingSafe$map$faultLabel: [{"name":"names","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"recs","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["createdAt",{"t":"any"},true],["category",{"t":"any"},true]]}},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$waitingSafe$map$faultLabel$$step: [{"name":"unit","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"cat","d":{"t":"any"},"opt":false}],
  inner$waitingSafe$map$label: [{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"names","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"recs","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["createdAt",{"t":"any"},true],["category",{"t":"any"},true]]}},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$waitingSafe$map$label$$step: [{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"unit","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"faultLabel","d":{"t":"str"},"opt":false}],
  inner$waitingSafe$map$ca: [{"name":"recs","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["createdAt",{"t":"any"},true],["category",{"t":"any"},true]]}},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$waitingSafe$map$createdMs: [{"name":"recs","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["createdAt",{"t":"any"},true],["category",{"t":"any"},true]]}},"opt":false},{"name":"it","d":{"t":"obj","n":"WaitingItem","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["unitId",{"t":"str"},false],["amount",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["priority",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$waitingSafe$map$createdMs$$step: [{"name":"ca","d":{"t":"any"},"opt":false}],
  inner$escalatePreview$title: [{"name":"items","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["createdMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["urgent",{"t":"bool"},false]]}},"opt":false}],
  inner$escalatePreview$waitMin: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$escalatePreview$steps: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false}],
  inner$escalatePreview$steps$$step: [{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false},{"name":"waitMin","d":{"t":"num"},"opt":false}],
  inner$escalatePreview$labels: [{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false}],
  inner$escalatePreview$nameOf: [{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false}],
  inner$escalatePreview$nameOf$$step: [{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false},{"name":"labels","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$escalatePreview$who: [{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false},{"name":"st","d":{"t":"obj","n":"EscState","p":[["stepIndex",{"t":"num"},false],["currentTo",{"t":"arr","of":{"t":"str"}},false],["nextMoveMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"bool"},false]]},"opt":false}],
  inner$escalatePreview$who$$step: [{"name":"nameOf","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"st","d":{"t":"obj","n":"EscState","p":[["stepIndex",{"t":"num"},false],["currentTo",{"t":"arr","of":{"t":"str"}},false],["nextMoveMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"bool"},false]]},"opt":false}],
  inner$escalatePreview$head: [{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false},{"name":"it","d":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["createdMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["urgent",{"t":"bool"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"EscState","p":[["stepIndex",{"t":"num"},false],["currentTo",{"t":"arr","of":{"t":"str"}},false],["nextMoveMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"bool"},false]]},"opt":false}],
  inner$escalatePreview$head$$step: [{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"it","d":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["createdMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["urgent",{"t":"bool"},false]]},"opt":false},{"name":"who","d":{"t":"str"},"opt":false}],
  inner$rotatePreview$names: [{"name":"recipients","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false}],
  inner$rotatePreview$lines: [{"name":"kind","d":{"t":"lit","v":["cleaning","unpaid","faults"]},"opt":false},{"name":"assigned","d":{"t":"arr","of":{"t":"obj","p":[["item",{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["since",{"t":"str"},false],["createdMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["urgent",{"t":"bool"},false]]},false],["person",{"t":"str"},false]]}},"opt":false}],
  inner$turnoverDivide$lines: [{"name":"pieces","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false},{"name":"who","d":{"t":"arr","of":{"t":"obj","p":[["item",{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},false],["person",{"t":"str"},false]]}},"opt":false}],
  inner$stayDivide$names: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$stayDivide$d: [{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$untilArrivalDivide$unitOf: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$untilArrivalDivide$d: [{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$amountDivide$fn$unitOf: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$amountRound$fn$unitOf: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$amountRound$fn$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$amountRound$fn$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$nightsNext$min: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$nightsNext$count: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$nightsNext$free: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false}],
  inner$nightsNext$free$$step: [{"name":"count","d":{"t":"num"},"opt":false},{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false}],
  inner$arrivalMoments$names: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$arrivalsOffset$minutes: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$arrivalsOffset$lines: [{"name":"list","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["iso",{"t":"str"},false],["minute",{"t":"num"},false],["abs",{"t":"num"},false],["unit",{"t":"str"},false]]}},"opt":false},{"name":"moved","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$arrivalsOffset$rel: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$arrivalsOffset$rel$$step: [{"name":"minutes","d":{"t":"num"},"opt":false}],
  inner$arrivalsNext$keyed: [{"name":"list","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["iso",{"t":"str"},false],["minute",{"t":"num"},false],["abs",{"t":"num"},false],["unit",{"t":"str"},false]]}},"opt":false}],
  inner$arrivalsNext$lines: [{"name":"now","d":{"t":"obj","p":[["iso",{"t":"str"},false],["minute",{"t":"num"},false]]},"opt":false},{"name":"list","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["iso",{"t":"str"},false],["minute",{"t":"num"},false],["abs",{"t":"num"},false],["unit",{"t":"str"},false]]}},"opt":false},{"name":"next","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$arrivalsNext$lines$$step: [{"name":"now","d":{"t":"obj","p":[["iso",{"t":"str"},false],["minute",{"t":"num"},false]]},"opt":false},{"name":"keyed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["id",{"t":"str"},false],["iso",{"t":"str"},false],["minute",{"t":"num"},false],["abs",{"t":"num"},false],["unit",{"t":"str"},false]]}},"opt":false},{"name":"next","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$arrivalsNext$map$a: [{"name":"keyed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["id",{"t":"str"},false],["iso",{"t":"str"},false],["minute",{"t":"num"},false],["abs",{"t":"num"},false],["unit",{"t":"str"},false]]}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$arrivalsRound$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$arrivalsRound$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$previewStrict$key: [{"name":"cap","d":{"t":"obj","p":[["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["id",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$capParams$c: [{"name":"caps","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},"opt":false},{"name":"place","d":{"t":"str"},"opt":false},{"name":"atom","d":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},"opt":false}],
  inner$divideMergeLines$size: [{"name":"base","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$divideMergeLines$lines: [{"name":"span","d":{"t":"obj","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["fromHm",{"t":"str"},false],["toHm",{"t":"str"},false]]},"opt":false},{"name":"base","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"slots","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$divideMergeLines$lines$$step: [{"name":"span","d":{"t":"obj","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["fromHm",{"t":"str"},false],["toHm",{"t":"str"},false]]},"opt":false},{"name":"size","d":{"t":"num"},"opt":false},{"name":"slots","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$mergeDivideLines$people: [{"name":"staff","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false}],
  inner$mergeDivideLines$parts: [{"name":"staff","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false}],
  inner$mergeDivideLines$parts$$step: [{"name":"people","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$mergeDivideLines$r: [{"name":"staff","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false},{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false},{"name":"runs","d":{"t":"arr","of":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$mergeDivideLines$r$$step: [{"name":"parts","d":{"t":"num"},"opt":false},{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false},{"name":"runs","d":{"t":"arr","of":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$mergeDivideLines$shares: [{"name":"staff","d":{"t":"arr","of":{"t":"obj","n":"Recipient","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["role",{"t":"str"},false]]}},"opt":false},{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false},{"name":"runs","d":{"t":"arr","of":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false},{"name":"pieces","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$mergeDivideLines$shares$$step: [{"name":"people","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false},{"name":"r","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}]},"opt":false},{"name":"pieces","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$mergeDivideLines$map$a: [{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false},{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$mergeDivideLines$map$z: [{"name":"nights","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["free",{"t":"bool"},false]]}},"opt":false},{"name":"r","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}]},"opt":false},{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$chainsFor$n: [{"name":"mergeP","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$bookingUnit$out$$after_loop: [{"name":"db","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$installmentsLine$groups$$after_loop: [{"name":"pieces","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$staffLabels$total$$after_loop: [{"name":"list","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["role",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$waitingSafe$recs$$after_loop: [{"name":"db","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
};
