// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/importer.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v.filter(isObj) : []);
const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v, d = 0) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : d;
};
function mapCharges(raw) {
    const used = new Set();
    return arr(raw).map((c, i) => {
        const label = str(c.label);
        const ko = str(c.ko);
        let kind = 'extra';
        let id = 'c' + (i + 1);
        if (ko) {
            kind = 'meal';
            id = 'meal:' + ko;
        }
        else if (label.startsWith('לינה')) {
            kind = 'stay';
            id = 'stay';
        }
        else if (label === 'דמי ניקיון') {
            kind = 'cleaning';
            id = 'cleaning';
        }
        else if (label.startsWith('מע״מ') || label.startsWith('מע"מ')) {
            kind = 'tax';
            id = 'tax';
        }
        else if (label === 'חבילת שבת') {
            kind = 'shabbat';
            id = 'shabbat';
        }
        if (used.has(id))
            id = 'c' + (i + 1) + 'x';
        used.add(id);
        const out = { id, kind, label, amount: num(c.amount) };
        if (ko)
            out.mealId = ko;
        return out;
    });
}
export function inner$num$n(v) {
    const n = typeof v === 'number' ? v : Number(v);
    return n;
}
export function inner$cp1255Rev$cc(ch) {
    const cc = ch.charCodeAt(0);
    return cc;
}
export function inner$deMoji$cc(ch) {
    const cc = ch.codePointAt(0);
    return cc;
}
export function inner$mapCharges$map$label(c) {
    const label = str(c.label);
    return label;
}
export function inner$mapCharges$map$ko(c) {
    const ko = str(c.ko);
    return ko;
}
export function inner$mapCharges$map$id(i) {
    let id = 'c' + (i + 1);
    return id;
}
export function inner$mapCharges$map$out(c, kind, id) {
    const label = str(c.label);
    const out = { id, kind, label, amount: num(c.amount) };
    return out;
}
export function inner$mapCharges$map$out$$step(c, label, kind, id) {
    const out = { id, kind, label, amount: num(c.amount) };
    return out;
}
export function inner$importAppBackup$guests(raw) {
    const guests = arr(raw.guests);
    return guests;
}
export function inner$importAppBackup$guestById(raw) {
    const guests = arr(raw.guests);
    const guestById = new Map(guests.map((g) => [str(g.id), g]));
    return guestById;
}
export function inner$importAppBackup$guestById$$step(guests) {
    const guestById = new Map(guests.map((g) => [str(g.id), g]));
    return guestById;
}
export function inner$importAppBackup$menu(raw) {
    const menu = arr(raw.menu);
    return menu;
}
export function inner$importAppBackup$dishIdByName(raw) {
    const menu = arr(raw.menu);
    const dishIdByName = new Map(menu.map((m) => [str(m.name), str(m.id)]));
    return dishIdByName;
}
export function inner$importAppBackup$dishIdByName$$step(menu) {
    const dishIdByName = new Map(menu.map((m) => [str(m.name), str(m.id)]));
    return dishIdByName;
}
export function inner$importAppBackup$units(nowIso, raw) {
    const at = { createdAt: nowIso, updatedAt: nowIso };
    const units = arr(raw.units).map((u) => ({
        id: str(u.id),
        name: str(u.name),
        type: str(u.type) || 'צימר',
        beds: num(u.beds),
        cap: num(u.cap),
        rate: num(u.rate),
        status: u.status === 'dirty' || u.status === 'blocked' ? u.status : 'free',
        subRooms: arr(u.rooms).map((r) => ({ id: str(r.id), name: str(r.name), beds: num(r.beds), rate: num(r.rate) })),
        ...at,
    }));
    return units;
}
export function inner$importAppBackup$units$$step(raw, at) {
    const units = arr(raw.units).map((u) => ({
        id: str(u.id),
        name: str(u.name),
        type: str(u.type) || 'צימר',
        beds: num(u.beds),
        cap: num(u.cap),
        rate: num(u.rate),
        status: u.status === 'dirty' || u.status === 'blocked' ? u.status : 'free',
        subRooms: arr(u.rooms).map((r) => ({ id: str(r.id), name: str(r.name), beds: num(r.beds), rate: num(r.rate) })),
        ...at,
    }));
    return units;
}
export function inner$importAppBackup$bookings(nowIso, raw) {
    const at = { createdAt: nowIso, updatedAt: nowIso };
    const bookings = arr(raw.reservations).map((r) => ({
        id: str(r.id),
        guestId: str(r.guest),
        unitId: str(r.unit),
        roomIds: Array.isArray(r.rooms) ? r.rooms.map(str) : [],
        checkIn: str(r.in),
        checkOut: str(r.out),
        adults: num(r.adults),
        kids: num(r.kids),
        status: str(r.status),
        charges: mapCharges(r.charges),
        payments: arr(r.payments).map((p, i) => ({ id: 'p' + (i + 1), amount: num(p.amount), date: str(p.date), note: str(p.note) })),
        notes: str(r.notes),
        shabbat: r.shabbat === true,
        ...at,
    }));
    return bookings;
}
export function inner$importAppBackup$bookings$$step(raw, at) {
    const bookings = arr(raw.reservations).map((r) => ({
        id: str(r.id),
        guestId: str(r.guest),
        unitId: str(r.unit),
        roomIds: Array.isArray(r.rooms) ? r.rooms.map(str) : [],
        checkIn: str(r.in),
        checkOut: str(r.out),
        adults: num(r.adults),
        kids: num(r.kids),
        status: str(r.status),
        charges: mapCharges(r.charges),
        payments: arr(r.payments).map((p, i) => ({ id: 'p' + (i + 1), amount: num(p.amount), date: str(p.date), note: str(p.note) })),
        notes: str(r.notes),
        shabbat: r.shabbat === true,
        ...at,
    }));
    return bookings;
}
export function inner$importAppBackup$diners(raw, o) {
    const guests = arr(raw.guests);
    const guestById = new Map(guests.map((g) => [str(g.id), g]));
    const diners = (Array.isArray(o.dinerGuests) ? o.dinerGuests : []).map((x) => {
        const e = typeof x === 'string' ? { gid: x } : isObj(x) ? x : {};
        const gid = str(e.gid);
        const g = guestById.get(gid) ?? {};
        return { guestId: gid, adults: e.adults != null ? num(e.adults) : num(g.adults), kids: e.kids != null ? num(e.kids) : num(g.kids) };
    });
    return diners;
}
export function inner$importAppBackup$diners$$step(guestById, o) {
    const diners = (Array.isArray(o.dinerGuests) ? o.dinerGuests : []).map((x) => {
        const e = typeof x === 'string' ? { gid: x } : isObj(x) ? x : {};
        const gid = str(e.gid);
        const g = guestById.get(gid) ?? {};
        return { guestId: gid, adults: e.adults != null ? num(e.adults) : num(g.adults), kids: e.kids != null ? num(e.kids) : num(g.kids) };
    });
    return diners;
}
export function inner$importAppBackup$map$e(x) {
    const e = typeof x === 'string' ? { gid: x } : isObj(x) ? x : {};
    return e;
}
export function inner$importAppBackup$map$gid(x) {
    const e = typeof x === 'string' ? { gid: x } : isObj(x) ? x : {};
    const gid = str(e.gid);
    return gid;
}
export function inner$importAppBackup$map$gid$$step(e) {
    const gid = str(e.gid);
    return gid;
}
export function inner$importAppBackup$map$g(guestById, x) {
    const e = typeof x === 'string' ? { gid: x } : isObj(x) ? x : {};
    const gid = str(e.gid);
    const g = guestById.get(gid) ?? {};
    return g;
}
export function inner$importAppBackup$map$g$$step(guestById, gid) {
    const g = guestById.get(gid) ?? {};
    return g;
}
export function inner$importAppBackup$sp(o) {
    const sp = isObj(o.seatPlan) ? o.seatPlan : {};
    return sp;
}
export function inner$importAppBackup$map$item(it) {
    const item = { name: str(it.name), price: num(it.price), qty: num(it.qty, 1) || 1, alg: str(it.alg), by: str(it.by) };
    return item;
}
export function inner$importAppBackup$map$did(dishIdByName, it) {
    const did = dishIdByName.get(str(it.name));
    return did;
}
export function inner$importAppBackup$map$out(p) {
    const out = { id: str(p.id), name: str(p.name) };
    return out;
}
export function inner$importAppBackup$org(raw) {
    const org = isObj(raw.org) ? raw.org : {};
    return org;
}
export function inner$importAppBackup$sb(raw) {
    const sb = isObj(raw.shabbat) ? raw.shabbat : {};
    return sb;
}
export function inner$importAppBackup$ui(raw) {
    const ui = isObj(raw.ui) ? raw.ui : {};
    return ui;
}
export function inner$importAppBackup$prefsRaw(raw) {
    const org = isObj(raw.org) ? raw.org : {};
    const sb = isObj(raw.shabbat) ? raw.shabbat : {};
    const ui = isObj(raw.ui) ? raw.ui : {};
    const prefsRaw = {
        checkin: str(org.checkin) || undefined,
        checkout: str(org.checkout) || undefined,
        cleaningFee: org.cleaningFee != null ? num(org.cleaningFee) : undefined,
        taxPct: org.taxPct != null ? num(org.taxPct) : undefined,
        orderLeadDays: org.orderLeadDays != null ? num(org.orderLeadDays) : undefined,
        familyTerm: org.familyTerm === true ? true : undefined,
        shabbat: { mode: str(sb.mode) || undefined, candle: str(sb.candle), havdalah: str(sb.havdalah), level: str(sb.level), mashgiach: str(sb.mashgiach) },
        shopGot: isObj(ui.shopGot) ? ui.shopGot : undefined,
        shopEmoji: isObj(ui.shopEmoji) ? ui.shopEmoji : undefined,
    };
    return prefsRaw;
}
export function inner$importAppBackup$prefsRaw$$step(org, sb, ui) {
    const prefsRaw = {
        checkin: str(org.checkin) || undefined,
        checkout: str(org.checkout) || undefined,
        cleaningFee: org.cleaningFee != null ? num(org.cleaningFee) : undefined,
        taxPct: org.taxPct != null ? num(org.taxPct) : undefined,
        orderLeadDays: org.orderLeadDays != null ? num(org.orderLeadDays) : undefined,
        familyTerm: org.familyTerm === true ? true : undefined,
        shabbat: { mode: str(sb.mode) || undefined, candle: str(sb.candle), havdalah: str(sb.havdalah), level: str(sb.level), mashgiach: str(sb.mashgiach) },
        shopGot: isObj(ui.shopGot) ? ui.shopGot : undefined,
        shopEmoji: isObj(ui.shopEmoji) ? ui.shopEmoji : undefined,
    };
    return prefsRaw;
}
export function inner$importAppBackup$bizName(raw) {
    const org = isObj(raw.org) ? raw.org : {};
    const bizName = str(org.name).trim();
    return bizName;
}
export function inner$importAppBackup$bizName$$step(org) {
    const bizName = str(org.name).trim();
    return bizName;
}
export function inner$importAppBackup$flags(raw) {
    const flags = isObj(raw.flags) ? raw.flags : {};
    return flags;
}
export function inner$importAppBackup$flagsOff(raw) {
    const flags = isObj(raw.flags) ? raw.flags : {};
    const flagsOff = ['kitchen', 'shabbat', 'maint'].filter((k) => flags[k] === false).map((k) => 'hosting.' + k);
    return flagsOff;
}
export function inner$importAppBackup$flagsOff$$step(flags) {
    const flagsOff = ['kitchen', 'shabbat', 'maint'].filter((k) => flags[k] === false).map((k) => 'hosting.' + k);
    return flagsOff;
}
export function inner$deMoji$hi$$after_loop(s) {
    let hi = false;
    for (let i = 0; i < s.length && !hi; i++)
        hi = s.charCodeAt(i) > 127;
    return hi;
}
export function inner$importAppBackup$sh$$after_loop(prefsRaw) {
    const sh = prefsRaw.shabbat;
    for (const k of Object.keys(sh))
        if (sh[k] === undefined)
            delete sh[k];
    return sh;
}

export const SIGS = {
  inner$num$n: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$cp1255Rev$cc: [{"name":"ch","d":{"t":"str"},"opt":false}],
  inner$deMoji$cc: [{"name":"ch","d":{"t":"str"},"opt":false}],
  inner$mapCharges$map$label: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mapCharges$map$ko: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mapCharges$map$id: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mapCharges$map$out: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"kind","d":{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$mapCharges$map$out$$step: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false},{"name":"kind","d":{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$importAppBackup$guests: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$guestById: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$guestById$$step: [{"name":"guests","d":{"t":"arr","of":{"t":"rec","of":{"t":"any"}}},"opt":false}],
  inner$importAppBackup$menu: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$dishIdByName: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$dishIdByName$$step: [{"name":"menu","d":{"t":"arr","of":{"t":"rec","of":{"t":"any"}}},"opt":false}],
  inner$importAppBackup$units: [{"name":"nowIso","d":{"t":"str"},"opt":false},{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$units$$step: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"at","d":{"t":"obj","p":[["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$importAppBackup$bookings: [{"name":"nowIso","d":{"t":"str"},"opt":false},{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$bookings$$step: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"at","d":{"t":"obj","p":[["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$importAppBackup$diners: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$diners$$step: [{"name":"guestById","d":{"t":"map","k":{"t":"str"},"v":{"t":"rec","of":{"t":"any"}}},"opt":false},{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$map$e: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$importAppBackup$map$gid: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$importAppBackup$map$gid$$step: [{"name":"e","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$map$g: [{"name":"guestById","d":{"t":"map","k":{"t":"str"},"v":{"t":"rec","of":{"t":"any"}}},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$importAppBackup$map$g$$step: [{"name":"guestById","d":{"t":"map","k":{"t":"str"},"v":{"t":"rec","of":{"t":"any"}}},"opt":false},{"name":"gid","d":{"t":"str"},"opt":false}],
  inner$importAppBackup$sp: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$map$item: [{"name":"it","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$map$did: [{"name":"dishIdByName","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"it","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$map$out: [{"name":"p","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$org: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$sb: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$ui: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$prefsRaw: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$prefsRaw$$step: [{"name":"org","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"sb","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"ui","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$bizName: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$bizName$$step: [{"name":"org","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$flags: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$flagsOff: [{"name":"raw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$importAppBackup$flagsOff$$step: [{"name":"flags","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$deMoji$hi$$after_loop: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$importAppBackup$sh$$after_loop: [{"name":"prefsRaw","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
};
