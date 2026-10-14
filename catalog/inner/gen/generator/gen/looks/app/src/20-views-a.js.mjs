// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/app/src/20-views-a.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SLOTS = [['08:00', '08:45'], ['08:50', '09:35'], ['09:40', '10:25'], ['10:25', '10:45'], ['10:45', '11:30'],
    ['11:35', '12:20'], ['12:20', '13:45'], ['13:45', '14:30'], ['14:35', '15:20']];
const mins = s => +s.slice(0, 2) * 60 + +s.slice(3);
const H0 = 6;
const H1 = 22;
const GCOLS = (H1 - H0) * 2;
const t2c = (t) => Math.min(GCOLS + 2, Math.max(2, (+t.slice(0, 2) - H0) * 2 + (+t.slice(3) >= 30 ? 1 : 0) + 2));
export function inner$class$render$byMonth(DB) {
    const byMonth = DB.hmonths.map((m, i) => DB.donations.filter(d => d.ago % 12 === i).reduce((a, d) => a + d.amount, 0) / 1000);
    return byMonth;
}
export function inner$class$render$noDriver(DB) {
    const noDriver = DB.routes.filter(r => !r.driver);
    return noDriver;
}
export function inner$class$render$absent(DB) {
    const absent = DB.staff.filter(s => s.absent);
    return absent;
}
export function inner$class$render$kinds(DB) {
    const kinds = [...new Set(DB.people.map(p => p.kind))];
    return kinds;
}
export function inner$class$mount$tie$s(p, DB) {
    const s = DB.staff.find(x => x.personId === p.id);
    return s;
}
export function inner$class$mount$tie$s_L148(p, DB) {
    const s = DB.students.find(x => x.personId === p.id);
    return s;
}
export function inner$class$mount$tie$f(p, DB) {
    const f = DB.families.find(x => x.head === p.id || x.spouse === p.id);
    return f;
}
export function inner$class$mount$tie$d(p, DB) {
    const d = DB.donors.find(x => x.personId === p.id);
    return d;
}
export function inner$class$mount$view$q(AN) {
    const q = AN.q.trim();
    return q;
}
export function inner$class$mount$view$filter$n(p) {
    const n = p.first + ' ' + p.last;
    return n;
}
export function inner$class$mount$paint$pages(AN, v) {
    const pages = Math.max(1, Math.ceil(v.length / AN.per));
    return pages;
}
export function inner$class$mount$paint$slice(AN, v) {
    const slice = v.slice((AN.page - 1) * AN.per, AN.page * AN.per);
    return slice;
}
export function inner$class$mount$paint$i(AN) {
    let i = AN.page - 1;
    return i;
}
export function inner$class$mount$paint$out(AN) {
    const out = [`<button type="button" id="prev"${AN.page === 1 ? ' disabled' : ''} aria-label="הקודם">‹</button>`];
    return out;
}
export function inner$class$mount$paint$i_L198(AN, rows) {
    const i = Math.min(AN.focus, rows.length - 1);
    return i;
}
export function inner$class$mount$leave$p(id, DB) {
    const p = DB.people.find(x => x.id === id);
    return p;
}
export function inner$class$mount$leave$nm(p) {
    const nm = p.first + ' ' + p.last;
    return nm;
}
export function inner$class$render$ss(c, DB) {
    const ss = DB.students.filter(s => s.classId === c.id);
    return ss;
}
export function inner$class$mount$now(d) {
    const now = d.getHours() * 60 + d.getMinutes();
    return now;
}
export function inner$class$mount$i(d) {
    const now = d.getHours() * 60 + d.getMinutes();
    const i = SLOTS.findIndex(s => now >= mins(s[0]) && now < mins(s[1]));
    return i;
}
export function inner$class$mount$i$$step(now) {
    const i = SLOTS.findIndex(s => now >= mins(s[0]) && now < mins(s[1]));
    return i;
}
export function inner$class$mount$f(d) {
    const now = d.getHours() * 60 + d.getMinutes();
    const i = SLOTS.findIndex(s => now >= mins(s[0]) && now < mins(s[1]));
    const f = (now - mins(SLOTS[i][0])) / (mins(SLOTS[i][1]) - mins(SLOTS[i][0]));
    return f;
}
export function inner$class$mount$f$$step(now, i) {
    const f = (now - mins(SLOTS[i][0])) / (mins(SLOTS[i][1]) - mins(SLOTS[i][0]));
    return f;
}
export function inner$class$render$cover(DB) {
    const cover = Array.from({ length: GCOLS }, (_, i) => {
        const c = i + 2;
        return DB.staff.reduce((n, s) => n + (s.shifts.some(([a, b]) => c >= t2c(a) && c < t2c(b)) ? 1 : 0), 0);
    });
    return cover;
}
export function inner$class$render$from$c(i) {
    const c = i + 2;
    return c;
}
export function inner$class$render$thin(DB) {
    const cover = Array.from({ length: GCOLS }, (_, i) => {
        const c = i + 2;
        return DB.staff.reduce((n, s) => n + (s.shifts.some(([a, b]) => c >= t2c(a) && c < t2c(b)) ? 1 : 0), 0);
    });
    const thin = cover.indexOf(Math.min(...cover.filter(v => v > 0)));
    return thin;
}
export function inner$class$render$thin$$step(cover) {
    const thin = cover.indexOf(Math.min(...cover.filter(v => v > 0)));
    return thin;
}
export function inner$class$render$maxc(DB) {
    const cover = Array.from({ length: GCOLS }, (_, i) => {
        const c = i + 2;
        return DB.staff.reduce((n, s) => n + (s.shifts.some(([a, b]) => c >= t2c(a) && c < t2c(b)) ? 1 : 0), 0);
    });
    const maxc = Math.max(...cover);
    return maxc;
}
export function inner$class$render$maxc$$step(cover) {
    const maxc = Math.max(...cover);
    return maxc;
}
export function inner$class$render$absent_L329(DB) {
    const absent = DB.staff.filter(s => s.absent);
    return absent;
}
export function inner$class$render$map$row(r) {
    const row = r + 2;
    return row;
}
export function inner$class$mount$h(d) {
    const h = d.getHours() + d.getMinutes() / 60;
    return h;
}

export const SIGS = {
  inner$class$render$byMonth: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$noDriver: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$absent: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$kinds: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$tie$s: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$tie$s_L148: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$tie$f: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$tie$d: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$view$q: [{"name":"AN","d":{"t":"obj","p":[["page",{"t":"num"},false],["per",{"t":"num"},false],["key",{"t":"str"},false],["dir",{"t":"num"},false],["q",{"t":"str"},false],["kind",{"t":"str"},false],["left",{"t":"bool"},false],["focus",{"t":"null"},false]]},"opt":false}],
  inner$class$mount$view$filter$n: [{"name":"p","d":{"t":"undef"},"opt":false}],
  inner$class$mount$paint$pages: [{"name":"AN","d":{"t":"obj","p":[["page",{"t":"num"},false],["per",{"t":"num"},false],["key",{"t":"str"},false],["dir",{"t":"num"},false],["q",{"t":"str"},false],["kind",{"t":"str"},false],["left",{"t":"bool"},false],["focus",{"t":"null"},false]]},"opt":false},{"name":"v","d":{"t":"arr","of":{"t":"obj","p":[["p",{"t":"undef"},false],["name",{"t":"str"},false],["kind",{"t":"any"},false],["city",{"t":"any"},false],["tieO",{"t":"or","of":[{"t":"obj","p":[["t",{"t":"any"},false],["bal",{"t":"num"},false],["href",{"t":"str"},false]]},{"t":"obj","p":[["t",{"t":"str"},false],["bal",{"t":"num"},false],["href",{"t":"undef"},true]]}]},false]]}},"opt":false}],
  inner$class$mount$paint$slice: [{"name":"AN","d":{"t":"obj","p":[["page",{"t":"num"},false],["per",{"t":"num"},false],["key",{"t":"str"},false],["dir",{"t":"num"},false],["q",{"t":"str"},false],["kind",{"t":"str"},false],["left",{"t":"bool"},false],["focus",{"t":"null"},false]]},"opt":false},{"name":"v","d":{"t":"arr","of":{"t":"obj","p":[["p",{"t":"undef"},false],["name",{"t":"str"},false],["kind",{"t":"any"},false],["city",{"t":"any"},false],["tieO",{"t":"or","of":[{"t":"obj","p":[["t",{"t":"any"},false],["bal",{"t":"num"},false],["href",{"t":"str"},false]]},{"t":"obj","p":[["t",{"t":"str"},false],["bal",{"t":"num"},false],["href",{"t":"undef"},true]]}]},false]]}},"opt":false}],
  inner$class$mount$paint$i: [{"name":"AN","d":{"t":"obj","p":[["page",{"t":"num"},false],["per",{"t":"num"},false],["key",{"t":"str"},false],["dir",{"t":"num"},false],["q",{"t":"str"},false],["kind",{"t":"str"},false],["left",{"t":"bool"},false],["focus",{"t":"null"},false]]},"opt":false}],
  inner$class$mount$paint$out: [{"name":"AN","d":{"t":"obj","p":[["page",{"t":"num"},false],["per",{"t":"num"},false],["key",{"t":"str"},false],["dir",{"t":"num"},false],["q",{"t":"str"},false],["kind",{"t":"str"},false],["left",{"t":"bool"},false],["focus",{"t":"null"},false]]},"opt":false}],
  inner$class$mount$paint$i_L198: [{"name":"AN","d":{"t":"obj","p":[["page",{"t":"num"},false],["per",{"t":"num"},false],["key",{"t":"str"},false],["dir",{"t":"num"},false],["q",{"t":"str"},false],["kind",{"t":"str"},false],["left",{"t":"bool"},false],["focus",{"t":"null"},false]]},"opt":false},{"name":"rows","d":{"t":"obj","n":"HTMLCollection","p":[["namedItem",{"t":"fn"},false],["length",{"t":"num"},false],["item",{"t":"fn"},false]]},"opt":false}],
  inner$class$mount$leave$p: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$leave$nm: [{"name":"p","d":{"t":"undef"},"opt":false}],
  inner$class$render$ss: [{"name":"c","d":{"t":"undef"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$now: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$class$mount$i: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$class$mount$i$$step: [{"name":"now","d":{"t":"num"},"opt":false}],
  inner$class$mount$f: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$class$mount$f$$step: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$class$render$cover: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$from$c: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$class$render$thin: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$thin$$step: [{"name":"cover","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$class$render$maxc: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$maxc$$step: [{"name":"cover","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$class$render$absent_L329: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$map$row: [{"name":"r","d":{"t":"num"},"opt":false}],
  inner$class$mount$h: [{"name":"d","d":{"t":"date"},"opt":false}],
};
