// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/SettingsTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SettingsTab$commit$k(patch) {
    const k = Object.keys(patch)[0];
    return k;
}

export const SIGS = {
  inner$SettingsTab$commit$k: [{"name":"patch","d":{"t":"obj","n":"Partial","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[["mode",{"t":"or","of":[{"t":"lit","v":["shabbat","prep","off","motzash"]},{"t":"undef"}]},true],["candle",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["havdalah",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["level",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["mashgiach",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},"opt":false}],
};
