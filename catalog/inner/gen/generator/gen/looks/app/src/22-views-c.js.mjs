// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/app/src/22-views-c.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const LFLOW = ['בקשה', 'ועדה', 'אושר', 'ניתן', 'בהחזר', 'נפרע'];
export function inner$class$render$inside(DB) {
    const inside = DB.queue.find(q => q.state === 'inside');
    return inside;
}
export function inner$class$render$wait(DB) {
    const wait = DB.queue.filter(q => q.state === 'wait');
    return wait;
}
export function inner$class$mount$onclick$f(nm, DB) {
    const f = DB.families.find(x => x.name === nm) || DB.families.find(x => x.name.includes(nm));
    return f;
}
export function inner$class$mount$onclick$no(DB) {
    const no = Math.max(...DB.queue.map(q => q.no)) + 1;
    return no;
}
export function inner$class$mount$addEventListener$q(b, DB) {
    const q = DB.queue.find(x => x.id === b.dataset.in);
    return q;
}
export function inner$class$mount$addEventListener$prev(DB) {
    const prev = DB.queue.find(x => x.state === 'inside');
    return prev;
}
export function inner$class$render$late(DB) {
    const late = DB.loans.filter(l => l.stage === 'באיחור');
    return late;
}
export function inner$class$render$map$sum(cards) {
    const sum = cards.reduce((a, c) => a + c.amount, 0);
    return sum;
}
export function inner$class$mount$addEventListener$i(b, l) {
    const i = LFLOW.indexOf(l.stage) + (+b.dataset.dir);
    return i;
}
export function inner$card$i(l) {
    const i = LFLOW.indexOf(l.stage);
    return i;
}
export function inner$class$mount$onclick$d(DB) {
    const d = DB.staff.find(s => s.role === 'נהג' && !s.absent);
    return d;
}
export function inner$lineSvg$step(r) {
    const W = 760;
    const pad = 64;
    const step = (W - pad * 2) / Math.max(1, r.stops.length - 1);
    return step;
}
export function inner$lineSvg$forEach$last(r, k) {
    const last = k === r.stops.length - 1;
    return last;
}
export function inner$class$render$p(pid, DB) {
    const p = DB.proposals.find(x => x.id === pid) || DB.proposals[0];
    return p;
}
export function inner$class$render$yes(pid, DB) {
    const p = DB.proposals.find(x => x.id === pid) || DB.proposals[0];
    const yes = p.crit.filter(c => c.ok === 'yes').length;
    return yes;
}
export function inner$class$render$yes$$step(p) {
    const yes = p.crit.filter(c => c.ok === 'yes').length;
    return yes;
}
export function inner$class$render$pct(pid, DB) {
    const p = DB.proposals.find(x => x.id === pid) || DB.proposals[0];
    const yes = p.crit.filter(c => c.ok === 'yes').length;
    const pct = Math.round(yes / p.crit.length * 100);
    return pct;
}
export function inner$class$render$pct$$step(p, yes) {
    const pct = Math.round(yes / p.crit.length * 100);
    return pct;
}
export function inner$class$mount$addEventListener$p(b, DB) {
    const p = DB.proposals.find(x => x.id === b.dataset.p);
    return p;
}
export function inner$class$mount$paint$segs(s, n) {
    const segs = Math.max(1, Math.ceil(n / (/[֐-׿]/.test(s) ? 70 : 160)));
    return segs;
}

export const SIGS = {
  inner$class$render$inside: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$wait: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$onclick$f: [{"name":"nm","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$onclick$no: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$addEventListener$q: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$addEventListener$prev: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$late: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$map$sum: [{"name":"cards","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$class$mount$addEventListener$i: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"undef"},"opt":false}],
  inner$card$i: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$class$mount$onclick$d: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$lineSvg$step: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$lineSvg$forEach$last: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$class$render$p: [{"name":"pid","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$yes: [{"name":"pid","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$yes$$step: [{"name":"p","d":{"t":"undef"},"opt":false}],
  inner$class$render$pct: [{"name":"pid","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$render$pct$$step: [{"name":"p","d":{"t":"undef"},"opt":false},{"name":"yes","d":{"t":"num"},"opt":false}],
  inner$class$mount$addEventListener$p: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$class$mount$paint$segs: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
