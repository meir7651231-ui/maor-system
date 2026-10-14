// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/timer/BodyMap.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$loadStore$o(raw) {
    const o = raw ? JSON.parse(raw) : {};
    return o;
}
export function inner$BodyMap$clientLabel(families, clientKey) {
    const clientLabel = clientKey.startsWith('fam:')
        ? families.find((f) => 'fam:' + f.id === clientKey)?.name ?? '—'
        : clientKey.slice('free:'.length) || 'ללא שם';
    return clientLabel;
}
export function inner$BodyMap$clientOptions(families) {
    const clientOptions = [
        ...families.map((f) => ({ value: 'fam:' + f.id, label: f.name })),
        { value: 'free:', label: '— שם חופשי —' },
    ];
    return clientOptions;
}
export function inner$BodyMap$map$map$zoneId(r, z) {
    const zoneId = r.key + '/' + z;
    return zoneId;
}
export function inner$BodyMap$map$map$reached(zones, r, z) {
    const zoneId = r.key + '/' + z;
    const st = zones[zoneId] ?? { done: 0, target: 0 };
    const reached = st.target > 0 && st.done >= st.target;
    return reached;
}
export function inner$BodyMap$map$map$reached$$step(st) {
    const reached = st.target > 0 && st.done >= st.target;
    return reached;
}
export function inner$BodyMap$totals$$after_loop(store, clientKey) {
    const zones = store[clientKey] ?? {};
    const totals = { done: 0, target: 0 };
    for (const z of Object.values(zones)) {
        totals.done += z.done;
        totals.target += z.target;
    }
    return totals;
}

export const SIGS = {
  inner$loadStore$o: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$BodyMap$clientLabel: [{"name":"families","d":{"t":"arr","of":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]}},"opt":false},{"name":"clientKey","d":{"t":"str"},"opt":false}],
  inner$BodyMap$clientOptions: [{"name":"families","d":{"t":"arr","of":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]}},"opt":false}],
  inner$BodyMap$map$map$zoneId: [{"name":"r","d":{"t":"obj","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["zones",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"z","d":{"t":"str"},"opt":false}],
  inner$BodyMap$map$map$reached: [{"name":"zones","d":{"t":"rec","of":{"t":"obj","n":"ZoneState","p":[["done",{"t":"num"},false],["target",{"t":"num"},false]]}},"opt":false},{"name":"r","d":{"t":"obj","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["zones",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"z","d":{"t":"str"},"opt":false}],
  inner$BodyMap$map$map$reached$$step: [{"name":"st","d":{"t":"obj","n":"ZoneState","p":[["done",{"t":"num"},false],["target",{"t":"num"},false]]},"opt":false}],
  inner$BodyMap$totals$$after_loop: [{"name":"store","d":{"t":"rec","of":{"t":"rec","of":{"t":"obj","n":"ZoneState","p":[["done",{"t":"num"},false],["target",{"t":"num"},false]]}}},"opt":false},{"name":"clientKey","d":{"t":"str"},"opt":false}],
};
