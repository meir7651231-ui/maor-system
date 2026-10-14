// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/retention.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$acquisitionCohorts$year(scan) {
    const year = +scan.first.slice(0, 4);
    return year;
}
export function inner$acquisitionCohorts$row(map, scan) {
    const year = +scan.first.slice(0, 4);
    let row = map.get(year);
    return row;
}
export function inner$acquisitionCohorts$row$$step(map, year) {
    let row = map.get(year);
    return row;
}
export function inner$acquisitionCohorts$cohorts(map) {
    const cohorts = [...map.values()].sort((a, b) => a.year - b.year);
    return cohorts;
}
export function inner$acquisitionCohorts$totSize$$after_loop(map) {
    const cohorts = [...map.values()].sort((a, b) => a.year - b.year);
    let totSize = 0;
    let totActive = 0;
    for (const c of cohorts) {
        c.ltv = Math.round(c.ltv);
        c.retentionPct = c.size > 0 ? Math.round((c.activeNow / c.size) * 100) : 0;
        totSize += c.size;
        totActive += c.activeNow;
    }
    return totSize;
}
export function inner$acquisitionCohorts$totActive$$after_loop(map) {
    const cohorts = [...map.values()].sort((a, b) => a.year - b.year);
    let totSize = 0;
    let totActive = 0;
    for (const c of cohorts) {
        c.ltv = Math.round(c.ltv);
        c.retentionPct = c.size > 0 ? Math.round((c.activeNow / c.size) * 100) : 0;
        totSize += c.size;
        totActive += c.activeNow;
    }
    return totActive;
}

export const SIGS = {
  inner$acquisitionCohorts$year: [{"name":"scan","d":{"t":"obj","n":"DonorScan","p":[["count",{"t":"num"},false],["ils",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["monthly",{"t":"arr","of":{"t":"num"}},false]]},"opt":false}],
  inner$acquisitionCohorts$row: [{"name":"map","d":{"t":"map","k":{"t":"num"},"v":{"t":"obj","n":"CohortYear","p":[["year",{"t":"num"},false],["size",{"t":"num"},false],["activeNow",{"t":"num"},false],["retentionPct",{"t":"num"},false],["ltv",{"t":"num"},false]]}},"opt":false},{"name":"scan","d":{"t":"obj","n":"DonorScan","p":[["count",{"t":"num"},false],["ils",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["monthly",{"t":"arr","of":{"t":"num"}},false]]},"opt":false}],
  inner$acquisitionCohorts$row$$step: [{"name":"map","d":{"t":"map","k":{"t":"num"},"v":{"t":"obj","n":"CohortYear","p":[["year",{"t":"num"},false],["size",{"t":"num"},false],["activeNow",{"t":"num"},false],["retentionPct",{"t":"num"},false],["ltv",{"t":"num"},false]]}},"opt":false},{"name":"year","d":{"t":"num"},"opt":false}],
  inner$acquisitionCohorts$cohorts: [{"name":"map","d":{"t":"map","k":{"t":"num"},"v":{"t":"obj","n":"CohortYear","p":[["year",{"t":"num"},false],["size",{"t":"num"},false],["activeNow",{"t":"num"},false],["retentionPct",{"t":"num"},false],["ltv",{"t":"num"},false]]}},"opt":false}],
  inner$acquisitionCohorts$totSize$$after_loop: [{"name":"map","d":{"t":"map","k":{"t":"num"},"v":{"t":"obj","n":"CohortYear","p":[["year",{"t":"num"},false],["size",{"t":"num"},false],["activeNow",{"t":"num"},false],["retentionPct",{"t":"num"},false],["ltv",{"t":"num"},false]]}},"opt":false}],
  inner$acquisitionCohorts$totActive$$after_loop: [{"name":"map","d":{"t":"map","k":{"t":"num"},"v":{"t":"obj","n":"CohortYear","p":[["year",{"t":"num"},false],["size",{"t":"num"},false],["activeNow",{"t":"num"},false],["retentionPct",{"t":"num"},false],["ltv",{"t":"num"},false]]}},"opt":false}],
};
