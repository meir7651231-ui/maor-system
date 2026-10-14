// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/platform/rolePresets.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function presetModules(preset, scope) {
    const out = {};
    for (const m of preset.hide)
        if (scope.includes(m))
            out[m] = false;
    return out;
}
export function inner$presetMatches$want(preset, scope) {
    const want = presetModules(preset, scope);
    return want;
}
export function inner$presetMatches$wantOff(preset, scope, m) {
    const want = presetModules(preset, scope);
    const wantOff = want[m] === false;
    return wantOff;
}
export function inner$presetMatches$wantOff$$step(want, m) {
    const wantOff = want[m] === false;
    return wantOff;
}
export function inner$presetMatches$haveOff(modules, m) {
    const have = modules ?? {};
    const haveOff = have[m] === false;
    return haveOff;
}
export function inner$presetMatches$haveOff$$step(have, m) {
    const haveOff = have[m] === false;
    return haveOff;
}
export function inner$presetModules$out$$after_loop(preset, scope) {
    const out = {};
    for (const m of preset.hide)
        if (scope.includes(m))
            out[m] = false;
    return out;
}

export const SIGS = {
  inner$presetMatches$want: [{"name":"preset","d":{"t":"obj","n":"RolePreset","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["hide",{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},false]]},"opt":false},{"name":"scope","d":{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},"opt":false}],
  inner$presetMatches$wantOff: [{"name":"preset","d":{"t":"obj","n":"RolePreset","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["hide",{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},false]]},"opt":false},{"name":"scope","d":{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},"opt":false},{"name":"m","d":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},"opt":false}],
  inner$presetMatches$wantOff$$step: [{"name":"want","d":{"t":"rec","of":{"t":"bool"}},"opt":false},{"name":"m","d":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},"opt":false}],
  inner$presetMatches$haveOff: [{"name":"modules","d":{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},"opt":false},{"name":"m","d":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},"opt":false}],
  inner$presetMatches$haveOff$$step: [{"name":"have","d":{"t":"rec","of":{"t":"bool"}},"opt":false},{"name":"m","d":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},"opt":false}],
  inner$presetModules$out$$after_loop: [{"name":"preset","d":{"t":"obj","n":"RolePreset","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["hide",{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},false]]},"opt":false},{"name":"scope","d":{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},"opt":false}],
};
