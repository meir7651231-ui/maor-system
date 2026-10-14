// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/CommandPalette.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CommandPalette$idx(active, results) {
    const idx = Math.min(active, Math.max(0, results.length - 1));
    return idx;
}

export const SIGS = {
  inner$CommandPalette$idx: [{"name":"active","d":{"t":"num"},"opt":false},{"name":"results","d":{"t":"arr","of":{"t":"obj","n":"Command","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["data","work","add","import","customreport","dedup","incoming","nedarim","openDonor"]},false],["label",{"t":"str"},false],["hint",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["group",{"t":"lit","v":["ניווט","פעולה","תורם"]},false],["keywords",{"t":"str"},false],["arg",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
};
