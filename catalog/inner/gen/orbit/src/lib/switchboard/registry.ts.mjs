// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/switchboard/registry.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isAvailable$a(BY_ID, id) {
    const a = BY_ID.get(id);
    return a;
}
export function inner$installProvider$info(BY_ID, id) {
    const info = BY_ID.get(id);
    return info;
}
export function inner$loadEntry$cur(loadingModules, e) {
    const cur = loadingModules.get(e.module);
    return cur;
}
export function inner$ask$info(BY_ID, id) {
    const info = BY_ID.get(id);
    return info;
}
export function inner$ask$a(BY_ID, installed, id) {
    const info = BY_ID.get(id);
    const a = installed.get(info.id);
    return a;
}
export function inner$ask$a$$step(installed, info) {
    const a = installed.get(info.id);
    return a;
}
export function inner$ask$err(BY_ID, failedModules, id) {
    const info = BY_ID.get(id);
    const err = failedModules.get(info.module);
    return err;
}
export function inner$ask$err$$step(failedModules, info) {
    const err = failedModules.get(info.module);
    return err;
}
export function inner$readsFor$keys$$after_loop(REGISTRY, mods) {
    const keys = new Set();
    for (const e of REGISTRY)
        if (mods.has(e.module))
            for (const k of e.reads)
                keys.add(k);
    return keys;
}

export const SIGS = {
  inner$isAvailable$a: [{"name":"BY_ID","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$installProvider$info: [{"name":"BY_ID","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$loadEntry$cur: [{"name":"loadingModules","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"obj","n":"ProviderEntry","p":[["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["reads",{"t":"arr","of":{"t":"lit","v":["families","supporters","deliveries","distributionDays","courses","reports","v","savedAt","seq","receiptSeq","donationSeq","shopReceiptSeq","enrollments","events","rooms","teachers","tzCoordinators","tzBoxes","tzCampaigns","tzEvents","shopItems","shopProducts","shopStores","shopCriteria","shopAssignments","shopEvents","shopIntakes","volunteers","tasks","warehouse","prListings","prRequests","prPosts","prAds","hostUnits","hostBookings","hostRecords","orgName","orgSite","orgDonate","orgGoal","budget","usdRate","notif","ui","attnDone","security","audit","delLog"]}},false],["abilities",{"t":"rec","of":{"t":"obj","n":"AbilityMeta","p":[["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["quiet",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["load",{"t":"fn"},false]]},"opt":false}],
  inner$ask$info: [{"name":"BY_ID","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}},"opt":false},{"name":"id","d":{"t":"tp","id":"K","of":{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]}},"opt":false}],
  inner$ask$a: [{"name":"BY_ID","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}},"opt":false},{"name":"installed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"LoadedAbility","p":[["run",{"t":"fn"},false],["today",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["input",{"t":"any"},false],["lines",{"t":"fn"},false]]}]},true]]}},"opt":false},{"name":"id","d":{"t":"tp","id":"K","of":{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]}},"opt":false}],
  inner$ask$a$$step: [{"name":"installed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"LoadedAbility","p":[["run",{"t":"fn"},false],["today",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["input",{"t":"any"},false],["lines",{"t":"fn"},false]]}]},true]]}},"opt":false},{"name":"info","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}]},"opt":false}],
  inner$ask$err: [{"name":"BY_ID","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}},"opt":false},{"name":"failedModules","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"id","d":{"t":"tp","id":"K","of":{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]}},"opt":false}],
  inner$ask$err$$step: [{"name":"failedModules","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"info","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AbilityInfo","p":[["id",{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["label",{"t":"str"},false],["flag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["quiet",{"t":"bool"},false]]}]},"opt":false}],
  inner$readsFor$keys$$after_loop: [{"name":"REGISTRY","d":{"t":"tup","of":[{"t":"obj","p":[["module",{"t":"lit","v":["hosting"]},false],["reads",{"t":"tup","of":[{"t":"lit","v":["hostUnits"]},{"t":"lit","v":["hostBookings"]},{"t":"lit","v":["hostRecords"]},{"t":"lit","v":["ui"]},{"t":"lit","v":["orgName"]}]},false],["abilities",{"t":"obj","p":[["hosting.today",{"t":"obj","p":[["label",{"t":"lit","v":["האירוח היום"]},false]]},false],["hosting.availability",{"t":"obj","p":[["label",{"t":"lit","v":["בדיקת יחידת אירוח פנויה"]},false]]},false]]},false],["load",{"t":"fn"},false]]},{"t":"obj","p":[["module",{"t":"lit","v":["parnasa"]},false],["reads",{"t":"tup","of":[{"t":"lit","v":["prListings"]},{"t":"lit","v":["prPosts"]},{"t":"lit","v":["ui"]}]},false],["abilities",{"t":"obj","p":[["parnasa.findPro",{"t":"obj","p":[["label",{"t":"lit","v":["מציאת בעל מקצוע"]},false],["flag",{"t":"lit","v":["parnasa.directory"]},false]]},false],["parnasa.shabbat",{"t":"obj","p":[["label",{"t":"lit","v":["זמני השבת"]},false],["flag",{"t":"lit","v":["parnasa.zmanim"]},false]]},false],["parnasa.minyanim",{"t":"obj","p":[["label",{"t":"lit","v":["מניינים בקהילה"]},false],["flag",{"t":"lit","v":["parnasa.board"]},false]]},false],["parnasa.emergency",{"t":"obj","p":[["label",{"t":"lit","v":["מספרי חירום"]},false],["flag",{"t":"lit","v":["parnasa.board"]},false]]},false]]},false],["load",{"t":"fn"},false]]},{"t":"obj","p":[["module",{"t":"lit","v":["calendar"]},false],["reads",{"t":"tup","of":[]},false],["abilities",{"t":"obj","p":[["calendar.dayInfo",{"t":"obj","p":[["label",{"t":"lit","v":["יום בלוח העברי"]},false],["quiet",{"t":"lit","v":[true]},false]]},false]]},false],["load",{"t":"fn"},false]]}]},"opt":false},{"name":"mods","d":{"t":"set","of":{"t":"str"}},"opt":false}],
};
