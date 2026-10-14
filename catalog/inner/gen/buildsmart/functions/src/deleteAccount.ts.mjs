// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/deleteAccount.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$purgeMultiPartyReferences$scrub$key(collection, field) {
    const key = `${collection}.${field}`;
    return key;
}
export function inner$purgeIntelForSubject$raw(stitchSnap) {
    const raw = stitchSnap.exists ? stitchSnap.get("anonKeys") : undefined;
    return raw;
}
export function inner$purgeIntelForSubject$actorKeys(uid, anonKeys) {
    const actorKeys = Array.from(new Set([uid, ...anonKeys]));
    return actorKeys;
}
export function inner$purgeIntelForSubject$purgeByActorKey$chunk(actorKeys, i) {
    const inChunk = 30;
    const chunk = actorKeys.slice(i, i + inChunk);
    return chunk;
}
export function inner$purgeIntelForSubject$chunk(uid, anonKeys, i) {
    const inChunk = 30;
    const actorKeys = Array.from(new Set([uid, ...anonKeys]));
    const chunk = actorKeys.slice(i, i + inChunk);
    return chunk;
}
export function inner$purgeIntelForSubject$chunk$$step(actorKeys, i) {
    const inChunk = 30;
    const chunk = actorKeys.slice(i, i + inChunk);
    return chunk;
}
export function inner$onCall$uid(request) {
    const data = (request.data ?? {});
    const uid = String(data.uid ?? "").trim();
    return uid;
}
export function inner$onCall$uid$$step(data) {
    const uid = String(data.uid ?? "").trim();
    return uid;
}

export const SIGS = {
  inner$purgeMultiPartyReferences$scrub$key: [{"name":"collection","d":{"t":"str"},"opt":false},{"name":"field","d":{"t":"str"},"opt":false}],
  inner$purgeIntelForSubject$raw: [{"name":"stitchSnap","d":{"t":"any"},"opt":false}],
  inner$purgeIntelForSubject$actorKeys: [{"name":"uid","d":{"t":"str"},"opt":false},{"name":"anonKeys","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$purgeIntelForSubject$purgeByActorKey$chunk: [{"name":"actorKeys","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$purgeIntelForSubject$chunk: [{"name":"uid","d":{"t":"str"},"opt":false},{"name":"anonKeys","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$purgeIntelForSubject$chunk$$step: [{"name":"actorKeys","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$onCall$uid: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$uid$$step: [{"name":"data","d":{"t":"obj","p":[["uid",{"t":"any"},true]]},"opt":false}],
};
