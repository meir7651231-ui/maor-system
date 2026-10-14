// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/app/src/21-views-b.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$class$render$tasks(late, DB) {
    const tasks = [
        ['צ׳קים להפקדה', DB.payments.filter(p => p.method === 'המחאה').length, 'עד יום חמישי', 2],
        ['משפחות בפיגור', late.length, 'שיחה או תזכורת', 5],
        ['בקשות הנחה', DB.families.filter(f => f.discount >= 21).length, 'ממתינות לוועדה', 1],
        ['הלוואות', DB.loans.filter(l => l.stage === 'בקשה').length, 'להחזר החודש', 3],
        ['קבלות', DB.payments.slice(0, 12).length, 'להפקה', 4],
    ];
    return tasks;
}
export function inner$class$mount$calc$addEventListener$d(amount) {
    const d = amount.value.replace(/[^\d]/g, '');
    return d;
}
export function inner$class$mount$search$v(q) {
    const v = q.value.trim();
    return v;
}
export function inner$class$render$pct(c, got) {
    const pct = got / c.goal * 100;
    return pct;
}
export function inner$class$render$wall(DB) {
    const wall = DB.donations.slice(0, 8);
    return wall;
}
export function inner$class$render$map$dn(d, DB) {
    const dn = DB.donors.find(x => x.id === d.donorId);
    return dn;
}
export function inner$class$render$maxM(DB) {
    const maxM = Math.max(...DB.budget.map(b => Math.max(...b.months)), 240);
    return maxM;
}
export function inner$class$render$perMonth(DB) {
    const perMonth = DB.hmonths.map((_, i) => DB.budget.reduce((a, b) => a + b.months[i], 0));
    return perMonth;
}
export function inner$class$render$planM(bt) {
    const planM = Math.round(bt.plan / 11);
    return planM;
}
export function inner$class$render$map$pct(b, a) {
    const pct = Math.round(a / b.plan * 100);
    return pct;
}
export function inner$class$render$map$over(b, a) {
    const over = a > b.plan;
    return over;
}
export function inner$class$render$map$x(i) {
    const x = 632 - 12 - i * 49;
    return x;
}
export function inner$class$render$map$hp(maxM, planM) {
    const hp = planM / maxM * 150;
    return hp;
}
export function inner$class$render$map$hr(maxM, perMonth, i) {
    const hr = perMonth[i] / maxM * 150;
    return hr;
}
export function inner$class$mount$addEventListener$f(DB) {
    const f = DB.families.find(x => !x.seat);
    return f;
}

export const SIGS = {
  inner$class$render$tasks: [{"name":"late","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$calc$addEventListener$d: [{"name":"amount","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false}],
  inner$class$mount$search$v: [{"name":"q","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false}],
  inner$class$render$pct: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"got","d":{"t":"num"},"opt":false}],
  inner$class$render$wall: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$map$dn: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$maxM: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$perMonth: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$planM: [{"name":"bt","d":{"t":"obj","p":[["plan",{"t":"num"},false],["actual",{"t":"num"},false]]},"opt":false}],
  inner$class$render$map$pct: [{"name":"b","d":{"t":"undef"},"opt":false},{"name":"a","d":{"t":"num"},"opt":false}],
  inner$class$render$map$over: [{"name":"b","d":{"t":"undef"},"opt":false},{"name":"a","d":{"t":"num"},"opt":false}],
  inner$class$render$map$x: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$class$render$map$hp: [{"name":"maxM","d":{"t":"num"},"opt":false},{"name":"planM","d":{"t":"num"},"opt":false}],
  inner$class$render$map$hr: [{"name":"maxM","d":{"t":"num"},"opt":false},{"name":"perMonth","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$class$mount$addEventListener$f: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
};
