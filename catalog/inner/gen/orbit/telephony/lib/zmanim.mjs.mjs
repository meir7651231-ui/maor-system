// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/zmanim.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DEG = Math.PI / 180;
const rad = (d) => d * DEG;
const deg = (r) => r / DEG;
const CITIES = {
    jerusalem: { he: 'ירושלים', lat: 31.778, lon: 35.235, candle: 40 },
    telaviv: { he: 'תל אביב', lat: 32.083, lon: 34.800, candle: 18 },
    bneibrak: { he: 'בני ברק', lat: 32.083, lon: 34.833, candle: 22 },
    haifa: { he: 'חיפה', lat: 32.816, lon: 34.989, candle: 30 },
    beitshemesh: { he: 'בית שמש', lat: 31.750, lon: 34.988, candle: 25 },
    ashdod: { he: 'אשדוד', lat: 31.804, lon: 34.655, candle: 22 },
    beersheva: { he: 'באר שבע', lat: 31.252, lon: 34.791, candle: 22 },
    netanya: { he: 'נתניה', lat: 32.328, lon: 34.857, candle: 18 },
    tzfat: { he: 'צפת', lat: 32.965, lon: 35.496, candle: 30 },
    default: { he: 'ברירת-מחדל (ירושלים)', lat: 31.778, lon: 35.235, candle: 40 },
};
function geoOf(tenant) {
    const g = tenant && tenant.geo;
    if (g && Number.isFinite(g.lat) && Number.isFinite(g.lon)) {
        return { lat: g.lat, lon: g.lon, candle: Number.isFinite(g.candle) ? g.candle : 18, he: g.he || 'מותאם' };
    }
    const key = (tenant && tenant.city && CITIES[tenant.city]) ? tenant.city : 'default';
    return CITIES[key];
}
function julianDay(y, m, d) {
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function solarEventUTCmin(y, m, d, lat, lon, sunset) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    const yv = Math.tan(rad(eps / 2)) ** 2;
    const eqTime = 4 * deg(yv * Math.sin(rad(2 * L0))
        - 2 * e * Math.sin(rad(M))
        + 4 * e * yv * Math.sin(rad(M)) * Math.cos(rad(2 * L0))
        - 0.5 * yv * yv * Math.sin(rad(4 * L0))
        - 1.25 * e * e * Math.sin(rad(2 * M)));
    // זווית-שעה לזניט 90.833° (כולל שבירה+רדיוס-השמש).
    const zenith = 90.833;
    const cosHA = (Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl)))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    if (cosHA > 1 || cosHA < -1)
        return null; // אין שקיעה/זריחה (קוטב)
    const HA = deg(Math.acos(cosHA)); // מעלות (חיובי)
    // lon מזרח-חיובי: זריחה=720-4*(lon+HA)-eqTime · שקיעה=720-4*(lon-HA)-eqTime.
    const utc = 720 - 4 * (lon + (sunset ? -HA : HA)) - eqTime;
    return ((utc % 1440) + 1440) % 1440;
}
function addDaysIso(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d, 12, 0, 0) + n * 86400000;
    return new Date(t).toISOString().slice(0, 10);
}
export function inner$geoOf$key(tenant) {
    const key = (tenant && tenant.city && CITIES[tenant.city]) ? tenant.city : 'default';
    return key;
}
export function inner$julianDay$A(y) {
    const A = Math.floor(y / 100);
    return A;
}
export function inner$julianDay$B(y) {
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return B;
}
export function inner$julianDay$B$$step(A) {
    const B = 2 - A + Math.floor(A / 4);
    return B;
}
export function inner$solarEventUTCmin$JD(y, m, d) {
    const JD = julianDay(y, m, d);
    return JD;
}
export function inner$solarEventUTCmin$T(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    return T;
}
export function inner$solarEventUTCmin$T$$step(JD) {
    const T = (JD - 2451545.0) / 36525.0;
    return T;
}
export function inner$solarEventUTCmin$L0(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    return L0;
}
export function inner$solarEventUTCmin$L0$$step(T) {
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    return L0;
}
export function inner$solarEventUTCmin$M(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    return M;
}
export function inner$solarEventUTCmin$M$$step(T) {
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    return M;
}
export function inner$solarEventUTCmin$e(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    return e;
}
export function inner$solarEventUTCmin$e$$step(T) {
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    return e;
}
export function inner$solarEventUTCmin$C(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    return C;
}
export function inner$solarEventUTCmin$C$$step(T, M) {
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    return C;
}
export function inner$solarEventUTCmin$trueLong(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    return trueLong;
}
export function inner$solarEventUTCmin$trueLong$$step(L0, C) {
    const trueLong = L0 + C;
    return trueLong;
}
export function inner$solarEventUTCmin$lambda(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    return lambda;
}
export function inner$solarEventUTCmin$lambda$$step(T, trueLong) {
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    return lambda;
}
export function inner$solarEventUTCmin$eps0(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    return eps0;
}
export function inner$solarEventUTCmin$eps0$$step(T) {
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    return eps0;
}
export function inner$solarEventUTCmin$eps(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    return eps;
}
export function inner$solarEventUTCmin$eps$$step(T, eps0) {
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    return eps;
}
export function inner$solarEventUTCmin$decl(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    return decl;
}
export function inner$solarEventUTCmin$decl$$step(lambda, eps) {
    const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    return decl;
}
export function inner$solarEventUTCmin$yv(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const yv = Math.tan(rad(eps / 2)) ** 2;
    return yv;
}
export function inner$solarEventUTCmin$yv$$step(eps) {
    const yv = Math.tan(rad(eps / 2)) ** 2;
    return yv;
}
export function inner$solarEventUTCmin$eqTime(y, m, d) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const yv = Math.tan(rad(eps / 2)) ** 2;
    const eqTime = 4 * deg(yv * Math.sin(rad(2 * L0))
        - 2 * e * Math.sin(rad(M))
        + 4 * e * yv * Math.sin(rad(M)) * Math.cos(rad(2 * L0))
        - 0.5 * yv * yv * Math.sin(rad(4 * L0))
        - 1.25 * e * e * Math.sin(rad(2 * M)));
    return eqTime;
}
export function inner$solarEventUTCmin$eqTime$$step(L0, M, e, yv) {
    const eqTime = 4 * deg(yv * Math.sin(rad(2 * L0))
        - 2 * e * Math.sin(rad(M))
        + 4 * e * yv * Math.sin(rad(M)) * Math.cos(rad(2 * L0))
        - 0.5 * yv * yv * Math.sin(rad(4 * L0))
        - 1.25 * e * e * Math.sin(rad(2 * M)));
    return eqTime;
}
export function inner$solarEventUTCmin$cosHA(y, m, d, lat) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    const zenith = 90.833;
    const cosHA = (Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl)))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    return cosHA;
}
export function inner$solarEventUTCmin$cosHA$$step(lat, decl) {
    const zenith = 90.833;
    const cosHA = (Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl)))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    return cosHA;
}
export function inner$solarEventUTCmin$HA(y, m, d, lat) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    const zenith = 90.833;
    const cosHA = (Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl)))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    const HA = deg(Math.acos(cosHA));
    return HA;
}
export function inner$solarEventUTCmin$HA$$step(cosHA) {
    const HA = deg(Math.acos(cosHA));
    return HA;
}
export function inner$solarEventUTCmin$utc(y, m, d, lat, lon, sunset) {
    const JD = julianDay(y, m, d);
    const T = (JD - 2451545.0) / 36525.0;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
        + Math.sin(rad(3 * M)) * 0.000289;
    const trueLong = L0 + C;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
    const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
    const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    const yv = Math.tan(rad(eps / 2)) ** 2;
    const eqTime = 4 * deg(yv * Math.sin(rad(2 * L0))
        - 2 * e * Math.sin(rad(M))
        + 4 * e * yv * Math.sin(rad(M)) * Math.cos(rad(2 * L0))
        - 0.5 * yv * yv * Math.sin(rad(4 * L0))
        - 1.25 * e * e * Math.sin(rad(2 * M)));
    const zenith = 90.833;
    const cosHA = (Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl)))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    const HA = deg(Math.acos(cosHA));
    const utc = 720 - 4 * (lon + (sunset ? -HA : HA)) - eqTime;
    return utc;
}
export function inner$solarEventUTCmin$utc$$step(lon, sunset, eqTime, HA) {
    const utc = 720 - 4 * (lon + (sunset ? -HA : HA)) - eqTime;
    return utc;
}
export function inner$localHHMM$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$localHHMM$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$localHHMM$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$localHHMM$instant(iso, utcMin) {
    const [y, m, d] = iso.split('-').map(Number);
    const instant = Date.UTC(y, m - 1, d, 0, 0, 0) + Math.round(utcMin) * 60000;
    return instant;
}
export function inner$localHHMM$instant$$step(utcMin, y, m, d) {
    const instant = Date.UTC(y, m - 1, d, 0, 0, 0) + Math.round(utcMin) * 60000;
    return instant;
}
export function inner$localHHMM$f(_zfmt, tz) {
    let f = _zfmt.get(tz);
    return f;
}
export function inner$localHHMM$hh(parts) {
    const hh = parts.find((p) => p.type === 'hour')?.value;
    return hh;
}
export function inner$localHHMM$mm(parts) {
    const mm = parts.find((p) => p.type === 'minute')?.value;
    return mm;
}
export function inner$sunset$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$sunset$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$sunset$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$sunset$u(iso, lat, lon) {
    const [y, m, d] = iso.split('-').map(Number);
    const u = solarEventUTCmin(y, m, d, lat, lon, true);
    return u;
}
export function inner$sunset$u$$step(lat, lon, y, m, d) {
    const u = solarEventUTCmin(y, m, d, lat, lon, true);
    return u;
}
export function inner$sunrise$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$sunrise$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$sunrise$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$sunrise$u(iso, lat, lon) {
    const [y, m, d] = iso.split('-').map(Number);
    const u = solarEventUTCmin(y, m, d, lat, lon, false);
    return u;
}
export function inner$sunrise$u$$step(lat, lon, y, m, d) {
    const u = solarEventUTCmin(y, m, d, lat, lon, false);
    return u;
}
export function inner$toMin$h(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h;
}
export function inner$toMin$m(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return m;
}
export function inner$fromMin$x(min) {
    const x = ((min % 1440) + 1440) % 1440;
    return x;
}
export function inner$shabbatTimes$geo(tenant) {
    const geo = geoOf(tenant);
    return geo;
}
export function inner$shabbatTimes$tzeisMin(opt) {
    const tzeisMin = Number.isFinite(opt.tzeis) ? opt.tzeis : 40;
    return tzeisMin;
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
export function inner$addDaysIso$t(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d, 12, 0, 0) + n * 86400000;
    return t;
}
export function inner$addDaysIso$t$$step(n, y, m, d) {
    const t = Date.UTC(y, m - 1, d, 12, 0, 0) + n * 86400000;
    return t;
}
export function inner$hebrewClosedWindows$incYt(opt) {
    const incYt = opt.includeYomTov !== false;
    return incYt;
}
export function inner$hebrewClosedWindows$incSh(opt) {
    const incSh = opt.includeShabbat !== false;
    return incSh;
}
export function inner$hebrewClosedWindows$iso(fromIso, i) {
    const iso = addDaysIso(fromIso, i);
    return iso;
}
export function inner$hebrewClosedWindows$yt(opt, c) {
    const incYt = opt.includeYomTov !== false;
    const yt = incYt ? (c.yomTov || null) : null;
    return yt;
}
export function inner$hebrewClosedWindows$yt$$step(incYt, c) {
    const yt = incYt ? (c.yomTov || null) : null;
    return yt;
}
export function inner$hebrewClosedWindows$sh(opt, c) {
    const incSh = opt.includeShabbat !== false;
    const sh = incSh && c.dow === 6;
    return sh;
}
export function inner$hebrewClosedWindows$sh$$step(incSh, c) {
    const sh = incSh && c.dow === 6;
    return sh;
}
export function inner$hebrewClosedWindows$erevIso(first) {
    const erevIso = addDaysIso(first.iso, -1);
    return erevIso;
}
export function inner$hebrewClosedWindows$reason(cls, i, j) {
    const reason = cls.slice(i, j + 1).map((x) => x.yomTov).find(Boolean) || 'שבת';
    return reason;
}
export function inner$hebrewClosedWindows$kind(first) {
    const kind = first.yomTov ? 'yomtov' : 'shabbat';
    return kind;
}

export const SIGS = {
  inner$geoOf$key: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$julianDay$A: [{"name":"y","d":{"t":"num"},"opt":false}],
  inner$julianDay$B: [{"name":"y","d":{"t":"num"},"opt":false}],
  inner$julianDay$B$$step: [{"name":"A","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$JD: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$T: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$T$$step: [{"name":"JD","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$L0: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$L0$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$M: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$M$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$e: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$e$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$C: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$C$$step: [{"name":"T","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$trueLong: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$trueLong$$step: [{"name":"L0","d":{"t":"num"},"opt":false},{"name":"C","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$lambda: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$lambda$$step: [{"name":"T","d":{"t":"num"},"opt":false},{"name":"trueLong","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$eps0: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$eps0$$step: [{"name":"T","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$eps: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$eps$$step: [{"name":"T","d":{"t":"num"},"opt":false},{"name":"eps0","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$decl: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$decl$$step: [{"name":"lambda","d":{"t":"num"},"opt":false},{"name":"eps","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$yv: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$yv$$step: [{"name":"eps","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$eqTime: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$eqTime$$step: [{"name":"L0","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"num"},"opt":false},{"name":"e","d":{"t":"num"},"opt":false},{"name":"yv","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$cosHA: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false},{"name":"lat","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$cosHA$$step: [{"name":"lat","d":{"t":"num"},"opt":false},{"name":"decl","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$HA: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false},{"name":"lat","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$HA$$step: [{"name":"cosHA","d":{"t":"num"},"opt":false}],
  inner$solarEventUTCmin$utc: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false},{"name":"lat","d":{"t":"num"},"opt":false},{"name":"lon","d":{"t":"num"},"opt":false},{"name":"sunset","d":{"t":"bool"},"opt":false}],
  inner$solarEventUTCmin$utc$$step: [{"name":"lon","d":{"t":"num"},"opt":false},{"name":"sunset","d":{"t":"bool"},"opt":false},{"name":"eqTime","d":{"t":"num"},"opt":false},{"name":"HA","d":{"t":"num"},"opt":false}],
  inner$localHHMM$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$localHHMM$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$localHHMM$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$localHHMM$instant: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"utcMin","d":{"t":"num"},"opt":false}],
  inner$localHHMM$instant$$step: [{"name":"utcMin","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$localHHMM$f: [{"name":"_zfmt","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tz","d":{"t":"any"},"opt":false}],
  inner$localHHMM$hh: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$localHHMM$mm: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$sunset$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$sunset$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$sunset$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$sunset$u: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"lat","d":{"t":"any"},"opt":false},{"name":"lon","d":{"t":"any"},"opt":false}],
  inner$sunset$u$$step: [{"name":"lat","d":{"t":"any"},"opt":false},{"name":"lon","d":{"t":"any"},"opt":false},{"name":"y","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$sunrise$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$sunrise$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$sunrise$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$sunrise$u: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"lat","d":{"t":"any"},"opt":false},{"name":"lon","d":{"t":"any"},"opt":false}],
  inner$sunrise$u$$step: [{"name":"lat","d":{"t":"any"},"opt":false},{"name":"lon","d":{"t":"any"},"opt":false},{"name":"y","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$toMin$h: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$toMin$m: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$fromMin$x: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$shabbatTimes$geo: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$shabbatTimes$tzeisMin: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["tzeis",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$addDaysIso$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addDaysIso$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addDaysIso$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addDaysIso$t: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$addDaysIso$t$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$hebrewClosedWindows$incYt: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["tzeis",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["diaspora",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$hebrewClosedWindows$incSh: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["tzeis",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["diaspora",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$hebrewClosedWindows$iso: [{"name":"fromIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$hebrewClosedWindows$yt: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["tzeis",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["diaspora",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false},{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["monthHe",{"t":"any"},false],["day",{"t":"num"},false],["dow",{"t":"any"},false],["shabbat",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["erevChag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["cholHamoed",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fast",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["roshChodesh",{"t":"bool"},false],["name",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["closedReason",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$hebrewClosedWindows$yt$$step: [{"name":"incYt","d":{"t":"bool"},"opt":false},{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["monthHe",{"t":"any"},false],["day",{"t":"num"},false],["dow",{"t":"any"},false],["shabbat",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["erevChag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["cholHamoed",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fast",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["roshChodesh",{"t":"bool"},false],["name",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["closedReason",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$hebrewClosedWindows$sh: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["tzeis",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["diaspora",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false},{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["monthHe",{"t":"any"},false],["day",{"t":"num"},false],["dow",{"t":"any"},false],["shabbat",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["erevChag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["cholHamoed",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fast",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["roshChodesh",{"t":"bool"},false],["name",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["closedReason",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$hebrewClosedWindows$sh$$step: [{"name":"incSh","d":{"t":"bool"},"opt":false},{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["monthHe",{"t":"any"},false],["day",{"t":"num"},false],["dow",{"t":"any"},false],["shabbat",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["erevChag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["cholHamoed",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fast",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["roshChodesh",{"t":"bool"},false],["name",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["closedReason",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$hebrewClosedWindows$erevIso: [{"name":"first","d":{"t":"obj","p":[["iso",{"t":"str"},false],["closed",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["shabbat",{"t":"bool"},false],["inWindow",{"t":"bool"},false]]},"opt":false}],
  inner$hebrewClosedWindows$reason: [{"name":"cls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$hebrewClosedWindows$kind: [{"name":"first","d":{"t":"obj","p":[["iso",{"t":"str"},false],["closed",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["shabbat",{"t":"bool"},false],["inWindow",{"t":"bool"},false]]},"opt":false}],
};
