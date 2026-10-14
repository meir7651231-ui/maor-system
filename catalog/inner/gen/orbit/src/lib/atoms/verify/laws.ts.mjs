// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/verify/laws.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const EPS = 1e-9;
const tol = (...xs) => EPS * Math.max(1, ...xs.map((x) => Math.abs(x)));
const DAY_MS = 86_400_000;
const isoPlus = (iso, days) => new Date(Date.parse(iso + 'T12:00:00Z') + days * DAY_MS).toISOString().slice(0, 10);
function clusters(items, maxGap) {
    const on = items.map((x, k) => (x ? k : -1)).filter((k) => k >= 0);
    const out = [];
    for (const k of on) {
        const last = out[out.length - 1];
        if (last && k - last[1] - 1 <= maxGap)
            last[1] = k;
        else
            out.push([k, k]);
    }
    return out;
}
const MIN = 60_000;
function effWait(input, k) {
    const s = input.steps[k];
    const to = Array.isArray(s?.to) ? s.to.filter((x) => typeof x === 'string') : [];
    const w = Number.isFinite(s?.waitMin) && s.waitMin > 0 ? s.waitMin : 0;
    if (!to.length)
        return 0;
    if (input.urgent === true) {
        const u = Number.isFinite(input.urgentWaitMin) && input.urgentWaitMin >= 0 ? input.urgentWaitMin : 60;
        return Math.min(w, u);
    }
    return w;
}
export function inner$isMultiple$q(v, step) {
    const q = v / step;
    return q;
}
export function inner$check$n(i) {
    const n = Math.floor(i.parts);
    return n;
}
export function inner$check$unit(i, ps) {
    const unit = (i.to - i.from) / ps.length;
    return unit;
}
export function inner$check$t(i) {
    const t = tol(i.from, i.to) * 8;
    return t;
}
export function inner$check$last(ps, k) {
    const last = k === ps.length - 1;
    return last;
}
export function inner$check$nextFrom(i, ps) {
    const nextFrom = ps.length ? ps[ps.length - 1].to + i.gap : i.from;
    return nextFrom;
}
export function inner$check$n_L156(i) {
    const n = Math.floor(i.parts);
    return n;
}
export function inner$check$st(i) {
    const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
    return st;
}
export function inner$check$q(i) {
    const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
    const q = i.total / st;
    return q;
}
export function inner$check$q$$step(i, st) {
    const q = i.total / st;
    return q;
}
export function inner$check$units(i) {
    const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
    const q = i.total / st;
    const units = Math.abs(q - Math.round(q)) <= 1e-9 * Math.max(1, Math.abs(q)) ? Math.round(q) : Math.trunc(q);
    return units;
}
export function inner$check$units$$step(q) {
    const units = Math.abs(q - Math.round(q)) <= 1e-9 * Math.max(1, Math.abs(q)) ? Math.round(q) : Math.trunc(q);
    return units;
}
export function inner$check$rest(i) {
    const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
    const q = i.total / st;
    const units = Math.abs(q - Math.round(q)) <= 1e-9 * Math.max(1, Math.abs(q)) ? Math.round(q) : Math.trunc(q);
    const rest = i.total - units * st;
    return rest;
}
export function inner$check$rest$$step(i, st, units) {
    const rest = i.total - units * st;
    return rest;
}
export function inner$check$core(i, xs) {
    const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
    const q = i.total / st;
    const units = Math.abs(q - Math.round(q)) <= 1e-9 * Math.max(1, Math.abs(q)) ? Math.round(q) : Math.trunc(q);
    const rest = i.total - units * st;
    const core = [xs[0] - rest, ...xs.slice(1)];
    return core;
}
export function inner$check$core$$step(xs, rest) {
    const core = [xs[0] - rest, ...xs.slice(1)];
    return core;
}
export function inner$check$spread(i, xs) {
    const st = Number.isFinite(i.step) && i.step > 0 ? i.step : 1;
    const q = i.total / st;
    const units = Math.abs(q - Math.round(q)) <= 1e-9 * Math.max(1, Math.abs(q)) ? Math.round(q) : Math.trunc(q);
    const rest = i.total - units * st;
    const core = [xs[0] - rest, ...xs.slice(1)];
    const spread = Math.max(...core) - Math.min(...core);
    return spread;
}
export function inner$check$spread$$step(core) {
    const spread = Math.max(...core) - Math.min(...core);
    return spread;
}
export function inner$check$unit_L195(i) {
    const unit = (i.to - i.from) / i.parts;
    return unit;
}
export function inner$clusters$on(items) {
    const on = items.map((x, k) => (x ? k : -1)).filter((k) => k >= 0);
    return on;
}
export function inner$clusters$last(out) {
    const last = out[out.length - 1];
    return last;
}
export function inner$check$minLen(i) {
    const minLen = Math.max(1, i.minLength);
    return minLen;
}
export function inner$check$want(i) {
    const minLen = Math.max(1, i.minLength);
    const want = clusters(i.items, i.maxGap).filter(([a, b]) => b - a + 1 >= minLen);
    return want;
}
export function inner$check$want$$step(i, minLen) {
    const want = clusters(i.items, i.maxGap).filter(([a, b]) => b - a + 1 >= minLen);
    return want;
}
export function inner$check$future(i) {
    const future = i.times.filter((t) => typeof t === typeof i.now && t > i.now).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return future;
}
export function inner$check$want_L296(i) {
    const future = i.times.filter((t) => typeof t === typeof i.now && t > i.now).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const want = future.slice(0, Math.max(0, Math.floor(i.count)));
    return want;
}
export function inner$check$want_L296$$step(i, future) {
    const want = future.slice(0, Math.max(0, Math.floor(i.count)));
    return want;
}
export function inner$check$min(i) {
    const min = Math.max(1, i.minLength);
    return min;
}
export function inner$check$from(i, x) {
    const from = Math.max(x.from, i.fromIndex);
    return from;
}
export function inner$check$t_L350(i) {
    const t = 2e-9 * Math.max(1, Math.abs(i.value));
    return t;
}
export function inner$check$d(i, r) {
    const d = r - i.value;
    return d;
}
export function inner$check$day(moved) {
    const day = Math.floor(moved / 1440);
    return day;
}
export function inner$check$minute(moved) {
    const day = Math.floor(moved / 1440);
    const minute = moved - day * 1440;
    return minute;
}
export function inner$check$minute$$step(moved, day) {
    const minute = moved - day * 1440;
    return minute;
}
export function inner$check$wantMs(i) {
    const wantMs = Date.parse(i.iso + 'T00:00:00Z') + (i.minute + i.days * 1440 + i.minutes) * 60_000;
    return wantMs;
}
export function inner$check$want_L403(i) {
    const wantMs = Date.parse(i.iso + 'T00:00:00Z') + (i.minute + i.days * 1440 + i.minutes) * 60_000;
    const want = new Date(wantMs).toISOString();
    return want;
}
export function inner$check$want_L403$$step(wantMs) {
    const want = new Date(wantMs).toISOString();
    return want;
}
export function inner$check$gotIso(moved) {
    const day = Math.floor(moved / 1440);
    const gotIso = new Date(day * DAY_MS).toISOString().slice(0, 10);
    return gotIso;
}
export function inner$check$gotIso$$step(day) {
    const gotIso = new Date(day * DAY_MS).toISOString().slice(0, 10);
    return gotIso;
}
export function inner$check$tok(i) {
    const tok = i.name + (i.delta ? (i.delta > 0 ? '+' : '-') + Math.abs(i.delta) : '');
    return tok;
}
export function inner$check$want_L420(i, base) {
    const want = base === null ? null : base + i.delta;
    return want;
}
export function inner$effWait$to(s) {
    const to = Array.isArray(s?.to) ? s.to.filter((x) => typeof x === 'string') : [];
    return to;
}
export function inner$effWait$w(s) {
    const w = Number.isFinite(s?.waitMin) && s.waitMin > 0 ? s.waitMin : 0;
    return w;
}
export function inner$effWait$u(input) {
    const u = Number.isFinite(input.urgentWaitMin) && input.urgentWaitMin >= 0 ? input.urgentWaitMin : 60;
    return u;
}
export function inner$check$end(i, plan, k) {
    const end = plan[k].atMs + effWait(i.input, k) * MIN;
    return end;
}
export function inner$check$last_L483(plan, k) {
    const last = k === plan.length - 1;
    return last;
}
export function inner$check$own(i, plan, k) {
    const own = effWait(i.input, k) > 0 || k === plan.length - 1;
    return own;
}
export function inner$check$hasTo(i, k) {
    const hasTo = i.input.steps[k].to.length > 0;
    return hasTo;
}
export function inner$check$sorted(i) {
    const sorted = [...i.probes].sort((a, b) => a - b);
    return sorted;
}
export function inner$check$cnt(i) {
    const cnt = Array.from({ length: i.list.length }, () => 0);
    return cnt;
}
export function inner$check$spread_L548(cnt) {
    const spread = Math.max(...cnt) - Math.min(...cnt);
    return spread;
}
export function inner$check$items(i) {
    const items = Array.from({ length: i.items }, (_, k) => k);
    return items;
}
export function inner$check$people(i) {
    const people = i.list.map((_, k) => k);
    return people;
}
export function inner$check$cnt_L581(i) {
    const people = i.list.map((_, k) => k);
    const cnt = Array.from({ length: people.length }, () => 0);
    return cnt;
}
export function inner$check$cnt_L581$$step(people) {
    const cnt = Array.from({ length: people.length }, () => 0);
    return cnt;
}
export function inner$check$iso(i, k) {
    const iso = isoPlus(i.iso, k);
    return iso;
}
export function inner$check$want_L618(i) {
    const want = i.candidates.filter((c) => c.text.split(' ').includes(i.target)).map((c) => c.id);
    return want;
}
export function inner$clusters$out$$after_loop(items, maxGap) {
    const on = items.map((x, k) => (x ? k : -1)).filter((k) => k >= 0);
    const out = [];
    for (const k of on) {
        const last = out[out.length - 1];
        if (last && k - last[1] - 1 <= maxGap)
            last[1] = k;
        else
            out.push([k, k]);
    }
    return out;
}
export function inner$check$want$$after_loop(i, runs) {
    const min = Math.max(1, i.minLength);
    let want = null;
    for (const x of runs) {
        if (x.to < i.fromIndex)
            continue;
        const from = Math.max(x.from, i.fromIndex);
        if (x.to - from + 1 >= min) {
            want = { from, to: x.to, length: x.to - from + 1 };
            break;
        }
    }
    return want;
}

export const SIGS = {
  inner$isMultiple$q: [{"name":"v","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$check$n: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$unit: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$check$t: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$last: [{"name":"ps","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$check$nextFrom: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$check$n_L156: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$st: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$q: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$q$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false}],
  inner$check$units: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$units$$step: [{"name":"q","d":{"t":"num"},"opt":false}],
  inner$check$rest: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$rest$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false},{"name":"units","d":{"t":"num"},"opt":false}],
  inner$check$core: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"xs","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$check$core$$step: [{"name":"xs","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"rest","d":{"t":"num"},"opt":false}],
  inner$check$spread: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"xs","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$check$spread$$step: [{"name":"core","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$check$unit_L195: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$clusters$on: [{"name":"items","d":{"t":"arr","of":{"t":"bool"}},"opt":false}],
  inner$clusters$last: [{"name":"out","d":{"t":"arr","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}},"opt":false}],
  inner$check$minLen: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"minLen","d":{"t":"num"},"opt":false}],
  inner$check$future: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want_L296: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want_L296$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"future","d":{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$check$min: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$from: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$check$t_L350: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$d: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$check$day: [{"name":"moved","d":{"t":"num"},"opt":false}],
  inner$check$minute: [{"name":"moved","d":{"t":"num"},"opt":false}],
  inner$check$minute$$step: [{"name":"moved","d":{"t":"num"},"opt":false},{"name":"day","d":{"t":"num"},"opt":false}],
  inner$check$wantMs: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want_L403: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want_L403$$step: [{"name":"wantMs","d":{"t":"num"},"opt":false}],
  inner$check$gotIso: [{"name":"moved","d":{"t":"num"},"opt":false}],
  inner$check$gotIso$$step: [{"name":"day","d":{"t":"num"},"opt":false}],
  inner$check$tok: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$want_L420: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$effWait$to: [{"name":"s","d":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]},"opt":false}],
  inner$effWait$w: [{"name":"s","d":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]},"opt":false}],
  inner$effWait$u: [{"name":"input","d":{"t":"obj","n":"EscInput","p":[["createdMs",{"t":"num"},false],["steps",{"t":"arr","of":{"t":"obj","n":"EscStep","p":[["to",{"t":"arr","of":{"t":"str"}},false],["waitMin",{"t":"num"},false]]}},false],["answeredMs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"num"}]},true],["urgent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["urgentWaitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nowMs",{"t":"num"},false]]},"opt":false}],
  inner$check$end: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"plan","d":{"t":"arr","of":{"t":"obj","n":"EscPlanRow","p":[["stepIndex",{"t":"num"},false],["to",{"t":"arr","of":{"t":"str"}},false],["atMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false]]}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$check$last_L483: [{"name":"plan","d":{"t":"arr","of":{"t":"obj","n":"EscPlanRow","p":[["stepIndex",{"t":"num"},false],["to",{"t":"arr","of":{"t":"str"}},false],["atMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false]]}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$check$own: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"plan","d":{"t":"arr","of":{"t":"obj","n":"EscPlanRow","p":[["stepIndex",{"t":"num"},false],["to",{"t":"arr","of":{"t":"str"}},false],["atMs",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false]]}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$check$hasTo: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$check$sorted: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$cnt: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$spread_L548: [{"name":"cnt","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$check$items: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$people: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$cnt_L581: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$check$cnt_L581$$step: [{"name":"people","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$check$iso: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$check$want_L618: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$clusters$out$$after_loop: [{"name":"items","d":{"t":"arr","of":{"t":"bool"}},"opt":false},{"name":"maxGap","d":{"t":"num"},"opt":false}],
  inner$check$want$$after_loop: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"runs","d":{"t":"arr","of":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
};
