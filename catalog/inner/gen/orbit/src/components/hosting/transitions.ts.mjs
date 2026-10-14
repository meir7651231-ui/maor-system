// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/transitions.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DAY_MS = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
function isIso(v) {
    return typeof v === 'string' && ISO_RE.test(v);
}
function utcOf(iso) {
    return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}
function nightsBetween(a, b) {
    if (!isIso(a) || !isIso(b))
        return 0;
    return Math.round((utcOf(b) - utcOf(a)) / DAY_MS);
}
function overlaps(aIn, aOut, bIn, bOut) {
    return aIn < bOut && bIn < aOut;
}
function bookingParty(b) {
    return b ? (b.adults || 0) + (b.kids || 0) : 0;
}
function unitHasRooms(u) {
    return !!u && u.subRooms.length > 0;
}
function roomNameOf(u, rid) {
    return u?.subRooms.find((r) => r.id === rid)?.name ?? rid;
}
function roomsLabel(u, roomIds) {
    return roomIds.length ? roomIds.map((id) => roomNameOf(u, id)).join(' + ') : '';
}
function bookRate(u, roomIds) {
    if (!unitHasRooms(u) || !roomIds.length)
        return u.rate;
    return u.subRooms.filter((r) => roomIds.includes(r.id)).reduce((s, r) => s + (r.rate || 0), 0);
}
const ALL_ROOMS = '__ALL__';
function blocksAvailability(b) {
    return b.status !== 'cancelled' && b.status !== 'done';
}
function occupiedRoomIds(bookings, u, checkIn, checkOut, exceptId) {
    const set = new Set();
    const roomed = unitHasRooms(u);
    for (const b of bookings) {
        if (b.unitId !== u.id || b.id === exceptId || !blocksAvailability(b))
            continue;
        if (!overlaps(checkIn, checkOut, b.checkIn, b.checkOut))
            continue;
        if (!roomed) {
            set.add(ALL_ROOMS);
            continue;
        }
        if (b.roomIds.length)
            for (const id of b.roomIds)
                set.add(id);
        else
            for (const r of u.subRooms)
                set.add(r.id);
    }
    return set;
}
function mealTotal(m) {
    return m.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
}
function withMealCharge(charges, m) {
    const rest = charges.filter((c) => c.mealId !== m.id);
    const tot = mealTotal(m);
    if (tot <= 0 || m.status === 'cancelled')
        return rest;
    return [...rest, { id: 'meal:' + m.id, kind: 'meal', label: 'הזמנת מטבח (' + m.items.length + ' מנות)', amount: tot, mealId: m.id }];
}
function syncMealsToParty(meals, b, nowIso) {
    const ppl = bookingParty(b);
    let charges = b.charges.slice();
    const changed = [];
    for (const m of meals) {
        if (m.bookingId !== b.id || m.status === 'served' || m.status === 'cancelled')
            continue;
        const prev = m.dinerCount;
        const items = m.items.map((it) => (it.qty === prev || !it.qty ? { ...it, qty: ppl } : it));
        const next = { ...m, items, dinerCount: ppl, updatedAt: nowIso };
        changed.push(next);
        charges = withMealCharge(charges, next);
    }
    return { meals: changed, charges };
}
function dishOf(item, dishes) {
    return (item.dishId && dishes.find((d) => d.id === item.dishId)) || dishes.find((d) => d.name === item.name);
}
export function inner$hostTerms$fam(prefs) {
    const fam = prefs?.familyTerm === true;
    return fam;
}
export function inner$occupiedRoomIds$roomed(u) {
    const roomed = unitHasRooms(u);
    return roomed;
}
export function inner$checkAvailability$roomed(u) {
    const roomed = unitHasRooms(u);
    return roomed;
}
export function inner$checkAvailability$occ(bookings, u, checkIn, checkOut, exceptId) {
    const occ = occupiedRoomIds(bookings, u, checkIn, checkOut, exceptId);
    return occ;
}
export function inner$priceQuote$nights(checkIn, checkOut) {
    const nights = Math.max(0, nightsBetween(checkIn, checkOut));
    return nights;
}
export function inner$priceQuote$rate(u, roomIds) {
    const rate = bookRate(u, roomIds);
    return rate;
}
export function inner$priceQuote$stay(u, roomIds, checkIn, checkOut) {
    const nights = Math.max(0, nightsBetween(checkIn, checkOut));
    const rate = bookRate(u, roomIds);
    const stay = rate * nights;
    return stay;
}
export function inner$priceQuote$stay$$step(nights, rate) {
    const stay = rate * nights;
    return stay;
}
export function inner$priceQuote$tax(u, roomIds, checkIn, checkOut, s, cleaning) {
    const nights = Math.max(0, nightsBetween(checkIn, checkOut));
    const rate = bookRate(u, roomIds);
    const stay = rate * nights;
    const tax = Math.round(((stay + cleaning) * s.taxPct) / 100);
    return tax;
}
export function inner$priceQuote$tax$$step(s, stay, cleaning) {
    const tax = Math.round(((stay + cleaning) * s.taxPct) / 100);
    return tax;
}
export function inner$priceQuote$rl(u, roomIds) {
    const rl = unitHasRooms(u) ? roomsLabel(u, roomIds) : '';
    return rl;
}
export function inner$withMealCharge$rest(charges, m) {
    const rest = charges.filter((c) => c.mealId !== m.id);
    return rest;
}
export function inner$withMealCharge$tot(m) {
    const tot = mealTotal(m);
    return tot;
}
export function inner$syncMealsToParty$ppl(b) {
    const ppl = bookingParty(b);
    return ppl;
}
export function inner$syncMealsToParty$charges(b) {
    let charges = b.charges.slice();
    return charges;
}
export function inner$syncMealsToParty$items(b, m, prev) {
    const ppl = bookingParty(b);
    const items = m.items.map((it) => (it.qty === prev || !it.qty ? { ...it, qty: ppl } : it));
    return items;
}
export function inner$syncMealsToParty$items$$step(ppl, m, prev) {
    const items = m.items.map((it) => (it.qty === prev || !it.qty ? { ...it, qty: ppl } : it));
    return items;
}
export function inner$syncAllKitchen$byId(meals) {
    const byId = new Map(meals.map((m) => [m.id, m]));
    return byId;
}
export function inner$syncAllKitchen$b(bookings, m) {
    const b = bookings.find((x) => x.id === m.bookingId);
    return b;
}
export function inner$syncAllKitchen$res(bookings, nowIso, byId, m) {
    const b = bookings.find((x) => x.id === m.bookingId);
    const res = syncMealsToParty([...byId.values()], b, nowIso);
    return res;
}
export function inner$syncAllKitchen$res$$step(nowIso, byId, b) {
    const res = syncMealsToParty([...byId.values()], b, nowIso);
    return res;
}
export function inner$syncAllKitchen$map$def(dishes, m, it) {
    const def = dishOf(it, dishes)?.defBy || m.cook;
    return def;
}
export function inner$syncAllKitchen$changedMeals(meals, byId) {
    const changedMeals = [...byId.values()].filter((m) => m !== meals.find((x) => x.id === m.id));
    return changedMeals;
}
export function inner$shabbatPackageMeal$ppl(b) {
    const ppl = bookingParty(b);
    return ppl;
}
export function inner$clearStaffRefs$map$roles(staffId, r) {
    const roles = r.cook === staffId || r.server === staffId || r.clearer === staffId || r.tableSetter === staffId;
    return roles;
}
export function inner$clearStaffRefs$map$items(staffId, r) {
    const items = r.items.some((it) => it.by === staffId);
    return items;
}
export function inner$cleanPlainRecord$name(r) {
    const name = r.name.trim();
    return name;
}
export function inner$cleanPlainRecord$name_L575(r) {
    const name = r.name.trim();
    return name;
}
export function inner$cleanPlainRecord$name_L579(r) {
    const name = r.name.trim();
    return name;
}
export function inner$cleanPlainRecord$name_L583(r) {
    const name = r.name.trim();
    return name;
}
export function inner$cleanPlainRecord$name_L587(r) {
    const name = r.name.trim();
    return name;
}
export function inner$cleanPlainRecord$task(r) {
    const task = r.task.trim();
    return task;
}
export function inner$nextLocalId$n(prefix, x) {
    const n = Number(x.id.slice(prefix.length));
    return n;
}
export function inner$occupiedRoomIds$set$$after_loop(bookings, u, checkIn, checkOut, exceptId) {
    const set = new Set();
    const roomed = unitHasRooms(u);
    for (const b of bookings) {
        if (b.unitId !== u.id || b.id === exceptId || !blocksAvailability(b))
            continue;
        if (!overlaps(checkIn, checkOut, b.checkIn, b.checkOut))
            continue;
        if (!roomed) {
            set.add(ALL_ROOMS);
            continue;
        }
        if (b.roomIds.length)
            for (const id of b.roomIds)
                set.add(id);
        else
            for (const r of u.subRooms)
                set.add(r.id);
    }
    return set;
}
export function inner$syncMealsToParty$charges$$after_loop(meals, b, nowIso) {
    const ppl = bookingParty(b);
    let charges = b.charges.slice();
    const changed = [];
    for (const m of meals) {
        if (m.bookingId !== b.id || m.status === 'served' || m.status === 'cancelled')
            continue;
        const prev = m.dinerCount;
        const items = m.items.map((it) => (it.qty === prev || !it.qty ? { ...it, qty: ppl } : it));
        const next = { ...m, items, dinerCount: ppl, updatedAt: nowIso };
        changed.push(next);
        charges = withMealCharge(charges, next);
    }
    return charges;
}
export function inner$syncMealsToParty$changed$$after_loop(meals, b, nowIso) {
    const ppl = bookingParty(b);
    let charges = b.charges.slice();
    const changed = [];
    for (const m of meals) {
        if (m.bookingId !== b.id || m.status === 'served' || m.status === 'cancelled')
            continue;
        const prev = m.dinerCount;
        const items = m.items.map((it) => (it.qty === prev || !it.qty ? { ...it, qty: ppl } : it));
        const next = { ...m, items, dinerCount: ppl, updatedAt: nowIso };
        changed.push(next);
        charges = withMealCharge(charges, next);
    }
    return changed;
}
export function inner$nextLocalId$max$$after_loop(prefix, list) {
    let max = 0;
    for (const x of list) {
        if (typeof x.id !== 'string' || !x.id.startsWith(prefix))
            continue;
        const n = Number(x.id.slice(prefix.length));
        if (Number.isInteger(n) && n > max)
            max = n;
    }
    return max;
}

export const SIGS = {
  inner$hostTerms$fam: [{"name":"prefs","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[["mode",{"t":"or","of":[{"t":"lit","v":["shabbat","prep","off","motzash"]},{"t":"undef"}]},true],["candle",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["havdalah",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["level",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["mashgiach",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]}]},"opt":false}],
  inner$occupiedRoomIds$roomed: [{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$checkAvailability$roomed: [{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$checkAvailability$occ: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"checkIn","d":{"t":"str"},"opt":false},{"name":"checkOut","d":{"t":"str"},"opt":false},{"name":"exceptId","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$priceQuote$nights: [{"name":"checkIn","d":{"t":"str"},"opt":false},{"name":"checkOut","d":{"t":"str"},"opt":false}],
  inner$priceQuote$rate: [{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"roomIds","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$priceQuote$stay: [{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"roomIds","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"checkIn","d":{"t":"str"},"opt":false},{"name":"checkOut","d":{"t":"str"},"opt":false}],
  inner$priceQuote$stay$$step: [{"name":"nights","d":{"t":"num"},"opt":false},{"name":"rate","d":{"t":"num"},"opt":false}],
  inner$priceQuote$tax: [{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"roomIds","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"checkIn","d":{"t":"str"},"opt":false},{"name":"checkOut","d":{"t":"str"},"opt":false},{"name":"s","d":{"t":"obj","n":"HostSettings","p":[["checkin",{"t":"str"},false],["checkout",{"t":"str"},false],["cleaningFee",{"t":"num"},false],["taxPct",{"t":"num"},false],["orderLeadDays",{"t":"num"},false],["familyTerm",{"t":"bool"},false]]},"opt":false},{"name":"cleaning","d":{"t":"num"},"opt":false}],
  inner$priceQuote$tax$$step: [{"name":"s","d":{"t":"obj","n":"HostSettings","p":[["checkin",{"t":"str"},false],["checkout",{"t":"str"},false],["cleaningFee",{"t":"num"},false],["taxPct",{"t":"num"},false],["orderLeadDays",{"t":"num"},false],["familyTerm",{"t":"bool"},false]]},"opt":false},{"name":"stay","d":{"t":"num"},"opt":false},{"name":"cleaning","d":{"t":"num"},"opt":false}],
  inner$priceQuote$rl: [{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"roomIds","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$withMealCharge$rest: [{"name":"charges","d":{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"m","d":{"t":"obj","n":"Pick","p":[["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["id",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$withMealCharge$tot: [{"name":"m","d":{"t":"obj","n":"Pick","p":[["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["id",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$syncMealsToParty$ppl: [{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$syncMealsToParty$charges: [{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$syncMealsToParty$items: [{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"prev","d":{"t":"num"},"opt":false}],
  inner$syncMealsToParty$items$$step: [{"name":"ppl","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"prev","d":{"t":"num"},"opt":false}],
  inner$syncAllKitchen$byId: [{"name":"meals","d":{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$syncAllKitchen$b: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$syncAllKitchen$res: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"nowIso","d":{"t":"str"},"opt":false},{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$syncAllKitchen$res$$step: [{"name":"nowIso","d":{"t":"str"},"opt":false},{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"b","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$syncAllKitchen$map$def: [{"name":"dishes","d":{"t":"arr","of":{"t":"obj","n":"HostDish","p":[["kind",{"t":"lit","v":["dish"]},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["price",{"t":"num"},false],["allergens",{"t":"str"},false],["prepTime",{"t":"str"},false],["cookTime",{"t":"str"},false],["cookTemp",{"t":"str"},false],["baseServings",{"t":"num"},false],["ingredients",{"t":"arr","of":{"t":"str"}},false],["steps",{"t":"arr","of":{"t":"str"}},false],["notes",{"t":"str"},false],["defBy",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"it","d":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]},"opt":false}],
  inner$syncAllKitchen$changedMeals: [{"name":"meals","d":{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$shabbatPackageMeal$ppl: [{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$clearStaffRefs$map$roles: [{"name":"staffId","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$clearStaffRefs$map$items: [{"name":"staffId","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$cleanPlainRecord$name: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$cleanPlainRecord$name_L575: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$cleanPlainRecord$name_L579: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$cleanPlainRecord$name_L583: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$cleanPlainRecord$name_L587: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$cleanPlainRecord$task: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$nextLocalId$n: [{"name":"prefix","d":{"t":"str"},"opt":false},{"name":"x","d":{"t":"obj","p":[["id",{"t":"str"},false]]},"opt":false}],
  inner$occupiedRoomIds$set$$after_loop: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"u","d":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"checkIn","d":{"t":"str"},"opt":false},{"name":"checkOut","d":{"t":"str"},"opt":false},{"name":"exceptId","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$syncMealsToParty$charges$$after_loop: [{"name":"meals","d":{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"nowIso","d":{"t":"str"},"opt":false}],
  inner$syncMealsToParty$changed$$after_loop: [{"name":"meals","d":{"t":"arr","of":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"nowIso","d":{"t":"str"},"opt":false}],
  inner$nextLocalId$max$$after_loop: [{"name":"prefix","d":{"t":"str"},"opt":false},{"name":"list","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false}],
};
