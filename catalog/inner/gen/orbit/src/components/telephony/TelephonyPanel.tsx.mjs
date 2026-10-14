// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/telephony/TelephonyPanel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$TelephonyPanel$generate$bundle(tenantId, orgName, p) {
    const bundle = JSON.stringify({ tenantId, orgName, generatedFor: 'FreeSWITCH/FusionPBX', files: p.files }, null, 2);
    return bundle;
}
export function inner$TelephonyPanel$gradeColor(preview) {
    const trust = preview?.trust ?? null;
    const gradeColor = trust?.grade === 'A' || trust?.grade === 'B'
        ? 'var(--ok, #0e7a6c)'
        : trust?.grade === 'C'
            ? 'var(--warn, #b7791f)'
            : 'var(--danger, #b3362a)';
    return gradeColor;
}
export function inner$TelephonyPanel$gradeColor$$step(trust) {
    const gradeColor = trust?.grade === 'A' || trust?.grade === 'B'
        ? 'var(--ok, #0e7a6c)'
        : trust?.grade === 'C'
            ? 'var(--warn, #b7791f)'
            : 'var(--danger, #b3362a)';
    return gradeColor;
}

export const SIGS = {
  inner$TelephonyPanel$generate$bundle: [{"name":"tenantId","d":{"t":"str"},"opt":false},{"name":"orgName","d":{"t":"str"},"opt":false},{"name":"p","d":{"t":"obj","n":"TelephonyPreview","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["rows",{"t":"arr","of":{"t":"obj","n":"PreviewRow","p":[["when",{"t":"str"},false],["caller",{"t":"str"},false],["summary",{"t":"str"},false],["outcome",{"t":"str"},false]]}},false],["trust",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["grade",{"t":"str"},false],["score",{"t":"num"},false],["ready",{"t":"bool"},false],["failing",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["detail",{"t":"str"},false],["severity",{"t":"str"},false]]}},false]]}]},false],["files",{"t":"or","of":[{"t":"null"},{"t":"rec","of":{"t":"str"}}]},false]]},"opt":false}],
  inner$TelephonyPanel$gradeColor: [{"name":"preview","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"TelephonyPreview","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["rows",{"t":"arr","of":{"t":"obj","n":"PreviewRow","p":[["when",{"t":"str"},false],["caller",{"t":"str"},false],["summary",{"t":"str"},false],["outcome",{"t":"str"},false]]}},false],["trust",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["grade",{"t":"str"},false],["score",{"t":"num"},false],["ready",{"t":"bool"},false],["failing",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["detail",{"t":"str"},false],["severity",{"t":"str"},false]]}},false]]}]},false],["files",{"t":"or","of":[{"t":"null"},{"t":"rec","of":{"t":"str"}}]},false]]}]},"opt":false}],
  inner$TelephonyPanel$gradeColor$$step: [{"name":"trust","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["grade",{"t":"str"},false],["score",{"t":"num"},false],["ready",{"t":"bool"},false],["failing",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["detail",{"t":"str"},false],["severity",{"t":"str"},false]]}},false]]}]},"opt":false}],
};
