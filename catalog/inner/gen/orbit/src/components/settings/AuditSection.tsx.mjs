// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/settings/AuditSection.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AuditSection$map$rows(byCat, cat) {
    const rows = byCat.get(cat);
    return rows;
}
export function inner$AuditSection$useMemo$m$$after_loop(AUDIT_CATEGORIES) {
    const m = new Map();
    for (const c of AUDIT_CATEGORIES)
        m.set(c, []);
    return m;
}

export const SIGS = {
  inner$AuditSection$map$rows: [{"name":"byCat","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"AuditIssue","p":[["cat",{"t":"lit","v":["טלפון","כפילות","ת\"ז","אימייל","כתובת","לוגיקה","ילדים","קשר"]},false],["title",{"t":"str"},false],["famId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false},{"name":"cat","d":{"t":"lit","v":["טלפון","כפילות","ת\"ז","אימייל","כתובת","לוגיקה","ילדים","קשר"]},"opt":false}],
  inner$AuditSection$useMemo$m$$after_loop: [{"name":"AUDIT_CATEGORIES","d":{"t":"arr","of":{"t":"lit","v":["טלפון","כפילות","ת\"ז","אימייל","כתובת","לוגיקה","ילדים","קשר"]}},"opt":false}],
};
