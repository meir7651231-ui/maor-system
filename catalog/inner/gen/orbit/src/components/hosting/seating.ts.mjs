// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/seating.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SEAT_FAM_COLORS = ['#2dd4bf', '#9d6bff', '#f2b84e', '#3a9bff', '#ff6f9f', '#31e39a', '#ff8f4d', '#5ad1ff', '#c084fc', '#ffd24d', '#7dd35b', '#ff6f6f'];
function cloneTables(sp) {
    return sp.tables.map((t) => ({ ...t, seated: t.seated.slice() }));
}
function seatedSet(tables) {
    const s = new Set();
    for (const t of tables)
        for (const id of t.seated)
            s.add(id);
    return s;
}
const free = (t) => Math.max(0, (t.cap || 0) - t.seated.length);
function seatPool(sp) {
    const s = seatedSet(sp.tables);
    return sp.people.filter((p) => !s.has(p.id));
}
function seatOneFamily(sp, gid) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
    if (!waiting.length)
        return { plan: sp, placed: 0 };
    const whole = tables.filter((t) => free(t) >= waiting.length).sort((a, b) => free(a) - free(b))[0];
    const order = (whole ? [whole] : tables.slice().sort((a, b) => free(b) - free(a))).concat(tables);
    let placed = 0;
    for (const p of waiting) {
        for (const t of order) {
            if (free(t) > 0) {
                t.seated.push(p.id);
                placed++;
                break;
            }
        }
    }
    return { plan: { ...sp, tables }, placed };
}
export function inner$seatPool$s(sp) {
    const s = seatedSet(sp.tables);
    return s;
}
export function inner$seatFamilies$s(sp) {
    const s = seatedSet(sp.tables);
    return s;
}
export function inner$seatFamilies$map$ppl(sp, g) {
    const ppl = sp.people.filter((p) => (p.guestId || '__solo') === g);
    return ppl;
}
export function inner$seatOneFamily$tables(sp) {
    const tables = cloneTables(sp);
    return tables;
}
export function inner$seatOneFamily$s(sp) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    return s;
}
export function inner$seatOneFamily$s$$step(tables) {
    const s = seatedSet(tables);
    return s;
}
export function inner$seatOneFamily$waiting(sp, gid) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
    return waiting;
}
export function inner$seatOneFamily$waiting$$step(sp, gid, s) {
    const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
    return waiting;
}
export function inner$seatOneFamily$whole(sp, gid) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
    const whole = tables.filter((t) => free(t) >= waiting.length).sort((a, b) => free(a) - free(b))[0];
    return whole;
}
export function inner$seatOneFamily$whole$$step(tables, waiting) {
    const whole = tables.filter((t) => free(t) >= waiting.length).sort((a, b) => free(a) - free(b))[0];
    return whole;
}
export function inner$seatOneFamily$order(sp, gid) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
    const whole = tables.filter((t) => free(t) >= waiting.length).sort((a, b) => free(a) - free(b))[0];
    const order = (whole ? [whole] : tables.slice().sort((a, b) => free(b) - free(a))).concat(tables);
    return order;
}
export function inner$seatOneFamily$order$$step(tables, whole) {
    const order = (whole ? [whole] : tables.slice().sort((a, b) => free(b) - free(a))).concat(tables);
    return order;
}
export function inner$seatAutoFill$tables(sp) {
    const tables = cloneTables(sp);
    return tables;
}
export function inner$seatAutoFill$s(sp) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    return s;
}
export function inner$seatAutoFill$s$$step(tables) {
    const s = seatedSet(tables);
    return s;
}
export function inner$seatAutoFill$t(sp, ti) {
    const tables = cloneTables(sp);
    const t = tables[ti % tables.length];
    return t;
}
export function inner$seatAutoFill$t$$step(tables, ti) {
    const t = tables[ti % tables.length];
    return t;
}
export function inner$seatByFamilies$r(plan, f) {
    const r = seatOneFamily(plan, f.gid);
    return r;
}
export function inner$seatBalance$tables(sp) {
    const tables = cloneTables(sp);
    return tables;
}
export function inner$seatBalance$t(sp) {
    const tables = cloneTables(sp);
    const t = tables.filter((x) => x.seated.length < x.cap).sort((a, b) => a.seated.length - b.seated.length)[0];
    return t;
}
export function inner$seatBalance$t$$step(tables) {
    const t = tables.filter((x) => x.seated.length < x.cap).sort((a, b) => a.seated.length - b.seated.length)[0];
    return t;
}
export function inner$seatShuffle$tables(sp) {
    const tables = sp.tables.map((t) => ({ ...t, seated: [] }));
    return tables;
}
export function inner$seatShuffle$arr(sp) {
    const arr = sp.people.slice();
    return arr;
}
export function inner$seatShuffle$i(arr) {
    let i = arr.length - 1;
    return i;
}
export function inner$seatShuffle$t(sp, ti) {
    const tables = sp.tables.map((t) => ({ ...t, seated: [] }));
    const t = tables[ti % tables.length];
    return t;
}
export function inner$seatShuffle$t$$step(tables, ti) {
    const t = tables[ti % tables.length];
    return t;
}
export function inner$seatPlace$tb(sp, tableId) {
    const tb = sp.tables.find((t) => t.id === tableId);
    return tb;
}
export function inner$seatDupTable$t(sp, id) {
    const t = sp.tables.find((x) => x.id === id);
    return t;
}
export function inner$seatSetCap$patchTable$n(raw, t) {
    const n = Math.max(1, parseInt(String(raw), 10) || t.cap);
    return n;
}
export function inner$seatStats$totSeats(sp) {
    const totSeats = sp.tables.reduce((s, t) => s + Math.max(0, t.cap || 0), 0);
    return totSeats;
}
export function inner$seatStats$waiting(sp) {
    const waiting = seatPool(sp).length;
    return waiting;
}
export function inner$seatStats$seatedN(sp) {
    const waiting = seatPool(sp).length;
    const seatedN = sp.people.length - waiting;
    return seatedN;
}
export function inner$seatStats$seatedN$$step(sp, waiting) {
    const seatedN = sp.people.length - waiting;
    return seatedN;
}
export function inner$seatText$parts(title) {
    const parts = ['🪑 תוכנית הושבה · ' + (title || 'ארוחה')];
    return parts;
}
export function inner$seatText$pool(sp) {
    const pool = seatPool(sp);
    return pool;
}
export function inner$seatPositions$top(cap) {
    const top = Math.ceil(cap / 2);
    return top;
}
export function inner$seatPositions$bot(cap) {
    const top = Math.ceil(cap / 2);
    const bot = cap - top;
    return bot;
}
export function inner$seatPositions$bot$$step(cap, top) {
    const bot = cap - top;
    return bot;
}
export function inner$seatPositions$line$tt(n, i) {
    const tt = n <= 1 ? 0.5 : i / (n - 1);
    return tt;
}
export function inner$seatPositions$cx(W) {
    const cx = W / 2;
    return cx;
}
export function inner$seatPositions$cy(H) {
    const cy = H / 2;
    return cy;
}
export function inner$seatPositions$r(W, H) {
    const pad = 20;
    const r = Math.min(W, H) / 2 - pad;
    return r;
}
export function inner$seatPositions$a(cap, i) {
    const a = ((-90 + (i * 360) / cap) * Math.PI) / 180;
    return a;
}
export function inner$seatRing$cap(t) {
    const cap = Math.max(1, t.cap || 8);
    return cap;
}
export function inner$seatRing$per(t) {
    const cap = Math.max(1, t.cap || 8);
    const per = Math.ceil(cap / 2);
    return per;
}
export function inner$seatRing$per$$step(cap) {
    const per = Math.ceil(cap / 2);
    return per;
}
export function inner$seatRing$side(t) {
    const cap = Math.max(1, t.cap || 8);
    const side = Math.min(300, 150 + Math.ceil(cap / 4) * 32);
    return side;
}
export function inner$seatRing$side$$step(cap) {
    const side = Math.min(300, 150 + Math.ceil(cap / 4) * 32);
    return side;
}
export function inner$seatRing$inner(t) {
    const cap = Math.max(1, t.cap || 8);
    const side = Math.min(300, 150 + Math.ceil(cap / 4) * 32);
    const inner = Math.max(54, side - 100);
    return inner;
}
export function inner$seatRing$inner$$step(side) {
    const inner = Math.max(54, side - 100);
    return inner;
}
export function inner$seatRing$r(t) {
    const cap = Math.max(1, t.cap || 8);
    const r = Math.min(118, 40 + cap * 4);
    return r;
}
export function inner$seatRing$r$$step(cap) {
    const r = Math.min(118, 40 + cap * 4);
    return r;
}
export function inner$seatRing$inner_L334(t) {
    const cap = Math.max(1, t.cap || 8);
    const r = Math.min(118, 40 + cap * 4);
    const inner = Math.max(40, 2 * (r - 30));
    return inner;
}
export function inner$seatRing$inner_L334$$step(r) {
    const inner = Math.max(40, 2 * (r - 30));
    return inner;
}
export function inner$seatedSet$s$$after_loop(tables) {
    const s = new Set();
    for (const t of tables)
        for (const id of t.seated)
            s.add(id);
    return s;
}
export function inner$seatFamColors$m$$after_loop(sp) {
    const m = {};
    let i = 0;
    for (const p of sp.people) {
        const g = p.guestId || '';
        if (g && !(g in m))
            m[g] = SEAT_FAM_COLORS[i++ % SEAT_FAM_COLORS.length];
    }
    return m;
}
export function inner$seatFamColors$i$$after_loop(sp) {
    const m = {};
    let i = 0;
    for (const p of sp.people) {
        const g = p.guestId || '';
        if (g && !(g in m))
            m[g] = SEAT_FAM_COLORS[i++ % SEAT_FAM_COLORS.length];
    }
    return i;
}
export function inner$seatFamilies$order$$after_loop(sp) {
    const order = [];
    for (const p of sp.people) {
        const g = p.guestId || '__solo';
        if (!order.includes(g))
            order.push(g);
    }
    return order;
}
export function inner$seatOneFamily$placed$$after_loop(sp, gid) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
    const whole = tables.filter((t) => free(t) >= waiting.length).sort((a, b) => free(a) - free(b))[0];
    const order = (whole ? [whole] : tables.slice().sort((a, b) => free(b) - free(a))).concat(tables);
    let placed = 0;
    for (const p of waiting) {
        for (const t of order) {
            if (free(t) > 0) {
                t.seated.push(p.id);
                placed++;
                break;
            }
        }
    }
    return placed;
}
export function inner$seatAutoFill$ti$$after_loop(sp) {
    const tables = cloneTables(sp);
    const s = seatedSet(tables);
    let ti = 0;
    for (const p of sp.people) {
        if (s.has(p.id))
            continue;
        for (let tries = 0; tries < tables.length; tries++) {
            const t = tables[ti % tables.length];
            ti++;
            if (t.seated.length < t.cap) {
                t.seated.push(p.id);
                break;
            }
        }
    }
    return ti;
}
export function inner$seatShuffle$ti$$after_loop(sp, arr) {
    const tables = sp.tables.map((t) => ({ ...t, seated: [] }));
    let ti = 0;
    for (const p of arr) {
        for (let tries = 0; tries < tables.length; tries++) {
            const t = tables[ti % tables.length];
            ti++;
            if (t.seated.length < t.cap) {
                t.seated.push(p.id);
                break;
            }
        }
    }
    return ti;
}
export function inner$seatPositions$c$$after_loop(cap) {
    const c = [0, 0, 0, 0];
    for (let i = 0; i < cap; i++)
        c[i % 4]++;
    return c;
}

export const SIGS = {
  inner$seatPool$s: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatFamilies$s: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatFamilies$map$ppl: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"g","d":{"t":"str"},"opt":false}],
  inner$seatOneFamily$tables: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatOneFamily$s: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatOneFamily$s$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false}],
  inner$seatOneFamily$waiting: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"gid","d":{"t":"str"},"opt":false}],
  inner$seatOneFamily$waiting$$step: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"gid","d":{"t":"str"},"opt":false},{"name":"s","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$seatOneFamily$whole: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"gid","d":{"t":"str"},"opt":false}],
  inner$seatOneFamily$whole$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false},{"name":"waiting","d":{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$seatOneFamily$order: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"gid","d":{"t":"str"},"opt":false}],
  inner$seatOneFamily$order$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false},{"name":"whole","d":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]},"opt":false}],
  inner$seatAutoFill$tables: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatAutoFill$s: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatAutoFill$s$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false}],
  inner$seatAutoFill$t: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"ti","d":{"t":"num"},"opt":false}],
  inner$seatAutoFill$t$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false},{"name":"ti","d":{"t":"num"},"opt":false}],
  inner$seatByFamilies$r: [{"name":"plan","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"f","d":{"t":"obj","n":"SeatFamily","p":[["gid",{"t":"str"},false],["name",{"t":"str"},false],["color",{"t":"str"},false],["total",{"t":"num"},false],["waiting",{"t":"num"},false]]},"opt":false}],
  inner$seatBalance$tables: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatBalance$t: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatBalance$t$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false}],
  inner$seatShuffle$tables: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatShuffle$arr: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatShuffle$i: [{"name":"arr","d":{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$seatShuffle$t: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"ti","d":{"t":"num"},"opt":false}],
  inner$seatShuffle$t$$step: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","p":[["seated",{"t":"arr","of":{"t":"str"}},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false},{"name":"ti","d":{"t":"num"},"opt":false}],
  inner$seatPlace$tb: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"tableId","d":{"t":"str"},"opt":false}],
  inner$seatDupTable$t: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$seatSetCap$patchTable$n: [{"name":"raw","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false},{"name":"t","d":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]},"opt":false}],
  inner$seatStats$totSeats: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatStats$waiting: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatStats$seatedN: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatStats$seatedN$$step: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"waiting","d":{"t":"num"},"opt":false}],
  inner$seatText$parts: [{"name":"title","d":{"t":"str"},"opt":false}],
  inner$seatText$pool: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatPositions$top: [{"name":"cap","d":{"t":"num"},"opt":false}],
  inner$seatPositions$bot: [{"name":"cap","d":{"t":"num"},"opt":false}],
  inner$seatPositions$bot$$step: [{"name":"cap","d":{"t":"num"},"opt":false},{"name":"top","d":{"t":"num"},"opt":false}],
  inner$seatPositions$line$tt: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$seatPositions$cx: [{"name":"W","d":{"t":"num"},"opt":false}],
  inner$seatPositions$cy: [{"name":"H","d":{"t":"num"},"opt":false}],
  inner$seatPositions$r: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"H","d":{"t":"num"},"opt":false}],
  inner$seatPositions$a: [{"name":"cap","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$seatRing$cap: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false]]},"opt":false}],
  inner$seatRing$per: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false]]},"opt":false}],
  inner$seatRing$per$$step: [{"name":"cap","d":{"t":"num"},"opt":false}],
  inner$seatRing$side: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false]]},"opt":false}],
  inner$seatRing$side$$step: [{"name":"cap","d":{"t":"num"},"opt":false}],
  inner$seatRing$inner: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false]]},"opt":false}],
  inner$seatRing$inner$$step: [{"name":"side","d":{"t":"num"},"opt":false}],
  inner$seatRing$r: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false]]},"opt":false}],
  inner$seatRing$r$$step: [{"name":"cap","d":{"t":"num"},"opt":false}],
  inner$seatRing$inner_L334: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false]]},"opt":false}],
  inner$seatRing$inner_L334$$step: [{"name":"r","d":{"t":"num"},"opt":false}],
  inner$seatedSet$s$$after_loop: [{"name":"tables","d":{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},"opt":false}],
  inner$seatFamColors$m$$after_loop: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatFamColors$i$$after_loop: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatFamilies$order$$after_loop: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatOneFamily$placed$$after_loop: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"gid","d":{"t":"str"},"opt":false}],
  inner$seatAutoFill$ti$$after_loop: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$seatShuffle$ti$$after_loop: [{"name":"sp","d":{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},"opt":false},{"name":"arr","d":{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$seatPositions$c$$after_loop: [{"name":"cap","d":{"t":"num"},"opt":false}],
};
