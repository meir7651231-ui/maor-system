// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/cloudConfig.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$patchOrgCloudConfig$keys(ops) {
    const keys = ops.slice(0, 12).map((o) => o.path.join('.'));
    return keys;
}
export function inner$writeOrgSecrets$v(patch, k) {
    const v = (patch[k] ?? '').trim();
    return v;
}
export function inner$findMemberOrgSlugs$mail(email) {
    const mail = email.trim().toLowerCase();
    return mail;
}
export function inner$removeOrgMember$variants(email) {
    const variants = [...new Set([email.trim(), email.trim().toLowerCase()])];
    return variants;
}
export function inner$markSupportRead$field(side) {
    const field = side === 'admin' ? 'unreadAdmin' : 'unreadUser';
    return field;
}

export const SIGS = {
  inner$patchOrgCloudConfig$keys: [{"name":"ops","d":{"t":"arr","of":{"t":"obj","n":"ConfigPatchOp","p":[["path",{"t":"arr","of":{"t":"str"}},false],["value",{"t":"any"},true],["del",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true]]}},"opt":false}],
  inner$writeOrgSecrets$v: [{"name":"patch","d":{"t":"obj","n":"Partial","p":[["yemotToken",{"t":"any"},true],["nedarimMosad",{"t":"any"},true],["nedarimApiPass",{"t":"any"},true],["smsApiKey",{"t":"any"},true],["smtpUrl",{"t":"any"},true],["solaXKey",{"t":"any"},true],["gcontactsClientId",{"t":"any"},true],["gcontactsClientSecret",{"t":"any"},true],["gcontactsRefresh",{"t":"any"},true]]},"opt":false},{"name":"k","d":{"t":"lit","v":["yemotToken","nedarimMosad","nedarimApiPass","smsApiKey","smtpUrl","solaXKey","gcontactsClientId","gcontactsClientSecret","gcontactsRefresh"]},"opt":false}],
  inner$findMemberOrgSlugs$mail: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$removeOrgMember$variants: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$markSupportRead$field: [{"name":"side","d":{"t":"lit","v":["admin","user"]},"opt":false}],
};
