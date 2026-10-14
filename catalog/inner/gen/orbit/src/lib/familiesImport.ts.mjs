// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/familiesImport.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clean = (x) => (x ?? '').replace(/\s+/g, ' ').trim();
export function inner$parseFamiliesCsv$name(r) {
    let name = clean(r[0]);
    return name;
}
export function inner$parseFamiliesCsv$city(r) {
    let city = clean(r[6]);
    return city;
}
export function inner$parseFamiliesCsv$stc(r) {
    const noteRaw = r[12] || '';
    const stc = clean((noteRaw.match(/סטטוס:\s*([^\n]+)/) || [])[1] || '');
    return stc;
}
export function inner$parseFamiliesCsv$stc$$step(noteRaw) {
    const stc = clean((noteRaw.match(/סטטוס:\s*([^\n]+)/) || [])[1] || '');
    return stc;
}
export function inner$parseFamiliesCsv$obj(r, name, isFair, city) {
    const noteRaw = r[12] || '';
    const stc = clean((noteRaw.match(/סטטוס:\s*([^\n]+)/) || [])[1] || '');
    const obj = {
        name,
        father: '',
        mother: clean(r[3]),
        fatherId: clean(r[1]),
        motherId: clean(r[4]),
        phone: clean(r[2]) === '-' ? '' : clean(r[2]),
        phone2: clean(r[5]) === '-' ? '' : clean(r[5]),
        email: '',
        address: clean([r[7], r[8]].map(clean).filter(Boolean).join(' ')),
        city,
        status: stc.includes('לא פעיל') ? 'inactive' : 'active',
        maritalStatus: stc.includes('אלמנ') || (r[9] || '').includes('אלמן')
            ? 'אלמן/ה'
            : stc.includes('גרוש')
                ? 'גרושים'
                : 'נשואים',
        language: 'עברית',
        community: clean(r[10]) || 'חסידי',
        notes: isFair ? 'השתתפה ביריד חנוכה תשפ"ו' : '',
    };
    return obj;
}
export function inner$parseFamiliesCsv$obj$$step(r, name, isFair, city, stc) {
    const obj = {
        name,
        father: '',
        mother: clean(r[3]),
        fatherId: clean(r[1]),
        motherId: clean(r[4]),
        phone: clean(r[2]) === '-' ? '' : clean(r[2]),
        phone2: clean(r[5]) === '-' ? '' : clean(r[5]),
        email: '',
        address: clean([r[7], r[8]].map(clean).filter(Boolean).join(' ')),
        city,
        status: stc.includes('לא פעיל') ? 'inactive' : 'active',
        maritalStatus: stc.includes('אלמנ') || (r[9] || '').includes('אלמן')
            ? 'אלמן/ה'
            : stc.includes('גרוש')
                ? 'גרושים'
                : 'נשואים',
        language: 'עברית',
        community: clean(r[10]) || 'חסידי',
        notes: isFair ? 'השתתפה ביריד חנוכה תשפ"ו' : '',
    };
    return obj;
}
export function inner$mergeFamilyImport$out$$after_loop(f, obj) {
    const out = { ...f };
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v)
            out[k] = v;
    }
    return out;
}

export const SIGS = {
  inner$parseFamiliesCsv$name: [{"name":"r","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseFamiliesCsv$city: [{"name":"r","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseFamiliesCsv$stc: [{"name":"r","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseFamiliesCsv$stc$$step: [{"name":"noteRaw","d":{"t":"str"},"opt":false}],
  inner$parseFamiliesCsv$obj: [{"name":"r","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"name","d":{"t":"str"},"opt":false},{"name":"isFair","d":{"t":"bool"},"opt":false},{"name":"city","d":{"t":"str"},"opt":false}],
  inner$parseFamiliesCsv$obj$$step: [{"name":"r","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"name","d":{"t":"str"},"opt":false},{"name":"isFair","d":{"t":"bool"},"opt":false},{"name":"city","d":{"t":"str"},"opt":false},{"name":"stc","d":{"t":"str"},"opt":false}],
  inner$mergeFamilyImport$out$$after_loop: [{"name":"f","d":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]},"opt":false},{"name":"obj","d":{"t":"obj","n":"FamilyImportRow","p":[["name",{"t":"str"},false],["father",{"t":"lit","v":[""]},false],["mother",{"t":"str"},false],["fatherId",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"lit","v":[""]},false],["address",{"t":"str"},false],["city",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["maritalStatus",{"t":"str"},false],["language",{"t":"lit","v":["עברית"]},false],["community",{"t":"str"},false],["notes",{"t":"str"},false]]},"opt":false}],
};
