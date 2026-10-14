// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/skin-golden.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$skinGolden$k(module) {
    const k = module.replace(/\.dart$/, '');
    return k;
}
export function inner$skinGolden$header(skins, module, stats) {
    const header = [`// 🎨 ${module} בעור-forge (GENMAX·G12d) — מחולל דטרמיניסטי: skin-golden.mjs · הזהב לא נגע (טעינה-לצד, חוק-7) · עור: ${Object.values(skins).map((x) => `${x.role}=${x.cls}`).join(' · ')}`,
        `//   החלפות: ${Object.entries(stats).map(([r, n]) => `${r}×${n}`).join(' · ') || '—'} · BareStat ב-Row נשאר DS (רצועת-4) · צבעי-מצב-DS לא מועברים · חיפוש/טבלאות/פילטרים = DS (אטומי-forge של קלט הם ציור, לא שדה)`];
    return header;
}

export const SIGS = {
  inner$skinGolden$k: [{"name":"module","d":{"t":"str"},"opt":false}],
  inner$skinGolden$header: [{"name":"skins","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"out","p":[]}]},"opt":false},{"name":"module","d":{"t":"str"},"opt":false},{"name":"stats","d":{"t":"obj","p":[["stat",{"t":"num"},false],["hero",{"t":"num"},false]]},"opt":false}],
};
