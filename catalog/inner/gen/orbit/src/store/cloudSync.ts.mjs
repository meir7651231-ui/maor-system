// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/store/cloudSync.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function describeErr(e) {
    const err = e;
    const code = String(err?.code ?? '');
    const raw = String(err?.message ?? e ?? '');
    const perm = code === 'permission-denied' || /permission[- ]denied/i.test(raw);
    const map = {
        'permission-denied': 'הרשאה חסרה (Rules)',
        unauthenticated: 'ההתחברות פגה — כניסה מחדש',
        unavailable: 'ענן זמנית לא-זמין',
        'failed-precondition': 'תקלת-קדם בענן',
        'resource-exhausted': 'מכסת-הענן מוצתה — נסי שוב מאוחר יותר',
        // נחיל ב׳ (3.9): מסמך >1MB (גלריית-תמונות) / שדה-פגום — Firestore דוחה; retry לא יעזור
        'invalid-argument': 'מסמך גדול/פגום בענן — לא ניתן לדחוף',
    };
    const msg = map[code] || raw.slice(0, 120) || 'שגיאה לא-ידועה';
    return { msg, perm };
}
export function inner$describeErr$code(err) {
    const code = String(err?.code ?? '');
    return code;
}
export function inner$describeErr$raw(e, err) {
    const raw = String(err?.message ?? e ?? '');
    return raw;
}
export function inner$describeErr$perm(e, err) {
    const code = String(err?.code ?? '');
    const raw = String(err?.message ?? e ?? '');
    const perm = code === 'permission-denied' || /permission[- ]denied/i.test(raw);
    return perm;
}
export function inner$describeErr$perm$$step(code, raw) {
    const perm = code === 'permission-denied' || /permission[- ]denied/i.test(raw);
    return perm;
}
export function inner$describeErr$msg(e, err) {
    const code = String(err?.code ?? '');
    const raw = String(err?.message ?? e ?? '');
    const map = {
        'permission-denied': 'הרשאה חסרה (Rules)',
        unauthenticated: 'ההתחברות פגה — כניסה מחדש',
        unavailable: 'ענן זמנית לא-זמין',
        'failed-precondition': 'תקלת-קדם בענן',
        'resource-exhausted': 'מכסת-הענן מוצתה — נסי שוב מאוחר יותר',
        // נחיל ב׳ (3.9): מסמך >1MB (גלריית-תמונות) / שדה-פגום — Firestore דוחה; retry לא יעזור
        'invalid-argument': 'מסמך גדול/פגום בענן — לא ניתן לדחוף',
    };
    const msg = map[code] || raw.slice(0, 120) || 'שגיאה לא-ידועה';
    return msg;
}
export function inner$describeErr$msg$$step(code, raw, map) {
    const msg = map[code] || raw.slice(0, 120) || 'שגיאה לא-ידועה';
    return msg;
}
export function inner$startCloudSync$localById(localList) {
    const localById = new Map(localList.map((x) => [x.id, x]));
    return localById;
}
export function inner$startCloudSync$localIds(localList) {
    const localIds = new Set(localList.map((x) => x.id));
    return localIds;
}
export function inner$startCloudSync$map$l(localById, c) {
    const l = localById.get(c.id);
    return l;
}
export function inner$startCloudSync$cloudIds(cloudList) {
    const cloudIds = new Set(cloudList.map((x) => x.id));
    return cloudIds;
}
export function inner$startCloudSync$localOnly(tombs, col, localList, cloudList) {
    const cloudIds = new Set(cloudList.map((x) => x.id));
    const localOnly = localList.filter((x) => !cloudIds.has(x.id) && !tombs.has(col + '|' + x.id));
    return localOnly;
}
export function inner$startCloudSync$localOnly$$step(tombs, col, localList, cloudIds) {
    const localOnly = localList.filter((x) => !cloudIds.has(x.id) && !tombs.has(col + '|' + x.id));
    return localOnly;
}
export function inner$startCloudSync$subscribe$subscribeAll$info(err) {
    const info = describeErr(err);
    return info;
}
export function inner$flushPush$info(e) {
    const info = describeErr(e);
    return info;
}
export function inner$flushPush$code(e) {
    const code = String(e?.code ?? '');
    return code;
}
export function inner$flushPush$fatal(e) {
    const info = describeErr(e);
    const code = String(e?.code ?? '');
    const fatal = info.perm || code === 'invalid-argument';
    return fatal;
}
export function inner$flushPush$fatal$$step(info, code) {
    const fatal = info.perm || code === 'invalid-argument';
    return fatal;
}

export const SIGS = {
  inner$describeErr$code: [{"name":"err","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["code",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["message",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$describeErr$raw: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"err","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["code",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["message",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$describeErr$perm: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"err","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["code",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["message",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$describeErr$perm$$step: [{"name":"code","d":{"t":"str"},"opt":false},{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$describeErr$msg: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"err","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["code",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["message",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$describeErr$msg$$step: [{"name":"code","d":{"t":"str"},"opt":false},{"name":"raw","d":{"t":"str"},"opt":false},{"name":"map","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
  inner$startCloudSync$localById: [{"name":"localList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false}],
  inner$startCloudSync$localIds: [{"name":"localList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false}],
  inner$startCloudSync$map$l: [{"name":"localById","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false},{"name":"c","d":{"t":"obj","p":[["id",{"t":"str"},false]]},"opt":false}],
  inner$startCloudSync$cloudIds: [{"name":"cloudList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false}],
  inner$startCloudSync$localOnly: [{"name":"tombs","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"col","d":{"t":"lit","v":["families","supporters","deliveries","distributionDays","courses","enrollments","events","rooms","teachers","tzCoordinators","tzBoxes","tzCampaigns","tzEvents","shopItems","shopProducts","shopStores","shopCriteria","shopAssignments","shopEvents","shopIntakes","volunteers","tasks","warehouse","prListings","prRequests","prPosts","prAds","hostUnits","hostBookings","hostRecords"]},"opt":false},{"name":"localList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false},{"name":"cloudList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false}],
  inner$startCloudSync$localOnly$$step: [{"name":"tombs","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"col","d":{"t":"lit","v":["families","supporters","deliveries","distributionDays","courses","enrollments","events","rooms","teachers","tzCoordinators","tzBoxes","tzCampaigns","tzEvents","shopItems","shopProducts","shopStores","shopCriteria","shopAssignments","shopEvents","shopIntakes","volunteers","tasks","warehouse","prListings","prRequests","prPosts","prAds","hostUnits","hostBookings","hostRecords"]},"opt":false},{"name":"localList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false},{"name":"cloudIds","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$startCloudSync$subscribe$subscribeAll$info: [{"name":"err","d":{"t":"any"},"opt":false}],
  inner$flushPush$info: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$flushPush$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$flushPush$fatal: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$flushPush$fatal$$step: [{"name":"info","d":{"t":"obj","p":[["msg",{"t":"str"},false],["perm",{"t":"bool"},false]]},"opt":false},{"name":"code","d":{"t":"str"},"opt":false}],
};
