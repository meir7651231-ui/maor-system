// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/platform/PlatformPanel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$PlatformPanel$refresh$all(allRaw) {
    const all = allRaw.filter((o) => !o.deleted);
    return all;
}
export function inner$PlatformPanel$approve$mgr(managerEmail) {
    const mgr = managerEmail.trim().toLowerCase();
    return mgr;
}
export function inner$PlatformPanel$openEditor$row(orgs, s) {
    const row = orgs.find((o) => o.slug === s);
    return row;
}
export function inner$PlatformPanel$saveManager$m(mgrEdit) {
    const m = mgrEdit.trim().toLowerCase();
    return m;
}
export function inner$PlatformPanel$addMember$m(memberAdd) {
    const m = memberAdd.trim().toLowerCase();
    return m;
}

export const SIGS = {
  inner$PlatformPanel$refresh$all: [{"name":"allRaw","d":{"t":"or","of":[{"t":"arr","of":{"t":"undef"}},{"t":"arr","of":{"t":"obj","p":[["config",{"t":"any"},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["memberConfigs",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","n":"EmployeeOverride","p":[["modules",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["weeklyGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["designations",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["displayName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["joinOpen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["joinCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["deleted",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["deletedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["configMeta",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ConfigWriteMeta","p":[["at",{"t":"str"},false],["by",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["via",{"t":"str"},false],["keys",{"t":"arr","of":{"t":"str"}},false]]}]},true],["slug",{"t":"str"},false]]}}]},"opt":false}],
  inner$PlatformPanel$approve$mgr: [{"name":"managerEmail","d":{"t":"str"},"opt":false}],
  inner$PlatformPanel$openEditor$row: [{"name":"orgs","d":{"t":"arr","of":{"t":"obj","n":"OrgRow","p":[["slug",{"t":"str"},false],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provisioned",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["manager",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["config",{"t":"any"},true]]}},"opt":false},{"name":"s","d":{"t":"str"},"opt":false}],
  inner$PlatformPanel$saveManager$m: [{"name":"mgrEdit","d":{"t":"str"},"opt":false}],
  inner$PlatformPanel$addMember$m: [{"name":"memberAdd","d":{"t":"str"},"opt":false}],
};
