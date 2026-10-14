// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/Browse.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$Browse$q(f) {
    const q = f.bq.trim();
    return q;
}

export const SIGS = {
  inner$Browse$q: [{"name":"f","d":{"t":"obj","n":"BrowseFilters","p":[["bq",{"t":"str"},false],["setBq",{"t":"fn"},false],["disc",{"t":"bool"},false],["setDisc",{"t":"fn"},false],["free",{"t":"bool"},false],["setFree",{"t":"fn"},false],["seek",{"t":"bool"},false],["setSeek",{"t":"fn"},false],["emergency",{"t":"bool"},false],["setEmergency",{"t":"fn"},false],["openOnly",{"t":"bool"},false],["setOpenOnly",{"t":"fn"},false],["aud",{"t":"lit","v":["all","men","women"]},false],["setAud",{"t":"fn"},false],["showAll",{"t":"bool"},false],["setShowAll",{"t":"fn"},false]]},"opt":false}],
};
