// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/platform/lib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEB2LAT = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
    'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
    'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'p',
    'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};
const ALL_MODULES = ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop', 'shop7', 'parnasa', 'hosting'];
function normEmail(email) {
    return email.trim().toLowerCase();
}
function overrideOf(email, org) {
    return org.memberConfigs?.[normEmail(email)] ?? {};
}
const GRANTABLE_STAFF_FEATURES = new Set([
    'supporters.bulkselect',
    'supporters.bulkdelete',
    // ביקורת-עומק 2.9: ה-desc מבטיח "המנהל מדליק לעובד/ת" — בלי הרישום כאן effectiveConfigFor זרק את ה-true
    'supporters.bulkmail',
    'supporters.bulkwa',
    'supporters.bulkmerge',
    'supporters.purpose',
    'supporters.delete',
    'families.delete',
    'courses.delete',
    'courses.bulkadmin',
    'settings.teachers.delete',
    'shop.delete',
    'tzedaka.delete',
    // פרנסה׳לע (12.10): אישורי-גבאי ומחיקות — מנהל תמיד, לעובד/ת רק בהדלקה פר-עובד
    'parnasa.approve',
    'parnasa.delete',
    // אירוח משפחתי (12.10): מחיקה-לצמיתות/איפוס והגדרות-המודול — מנהל תמיד, לעובד/ת רק בהדלקה פר-עובד
    'hosting.delete',
    'hosting.manage',
]);
export function inner$slugify$lat(orgName) {
    const lat = [...orgName.trim().toLowerCase()].map((ch) => HEB2LAT[ch] ?? ch).join('');
    return lat;
}
export function inner$slugify$base(orgName) {
    const lat = [...orgName.trim().toLowerCase()].map((ch) => HEB2LAT[ch] ?? ch).join('');
    let base = lat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    return base;
}
export function inner$slugify$base$$step(lat) {
    let base = lat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    return base;
}
export function inner$slugify$cand(base, i) {
    const cand = base + '-' + i;
    return cand;
}
export function inner$genJoinCode$x(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    let x = h >>> 0;
    return x;
}
export function inner$genJoinCode$x$$step(h) {
    let x = h >>> 0;
    return x;
}
export function inner$parseJoinFullCode$t(full) {
    const t = full.trim();
    return t;
}
export function inner$parseJoinFullCode$dot(full) {
    const t = full.trim();
    const dot = t.indexOf('.');
    return dot;
}
export function inner$parseJoinFullCode$dot$$step(t) {
    const dot = t.indexOf('.');
    return dot;
}
export function inner$parseJoinFullCode$slug(full) {
    const t = full.trim();
    const dot = t.indexOf('.');
    const slug = t.slice(0, dot).trim().toLowerCase();
    return slug;
}
export function inner$parseJoinFullCode$slug$$step(t, dot) {
    const slug = t.slice(0, dot).trim().toLowerCase();
    return slug;
}
export function inner$parseJoinFullCode$code(full) {
    const t = full.trim();
    const dot = t.indexOf('.');
    const code = t.slice(dot + 1).trim();
    return code;
}
export function inner$parseJoinFullCode$code$$step(t, dot) {
    const code = t.slice(dot + 1).trim();
    return code;
}
export function inner$isOrgManager$m(org) {
    const m = (org.manager ?? '').trim().toLowerCase();
    return m;
}
export function inner$orgEnabledFeatures$filter$isRealModule(f) {
    const isRealModule = ALL_MODULES.includes(f.module);
    return isRealModule;
}
export function inner$isMember$e(email) {
    const e = normEmail(email);
    return e;
}
export function inner$effectiveConfigFor$ov(email, org) {
    const ov = overrideOf(email, org);
    return ov;
}
export function inner$allowedDesignationsFor$d(email, org) {
    const d = overrideOf(email, org).designations;
    return d;
}
export function inner$approveMember$e(email) {
    const e = normEmail(email);
    return e;
}
export function inner$approveMember$members(org, email) {
    const e = normEmail(email);
    const members = [...new Set([...(org.members ?? []).map((m) => m.trim().toLowerCase()), e])];
    return members;
}
export function inner$approveMember$members$$step(org, e) {
    const members = [...new Set([...(org.members ?? []).map((m) => m.trim().toLowerCase()), e])];
    return members;
}
export function inner$memberDisplayName$nm(org, email) {
    const nm = org?.memberConfigs?.[normEmail(email)]?.displayName?.trim();
    return nm;
}
export function inner$memberNamesOf$nm(ov) {
    const nm = ov?.displayName?.trim();
    return nm;
}
export function inner$whoLabel$w(who) {
    const w = (who ?? '').trim();
    return w;
}
export function inner$setEmployeeOverride$e(email) {
    const e = normEmail(email);
    return e;
}
export function inner$removeMember$e(email) {
    const e = normEmail(email);
    return e;
}
export function inner$removeMember$members(org, email) {
    const e = normEmail(email);
    const members = (org.members ?? []).map((m) => m.trim().toLowerCase()).filter((m) => m !== e);
    return members;
}
export function inner$removeMember$members$$step(org, e) {
    const members = (org.members ?? []).map((m) => m.trim().toLowerCase()).filter((m) => m !== e);
    return members;
}
export function inner$allOffConfig$modules$$after_loop() {
    const modules = {};
    for (const m of ALL_MODULES)
        modules[m] = false;
    return modules;
}
export function inner$genJoinCode$h$$after_loop(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h;
}
export function inner$genJoinCode$out$$after_loop(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    let out = '';
    let x = h >>> 0;
    for (let i = 0; i < 8; i++) {
        out += (x % 36).toString(36);
        x = Math.floor(x / 36) || (h >>> 0) + i + 1;
    }
    return out;
}
export function inner$genJoinCode$x$$after_loop(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    let out = '';
    let x = h >>> 0;
    for (let i = 0; i < 8; i++) {
        out += (x % 36).toString(36);
        x = Math.floor(x / 36) || (h >>> 0) + i + 1;
    }
    return x;
}
export function inner$effectiveConfigFor$modules$$after_loop(email, org, orgConfig) {
    const ov = overrideOf(email, org);
    const modules = { ...orgConfig.modules };
    for (const [m, v] of Object.entries(ov.modules ?? {}))
        if (v === false)
            modules[m] = false;
    return modules;
}
export function inner$effectiveConfigFor$features$$after_loop(email, org, orgConfig) {
    const ov = overrideOf(email, org);
    const features = { ...orgConfig.features };
    for (const [k, v] of Object.entries(ov.features ?? {})) {
        if (v === false)
            features[k] = false;
        else if (v === true && GRANTABLE_STAFF_FEATURES.has(k) && orgConfig.features?.[k] !== false)
            features[k] = true; // הדלקה פר-עובד — לעולם לא מעל תקרת-הארגון
    }
    return features;
}
export function inner$memberNamesOf$out$$after_loop(org) {
    const out = {};
    for (const [email, ov] of Object.entries(org?.memberConfigs ?? {})) {
        const nm = ov?.displayName?.trim();
        if (nm)
            out[normEmail(email)] = nm;
    }
    return out;
}

export const SIGS = {
  inner$slugify$lat: [{"name":"orgName","d":{"t":"str"},"opt":false}],
  inner$slugify$base: [{"name":"orgName","d":{"t":"str"},"opt":false}],
  inner$slugify$base$$step: [{"name":"lat","d":{"t":"str"},"opt":false}],
  inner$slugify$cand: [{"name":"base","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$genJoinCode$x: [{"name":"seed","d":{"t":"str"},"opt":false}],
  inner$genJoinCode$x$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
  inner$parseJoinFullCode$t: [{"name":"full","d":{"t":"str"},"opt":false}],
  inner$parseJoinFullCode$dot: [{"name":"full","d":{"t":"str"},"opt":false}],
  inner$parseJoinFullCode$dot$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$parseJoinFullCode$slug: [{"name":"full","d":{"t":"str"},"opt":false}],
  inner$parseJoinFullCode$slug$$step: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"dot","d":{"t":"num"},"opt":false}],
  inner$parseJoinFullCode$code: [{"name":"full","d":{"t":"str"},"opt":false}],
  inner$parseJoinFullCode$code$$step: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"dot","d":{"t":"num"},"opt":false}],
  inner$isOrgManager$m: [{"name":"org","d":{"t":"obj","n":"Pick","p":[["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$orgEnabledFeatures$filter$isRealModule: [{"name":"f","d":{"t":"tp","id":"F","of":{"t":"obj","p":[["key",{"t":"str"},false],["module",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$isMember$e: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$effectiveConfigFor$ov: [{"name":"email","d":{"t":"str"},"opt":false},{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false}],
  inner$allowedDesignationsFor$d: [{"name":"email","d":{"t":"str"},"opt":false},{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false}],
  inner$approveMember$e: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$approveMember$members: [{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false},{"name":"email","d":{"t":"str"},"opt":false}],
  inner$approveMember$members$$step: [{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false},{"name":"e","d":{"t":"str"},"opt":false}],
  inner$memberDisplayName$nm: [{"name":"org","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}]},"opt":false},{"name":"email","d":{"t":"str"},"opt":false}],
  inner$memberNamesOf$nm: [{"name":"ov","d":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$whoLabel$w: [{"name":"who","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$setEmployeeOverride$e: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$removeMember$e: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$removeMember$members: [{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false},{"name":"email","d":{"t":"str"},"opt":false}],
  inner$removeMember$members$$step: [{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false},{"name":"e","d":{"t":"str"},"opt":false}],
  inner$allOffConfig$modules$$after_loop: [],
  inner$genJoinCode$h$$after_loop: [{"name":"seed","d":{"t":"str"},"opt":false}],
  inner$genJoinCode$out$$after_loop: [{"name":"seed","d":{"t":"str"},"opt":false}],
  inner$genJoinCode$x$$after_loop: [{"name":"seed","d":{"t":"str"},"opt":false}],
  inner$effectiveConfigFor$modules$$after_loop: [{"name":"email","d":{"t":"str"},"opt":false},{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false},{"name":"orgConfig","d":{"t":"tp","id":"T","of":{"t":"obj","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true]]}},"opt":false}],
  inner$effectiveConfigFor$features$$after_loop: [{"name":"email","d":{"t":"str"},"opt":false},{"name":"org","d":{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false},{"name":"orgConfig","d":{"t":"tp","id":"T","of":{"t":"obj","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true]]}},"opt":false}],
  inner$memberNamesOf$out$$after_loop: [{"name":"org","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgCloudDoc","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}]},"opt":false}],
};
