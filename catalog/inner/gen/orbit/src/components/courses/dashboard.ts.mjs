// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/dashboard.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$courseDashboard$bump$a(agg, id) {
    let a = agg.get(id);
    return a;
}
export function inner$courseDashboard$map$a(agg, c) {
    const a = agg.get(c.id) ?? { enrolled: 0, waitlist: 0, debt: 0, absences: 0, atRisk: 0 };
    return a;
}
export function inner$courseDashboard$map$occupancy(agg, c) {
    const a = agg.get(c.id) ?? { enrolled: 0, waitlist: 0, debt: 0, absences: 0, atRisk: 0 };
    const max = c.maxStudents || 0;
    const occupancy = max > 0 ? Math.round(Math.min(1, a.enrolled / max) * 100) : 0;
    return occupancy;
}
export function inner$courseDashboard$map$occupancy$$step(a, max) {
    const occupancy = max > 0 ? Math.round(Math.min(1, a.enrolled / max) * 100) : 0;
    return occupancy;
}
export function inner$courseDashboard$withMax(rows) {
    const withMax = rows.filter((r) => r.max > 0);
    return withMax;
}
export function inner$courseDashboard$avgOccupancy(rows) {
    const withMax = rows.filter((r) => r.max > 0);
    const avgOccupancy = withMax.length
        ? Math.round(withMax.reduce((s, r) => s + r.occupancy, 0) / withMax.length)
        : 0;
    return avgOccupancy;
}
export function inner$courseDashboard$avgOccupancy$$step(withMax) {
    const avgOccupancy = withMax.length
        ? Math.round(withMax.reduce((s, r) => s + r.occupancy, 0) / withMax.length)
        : 0;
    return avgOccupancy;
}
export function inner$courseDashboard$summary(rows) {
    const withMax = rows.filter((r) => r.max > 0);
    const avgOccupancy = withMax.length
        ? Math.round(withMax.reduce((s, r) => s + r.occupancy, 0) / withMax.length)
        : 0;
    const summary = {
        courses: rows.length,
        enrolled: rows.reduce((s, r) => s + r.enrolled, 0),
        waitlist: rows.reduce((s, r) => s + r.waitlist, 0),
        debt: rows.reduce((s, r) => s + r.debt, 0),
        avgOccupancy,
        atRisk: rows.reduce((s, r) => s + r.atRisk, 0),
    };
    return summary;
}
export function inner$courseDashboard$summary$$step(rows, avgOccupancy) {
    const summary = {
        courses: rows.length,
        enrolled: rows.reduce((s, r) => s + r.enrolled, 0),
        waitlist: rows.reduce((s, r) => s + r.waitlist, 0),
        debt: rows.reduce((s, r) => s + r.debt, 0),
        avgOccupancy,
        atRisk: rows.reduce((s, r) => s + r.atRisk, 0),
    };
    return summary;
}
export function inner$courseDashboard$mostWanted(rows) {
    const mostWanted = rows.filter((r) => r.waitlist > 0).sort((a, b) => b.waitlist - a.waitlist);
    return mostWanted;
}
export function inner$dashboardCsvRows$body(dash) {
    const body = dash.rows.map((r) => [
        r.name,
        r.teacher,
        r.enrolled,
        r.max || '∞',
        r.max > 0 ? r.occupancy : '—',
        r.waitlist,
        r.debt,
        r.absences,
        r.atRisk,
    ]);
    return body;
}

export const SIGS = {
  inner$courseDashboard$bump$a: [{"name":"agg","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Agg","p":[["enrolled",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$courseDashboard$map$a: [{"name":"agg","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Agg","p":[["enrolled",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$courseDashboard$map$occupancy: [{"name":"agg","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Agg","p":[["enrolled",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$courseDashboard$map$occupancy$$step: [{"name":"a","d":{"t":"obj","n":"Agg","p":[["enrolled",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]},"opt":false},{"name":"max","d":{"t":"num"},"opt":false}],
  inner$courseDashboard$withMax: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false}],
  inner$courseDashboard$avgOccupancy: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false}],
  inner$courseDashboard$avgOccupancy$$step: [{"name":"withMax","d":{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false}],
  inner$courseDashboard$summary: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false}],
  inner$courseDashboard$summary$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false},{"name":"avgOccupancy","d":{"t":"num"},"opt":false}],
  inner$courseDashboard$mostWanted: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},"opt":false}],
  inner$dashboardCsvRows$body: [{"name":"dash","d":{"t":"obj","n":"CourseDashboard","p":[["rows",{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},false],["summary",{"t":"obj","n":"DashboardSummary","p":[["courses",{"t":"num"},false],["enrolled",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["avgOccupancy",{"t":"num"},false],["atRisk",{"t":"num"},false]]},false],["mostWanted",{"t":"arr","of":{"t":"obj","n":"CourseRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacher",{"t":"str"},false],["enrolled",{"t":"num"},false],["max",{"t":"num"},false],["occupancy",{"t":"num"},false],["waitlist",{"t":"num"},false],["debt",{"t":"num"},false],["absences",{"t":"num"},false],["atRisk",{"t":"num"},false]]}},false]]},"opt":false}],
};
