// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/builder/sections.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function featureModuleKey(m) {
    return m === 'home' || m === 'settings' || m === 'core' || m === 'shell' || m === 'signup' ? null : m;
}
export function inner$featureEffectiveOn$mk(f) {
    const mk = featureModuleKey(f.module);
    return mk;
}

export const SIGS = {
  inner$featureEffectiveOn$mk: [{"name":"f","d":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]},"opt":false}],
};
