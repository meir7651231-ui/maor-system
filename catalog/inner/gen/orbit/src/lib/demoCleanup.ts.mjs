// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/demoCleanup.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SEP = '';
function fingerprint(rec, fields) {
    return fields.map((f) => String(rec?.[f] ?? '')).join(SEP);
}
export function inner$planDemoCleanup$demoFps(demo, fields) {
    const demoFps = new Set(demo.map((r) => fingerprint(r, fields)));
    return demoFps;
}
export function inner$planDemoCleanup$id(r) {
    const id = String(r.id ?? '');
    return id;
}
export function inner$planDemoCleanup$mid(m) {
    const mid = String(m?.id ?? '');
    return mid;
}
export function inner$planDemoCleanup$total$$after_loop(removed) {
    let total = 0;
    for (const k of Object.keys(removed))
        total += removed[k].count;
    return total;
}

export const SIGS = {
  inner$planDemoCleanup$demoFps: [{"name":"demo","d":{"t":"any"},"opt":false},{"name":"fields","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$planDemoCleanup$id: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planDemoCleanup$mid: [{"name":"m","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planDemoCleanup$total$$after_loop: [{"name":"removed","d":{"t":"rec","of":{"t":"obj","p":[["count",{"t":"num"},false],["names",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
};
