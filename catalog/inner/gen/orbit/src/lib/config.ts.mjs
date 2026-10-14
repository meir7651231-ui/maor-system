// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/config.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normalizeFirebase(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const f = raw;
    const req = [f.apiKey, f.authDomain, f.projectId, f.appId];
    if (!req.every((v) => typeof v === 'string' && v.length > 0))
        return undefined;
    const out = {
        apiKey: f.apiKey,
        authDomain: f.authDomain,
        projectId: f.projectId,
        appId: f.appId,
    };
    if (typeof f.storageBucket === 'string' && f.storageBucket)
        out.storageBucket = f.storageBucket;
    if (typeof f.messagingSenderId === 'string' && f.messagingSenderId) {
        out.messagingSenderId = f.messagingSenderId;
    }
    return out;
}
const TEL_KINDS = ['sim', 'virtual', 'whatsapp'];
const TEL_HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
function telStr(v, max) {
    return typeof v === 'string' ? v.replace(/\p{Cc}/gu, '').trim().slice(0, max) : '';
}
function telExt(v, def) {
    const s = typeof v === 'string' ? v.replace(/\D/g, '').slice(0, 8) : '';
    return s || def;
}
function normalizeTelephony(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const t = raw;
    const numsRaw = Array.isArray(t.numbers) ? t.numbers.slice(0, 64) : [];
    const numbers = [];
    numsRaw.forEach((n, i) => {
        if (!n || typeof n !== 'object' || Array.isArray(n))
            return;
        const o = n;
        const kind = TEL_KINDS.includes(o.kind) ? o.kind : 'sim';
        const e164 = typeof o.e164 === 'string' ? o.e164.replace(/[^\d+()\-\s]/g, '').trim().slice(0, 24) : '';
        const id = telStr(o.id, 32) || `n${i + 1}`;
        const num = { id, e164, label: telStr(o.label, 60) || id, kind };
        if (o.kosher === true)
            num.kosher = true;
        numbers.push(num);
    });
    const daysRaw = Array.isArray(t.officeDays) ? t.officeDays : [0, 1, 2, 3, 4];
    const officeDays = [
        ...new Set(daysRaw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
    ].sort((a, b) => a - b);
    const bool = (v, def) => (typeof v === 'boolean' ? v : def);
    const hhmm = (v, def) => (typeof v === 'string' && TEL_HHMM_RE.test(v) ? v : def);
    // עיר — [a-z] בלבד, 2–20 תווים (תואם לקבלה של validate.mjs); אורך פסול ⇒ '' (מושמט,
    // לא נגזם — קלט חורג הוא זבל, עדיף נפילה לברירת-מחדל מאשר שם-עיר שגוי-שקט).
    const cityRaw = typeof t.city === 'string' ? t.city.toLowerCase().replace(/[^a-z]/g, '') : '';
    return {
        // מתג-המקטע — opt-in: הכותרת נשמרת רק כשהיא true (חסר/false ⇒ כבוי, מושמט).
        ...(t.enabled === true ? { enabled: true } : {}),
        numbers,
        officeDays,
        officeStart: hhmm(t.officeStart, '09:00'),
        officeEnd: hhmm(t.officeEnd, '17:00'),
        officeExt: telExt(t.officeExt, '101'),
        managerExt: telExt(t.managerExt, '201'),
        vmBox: telExt(t.vmBox, '100'),
        city: cityRaw.length >= 2 && cityRaw.length <= 20 ? cityRaw : '',
        kosherMode: bool(t.kosherMode, false),
        hebrewCalendar: bool(t.hebrewCalendar, true),
        zmanim: bool(t.zmanim, false),
        shabbat: bool(t.shabbat, true),
        fasts: bool(t.fasts, false),
        voicemail: bool(t.voicemail, true),
    };
}
function siteStr(v, max) {
    return typeof v === 'string' ? v.replace(/\p{Cc}/gu, '').trim().slice(0, max) : '';
}
function sitePosNum(v) {
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;
}
function sitePhone(v) {
    return typeof v === 'string' ? v.replace(/[^\d+()\-\s]/g, '').trim().slice(0, 24) : '';
}
export function inner$featureOn$parts(key) {
    const parts = key.split('.');
    return parts;
}
export function inner$safeHttpsUrl$t(raw) {
    const t = (raw || '').trim();
    return t;
}
export function inner$termOf$t(v) {
    const t = v.trim();
    return t;
}
export function inner$telExt$s(v) {
    const s = typeof v === 'string' ? v.replace(/\D/g, '').slice(0, 8) : '';
    return s;
}
export function inner$normalizeTelephony$numsRaw(t) {
    const numsRaw = Array.isArray(t.numbers) ? t.numbers.slice(0, 64) : [];
    return numsRaw;
}
export function inner$normalizeTelephony$forEach$kind(o) {
    const kind = TEL_KINDS.includes(o.kind) ? o.kind : 'sim';
    return kind;
}
export function inner$normalizeTelephony$forEach$e164(o) {
    const e164 = typeof o.e164 === 'string' ? o.e164.replace(/[^\d+()\-\s]/g, '').trim().slice(0, 24) : '';
    return e164;
}
export function inner$normalizeTelephony$forEach$id(i, o) {
    const id = telStr(o.id, 32) || `n${i + 1}`;
    return id;
}
export function inner$normalizeTelephony$forEach$num(i, o) {
    const kind = TEL_KINDS.includes(o.kind) ? o.kind : 'sim';
    const e164 = typeof o.e164 === 'string' ? o.e164.replace(/[^\d+()\-\s]/g, '').trim().slice(0, 24) : '';
    const id = telStr(o.id, 32) || `n${i + 1}`;
    const num = { id, e164, label: telStr(o.label, 60) || id, kind };
    return num;
}
export function inner$normalizeTelephony$forEach$num$$step(o, kind, e164, id) {
    const num = { id, e164, label: telStr(o.label, 60) || id, kind };
    return num;
}
export function inner$normalizeTelephony$daysRaw(t) {
    const daysRaw = Array.isArray(t.officeDays) ? t.officeDays : [0, 1, 2, 3, 4];
    return daysRaw;
}
export function inner$normalizeTelephony$officeDays(t) {
    const daysRaw = Array.isArray(t.officeDays) ? t.officeDays : [0, 1, 2, 3, 4];
    const officeDays = [
        ...new Set(daysRaw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
    ].sort((a, b) => a - b);
    return officeDays;
}
export function inner$normalizeTelephony$officeDays$$step(daysRaw) {
    const officeDays = [
        ...new Set(daysRaw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
    ].sort((a, b) => a - b);
    return officeDays;
}
export function inner$normalizeTelephony$cityRaw(t) {
    const cityRaw = typeof t.city === 'string' ? t.city.toLowerCase().replace(/[^a-z]/g, '') : '';
    return cityRaw;
}
export function inner$normLocalized$s(v, max) {
    const s = siteStr(v, max);
    return s;
}
export function inner$normLocalized$s_L236(v, max, l) {
    const s = siteStr(v[l], max);
    return s;
}
export function inner$normalizeSite$icon(s) {
    const icon = siteStr(s.icon, 12);
    return icon;
}
export function inner$normalizeSite$map$value(o) {
    const value = siteStr(o.value, 24);
    return value;
}
export function inner$normalizeSite$goal(c) {
    const goal = sitePosNum(c.goal);
    return goal;
}
export function inner$normalizeSite$raised(c) {
    const raised = sitePosNum(c.raised);
    return raised;
}
export function inner$normalizeSite$end(c) {
    const end = siteStr(c.end, 30);
    return end;
}
export function inner$normalizeSite$cur(c) {
    const cur = siteStr(c.currency, 4);
    return cur;
}
export function inner$normalizeSite$map$icon(o) {
    const icon = siteStr(o.icon, 12);
    return icon;
}
export function inner$normalizeSite$phones(c) {
    const phones = c.phones.map(sitePhone).filter((p) => p).slice(0, 8);
    return phones;
}
export function inner$normalizeSite$wa(c) {
    const wa = sitePhone(c.whatsapp);
    return wa;
}
export function inner$normalizeSite$email(c) {
    const email = siteStr(c.email, 120);
    return email;
}
export function inner$normalizeSite$amt(c) {
    const amt = sitePosNum(c.unitAmount);
    return amt;
}
export function inner$normalizeSite$map$amt(o) {
    const amt = sitePosNum(o.amount);
    return amt;
}
export function inner$normalizeSite$map$author(o) {
    const author = siteStr(o.author, 80);
    return author;
}
export function inner$normalizeSite$map$date(o) {
    const date = siteStr(o.date, 30);
    return date;
}
export function inner$normalizeSite$map$name(o) {
    const name = siteStr(o.name, 80);
    return name;
}
export function inner$normalizeSite$map$year(o) {
    const year = siteStr(o.year, 12);
    return year;
}
export function inner$normalizeSite$delta(o) {
    const delta = siteStr(o.delta, 40);
    return delta;
}
export function inner$normalizeSite$pts(o) {
    const pts = o.points.map((p) => (typeof p === 'number' && Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null)).filter((p) => p !== null).slice(0, 40);
    return pts;
}
export function inner$normalizeConfig$cfg(c, DEFAULT_CONFIG) {
    const cfg = {
        ...DEFAULT_CONFIG,
        ...c,
        slug: typeof c.slug === 'string' && c.slug ? c.slug : DEFAULT_CONFIG.slug,
        orgName: typeof c.orgName === 'string' ? c.orgName : DEFAULT_CONFIG.orgName,
        theme: typeof c.theme === 'string' && c.theme ? c.theme : DEFAULT_CONFIG.theme,
        modules: c.modules && typeof c.modules === 'object' && !Array.isArray(c.modules) ? { ...c.modules } : {},
        features: c.features && typeof c.features === 'object' && !Array.isArray(c.features)
            ? { ...c.features }
            : {},
        terms: c.terms && typeof c.terms === 'object' && !Array.isArray(c.terms) ? { ...c.terms } : {},
    };
    return cfg;
}
export function inner$normalizeConfig$fb(c) {
    const fb = normalizeFirebase(c.firebase);
    return fb;
}
export function inner$normalizeConfig$admins(c) {
    const admins = Array.isArray(c.adminEmails)
        ? c.adminEmails.filter((e) => typeof e === 'string' && e.trim() !== '')
        : [];
    return admins;
}
export function inner$normalizeConfig$teachersRaw(rolesRaw) {
    const teachersRaw = rolesRaw && typeof rolesRaw === 'object' && rolesRaw.teachers && typeof rolesRaw.teachers === 'object'
        ? rolesRaw.teachers
        : null;
    return teachersRaw;
}
export function inner$normalizeConfig$tel(c) {
    const tel = normalizeTelephony(c.telephony);
    return tel;
}
export function inner$normalizeConfig$hosts(c) {
    const hosts = c.allowedHosts.filter((h) => typeof h === 'string' && !!h.trim()).map((h) => h.trim().slice(0, 120)).slice(0, 12);
    return hosts;
}
export function inner$roleOf$e(email) {
    const e = (email || '').trim().toLowerCase();
    return e;
}
export function inner$teacherIdOf$e(email) {
    const e = (email || '').trim().toLowerCase();
    return e;
}
export function inner$isAdminUser$e(email) {
    const e = email.trim().toLowerCase();
    return e;
}
export function inner$isAdminAuthority$platformOrg(config) {
    const platformOrg = !!config.firebase && config.cloudRoot !== true && config.slug !== 'default';
    return platformOrg;
}
export function inner$isSuperAdmin$e(email) {
    const e = (email || '').trim().toLowerCase();
    return e;
}
export function inner$faviconDataUri$svg(emoji) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50' y='52' font-size='72' text-anchor='middle' dominant-baseline='central'>" +
        emoji +
        '</text></svg>';
    return svg;
}
export function inner$normLocalized$out$$after_loop(v, max, SITE_LANGS) {
    const out = {};
    for (const l of SITE_LANGS) {
        const s = siteStr(v[l], max);
        if (s)
            out[l] = s;
    }
    return out;
}
export function inner$normalizeConfig$entry$$after_loop(k, v, INTEGRATION_SETTING_KEYS) {
    const entry = { enabled: v.enabled };
    for (const s of INTEGRATION_SETTING_KEYS[k] ?? []) {
        const sv = v[s];
        if (typeof sv === 'string' && sv.trim())
            entry[s] = sv.trim();
    }
    return entry;
}
export function inner$normalizeConfig$teachers$$after_loop(rolesRaw) {
    const teachersRaw = rolesRaw && typeof rolesRaw === 'object' && rolesRaw.teachers && typeof rolesRaw.teachers === 'object'
        ? rolesRaw.teachers
        : null;
    const teachers = {};
    for (const [k, v] of Object.entries(teachersRaw))
        if (k.trim() && typeof v === 'string' && v.trim())
            teachers[k.trim()] = v.trim();
    return teachers;
}

export const SIGS = {
  inner$featureOn$parts: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$safeHttpsUrl$t: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$termOf$t: [{"name":"v","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$telExt$s: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$numsRaw: [{"name":"t","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$forEach$kind: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$forEach$e164: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$forEach$id: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$forEach$num: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$forEach$num$$step: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"kind","d":{"t":"lit","v":["sim","virtual","whatsapp"]},"opt":false},{"name":"e164","d":{"t":"str"},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$normalizeTelephony$daysRaw: [{"name":"t","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$officeDays: [{"name":"t","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$officeDays$$step: [{"name":"daysRaw","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$normalizeTelephony$cityRaw: [{"name":"t","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normLocalized$s: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"max","d":{"t":"num"},"opt":false}],
  inner$normLocalized$s_L236: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"max","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"lit","v":["he","en","yi"]},"opt":false}],
  inner$normalizeSite$icon: [{"name":"s","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$value: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$goal: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$raised: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$end: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$cur: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$icon: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$phones: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$wa: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$email: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$amt: [{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$amt: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$author: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$date: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$name: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$map$year: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$delta: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeSite$pts: [{"name":"o","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$normalizeConfig$cfg: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["slug",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"DEFAULT_CONFIG","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$normalizeConfig$fb: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["slug",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$normalizeConfig$admins: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["slug",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$normalizeConfig$teachersRaw: [{"name":"rolesRaw","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["teachers",{"t":"any"},true]]}]},"opt":false}],
  inner$normalizeConfig$tel: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["slug",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$normalizeConfig$hosts: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["slug",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$roleOf$e: [{"name":"email","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$teacherIdOf$e: [{"name":"email","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$isAdminUser$e: [{"name":"email","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$isAdminAuthority$platformOrg: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$isSuperAdmin$e: [{"name":"email","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$faviconDataUri$svg: [{"name":"emoji","d":{"t":"str"},"opt":false}],
  inner$normLocalized$out$$after_loop: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"max","d":{"t":"num"},"opt":false},{"name":"SITE_LANGS","d":{"t":"tup","of":[{"t":"lit","v":["he"]},{"t":"lit","v":["en"]},{"t":"lit","v":["yi"]}]},"opt":false}],
  inner$normalizeConfig$entry$$after_loop: [{"name":"k","d":{"t":"str"},"opt":false},{"name":"v","d":{"t":"any"},"opt":false},{"name":"INTEGRATION_SETTING_KEYS","d":{"t":"rec","of":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$normalizeConfig$teachers$$after_loop: [{"name":"rolesRaw","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["teachers",{"t":"any"},true]]}]},"opt":false}],
};
