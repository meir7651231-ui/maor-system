// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/zmanimBoard.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PR_TZEIS_MIN = 40;
const PR_MGA_MIN = 72;
const inRange = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
const pad2 = (n) => String(n).padStart(2, '0');
function hmToMin(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    if (!m)
        return null;
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (mi > 59 || h > 24 || (h === 24 && mi !== 0))
        return null;
    return h * 60 + mi;
}
function minToHm(min) {
    const x = ((Math.round(min) % 1440) + 1440) % 1440;
    return pad2(Math.floor(x / 60)) + ':' + pad2(x % 60);
}
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isIsoDate(iso) {
    return typeof iso === 'string' && ISO_DATE_RE.test(iso) && Number.isFinite(Date.parse(iso + 'T12:00:00Z'));
}
function addDaysIso(iso, n) {
    if (!isIsoDate(iso) || !Number.isFinite(n))
        return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}
function dowOfIso(iso) {
    if (!isIsoDate(iso))
        return -1;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}
const dayCache = new Map();
const timesCache = new Map();
const RAD = Math.PI / 180;
function noaaUtcMin(iso, lat, lon, dep, rise) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const yv = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime = (4 / RAD) *
        (yv * Math.sin(2 * L0 * RAD) -
            2 * e * Math.sin(M * RAD) +
            4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
            0.5 * yv * yv * Math.sin(4 * L0 * RAD) -
            1.25 * e * e * Math.sin(2 * M * RAD));
    const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
    if (!(cosHA >= -1 && cosHA <= 1))
        return null;
    const HA = Math.acos(cosHA) / RAD;
    const utc = 720 - 4 * (lon + (rise ? HA : -HA)) - eqTime;
    return ((utc % 1440) + 1440) % 1440;
}
function resolveTimeToken(token, t) {
    const s = String(token ?? '').trim();
    const fixed = hmToMin(s);
    if (fixed !== null)
        return fixed < 1440 ? minToHm(fixed) : '';
    const m = /^(sh|tz|nz)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    if (!m)
        return '';
    const kind = m[1].toLowerCase();
    const base = hmToMin(kind === 'sh' ? t.sunset : kind === 'tz' ? t.tzeis : t.sunrise);
    if (base === null)
        return '';
    return minToHm(base + (m[2] ? Number(m[2].replace(/\s/g, '')) : 0));
}
export function inner$tzValid$ok(tzCache, tz) {
    let ok = tzCache.get(tz);
    return ok;
}
export function inner$resolveZmanimLoc$lat(z) {
    const lat = inRange(z?.lat, -90, 90);
    return lat;
}
export function inner$resolveZmanimLoc$lon(z) {
    const lon = inRange(z?.lon, -180, 180);
    return lon;
}
export function inner$resolveZmanimLoc$candle(z) {
    const candle = inRange(z?.candleMin, 0, 120);
    return candle;
}
export function inner$resolveZmanimLoc$tzeis(z) {
    const tzeis = inRange(z?.tzeisMin, 0, 120);
    return tzeis;
}
export function inner$resolveZmanimLoc$label(z) {
    const label = typeof z?.label === 'string' ? z.label.trim() : '';
    return label;
}
export function inner$resolveZmanimLoc$elevation(z) {
    const elevation = inRange(z?.elevation, -500, 9000) ?? 0;
    return elevation;
}
export function inner$resolveZmanimLoc$tzeisMin(z) {
    const tzeis = inRange(z?.tzeisMin, 0, 120);
    const tzeisMin = Math.round(tzeis ?? PR_TZEIS_MIN);
    return tzeisMin;
}
export function inner$resolveZmanimLoc$tzeisMin$$step(tzeis) {
    const tzeisMin = Math.round(tzeis ?? PR_TZEIS_MIN);
    return tzeisMin;
}
export function inner$clockAt$f(clockFmts, zone) {
    let f = clockFmts.get(zone);
    return f;
}
export function inner$hmToMin$m(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    return m;
}
export function inner$hmToMin$h(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    const h = Number(m[1]);
    return h;
}
export function inner$hmToMin$h$$step(m) {
    const h = Number(m[1]);
    return h;
}
export function inner$hmToMin$mi(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
    const mi = Number(m[2]);
    return mi;
}
export function inner$hmToMin$mi$$step(m) {
    const mi = Number(m[2]);
    return mi;
}
export function inner$minToHm$x(min) {
    const x = ((Math.round(min) % 1440) + 1440) % 1440;
    return x;
}
export function inner$addDaysIso$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$addDaysIso$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$addDaysIso$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$dowOfIso$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$dowOfIso$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$dowOfIso$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$dayInfo$k(iso, loc) {
    const k = (loc.diaspora ? 'D|' : 'I|') + loc.tz + '|' + iso;
    return k;
}
export function inner$dayInfo$hit(iso, loc) {
    const k = (loc.diaspora ? 'D|' : 'I|') + loc.tz + '|' + iso;
    const hit = dayCache.get(k);
    return hit;
}
export function inner$dayInfo$hit$$step(k) {
    const hit = dayCache.get(k);
    return hit;
}
export function inner$dayTimes$k(iso, loc) {
    const k = [loc.lat, loc.lon, loc.tz, loc.candleMin, loc.tzeisMin, iso].join('|');
    return k;
}
export function inner$dayTimes$hit(iso, loc) {
    const k = [loc.lat, loc.lon, loc.tz, loc.candleMin, loc.tzeisMin, iso].join('|');
    const hit = timesCache.get(k);
    return hit;
}
export function inner$dayTimes$hit$$step(k) {
    const hit = timesCache.get(k);
    return hit;
}
export function inner$noaaUtcMin$y0(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    return y0;
}
export function inner$noaaUtcMin$m0(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    return m0;
}
export function inner$noaaUtcMin$d(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    return d;
}
export function inner$noaaUtcMin$y(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    return y;
}
export function inner$noaaUtcMin$y$$step(y0, m0) {
    const y = m0 <= 2 ? y0 - 1 : y0;
    return y;
}
export function inner$noaaUtcMin$m(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const m = m0 <= 2 ? m0 + 12 : m0;
    return m;
}
export function inner$noaaUtcMin$m$$step(m0) {
    const m = m0 <= 2 ? m0 + 12 : m0;
    return m;
}
export function inner$noaaUtcMin$A(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const A = Math.floor(y / 100);
    return A;
}
export function inner$noaaUtcMin$A$$step(y) {
    const A = Math.floor(y / 100);
    return A;
}
export function inner$noaaUtcMin$JD(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    return JD;
}
export function inner$noaaUtcMin$JD$$step(d, y, m, A) {
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    return JD;
}
export function inner$noaaUtcMin$T(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    return T;
}
export function inner$noaaUtcMin$T$$step(JD) {
    const T = (JD - 2451545.0) / 36525.0;
    return T;
}
export function inner$noaaUtcMin$L0(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    return L0;
}
export function inner$noaaUtcMin$L0$$step(T) {
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    return L0;
}
export function inner$noaaUtcMin$M(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    return M;
}
export function inner$noaaUtcMin$M$$step(T) {
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    return M;
}
export function inner$noaaUtcMin$e(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    return e;
}
export function inner$noaaUtcMin$e$$step(T) {
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    return e;
}
export function inner$noaaUtcMin$C(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    return C;
}
export function inner$noaaUtcMin$C$$step(T, M) {
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    return C;
}
export function inner$noaaUtcMin$lambda(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    return lambda;
}
export function inner$noaaUtcMin$lambda$$step(T, L0, C) {
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    return lambda;
}
export function inner$noaaUtcMin$eps0(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    return eps0;
}
export function inner$noaaUtcMin$eps0$$step(T) {
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    return eps0;
}
export function inner$noaaUtcMin$eps(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    return eps;
}
export function inner$noaaUtcMin$eps$$step(T, eps0) {
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    return eps;
}
export function inner$noaaUtcMin$decl(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    return decl;
}
export function inner$noaaUtcMin$decl$$step(lambda, eps) {
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    return decl;
}
export function inner$noaaUtcMin$yv(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const yv = Math.tan((eps / 2) * RAD) ** 2;
    return yv;
}
export function inner$noaaUtcMin$yv$$step(eps) {
    const yv = Math.tan((eps / 2) * RAD) ** 2;
    return yv;
}
export function inner$noaaUtcMin$eqTime(iso) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const yv = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime = (4 / RAD) *
        (yv * Math.sin(2 * L0 * RAD) -
            2 * e * Math.sin(M * RAD) +
            4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
            0.5 * yv * yv * Math.sin(4 * L0 * RAD) -
            1.25 * e * e * Math.sin(2 * M * RAD));
    return eqTime;
}
export function inner$noaaUtcMin$eqTime$$step(L0, M, e, yv) {
    const eqTime = (4 / RAD) *
        (yv * Math.sin(2 * L0 * RAD) -
            2 * e * Math.sin(M * RAD) +
            4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
            0.5 * yv * yv * Math.sin(4 * L0 * RAD) -
            1.25 * e * e * Math.sin(2 * M * RAD));
    return eqTime;
}
export function inner$noaaUtcMin$cosHA(iso, lat, dep) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
    return cosHA;
}
export function inner$noaaUtcMin$cosHA$$step(lat, dep, decl) {
    const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
    return cosHA;
}
export function inner$noaaUtcMin$HA(iso, lat, dep) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
    const HA = Math.acos(cosHA) / RAD;
    return HA;
}
export function inner$noaaUtcMin$HA$$step(cosHA) {
    const HA = Math.acos(cosHA) / RAD;
    return HA;
}
export function inner$noaaUtcMin$utc(iso, lat, lon, dep, rise) {
    const [y0, m0, d] = iso.split('-').map(Number);
    const y = m0 <= 2 ? y0 - 1 : y0;
    const m = m0 <= 2 ? m0 + 12 : m0;
    const A = Math.floor(y / 100);
    const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const yv = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime = (4 / RAD) *
        (yv * Math.sin(2 * L0 * RAD) -
            2 * e * Math.sin(M * RAD) +
            4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
            0.5 * yv * yv * Math.sin(4 * L0 * RAD) -
            1.25 * e * e * Math.sin(2 * M * RAD));
    const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
    const HA = Math.acos(cosHA) / RAD;
    const utc = 720 - 4 * (lon + (rise ? HA : -HA)) - eqTime;
    return utc;
}
export function inner$noaaUtcMin$utc$$step(lon, rise, eqTime, HA) {
    const utc = 720 - 4 * (lon + (rise ? HA : -HA)) - eqTime;
    return utc;
}
export function inner$sunAngleTime$u(iso, loc, dep, rise) {
    const u = noaaUtcMin(iso, loc.lat, loc.lon, dep, rise);
    return u;
}
export function inner$sunAngleTime$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$sunAngleTime$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$sunAngleTime$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$sunAngleTime$mm(iso, loc, dep, rise, mode) {
    const u = noaaUtcMin(iso, loc.lat, loc.lon, dep, rise);
    const mm = mode === 'floor' ? Math.floor(u) : mode === 'ceil' ? Math.ceil(u) : Math.round(u);
    return mm;
}
export function inner$sunAngleTime$mm$$step(mode, u) {
    const mm = mode === 'floor' ? Math.floor(u) : mode === 'ceil' ? Math.ceil(u) : Math.round(u);
    return mm;
}
export function inner$closureAt$now(hhmm) {
    const now = hmToMin(hhmm) ?? 0;
    return now;
}
export function inner$closureAt$next(iso) {
    const next = addDaysIso(iso, 1);
    return next;
}
export function inner$closureAt$tzeis(t) {
    const tzeis = hmToMin(t.tzeis);
    return tzeis;
}
export function inner$closureAt$candle(t) {
    const candle = hmToMin(t.candle);
    return candle;
}
export function inner$dateWords$civil(iso) {
    const civil = new Date(iso + 'T12:00:00').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    return civil;
}
export function inner$hebDateAt$night(clock, ss) {
    const night = ss !== null && (hmToMin(clock.hhmm) ?? 0) >= ss;
    return night;
}
export function inner$hebDateAt$anchorIso(clock, ss) {
    const night = ss !== null && (hmToMin(clock.hhmm) ?? 0) >= ss;
    const anchorIso = night ? addDaysIso(clock.iso, 1) : clock.iso;
    return anchorIso;
}
export function inner$hebDateAt$anchorIso$$step(clock, night) {
    const anchorIso = night ? addDaysIso(clock.iso, 1) : clock.iso;
    return anchorIso;
}
export function inner$dayZmanim$sr(t) {
    const sr = hmToMin(t.sunrise);
    return sr;
}
export function inner$dayZmanim$ss(t) {
    const ss = hmToMin(t.sunset);
    return ss;
}
export function inner$dayZmanim$ok(t) {
    const sr = hmToMin(t.sunrise);
    const ss = hmToMin(t.sunset);
    const ok = sr !== null && ss !== null;
    return ok;
}
export function inner$dayZmanim$ok$$step(sr, ss) {
    const ok = sr !== null && ss !== null;
    return ok;
}
export function inner$dayZmanim$gra(t) {
    const sr = hmToMin(t.sunrise);
    const ss = hmToMin(t.sunset);
    const ok = sr !== null && ss !== null;
    const gra = ok ? (ss - sr) / 12 : 0;
    return gra;
}
export function inner$dayZmanim$gra$$step(sr, ss, ok) {
    const gra = ok ? (ss - sr) / 12 : 0;
    return gra;
}
export function inner$dayZmanim$dawn(t) {
    const sr = hmToMin(t.sunrise);
    const ss = hmToMin(t.sunset);
    const ok = sr !== null && ss !== null;
    const dawn = ok ? sr - PR_MGA_MIN : 0;
    return dawn;
}
export function inner$dayZmanim$dawn$$step(sr, ok) {
    const dawn = ok ? sr - PR_MGA_MIN : 0;
    return dawn;
}
export function inner$dayZmanim$mga(t) {
    const sr = hmToMin(t.sunrise);
    const ss = hmToMin(t.sunset);
    const ok = sr !== null && ss !== null;
    const dawn = ok ? sr - PR_MGA_MIN : 0;
    const mga = ok ? (ss + PR_MGA_MIN - dawn) / 12 : 0;
    return mga;
}
export function inner$dayZmanim$mga$$step(ss, ok, dawn) {
    const mga = ok ? (ss + PR_MGA_MIN - dawn) / 12 : 0;
    return mga;
}
export function inner$markZmanim$now(clock) {
    const now = hmToMin(clock.hhmm) ?? 0;
    return now;
}
export function inner$markZmanim$map$m(r) {
    const m = hmToMin(r.time);
    return m;
}
export function inner$markZmanim$map$past(now, r) {
    const m = hmToMin(r.time);
    const past = m !== null && m <= now;
    return past;
}
export function inner$markZmanim$map$past$$step(now, m) {
    const past = m !== null && m <= now;
    return past;
}
export function inner$markZmanim$map$next(now, nextSet, r) {
    const m = hmToMin(r.time);
    const next = !nextSet && m !== null && m > now;
    return next;
}
export function inner$markZmanim$map$next$$step(now, nextSet, m) {
    const next = !nextSet && m !== null && m > now;
    return next;
}
export function inner$shabbatOf$now(clock) {
    const now = hmToMin(clock.hhmm) ?? 0;
    return now;
}
export function inner$shabbatOf$sat(clock) {
    let sat = clock.dow === 6 ? clock.iso : addDaysIso(clock.iso, 6 - clock.dow);
    return sat;
}
export function inner$shabbatOf$fri(sat) {
    const fri = addDaysIso(sat, -1);
    return fri;
}
export function inner$shabbatOf$candle(tf) {
    const candle = hmToMin(tf.candle);
    return candle;
}
export function inner$shabbatOf$end(ts) {
    const end = hmToMin(ts.tzeis);
    return end;
}
export function inner$shabbatOf$ssSat(ts) {
    const ssSat = hmToMin(ts.sunset);
    return ssSat;
}
export function inner$shabbatOf$current(clock, sat, tf, ts) {
    const now = hmToMin(clock.hhmm) ?? 0;
    const fri = addDaysIso(sat, -1);
    const candle = hmToMin(tf.candle);
    const end = hmToMin(ts.tzeis);
    const current = (clock.iso === fri && candle !== null && now >= candle) || (clock.iso === sat && (end === null || now < end));
    return current;
}
export function inner$shabbatOf$current$$step(clock, now, sat, fri, candle, end) {
    const current = (clock.iso === fri && candle !== null && now >= candle) || (clock.iso === sat && (end === null || now < end));
    return current;
}
export function inner$upcomingClosures$now(clock) {
    const now = clock.iso + ' ' + clock.hhmm;
    return now;
}
export function inner$weekZmanim$iso(fromIso, i) {
    const iso = addDaysIso(fromIso, i);
    return iso;
}
export function inner$weekZmanim$dow(fromIso, i) {
    const iso = addDaysIso(fromIso, i);
    const dow = dowOfIso(iso);
    return dow;
}
export function inner$weekZmanim$dow$$step(iso) {
    const dow = dowOfIso(iso);
    return dow;
}
export function inner$resolveTimeToken$s(token) {
    const s = String(token ?? '').trim();
    return s;
}
export function inner$resolveTimeToken$fixed(token) {
    const s = String(token ?? '').trim();
    const fixed = hmToMin(s);
    return fixed;
}
export function inner$resolveTimeToken$fixed$$step(s) {
    const fixed = hmToMin(s);
    return fixed;
}
export function inner$resolveTimeToken$m(token) {
    const s = String(token ?? '').trim();
    const m = /^(sh|tz|nz)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    return m;
}
export function inner$resolveTimeToken$m$$step(s) {
    const m = /^(sh|tz|nz)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    return m;
}
export function inner$resolveTimeToken$kind(token) {
    const s = String(token ?? '').trim();
    const m = /^(sh|tz|nz)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    const kind = m[1].toLowerCase();
    return kind;
}
export function inner$resolveTimeToken$kind$$step(m) {
    const kind = m[1].toLowerCase();
    return kind;
}
export function inner$resolveTimeToken$base(token, t) {
    const s = String(token ?? '').trim();
    const m = /^(sh|tz|nz)\s*([+-]\s*\d{1,3})?$/i.exec(s);
    const kind = m[1].toLowerCase();
    const base = hmToMin(kind === 'sh' ? t.sunset : kind === 'tz' ? t.tzeis : t.sunrise);
    return base;
}
export function inner$resolveTimeToken$base$$step(t, kind) {
    const base = hmToMin(kind === 'sh' ? t.sunset : kind === 'tz' ? t.tzeis : t.sunrise);
    return base;
}
export function inner$resolveMinyanim$dow(iso) {
    const dow = dowOfIso(iso);
    return dow;
}
export function inner$resolveMinyanim$time(t, tok) {
    const time = resolveTimeToken(tok, t);
    return time;
}
export function inner$emergencyNumbers$own(posts, todayIso) {
    const own = posts
        .filter((p) => p.kind === 'emergency' && p.approved === true && (!todayIso || !p.until || p.until >= todayIso) && String(p.phone ?? '').trim())
        .slice()
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
    return own;
}

export const SIGS = {
  inner$tzValid$ok: [{"name":"tzCache","d":{"t":"map","k":{"t":"str"},"v":{"t":"bool"}},"opt":false},{"name":"tz","d":{"t":"any"},"opt":false}],
  inner$resolveZmanimLoc$lat: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$lon: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$candle: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$tzeis: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$label: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$elevation: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$tzeisMin: [{"name":"z","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$resolveZmanimLoc$tzeisMin$$step: [{"name":"tzeis","d":{"t":"or","of":[{"t":"undef"},{"t":"num"}]},"opt":false}],
  inner$clockAt$f: [{"name":"clockFmts","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"DateTimeFormat","p":[["format",{"t":"fn"},false],["resolvedOptions",{"t":"fn"},false],["formatToParts",{"t":"fn"},false],["formatRange",{"t":"fn"},false],["formatRangeToParts",{"t":"fn"},false]]}},"opt":false},{"name":"zone","d":{"t":"str"},"opt":false}],
  inner$hmToMin$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$hmToMin$h: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$hmToMin$h$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$hmToMin$mi: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$hmToMin$mi$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$minToHm$x: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$addDaysIso$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$addDaysIso$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$addDaysIso$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$dowOfIso$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$dowOfIso$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$dowOfIso$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$dayInfo$k: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"loc","d":{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},"opt":false}],
  inner$dayInfo$hit: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"loc","d":{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},"opt":false}],
  inner$dayInfo$hit$$step: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$dayTimes$k: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"loc","d":{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},"opt":false}],
  inner$dayTimes$hit: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"loc","d":{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},"opt":false}],
  inner$dayTimes$hit$$step: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$y0: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$m0: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$y$$step: [{"name":"y0","d":{"t":"num"},"opt":false},{"name":"m0","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$m$$step: [{"name":"m0","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$A: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$A$$step: [{"name":"y","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$JD: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$JD$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"A","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$T: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$T$$step: [{"name":"JD","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$L0: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$L0$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$M: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$M$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$e: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$e$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$C: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$C$$step: [{"name":"T","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$lambda: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$lambda$$step: [{"name":"T","d":{"t":"num"},"opt":false},{"name":"L0","d":{"t":"num"},"opt":false},{"name":"C","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$eps0: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$eps0$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$eps: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$eps$$step: [{"name":"T","d":{"t":"num"},"opt":false},{"name":"eps0","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$decl: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$decl$$step: [{"name":"lambda","d":{"t":"num"},"opt":false},{"name":"eps","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$yv: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$yv$$step: [{"name":"eps","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$eqTime: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$noaaUtcMin$eqTime$$step: [{"name":"L0","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"num"},"opt":false},{"name":"e","d":{"t":"num"},"opt":false},{"name":"yv","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$cosHA: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"lat","d":{"t":"num"},"opt":false},{"name":"dep","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$cosHA$$step: [{"name":"lat","d":{"t":"num"},"opt":false},{"name":"dep","d":{"t":"num"},"opt":false},{"name":"decl","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$HA: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"lat","d":{"t":"num"},"opt":false},{"name":"dep","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$HA$$step: [{"name":"cosHA","d":{"t":"num"},"opt":false}],
  inner$noaaUtcMin$utc: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"lat","d":{"t":"num"},"opt":false},{"name":"lon","d":{"t":"num"},"opt":false},{"name":"dep","d":{"t":"num"},"opt":false},{"name":"rise","d":{"t":"bool"},"opt":false}],
  inner$noaaUtcMin$utc$$step: [{"name":"lon","d":{"t":"num"},"opt":false},{"name":"rise","d":{"t":"bool"},"opt":false},{"name":"eqTime","d":{"t":"num"},"opt":false},{"name":"HA","d":{"t":"num"},"opt":false}],
  inner$sunAngleTime$u: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"loc","d":{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},"opt":false},{"name":"dep","d":{"t":"num"},"opt":false},{"name":"rise","d":{"t":"bool"},"opt":false}],
  inner$sunAngleTime$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$sunAngleTime$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$sunAngleTime$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$sunAngleTime$mm: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"loc","d":{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},"opt":false},{"name":"dep","d":{"t":"num"},"opt":false},{"name":"rise","d":{"t":"bool"},"opt":false},{"name":"mode","d":{"t":"lit","v":["round","floor","ceil"]},"opt":false}],
  inner$sunAngleTime$mm$$step: [{"name":"mode","d":{"t":"lit","v":["round","floor","ceil"]},"opt":false},{"name":"u","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$closureAt$now: [{"name":"hhmm","d":{"t":"str"},"opt":false}],
  inner$closureAt$next: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$closureAt$tzeis: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$closureAt$candle: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dateWords$civil: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$hebDateAt$night: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$hebDateAt$anchorIso: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$hebDateAt$anchorIso$$step: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"night","d":{"t":"bool"},"opt":false}],
  inner$dayZmanim$sr: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dayZmanim$ss: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dayZmanim$ok: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dayZmanim$ok$$step: [{"name":"sr","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$dayZmanim$gra: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dayZmanim$gra$$step: [{"name":"sr","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ok","d":{"t":"bool"},"opt":false}],
  inner$dayZmanim$dawn: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dayZmanim$dawn$$step: [{"name":"sr","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ok","d":{"t":"bool"},"opt":false}],
  inner$dayZmanim$mga: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$dayZmanim$mga$$step: [{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ok","d":{"t":"bool"},"opt":false},{"name":"dawn","d":{"t":"num"},"opt":false}],
  inner$markZmanim$now: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false}],
  inner$markZmanim$map$m: [{"name":"r","d":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]},"opt":false}],
  inner$markZmanim$map$past: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]},"opt":false}],
  inner$markZmanim$map$past$$step: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$markZmanim$map$next: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"nextSet","d":{"t":"bool"},"opt":false},{"name":"r","d":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]},"opt":false}],
  inner$markZmanim$map$next$$step: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"nextSet","d":{"t":"bool"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$shabbatOf$now: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false}],
  inner$shabbatOf$sat: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false}],
  inner$shabbatOf$fri: [{"name":"sat","d":{"t":"str"},"opt":false}],
  inner$shabbatOf$candle: [{"name":"tf","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$shabbatOf$end: [{"name":"ts","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$shabbatOf$ssSat: [{"name":"ts","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$shabbatOf$current: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"sat","d":{"t":"str"},"opt":false},{"name":"tf","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false},{"name":"ts","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$shabbatOf$current$$step: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"now","d":{"t":"num"},"opt":false},{"name":"sat","d":{"t":"str"},"opt":false},{"name":"fri","d":{"t":"str"},"opt":false},{"name":"candle","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"end","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$upcomingClosures$now: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false}],
  inner$weekZmanim$iso: [{"name":"fromIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$weekZmanim$dow: [{"name":"fromIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$weekZmanim$dow$$step: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$resolveTimeToken$s: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveTimeToken$fixed: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveTimeToken$fixed$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$resolveTimeToken$m: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveTimeToken$m$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$resolveTimeToken$kind: [{"name":"token","d":{"t":"any"},"opt":false}],
  inner$resolveTimeToken$kind$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$resolveTimeToken$base: [{"name":"token","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false}],
  inner$resolveTimeToken$base$$step: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false},{"name":"kind","d":{"t":"str"},"opt":false}],
  inner$resolveMinyanim$dow: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$resolveMinyanim$time: [{"name":"t","d":{"t":"obj","n":"PrDayTimes","p":[["sunrise",{"t":"str"},false],["sunset",{"t":"str"},false],["candle",{"t":"str"},false],["tzeis",{"t":"str"},false]]},"opt":false},{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$emergencyNumbers$own: [{"name":"posts","d":{"t":"arr","of":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"todayIso","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
};
