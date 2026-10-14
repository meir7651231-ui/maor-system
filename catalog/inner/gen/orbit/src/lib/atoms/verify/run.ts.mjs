// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/verify/run.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function smallerNumbers(x) {
    if (!Number.isFinite(x) || x === 0)
        return [];
    const c = [0, Math.trunc(x), Math.trunc(x / 2), x - Math.sign(x), Math.round(x * 100) / 100, Math.round(x * 10) / 10, Math.round(x)];
    return [...new Set(c)].filter((v) => Number.isFinite(v) && v !== x && Math.abs(v) <= Math.abs(x));
}
function shrinkValue(v, depth = 0) {
    if (typeof v === 'number')
        return smallerNumbers(v);
    if (Array.isArray(v)) {
        const out = [];
        if (v.length)
            out.push([]);
        if (v.length > 1)
            out.push(v.slice(0, Math.floor(v.length / 2)), v.slice(Math.floor(v.length / 2)));
        for (let i = 0; i < v.length && i < 40; i++)
            out.push([...v.slice(0, i), ...v.slice(i + 1)]);
        if (depth < 3)
            for (let i = 0; i < v.length && i < 40; i++)
                for (const s of shrinkValue(v[i], depth + 1))
                    out.push([...v.slice(0, i), s, ...v.slice(i + 1)]);
        return out;
    }
    if (v && typeof v === 'object' && depth < 3) {
        const out = [];
        for (const k of Object.keys(v))
            for (const s of shrinkValue(v[k], depth + 1))
                out.push({ ...v, [k]: s });
        return out;
    }
    return [];
}
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const pnum = (p, k, d) => (typeof p[k] === 'number' ? p[k] : d);
const pstr = (p, k, d) => (typeof p[k] === 'string' ? p[k] : d);
const hmOf = (s) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
const money = (s) => Number(s.replace(/[₪,]/g, ''));
const DAY = 86_400_000;
function dayOfDm(dmText, todayIso) {
    const [d, m] = dmText.split('/').map(Number);
    const t0 = Date.parse(todayIso + 'T12:00:00Z');
    const y = Number(todayIso.slice(0, 4));
    let best = NaN;
    for (const yy of [y - 1, y, y + 1]) {
        const t = Date.UTC(yy, m - 1, d, 12);
        if (!Number.isFinite(best) || Math.abs(t - t0) < Math.abs(best - t0))
            best = t;
    }
    return Math.floor(best / DAY);
}
const todayDay = (env) => Math.floor(Date.parse(env.today + 'T12:00:00Z') / DAY);
const realLines = (lines) => lines.filter((l) => !/^ועוד \d+$/.test(l));
function parseDuration(t) {
    if (t === 'רבע שעה')
        return 15;
    if (t === 'חצי שעה')
        return 30;
    let total = 0;
    let any = false;
    for (const part of t.replace(/ ו-/g, ', ').split(', ')) {
        let m;
        if (part === 'שעה')
            total += 60;
        else if (part === 'שעתיים')
            total += 120;
        else if ((m = /^(\d+) שעות$/.exec(part)))
            total += 60 * +m[1];
        else if ((m = /^(\d+) דקות$/.exec(part)))
            total += +m[1];
        else if ((m = /^(\d+) שניות$/.exec(part)))
            total += +m[1] / 60;
        else
            return null;
        any = true;
    }
    return any ? total : null;
}
function installments(line) {
    const m = /(₪[\d,]+(?:\.\d+)?) = (.+)$/.exec(line);
    if (!m)
        return null;
    const pieces = [];
    for (const g of m[2].split(' + ')) {
        const x = /^(?:(\d+) × )?(₪[\d,]+(?:\.\d+)?)$/.exec(g.trim());
        if (!x)
            return null;
        for (let k = 0; k < (x[1] ? +x[1] : 1); k++)
            pieces.push(money(x[2]));
    }
    return { total: money(m[1]), pieces };
}
function nightsMatch(pv, env, re) {
    for (const l of realLines(pv.lines)) {
        const m = re.exec(l);
        if (m && dayOfDm(m[2], env.today) - dayOfDm(m[1], env.today) !== +m[3])
            return m[3] + ' לילות לא מתאים לתאריכים: ' + l;
    }
    return null;
}
export function inner$smallerNumbers$c(x) {
    const c = [0, Math.trunc(x), Math.trunc(x / 2), x - Math.sign(x), Math.round(x * 100) / 100, Math.round(x * 10) / 10, Math.round(x)];
    return c;
}
export function inner$secretsOf$first(m) {
    const first = str(m?.first) || str(m?.name);
    return first;
}
export function inner$hasWord$re(wordRe, w) {
    let re = wordRe.get(w);
    return re;
}
export function inner$dayOfDm$d(dmText) {
    const [d, m] = dmText.split('/').map(Number);
    return d;
}
export function inner$dayOfDm$m(dmText) {
    const [d, m] = dmText.split('/').map(Number);
    return m;
}
export function inner$dayOfDm$t0(todayIso) {
    const t0 = Date.parse(todayIso + 'T12:00:00Z');
    return t0;
}
export function inner$dayOfDm$y(todayIso) {
    const y = Number(todayIso.slice(0, 4));
    return y;
}
export function inner$dayOfDm$t(dmText, yy) {
    const [d, m] = dmText.split('/').map(Number);
    const t = Date.UTC(yy, m - 1, d, 12);
    return t;
}
export function inner$dayOfDm$t$$step(d, m, yy) {
    const t = Date.UTC(yy, m - 1, d, 12);
    return t;
}
export function inner$totalLines$m(lines) {
    const m = /^ועוד (\d+)$/.exec(lines[lines.length - 1] ?? '');
    return m;
}
export function inner$installments$m(line) {
    const m = /(₪[\d,]+(?:\.\d+)?) = (.+)$/.exec(line);
    return m;
}
export function inner$installments$x(g) {
    const x = /^(?:(\d+) × )?(₪[\d,]+(?:\.\d+)?)$/.exec(g.trim());
    return x;
}
export function inner$checkInstallments$it(line) {
    const it = installments(line);
    return it;
}
export function inner$checkInstallments$s(line) {
    const it = installments(line);
    const s = it.pieces.reduce((a, b) => a + b, 0);
    return s;
}
export function inner$checkInstallments$s$$step(it) {
    const s = it.pieces.reduce((a, b) => a + b, 0);
    return s;
}
export function inner$checkInstallments$size(p) {
    const size = pnum(p, 'size', 30);
    return size;
}
export function inner$checkInstallments$parts(p) {
    const parts = Math.floor(pnum(p, 'parts', 12));
    return parts;
}
export function inner$checkInstallments$frac(line) {
    const it = installments(line);
    const frac = it.total - Math.trunc(it.total);
    return frac;
}
export function inner$checkInstallments$frac$$step(it) {
    const frac = it.total - Math.trunc(it.total);
    return frac;
}
export function inner$checkInstallments$core(line) {
    const it = installments(line);
    const frac = it.total - Math.trunc(it.total);
    const core = [it.pieces[0] - frac, ...it.pieces.slice(1)];
    return core;
}
export function inner$checkInstallments$core$$step(it, frac) {
    const core = [it.pieces[0] - frac, ...it.pieces.slice(1)];
    return core;
}
export function inner$roundOk$t() {
    const t = 1e-6 + 1 / 120;
    return t;
}
export function inner$bookings_turnover_divide$m(pv) {
    const m = /^חלון הניקיון (\d\d:\d\d)–(\d\d:\d\d) · (\d+) תורים$/.exec(pv.title);
    return m;
}
export function inner$bookings_turnover_divide$pieces(pv) {
    const pieces = realLines(pv.lines).map((l) => /^(\d\d:\d\d)–(\d\d:\d\d)/.exec(l)).map((x) => ({ from: hmOf(x[1]), to: hmOf(x[2]) }));
    return pieces;
}
export function inner$bookings_turnover_divide$bySize(p) {
    const bySize = pstr(p, 'by', 'parts') === 'size';
    return bySize;
}
export function inner$zmanim_day_divide$m(pv) {
    const m = /^(?:שעה זמנית היום = (.+?)|(\d+) חלקים של (.+?)) · מהנץ (\d\d:\d\d) עד השקיעה (\d\d:\d\d) · /.exec(pv.title);
    return m;
}
export function inner$zmanim_day_divide$n(pv) {
    const m = /^(?:שעה זמנית היום = (.+?)|(\d+) חלקים של (.+?)) · מהנץ (\d\d:\d\d) עד השקיעה (\d\d:\d\d) · /.exec(pv.title);
    const n = m[1] ? 12 : +m[2];
    return n;
}
export function inner$zmanim_day_divide$n$$step(m) {
    const n = m[1] ? 12 : +m[2];
    return n;
}
export function inner$zmanim_day_divide$unit(pv) {
    const m = /^(?:שעה זמנית היום = (.+?)|(\d+) חלקים של (.+?)) · מהנץ (\d\d:\d\d) עד השקיעה (\d\d:\d\d) · /.exec(pv.title);
    const unit = parseDuration(m[1] ?? m[3]);
    return unit;
}
export function inner$zmanim_day_divide$unit$$step(m) {
    const unit = parseDuration(m[1] ?? m[3]);
    return unit;
}
export function inner$zmanim_day_divide$span(pv) {
    const m = /^(?:שעה זמנית היום = (.+?)|(\d+) חלקים של (.+?)) · מהנץ (\d\d:\d\d) עד השקיעה (\d\d:\d\d) · /.exec(pv.title);
    const span = hmOf(m[5]) - hmOf(m[4]);
    return span;
}
export function inner$zmanim_day_divide$span$$step(m) {
    const span = hmOf(m[5]) - hmOf(m[4]);
    return span;
}
export function inner$zmanim_day_divide$pieces(pv) {
    const pieces = realLines(pv.lines).map((l) => /· (\d\d:\d\d)–(\d\d:\d\d)$/.exec(l)).map((x) => ({ from: hmOf(x[1]), to: hmOf(x[2]) }));
    return pieces;
}
export function inner$zmanim_shabbat_divide$m(pv) {
    const m = /מהדלקת הנרות (\d\d:\d\d) עד צאת השבת (\d\d:\d\d) · (\d+) משמרות של (.+)$/.exec(pv.title);
    return m;
}
export function inner$zmanim_shabbat_divide$unit(pv) {
    const m = /מהדלקת הנרות (\d\d:\d\d) עד צאת השבת (\d\d:\d\d) · (\d+) משמרות של (.+)$/.exec(pv.title);
    const unit = parseDuration(m[4]);
    return unit;
}
export function inner$zmanim_shabbat_divide$unit$$step(m) {
    const unit = parseDuration(m[4]);
    return unit;
}
export function inner$zmanim_shabbat_divide$span(pv) {
    const m = /מהדלקת הנרות (\d\d:\d\d) עד צאת השבת (\d\d:\d\d) · (\d+) משמרות של (.+)$/.exec(pv.title);
    const span = 1440 + hmOf(m[2]) - hmOf(m[1]);
    return span;
}
export function inner$zmanim_shabbat_divide$span$$step(m) {
    const span = 1440 + hmOf(m[2]) - hmOf(m[1]);
    return span;
}
export function inner$whatNeed_hours_divide$m(l) {
    const m = /(\d\d:\d\d)–(\d\d:\d\d|.+?) ← (\d+) תורים של (.+)$/.exec(l);
    return m;
}
export function inner$whatNeed_hours_divide$unit(l) {
    const m = /(\d\d:\d\d)–(\d\d:\d\d|.+?) ← (\d+) תורים של (.+)$/.exec(l);
    const unit = parseDuration(m[4]);
    return unit;
}
export function inner$whatNeed_hours_divide$unit$$step(m) {
    const unit = parseDuration(m[4]);
    return unit;
}
export function inner$whatNeed_hours_divide$span(l) {
    const m = /(\d\d:\d\d)–(\d\d:\d\d|.+?) ← (\d+) תורים של (.+)$/.exec(l);
    let span = hmOf(m[2]) - hmOf(m[1]);
    return span;
}
export function inner$whatNeed_hours_divide$span$$step(m) {
    let span = hmOf(m[2]) - hmOf(m[1]);
    return span;
}
export function inner$whatNeed_hours_divide$size(p) {
    const size = pnum(p, 'size', 30);
    return size;
}
export function inner$whatNeed_hours_divide$gap(p) {
    const gap = pnum(p, 'gap', 0);
    return gap;
}
export function inner$whatNeed_hours_divide$first(p, span) {
    const size = pnum(p, 'size', 30);
    const first = pstr(p, 'remainder', 'drop') === 'shorten' && span < size ? span : size;
    return first;
}
export function inner$whatNeed_hours_divide$first$$step(p, span, size) {
    const first = pstr(p, 'remainder', 'drop') === 'shorten' && span < size ? span : size;
    return first;
}
export function inner$whatNeed_hours_divide$full(p, span) {
    const size = pnum(p, 'size', 30);
    const gap = pnum(p, 'gap', 0);
    const full = Math.floor((span + gap) / (size + gap));
    return full;
}
export function inner$whatNeed_hours_divide$full$$step(span, size, gap) {
    const full = Math.floor((span + gap) / (size + gap));
    return full;
}
export function inner$whatNeed_hours_divide$want(p, span) {
    const size = pnum(p, 'size', 30);
    const gap = pnum(p, 'gap', 0);
    const full = Math.floor((span + gap) / (size + gap));
    const want = pstr(p, 'remainder', 'drop') === 'shorten' && full * (size + gap) < span ? full + 1 : full;
    return want;
}
export function inner$whatNeed_hours_divide$want$$step(p, span, size, gap, full) {
    const want = pstr(p, 'remainder', 'drop') === 'shorten' && full * (size + gap) < span ? full + 1 : full;
    return want;
}
export function inner$zmanim_times_offset$d(p) {
    const d = pnum(p, 'minutes', -10);
    return d;
}
export function inner$zmanim_times_offset$m(l) {
    const m = /(\d\d:\d\d) ← (\d\d:\d\d)( \(יום קודם\)| \(למחרת\))?$/.exec(l);
    return m;
}
export function inner$zmanim_times_offset$raw(p, l) {
    const d = pnum(p, 'minutes', -10);
    const m = /(\d\d:\d\d) ← (\d\d:\d\d)( \(יום קודם\)| \(למחרת\))?$/.exec(l);
    const raw = hmOf(m[1]) + d;
    return raw;
}
export function inner$zmanim_times_offset$raw$$step(d, m) {
    const raw = hmOf(m[1]) + d;
    return raw;
}
export function inner$zmanim_times_offset$note(p, l) {
    const d = pnum(p, 'minutes', -10);
    const m = /(\d\d:\d\d) ← (\d\d:\d\d)( \(יום קודם\)| \(למחרת\))?$/.exec(l);
    const raw = hmOf(m[1]) + d;
    const note = raw < 0 ? ' (יום קודם)' : raw >= 1440 ? ' (למחרת)' : undefined;
    return note;
}
export function inner$zmanim_times_offset$note$$step(raw) {
    const note = raw < 0 ? ' (יום קודם)' : raw >= 1440 ? ' (למחרת)' : undefined;
    return note;
}
export function inner$whatNeed_openings_offset$d(p) {
    const d = pnum(p, 'minutes', -10);
    return d;
}
export function inner$whatNeed_openings_offset$m(l) {
    const m = /ב-(\d\d:\d\d|.+?) ← תזכורת ב-(\d\d:\d\d)$/.exec(l);
    return m;
}
export function inner$bookings_arrivals_offset$d(p) {
    const d = pnum(p, 'minutes', -10);
    return d;
}
export function inner$bookings_arrivals_offset$m(l) {
    const m = /הגעה (\d+\/\d+) (\d\d:\d\d) ⇒ תזכורת (\d+\/\d+) (\d\d:\d\d)$/.exec(l);
    return m;
}
export function inner$bookings_arrivals_offset$a(env, l) {
    const m = /הגעה (\d+\/\d+) (\d\d:\d\d) ⇒ תזכורת (\d+\/\d+) (\d\d:\d\d)$/.exec(l);
    const a = dayOfDm(m[1], env.today) * 1440 + hmOf(m[2]);
    return a;
}
export function inner$bookings_arrivals_offset$a$$step(env, m) {
    const a = dayOfDm(m[1], env.today) * 1440 + hmOf(m[2]);
    return a;
}
export function inner$bookings_arrivals_offset$b(env, l) {
    const m = /הגעה (\d+\/\d+) (\d\d:\d\d) ⇒ תזכורת (\d+\/\d+) (\d\d:\d\d)$/.exec(l);
    const b = dayOfDm(m[3], env.today) * 1440 + hmOf(m[4]);
    return b;
}
export function inner$bookings_arrivals_offset$b$$step(env, m) {
    const b = dayOfDm(m[3], env.today) * 1440 + hmOf(m[4]);
    return b;
}
export function inner$bookings_arrivals_round$step(p) {
    const step = pnum(p, 'step', 1);
    return step;
}
export function inner$bookings_arrivals_round$dir(p) {
    const dir = pstr(p, 'dir', 'down');
    return dir;
}
export function inner$bookings_arrivals_round$m(l) {
    const m = /(\d\d:\d\d) ⇒ (\d\d:\d\d)$/.exec(l);
    return m;
}
export function inner$bookings_arrivals_round$src(l) {
    const m = /(\d\d:\d\d) ⇒ (\d\d:\d\d)$/.exec(l);
    const src = hmOf(m[1]);
    return src;
}
export function inner$bookings_arrivals_round$src$$step(m) {
    const src = hmOf(m[1]);
    return src;
}
export function inner$bookings_arrivals_round$res(p, l) {
    const dir = pstr(p, 'dir', 'down');
    const m = /(\d\d:\d\d) ⇒ (\d\d:\d\d)$/.exec(l);
    const src = hmOf(m[1]);
    const res = hmOf(m[2]) + (hmOf(m[2]) < src && dir !== 'down' ? 1440 : 0);
    return res;
}
export function inner$bookings_arrivals_round$res$$step(dir, m, src) {
    const res = hmOf(m[2]) + (hmOf(m[2]) < src && dir !== 'down' ? 1440 : 0);
    return res;
}
export function inner$zmanim_times_round$step(p) {
    const step = pnum(p, 'step', 1);
    return step;
}
export function inner$zmanim_times_round$nearest(p) {
    const nearest = pstr(p, 'dir', 'down') === 'nearest';
    return nearest;
}
export function inner$zmanim_times_round$m(l) {
    const m = /^(.+) (\d\d):(\d\d):(\d\d) ← (\d\d:\d\d)$/.exec(l);
    return m;
}
export function inner$zmanim_times_round$src(l) {
    const m = /^(.+) (\d\d):(\d\d):(\d\d) ← (\d\d:\d\d)$/.exec(l);
    const src = +m[2] * 60 + +m[3] + +m[4] / 60;
    return src;
}
export function inner$zmanim_times_round$src$$step(m) {
    const src = +m[2] * 60 + +m[3] + +m[4] / 60;
    return src;
}
export function inner$zmanim_times_round$dir(p, l) {
    const nearest = pstr(p, 'dir', 'down') === 'nearest';
    const m = /^(.+) (\d\d):(\d\d):(\d\d) ← (\d\d:\d\d)$/.exec(l);
    const dir = nearest ? 'nearest' : m[1].startsWith('סוף') ? 'down' : 'up';
    return dir;
}
export function inner$zmanim_times_round$dir$$step(nearest, m) {
    const dir = nearest ? 'nearest' : m[1].startsWith('סוף') ? 'down' : 'up';
    return dir;
}
export function inner$bookings_stay_divide$m(l) {
    const m = /(\d+\/\d+)–(\d+\/\d+) ⇒ ניקיון ב-(.+)$/.exec(l);
    return m;
}
export function inner$bookings_stay_divide$a(env, l) {
    const m = /(\d+\/\d+)–(\d+\/\d+) ⇒ ניקיון ב-(.+)$/.exec(l);
    const a = dayOfDm(m[1], env.today);
    return a;
}
export function inner$bookings_stay_divide$a$$step(env, m) {
    const a = dayOfDm(m[1], env.today);
    return a;
}
export function inner$bookings_stay_divide$b(env, l) {
    const m = /(\d+\/\d+)–(\d+\/\d+) ⇒ ניקיון ב-(.+)$/.exec(l);
    const b = dayOfDm(m[2], env.today);
    return b;
}
export function inner$bookings_stay_divide$b$$step(env, m) {
    const b = dayOfDm(m[2], env.today);
    return b;
}
export function inner$bookings_untilArrival_divide$m(l) {
    const m = /הגעה (\d+\/\d+) ⇒ (.+)$/.exec(l);
    return m;
}
export function inner$bookings_untilArrival_divide$arr(env, l) {
    const m = /הגעה (\d+\/\d+) ⇒ (.+)$/.exec(l);
    const arr = dayOfDm(m[1], env.today);
    return arr;
}
export function inner$bookings_untilArrival_divide$arr$$step(env, m) {
    const arr = dayOfDm(m[1], env.today);
    return arr;
}
export function inner$bookings_untilArrival_divide$prev() {
    let prev = -Infinity;
    return prev;
}
export function inner$bookings_nights_merge$min(p) {
    const min = pnum(p, 'minLength', 1);
    return min;
}
export function inner$bookings_nights_merge$m(l) {
    const m = /פנוי (\d+) לילות ברצף/.exec(l);
    return m;
}
export function inner$bookings_arrivals_next$m(l) {
    const m = /^היום (\d\d:\d\d) · /.exec(l);
    return m;
}
export function inner$bookings_arrivals_next$d(l) {
    const d = /^(\d+\/\d+) \d\d:\d\d · /.exec(l);
    return d;
}
export function inner$zmanim_times_next$now(pv) {
    const now = /עכשיו (\d\d:\d\d)/.exec(pv.title);
    return now;
}
export function inner$zmanim_times_next$m(l) {
    const m = /(\d\d:\d\d)$/.exec(l);
    return m;
}
export function inner$whatNeed_openings_next$m(l) {
    const m = / · היום ב-(\d\d:\d\d)$/.exec(l);
    return m;
}
export function inner$bookings_unitStays_next$bad(pv, env) {
    const bad = nightsMatch(pv, env, /ההזמנה הבאה: (\d+\/\d+)–(\d+\/\d+) \((\d+) לילות\)/);
    return bad;
}
export function inner$bookings_unitStays_next$m(l) {
    const m = /ההזמנה הבאה: (\d+\/\d+)–/.exec(l);
    return m;
}
export function inner$bookings_nights_next$m(l) {
    const m = /הבא(?:ים)?: (.+)$/.exec(l) ?? /פנויים ברצף מ-(\d+\/\d+)/.exec(l);
    return m;
}
export function inner$bookings_nights_next$days(env, l) {
    const m = /הבא(?:ים)?: (.+)$/.exec(l) ?? /פנויים ברצף מ-(\d+\/\d+)/.exec(l);
    const days = m[1].split(', ').map((x) => (x === 'הלילה' ? todayDay(env) : dayOfDm(x, env.today)));
    return days;
}
export function inner$bookings_nights_next$days$$step(env, m) {
    const days = m[1].split(', ').map((x) => (x === 'הלילה' ? todayDay(env) : dayOfDm(x, env.today)));
    return days;
}
export function inner$windowsInOrder$prevEnd() {
    let prevEnd = -Infinity;
    return prevEnd;
}
export function inner$windowsInOrder$m(l) {
    const m = /מ-(\d+\/\d+) (\d\d:\d\d) עד (\d+\/\d+) (\d\d:\d\d)/.exec(l);
    return m;
}
export function inner$windowsInOrder$a(env, l) {
    const m = /מ-(\d+\/\d+) (\d\d:\d\d) עד (\d+\/\d+) (\d\d:\d\d)/.exec(l);
    const a = dayOfDm(m[1], env.today) * 1440 + hmOf(m[2]);
    return a;
}
export function inner$windowsInOrder$a$$step(env, m) {
    const a = dayOfDm(m[1], env.today) * 1440 + hmOf(m[2]);
    return a;
}
export function inner$windowsInOrder$b(env, l) {
    const m = /מ-(\d+\/\d+) (\d\d:\d\d) עד (\d+\/\d+) (\d\d:\d\d)/.exec(l);
    const b = dayOfDm(m[3], env.today) * 1440 + hmOf(m[4]);
    return b;
}
export function inner$windowsInOrder$b$$step(env, m) {
    const b = dayOfDm(m[3], env.today) * 1440 + hmOf(m[4]);
    return b;
}
export function inner$nightsMatch$m(re, l) {
    const m = re.exec(l);
    return m;
}
export function inner$moneyRound$step(p) {
    const step = pnum(p, 'step', 1);
    return step;
}
export function inner$moneyRound$dir(p) {
    const dir = pstr(p, 'dir', 'down');
    return dir;
}
export function inner$moneyRound$m(arrow, l) {
    const m = new RegExp('(₪[\\d,]+(?:\\.\\d+)?) ' + arrow + ' (₪[\\d,]+(?:\\.\\d+)?)$').exec(l);
    return m;
}
export function inner$moneyRound$src(arrow, l) {
    const m = new RegExp('(₪[\\d,]+(?:\\.\\d+)?) ' + arrow + ' (₪[\\d,]+(?:\\.\\d+)?)$').exec(l);
    const src = money(m[1]);
    return src;
}
export function inner$moneyRound$src$$step(m) {
    const src = money(m[1]);
    return src;
}
export function inner$moneyRound$res(arrow, l) {
    const m = new RegExp('(₪[\\d,]+(?:\\.\\d+)?) ' + arrow + ' (₪[\\d,]+(?:\\.\\d+)?)$').exec(l);
    const res = money(m[2]);
    return res;
}
export function inner$moneyRound$res$$step(m) {
    const res = money(m[2]);
    return res;
}
export function inner$deadlines$m(l) {
    const m = /(?:עד|תישלח ל.+? ב-)((\d+\/\d+) )?(\d\d:\d\d)/.exec(l);
    return m;
}
export function inner$deadlines$day(env, l) {
    const m = /(?:עד|תישלח ל.+? ב-)((\d+\/\d+) )?(\d\d:\d\d)/.exec(l);
    const day = m[2] ? dayOfDm(m[2], env.today) : todayDay(env);
    return day;
}
export function inner$deadlines$day$$step(env, m) {
    const day = m[2] ? dayOfDm(m[2], env.today) : todayDay(env);
    return day;
}
export function inner$rotateDays$m(pv) {
    const m = /^בתורות לפי יום · (\d+) בתור$/.exec(pv.title);
    return m;
}
export function inner$rotateDays$who(pv) {
    const who = pv.lines.map((l) => l.split(' ⇒ ')[1]);
    return who;
}
export function inner$basicIssue$text(pv) {
    const text = [pv.title, ...pv.lines].join('\n');
    return text;
}
export function inner$basicIssue$plain(pv) {
    const text = [pv.title, ...pv.lines].join('\n');
    const plain = text.replace(/ברצף/g, '').replace(/בקשה במיזוג|^מיזוג ← |מיזוג\/קירור/gm, '');
    return plain;
}
export function inner$basicIssue$plain$$step(text) {
    const plain = text.replace(/ברצף/g, '').replace(/בקשה במיזוג|^מיזוג ← |מיזוג\/קירור/gm, '');
    return plain;
}
export function inner$connectionTargets$place(key) {
    const [place, atom] = key.split(':');
    return place;
}
export function inner$connectionTargets$atom(key) {
    const [place, atom] = key.split(':');
    return atom;
}
export function inner$connectionTargets$engine(key) {
    const [place, atom] = key.split(':');
    const engine = place.split('.')[0];
    return engine;
}
export function inner$connectionTargets$engine$$step(place) {
    const engine = place.split('.')[0];
    return engine;
}
export function inner$connectionTargets$key(pl, atom) {
    const key = pl.id + ':' + atom;
    return key;
}
export function inner$connectionTargets$walk$last(chain) {
    const last = chain[chain.length - 1];
    return last;
}
export function inner$connectionTargets$roots(ROOT_VALUE) {
    const roots = Object.entries(ROOT_VALUE).map(([k, v]) => [...k.split(':'), v, false]);
    return roots;
}
export function inner$verifyConnections$genWorlds(opts, worlds) {
    const genWorlds = worlds.slice(0, 1 + (opts.genDbs ?? 8));
    return genWorlds;
}
export function inner$verifyConnections$sets(opts, t) {
    const paramSets = opts.paramSets ?? 2;
    const sets = t.gen ? (opts.genParamSets ?? 1) : t.caps.length ? (opts.chainParamSets ?? paramSets) : paramSets;
    return sets;
}
export function inner$verifyConnections$sets$$step(opts, paramSets, t) {
    const sets = t.gen ? (opts.genParamSets ?? 1) : t.caps.length ? (opts.chainParamSets ?? paramSets) : paramSets;
    return sets;
}
export function inner$verifyConnections$cap(chain) {
    const cap = chain[chain.length - 1];
    return cap;
}
export function inner$verifyConnections$cctx(w, chain) {
    const cctx = { ...w.ctx, caps: chain.slice(0, -1) };
    return cctx;
}
export function inner$verifyConnections$params(chain) {
    const params = Object.fromEntries(chain.map((c) => [c.atom + (chain.indexOf(c) ? '#' + chain.indexOf(c) : ''), c.params]));
    return params;
}
export function inner$verifyConnections$checks(rootPlace, s) {
    const checks = s === 0 ? (rootPlace?.personal ? 6 : 5) : 4;
    return checks;
}
export function inner$isVerified$atoms(key) {
    const atoms = key.includes('>') ? key.split(':').slice(-1)[0].split('>') : [key.split(':')[1]];
    return atoms;
}
export function inner$shrinkValue$out$$after_loop(v, depth) {
    const out = [];
    for (const k of Object.keys(v))
        for (const s of shrinkValue(v[k], depth + 1))
            out.push({ ...v, [k]: s });
    return out;
}
export function inner$dayOfDm$best$$after_loop(dmText, todayIso) {
    const [d, m] = dmText.split('/').map(Number);
    const t0 = Date.parse(todayIso + 'T12:00:00Z');
    const y = Number(todayIso.slice(0, 4));
    let best = NaN;
    for (const yy of [y - 1, y, y + 1]) {
        const t = Date.UTC(yy, m - 1, d, 12);
        if (!Number.isFinite(best) || Math.abs(t - t0) < Math.abs(best - t0))
            best = t;
    }
    return best;
}

export const SIGS = {
  inner$smallerNumbers$c: [{"name":"x","d":{"t":"num"},"opt":false}],
  inner$secretsOf$first: [{"name":"m","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$hasWord$re: [{"name":"wordRe","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false},{"name":"w","d":{"t":"str"},"opt":false}],
  inner$dayOfDm$d: [{"name":"dmText","d":{"t":"str"},"opt":false}],
  inner$dayOfDm$m: [{"name":"dmText","d":{"t":"str"},"opt":false}],
  inner$dayOfDm$t0: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$dayOfDm$y: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$dayOfDm$t: [{"name":"dmText","d":{"t":"str"},"opt":false},{"name":"yy","d":{"t":"num"},"opt":false}],
  inner$dayOfDm$t$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"yy","d":{"t":"num"},"opt":false}],
  inner$totalLines$m: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$installments$m: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$installments$x: [{"name":"g","d":{"t":"str"},"opt":false}],
  inner$checkInstallments$it: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$checkInstallments$s: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$checkInstallments$s$$step: [{"name":"it","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["total",{"t":"num"},false],["pieces",{"t":"arr","of":{"t":"num"}},false]]}]},"opt":false}],
  inner$checkInstallments$size: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$checkInstallments$parts: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$checkInstallments$frac: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$checkInstallments$frac$$step: [{"name":"it","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["total",{"t":"num"},false],["pieces",{"t":"arr","of":{"t":"num"}},false]]}]},"opt":false}],
  inner$checkInstallments$core: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$checkInstallments$core$$step: [{"name":"it","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["total",{"t":"num"},false],["pieces",{"t":"arr","of":{"t":"num"}},false]]}]},"opt":false},{"name":"frac","d":{"t":"num"},"opt":false}],
  inner$roundOk$t: [],
  inner$bookings_turnover_divide$m: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$bookings_turnover_divide$pieces: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$bookings_turnover_divide$bySize: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$zmanim_day_divide$m: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_day_divide$n: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_day_divide$n$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$zmanim_day_divide$unit: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_day_divide$unit$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$zmanim_day_divide$span: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_day_divide$span$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$zmanim_day_divide$pieces: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_shabbat_divide$m: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_shabbat_divide$unit: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_shabbat_divide$unit$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$zmanim_shabbat_divide$span: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_shabbat_divide$span$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$whatNeed_hours_divide$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$whatNeed_hours_divide$unit: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$whatNeed_hours_divide$unit$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$whatNeed_hours_divide$span: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$whatNeed_hours_divide$span$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$whatNeed_hours_divide$size: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$whatNeed_hours_divide$gap: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$whatNeed_hours_divide$first: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$whatNeed_hours_divide$first$$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"span","d":{"t":"num"},"opt":false},{"name":"size","d":{"t":"num"},"opt":false}],
  inner$whatNeed_hours_divide$full: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$whatNeed_hours_divide$full$$step: [{"name":"span","d":{"t":"num"},"opt":false},{"name":"size","d":{"t":"num"},"opt":false},{"name":"gap","d":{"t":"num"},"opt":false}],
  inner$whatNeed_hours_divide$want: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$whatNeed_hours_divide$want$$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"span","d":{"t":"num"},"opt":false},{"name":"size","d":{"t":"num"},"opt":false},{"name":"gap","d":{"t":"num"},"opt":false},{"name":"full","d":{"t":"num"},"opt":false}],
  inner$zmanim_times_offset$d: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$zmanim_times_offset$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_offset$raw: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_offset$raw$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$zmanim_times_offset$note: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_offset$note$$step: [{"name":"raw","d":{"t":"num"},"opt":false}],
  inner$whatNeed_openings_offset$d: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$whatNeed_openings_offset$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_offset$d: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$bookings_arrivals_offset$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_offset$a: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_offset$a$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_arrivals_offset$b: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_offset$b$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_arrivals_round$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$bookings_arrivals_round$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$bookings_arrivals_round$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_round$src: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_round$src$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_arrivals_round$res: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_round$res$$step: [{"name":"dir","d":{"t":"str"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false},{"name":"src","d":{"t":"num"},"opt":false}],
  inner$zmanim_times_round$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$zmanim_times_round$nearest: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$zmanim_times_round$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_round$src: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_round$src$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$zmanim_times_round$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_round$dir$$step: [{"name":"nearest","d":{"t":"bool"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_stay_divide$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_stay_divide$a: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_stay_divide$a$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_stay_divide$b: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_stay_divide$b$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_untilArrival_divide$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_untilArrival_divide$arr: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_untilArrival_divide$arr$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$bookings_untilArrival_divide$prev: [],
  inner$bookings_nights_merge$min: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$bookings_nights_merge$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_next$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_arrivals_next$d: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$zmanim_times_next$now: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$zmanim_times_next$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$whatNeed_openings_next$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_unitStays_next$bad: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false}],
  inner$bookings_unitStays_next$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_nights_next$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_nights_next$days: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$bookings_nights_next$days$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$windowsInOrder$prevEnd: [],
  inner$windowsInOrder$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$windowsInOrder$a: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$windowsInOrder$a$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$windowsInOrder$b: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$windowsInOrder$b$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$nightsMatch$m: [{"name":"re","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$moneyRound$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$moneyRound$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$moneyRound$m: [{"name":"arrow","d":{"t":"str"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$moneyRound$src: [{"name":"arrow","d":{"t":"str"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$moneyRound$src$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$moneyRound$res: [{"name":"arrow","d":{"t":"str"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$moneyRound$res$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$deadlines$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$deadlines$day: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$deadlines$day$$step: [{"name":"env","d":{"t":"obj","n":"Env","p":[["nowMs",{"t":"num"},false],["today",{"t":"str"},false],["nowMin",{"t":"num"},false]]},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$rotateDays$m: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$rotateDays$who: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$basicIssue$text: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$basicIssue$plain: [{"name":"pv","d":{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$basicIssue$plain$$step: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$connectionTargets$place: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$connectionTargets$atom: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$connectionTargets$engine: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$connectionTargets$engine$$step: [{"name":"place","d":{"t":"str"},"opt":false}],
  inner$connectionTargets$key: [{"name":"pl","d":{"t":"obj","n":"Place","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false]]},"opt":false},{"name":"atom","d":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},"opt":false}],
  inner$connectionTargets$walk$last: [{"name":"chain","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$connectionTargets$roots: [{"name":"ROOT_VALUE","d":{"t":"rec","of":{"t":"lit","v":["slots","windows","moments","assigned","pieces"]}},"opt":false}],
  inner$verifyConnections$genWorlds: [{"name":"opts","d":{"t":"obj","n":"VerifyConnOpts","p":[["dbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["seed",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["paramSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["chainParamSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["secrets",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["emails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["texts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}]},true],["only",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["demo",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["nowMs",{"t":"num"},false],["secrets",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["emails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["texts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}]},true]]}]},true],["demoDbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["genDbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["genParamSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"worlds","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["ctx",{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["secrets",{"t":"obj","n":"OrgSecrets","p":[["names",{"t":"arr","of":{"t":"str"}},false],["phones",{"t":"arr","of":{"t":"str"}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["texts",{"t":"arr","of":{"t":"str"}},false]]},false]]}},"opt":false}],
  inner$verifyConnections$sets: [{"name":"opts","d":{"t":"obj","n":"VerifyConnOpts","p":[["dbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["seed",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["paramSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["chainParamSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["secrets",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["emails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["texts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}]},true],["only",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["demo",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["nowMs",{"t":"num"},false],["secrets",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["emails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["texts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}]},true]]}]},true],["demoDbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["genDbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["genParamSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"t","d":{"t":"obj","n":"ConnTarget","p":[["key",{"t":"str"},false],["cap",{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["gen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$verifyConnections$sets$$step: [{"name":"opts","d":{"t":"obj","n":"VerifyConnOpts","p":[["dbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["seed",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["paramSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["chainParamSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["secrets",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["emails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["texts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}]},true],["only",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["demo",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["nowMs",{"t":"num"},false],["secrets",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["emails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["texts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}]},true]]}]},true],["demoDbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["genDbs",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["genParamSets",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"paramSets","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"obj","n":"ConnTarget","p":[["key",{"t":"str"},false],["cap",{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["gen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$verifyConnections$cap: [{"name":"chain","d":{"t":"arr","of":{"t":"obj","p":[["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$verifyConnections$cctx: [{"name":"w","d":{"t":"obj","p":[["name",{"t":"str"},false],["ctx",{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["secrets",{"t":"obj","n":"OrgSecrets","p":[["names",{"t":"arr","of":{"t":"str"}},false],["phones",{"t":"arr","of":{"t":"str"}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["texts",{"t":"arr","of":{"t":"str"}},false]]},false]]},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"obj","p":[["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$verifyConnections$params: [{"name":"chain","d":{"t":"arr","of":{"t":"obj","p":[["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$verifyConnections$checks: [{"name":"rootPlace","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"GenPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false],["spec",{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["personal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$isVerified$atoms: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$shrinkValue$out$$after_loop: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"depth","d":{"t":"num"},"opt":false}],
  inner$dayOfDm$best$$after_loop: [{"name":"dmText","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
};
