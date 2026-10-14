// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/lib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function monthBounds(iso) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, '0');
    return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, '0')}` };
}
function currentStay(u, bookings, today) {
    let cur = null;
    for (const b of bookings)
        if (b.unitId === u.id && b.status === 'in' && b.checkIn <= today && (!cur || b.checkIn > cur.checkIn))
            cur = b;
    return cur;
}
function unitLiveStatus(u, bookings, today) {
    if (u.status === 'blocked')
        return 'blocked';
    if (currentStay(u, bookings, today))
        return 'occupied';
    if (u.status === 'dirty')
        return 'dirty';
    return 'free';
}
export function inner$initialsOf$p(name) {
    const p = (name || '').trim().split(/\s+/);
    return p;
}
export function inner$initialsOf$a(name) {
    const p = (name || '').trim().split(/\s+/);
    const a = (p[0] || '').slice(0, 1);
    return a;
}
export function inner$initialsOf$a$$step(p) {
    const a = (p[0] || '').slice(0, 1);
    return a;
}
export function inner$initialsOf$b(name) {
    const p = (name || '').trim().split(/\s+/);
    const b = (p[1] || '').slice(0, 1) || (p[0] || '').slice(1, 2);
    return b;
}
export function inner$initialsOf$b$$step(p) {
    const b = (p[1] || '').slice(0, 1) || (p[0] || '').slice(1, 2);
    return b;
}
export function inner$waShareHref$t(text) {
    const t = encodeURIComponent(text);
    return t;
}
export function inner$monthBounds$y(iso) {
    const y = +iso.slice(0, 4);
    return y;
}
export function inner$monthBounds$m(iso) {
    const m = +iso.slice(5, 7);
    return m;
}
export function inner$monthBounds$last(iso) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return last;
}
export function inner$monthBounds$last$$step(y, m) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return last;
}
export function inner$monthBounds$mm(iso) {
    const m = +iso.slice(5, 7);
    const mm = String(m).padStart(2, '0');
    return mm;
}
export function inner$monthBounds$mm$$step(m) {
    const mm = String(m).padStart(2, '0');
    return mm;
}
export function inner$monthPaidRevenue$ym(today) {
    const ym = today.slice(0, 7);
    return ym;
}
export function inner$monthChargedRevenue$from(today) {
    const { from, to } = monthBounds(today);
    return from;
}
export function inner$monthChargedRevenue$to(today) {
    const { from, to } = monthBounds(today);
    return to;
}
export function inner$revenueSeries$y0(today) {
    const y0 = +today.slice(0, 4);
    return y0;
}
export function inner$revenueSeries$m0(today) {
    const m0 = +today.slice(5, 7) - 1;
    return m0;
}
export function inner$revenueSeries$i(n) {
    let i = n - 1;
    return i;
}
export function inner$revenueSeries$d(today, i) {
    const y0 = +today.slice(0, 4);
    const m0 = +today.slice(5, 7) - 1;
    const d = new Date(Date.UTC(y0, m0 - i, 1));
    return d;
}
export function inner$revenueSeries$d$$step(y0, m0, i) {
    const d = new Date(Date.UTC(y0, m0 - i, 1));
    return d;
}
export function inner$revenueSeries$ym(today, i) {
    const y0 = +today.slice(0, 4);
    const m0 = +today.slice(5, 7) - 1;
    const d = new Date(Date.UTC(y0, m0 - i, 1));
    const ym = d.toISOString().slice(0, 7);
    return ym;
}
export function inner$revenueSeries$ym$$step(d) {
    const ym = d.toISOString().slice(0, 7);
    return ym;
}
export function inner$bookingsView$rs(bookings) {
    let rs = bookings.slice().sort((a, b) => (a.checkIn < b.checkIn ? 1 : a.checkIn > b.checkIn ? -1 : 0));
    return rs;
}
export function inner$bookingsView$t(q) {
    const t = q.trim().toLowerCase();
    return t;
}
export function inner$bookingsKpis$active(bookings, isActive) {
    const active = bookings.filter(isActive);
    return active;
}
export function inner$guestsView$t(q) {
    const t = q.trim().toLowerCase();
    return t;
}
export function inner$cleanTasksOf$tasks(records) {
    const tasks = records.filter((r) => r.kind === 'clean');
    return tasks;
}
export function inner$calendarMonth$map$wd(c) {
    const wd = new Date(c.iso + 'T12:00:00').getDay();
    return wd;
}
export function inner$calendarMonth$d0(anchorIso, days) {
    const first = days[0]?.iso ?? anchorIso;
    const d0 = new Date(first + 'T12:00:00');
    return d0;
}
export function inner$calendarMonth$d0$$step(first) {
    const d0 = new Date(first + 'T12:00:00');
    return d0;
}
export function inner$calendarBars$last(dayIsos) {
    const last = dayIsos[dayIsos.length - 1];
    return last;
}
export function inner$calendarBars$L(ends, b) {
    let L = ends.findIndex((e) => e <= b.checkIn);
    return L;
}
export function inner$currentStay$cur$$after_loop(u, bookings, today) {
    let cur = null;
    for (const b of bookings)
        if (b.unitId === u.id && b.status === 'in' && b.checkIn <= today && (!cur || b.checkIn > cur.checkIn))
            cur = b;
    return cur;
}
export function inner$dashboardOf$live$$after_loop(units, bookings, today) {
    const live = {};
    for (const u of units)
        live[u.id] = unitLiveStatus(u, bookings, today);
    return live;
}
export function inner$bookingCounts$out$$after_loop(bookings) {
    const out = { all: bookings.length, pending: 0, confirmed: 0, in: 0, done: 0, cancelled: 0 };
    for (const b of bookings)
        out[b.status]++;
    return out;
}

export const SIGS = {
  inner$initialsOf$p: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$initialsOf$a: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$initialsOf$a$$step: [{"name":"p","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$initialsOf$b: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$initialsOf$b$$step: [{"name":"p","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$waShareHref$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$monthBounds$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$monthBounds$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$monthBounds$last: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$monthBounds$last$$step: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
  inner$monthBounds$mm: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$monthBounds$mm$$step: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$monthPaidRevenue$ym: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$monthChargedRevenue$from: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$monthChargedRevenue$to: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$revenueSeries$y0: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$revenueSeries$m0: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$revenueSeries$i: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$revenueSeries$d: [{"name":"today","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$revenueSeries$d$$step: [{"name":"y0","d":{"t":"num"},"opt":false},{"name":"m0","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$revenueSeries$ym: [{"name":"today","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$revenueSeries$ym$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$bookingsView$rs: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$bookingsView$t: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$bookingsKpis$active: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"isActive","d":{"t":"fn"},"opt":false}],
  inner$guestsView$t: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$cleanTasksOf$tasks: [{"name":"records","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$calendarMonth$map$wd: [{"name":"c","d":{"t":"obj","n":"MonthGridCell","p":[["iso",{"t":"str"},false],["dayNum",{"t":"str"},false],["hebDay",{"t":"str"},false],["inMonth",{"t":"bool"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fullHoliday",{"t":"bool"},false],["events",{"t":"arr","of":{"t":"obj","p":[["date",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$calendarMonth$d0: [{"name":"anchorIso","d":{"t":"str"},"opt":false},{"name":"days","d":{"t":"arr","of":{"t":"obj","n":"HostCalDay","p":[["iso",{"t":"str"},false],["head",{"t":"str"},false],["sub",{"t":"str"},false],["weekend",{"t":"bool"},false],["sacred",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["today",{"t":"bool"},false]]}},"opt":false}],
  inner$calendarMonth$d0$$step: [{"name":"first","d":{"t":"str"},"opt":false}],
  inner$calendarBars$last: [{"name":"dayIsos","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$calendarBars$L: [{"name":"ends","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"b","d":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$currentStay$cur$$after_loop: [{"name":"u","d":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false]]},"opt":false},{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"today","d":{"t":"str"},"opt":false}],
  inner$dashboardOf$live$$after_loop: [{"name":"units","d":{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["beds",{"t":"num"},false],["cap",{"t":"num"},false],["rate",{"t":"num"},false],["status",{"t":"lit","v":["free","dirty","blocked"]},false],["subRooms",{"t":"arr","of":{"t":"obj","n":"HostRoom","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["beds",{"t":"num"},false],["rate",{"t":"num"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"today","d":{"t":"str"},"opt":false}],
  inner$bookingCounts$out$$after_loop: [{"name":"bookings","d":{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[["id",{"t":"str"},false],["guestId",{"t":"str"},false],["unitId",{"t":"str"},false],["roomIds",{"t":"arr","of":{"t":"str"}},false],["checkIn",{"t":"str"},false],["checkOut",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false],["status",{"t":"lit","v":["pending","done","confirmed","in","cancelled"]},false],["charges",{"t":"arr","of":{"t":"obj","n":"HostCharge","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["stay","cleaning","tax","meal","shabbat","extra"]},false],["label",{"t":"str"},false],["amount",{"t":"num"},false],["mealId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["payments",{"t":"arr","of":{"t":"obj","n":"HostPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["shabbat",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["checkedInAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkedOutAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
};
