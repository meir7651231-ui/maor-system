// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/SettingsTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SettingsTab$saveSettings$patch(f) {
    const patch = {
        communityName: f.communityName.trim() || undefined,
        requireApproval: f.requireApproval ? undefined : false,
        contactPhone: f.contactPhone.trim() || undefined,
        dedication: f.dedication.trim() || undefined,
        bookletDedication: f.bookletDedication.trim() || undefined,
    };
    return patch;
}
export function inner$SettingsTab$savePrices$t(prices, k) {
    const t = prices[k].trim();
    return t;
}
export function inner$SettingsTab$savePrices$n(prices, k) {
    const t = prices[k].trim();
    const n = Number(t);
    return n;
}
export function inner$SettingsTab$savePrices$n$$step(t) {
    const n = Number(t);
    return n;
}
export function inner$SettingsTab$useState$out$$after_loop(prefs, PR_PRICE_LABELS, PR_PRICE_DEFAULTS) {
    const out = {};
    for (const [k] of PR_PRICE_LABELS)
        out[k] = String(prefs?.prices?.[k] ?? PR_PRICE_DEFAULTS[k]);
    return out;
}

export const SIGS = {
  inner$SettingsTab$saveSettings$patch: [{"name":"f","d":{"t":"obj","p":[["communityName",{"t":"str"},false],["requireApproval",{"t":"bool"},false],["contactPhone",{"t":"str"},false],["dedication",{"t":"str"},false],["bookletDedication",{"t":"str"},false]]},"opt":false}],
  inner$SettingsTab$savePrices$t: [{"name":"prices","d":{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["board",{"t":"any"},false],["full",{"t":"any"},false],["half",{"t":"any"},false],["featured",{"t":"any"},false],["sponsor",{"t":"any"},false],["dedication",{"t":"any"},false],["job",{"t":"any"},false]]},"opt":false},{"name":"k","d":{"t":"lit","v":["small","board","full","half","featured","sponsor","dedication","job"]},"opt":false}],
  inner$SettingsTab$savePrices$n: [{"name":"prices","d":{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["board",{"t":"any"},false],["full",{"t":"any"},false],["half",{"t":"any"},false],["featured",{"t":"any"},false],["sponsor",{"t":"any"},false],["dedication",{"t":"any"},false],["job",{"t":"any"},false]]},"opt":false},{"name":"k","d":{"t":"lit","v":["small","board","full","half","featured","sponsor","dedication","job"]},"opt":false}],
  inner$SettingsTab$savePrices$n$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$SettingsTab$useState$out$$after_loop: [{"name":"prefs","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["small",{"t":"any"},true],["board",{"t":"any"},true],["full",{"t":"any"},true],["half",{"t":"any"},true],["featured",{"t":"any"},true],["sponsor",{"t":"any"},true],["dedication",{"t":"any"},true],["job",{"t":"any"},true]]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true]]}]},"opt":false},{"name":"PR_PRICE_LABELS","d":{"t":"arr","of":{"t":"tup","of":[{"t":"lit","v":["small","board","full","half","featured","sponsor","dedication","job"]},{"t":"str"},{"t":"str"}]}},"opt":false},{"name":"PR_PRICE_DEFAULTS","d":{"t":"obj","n":"Readonly","p":[["small",{"t":"any"},false],["board",{"t":"any"},false],["full",{"t":"any"},false],["half",{"t":"any"},false],["featured",{"t":"any"},false],["sponsor",{"t":"any"},false],["dedication",{"t":"any"},false],["job",{"t":"any"},false]]},"opt":false}],
};
