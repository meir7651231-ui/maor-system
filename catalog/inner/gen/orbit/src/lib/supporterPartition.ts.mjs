// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/supporterPartition.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supKeyOf$f(sp) {
    const f = (sp.forWho ?? '').trim();
    return f;
}
export function inner$docSkey$spId(data) {
    const spId = typeof data.spId === 'string' ? data.spId : '';
    return spId;
}
export function inner$supAllowedKeys$clean(allowed) {
    const clean = [...new Set(allowed.map((s) => s.trim()).filter(Boolean))].slice(0, 29);
    return clean;
}

export const SIGS = {
  inner$supKeyOf$f: [{"name":"sp","d":{"t":"obj","n":"Pick","p":[["forWho",{"t":"str"},false]]},"opt":false}],
  inner$docSkey$spId: [{"name":"data","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$supAllowedKeys$clean: [{"name":"allowed","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
