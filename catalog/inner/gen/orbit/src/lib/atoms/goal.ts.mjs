// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/goal.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PLACE_WORDS = {
    'bookings.turnover': ['חלון הניקיון', 'חלון ניקיון', 'בין עזיבה לכניסה', ['ניקיון', 0.6], ['תורים', 0.5], ['משבצות', 0.5]],
    'bookings.day': ['יום העבודה', 'יום עבודה', 'קבלת אורחים', ['תורים', 0.4]],
    'bookings.stay': ['שהייה', 'השהייה', 'שהייה ארוכה'],
    'bookings.balance': ['יתרה', 'היתרה', 'יתרה לתשלום', ['תשלומים', 0.5]],
    'bookings.total': ['המחיר הכולל', 'מחיר כולל', 'מחיר לאדם', 'מחיר ללילה', ['מחיר', 0.6], ['תשלומים', 0.4]],
    'bookings.untilArrival': ['עד ההגעה', 'עד הכניסה', 'מועדי תשלום'],
    'bookings.nights': ['הזמן הפנוי', 'זמן פנוי', 'לילות', 'לילה', 'לילות פנויים', 'לילה פנוי', ['פנוי', 0.6], ['פנויים', 0.6], ['פנויות', 0.6]],
    'bookings.guestStays': ['הזמנות האורח', 'הזמנות של אורח'],
    'bookings.unitStays': ['הזמנות היחידה', 'הזמנה הבאה'],
    'bookings.sacredDays': [['שבת', 0.5], ['חג', 0.5], ['חגים', 0.5]],
    'bookings.unitFaults': ['תקלות היחידה'],
    'bookings.arrivals': ['הגעה', 'הגעות', 'ההגעה', 'מועדי ההגעה', 'מגיעים', 'מגיע', 'שעת הגעה'],
    'bookings.cleaning': ['מנקה', 'מנקים', 'מנקות', 'משימת ניקיון', 'משימות ניקיון', ['ניקיון', 0.6]],
    'bookings.faults': ['תקלה', 'תקלות', 'תחזוקה', 'אחראי תחזוקה'],
    'bookings.unpaid': ['יתרות פתוחות', 'לא שולם', 'לא שילם', 'לא שילמו', 'גבייה', 'חוב', 'חובות'],
    'bookings.guests': ['אורח', 'אורחים', 'שם אורח', 'שמות האורחים'],
    'zmanim.day': ['שעות זמניות', 'שעה זמנית', 'מהנץ עד השקיעה', 'היום מהנץ'],
    'zmanim.shabbat': ['השבת', 'משמרות שבת', 'תורנות שמירה', 'שמירה', ['שבת', 0.8]],
    'zmanim.times': ['זמני היום', 'שקיעה', 'השקיעה', 'נץ', 'הנץ', 'צאת', 'צאת הכוכבים', 'מניין', 'מנין', 'הדלקת נרות', 'הזמן הבא', 'חצות', 'קריאת שמע', ['זמן', 0.5], ['זמנים', 0.5]],
    'zmanim.closedDays': ['השבת או החג', 'שבת או חג', 'ימים סגורים', 'הימים הסגורים', 'חג ושבת', 'שבת וחג', 'יום טוב', ['חג', 0.8], ['חגים', 0.8]],
    'whatNeed.requests': ['בקשה', 'בקשות', 'הבקשה', 'פנייה', 'פניות'],
    'whatNeed.text': ['הבקשה בטקסט', 'מקצוע', 'המקצוע'],
    'whatNeed.names': ['עסק', 'עסקים', 'שם העסק', 'שמות העסקים'],
    'whatNeed.hours': ['שעות הפתיחה', 'שעות פתיחה'],
    'whatNeed.openings': ['נפתח', 'נסגר', 'נפתחים', 'נסגרים', 'פתוח', 'סגור'],
    'whatNeed.adSlot': ['פרסומת', 'פרסומות', 'משבצת פרסום'],
    'whatNeed.adPrice': ['מחיר הפרסומת', 'מחיר פרסומת', 'מחיר הפרסום'],
};
const PREFIX = /^[והבלמשכ]/;
function variants(tok) {
    const out = [tok];
    let t = tok;
    for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 3; i++) {
        t = t.slice(1);
        out.push(t);
    }
    return out;
}
function core(w) {
    let t = w;
    for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 4; i++)
        t = t.slice(1);
    return t;
}
const sortEntries = (out) => out.sort((a, b) => b.words.length - a.words.length || (a.kind === b.kind ? 0 : a.kind === 'atom' ? -1 : 1));
const PLACE_ORDER = Object.keys(PLACE_WORDS);
const DAY_SPANS = new Set(['bookings.stay', 'bookings.untilArrival']);
const AMOUNT_KINDS = new Set(['amount']);
function matchOf(goal, d) {
    const atoms = d.steps.map((s) => s.atom);
    let m = 0;
    for (const a of goal.atoms)
        if (atoms.includes(a))
            m += 2;
    const order = goal.atoms.filter((a) => atoms.includes(a));
    if (order.length > 1 && order.every((a, i) => i === 0 || atoms.indexOf(a) > atoms.indexOf(order[i - 1])))
        m += 1;
    m += goal.placeScore[d.rootPlace] ?? 0;
    return m;
}
const isStrong = (goal, place) => (goal.placeScore[place] ?? 0) >= 1;
function outcomeOf(title) {
    // FACTORY 14.10: כותרת של מקום שנמצא אוטומטית = "<המקום>: <מה יוצא>" ⇒ רק מה שיוצא ("מחולק לתשלומים שווים")
    const gen = /^[^:]+: (.+)$/.exec(title);
    if (gen && !/\d:$/.test(title.split(': ')[0]))
        return gen[1];
    // החלק האחרון שאומר משהו: לא רק שעות ("תורים באורך משתנה · 11:00–15:00" ⇒ השם) ולא המקום ("· לפי בני ברק")
    const bits = title.split(' · ').map((b) => b.trim()).filter((b) => b && !/^לפי /.test(b) && !/^[\d:–\-/ ]+$/.test(b));
    return bits.length ? bits[bits.length - 1] : '';
}
const sameParams = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function inner$wordMatch$vs(tok) {
    const vs = variants(tok);
    return vs;
}
export function inner$wordMatch$a(tok) {
    const a = core(tok);
    return a;
}
export function inner$wordMatch$b(w) {
    const b = core(w);
    return b;
}
export function inner$generatedPlaceWords$head(p) {
    const head = String(p.name ?? '').split(/ של | שמחכים|, | \(|:/)[0].trim();
    return head;
}
export function inner$fn$txt(p) {
    const [txt, w] = typeof p === 'string' ? [p, 1] : p;
    return txt;
}
export function inner$fn$w(p) {
    const [txt, w] = typeof p === 'string' ? [p, 1] : p;
    return w;
}
export function inner$parseNum$s(t) {
    const s = t.replace(/^₪/, '');
    return s;
}
export function inner$near$i(from) {
    let i = Math.max(0, from);
    return i;
}
export function inner$readParams$tt(toks) {
    const tt = toks.map((x) => x.t);
    return tt;
}
export function inner$readParams$dual(DUAL, toks, i) {
    const tt = toks.map((x) => x.t);
    const dual = variants(tt[i]).map((v) => DUAL[v]).find(Boolean);
    return dual;
}
export function inner$readParams$dual$$step(DUAL, tt, i) {
    const dual = variants(tt[i]).map((v) => DUAL[v]).find(Boolean);
    return dual;
}
export function inner$readParams$minutes(n, unit) {
    const minutes = unit === 'min' ? n : unit === 'hour' ? n * 60 : unit === 'day' ? n * 1440 : 0;
    return minutes;
}
export function inner$readParams$toRound(toks, i) {
    const tt = toks.map((x) => x.t);
    const toRound = /^ל/.test(tt[i]) || tt[i - 1] === 'ל' || (/^(חצי|רבע)$/.test(variants(tt[i]).at(-1) ?? '') && /^ל/.test(tt[i]));
    return toRound;
}
export function inner$readParams$toRound$$step(tt, i) {
    const toRound = /^ל/.test(tt[i]) || tt[i - 1] === 'ל' || (/^(חצי|רבע)$/.test(variants(tt[i]).at(-1) ?? '') && /^ל/.test(tt[i]));
    return toRound;
}
export function inner$readParams$tx(toks) {
    const tt = toks.map((x) => x.t);
    const tx = tt.join(' ');
    return tx;
}
export function inner$readParams$tx$$step(tt) {
    const tx = tt.join(' ');
    return tx;
}
export function inner$readGoal$raw(text) {
    const raw = typeof text === 'string' ? text.slice(0, 400) : '';
    return raw;
}
export function inner$readGoal$pre(text) {
    const raw = typeof text === 'string' ? text.slice(0, 400) : '';
    const pre = raw.replace(/(\d),(\d{3})/g, '$1$2').replace(/₪\s*/g, ' ₪').replace(/(\d)\s*₪/g, ' ₪$1');
    return pre;
}
export function inner$readGoal$pre$$step(raw) {
    const pre = raw.replace(/(\d),(\d{3})/g, '$1$2').replace(/₪\s*/g, ' ₪').replace(/(\d)\s*₪/g, ' ₪$1');
    return pre;
}
export function inner$readGoal$placeToks(toks) {
    const placeToks = toks.map((x) => ({ t: x.t, used: false }));
    return placeToks;
}
export function inner$readGoal$entries(ENTRIES, extra) {
    const entries = extra.length ? sortEntries([...ENTRIES, ...extra]) : ENTRIES;
    return entries;
}
export function inner$readGoal$list(toks, e) {
    const placeToks = toks.map((x) => ({ t: x.t, used: false }));
    const list = e.kind === 'atom' ? toks : placeToks;
    return list;
}
export function inner$readGoal$list$$step(toks, placeToks, e) {
    const list = e.kind === 'atom' ? toks : placeToks;
    return list;
}
export function inner$readGoal$claims(e) {
    const claims = e.kind === 'atom' || e.words.length > 1;
    return claims;
}
export function inner$readGoal$atoms(atomAt) {
    const atoms = [...atomAt.entries()].sort((a, b) => a[1] - b[1]).map(([a]) => a);
    return atoms;
}
export function inner$readGoal$places(placeScore) {
    const places = Object.keys(placeScore).sort((a, b) => placeScore[b] - placeScore[a] || PLACE_ORDER.indexOf(a) - PLACE_ORDER.indexOf(b));
    return places;
}
export function inner$withPick$places(goal, pick) {
    const places = [pick.place, ...goal.places.filter((p) => p !== pick.place)];
    return places;
}
export function inner$rawParamsFor$amount(place) {
    const amount = AMOUNT_KINDS.has(place.kind);
    return amount;
}
export function inner$rawParamsFor$size(place, gp) {
    const size = DAY_SPANS.has(place.id) ? gp.sizeMin / 1440 : gp.sizeMin;
    return size;
}
export function inner$rawParamsFor$step(place, gp) {
    const amount = AMOUNT_KINDS.has(place.kind);
    const step = (amount ? gp.stepMoney : gp.stepMin) ?? gp.bare;
    return step;
}
export function inner$rawParamsFor$step$$step(gp, amount) {
    const step = (amount ? gp.stepMoney : gp.stepMin) ?? gp.bare;
    return step;
}
export function inner$earned$every$first(goal, d) {
    const first = d.steps.findIndex((x) => goal.atoms.includes(x.atom));
    return first;
}
export function inner$enumerate$savedById(saved) {
    const savedById = new Map(saved.map((c) => [c.id, c]));
    return savedById;
}
export function inner$enumerate$grow$last(d) {
    const last = d.caps[d.caps.length - 1];
    return last;
}
export function inner$enumerate$grow$parent(savedById, d) {
    const last = d.caps[d.caps.length - 1];
    const parent = savedById.get(last.id) ?? last;
    return parent;
}
export function inner$enumerate$grow$parent$$step(savedById, last) {
    const parent = savedById.get(last.id) ?? last;
    return parent;
}
export function inner$enumerate$grow$caps(savedById, d, child) {
    const last = d.caps[d.caps.length - 1];
    const parent = savedById.get(last.id) ?? last;
    const caps = [...d.caps.slice(0, -1), parent, child];
    return caps;
}
export function inner$enumerate$grow$caps$$step(d, parent, child) {
    const caps = [...d.caps.slice(0, -1), parent, child];
    return caps;
}
export function inner$matchOf$atoms(d) {
    const atoms = d.steps.map((s) => s.atom);
    return atoms;
}
export function inner$matchOf$order(goal, d) {
    const atoms = d.steps.map((s) => s.atom);
    const order = goal.atoms.filter((a) => atoms.includes(a));
    return order;
}
export function inner$matchOf$order$$step(goal, atoms) {
    const order = goal.atoms.filter((a) => atoms.includes(a));
    return order;
}
export function inner$sayComposition$out(c) {
    const out = c.title ? outcomeOf(c.title) : '';
    return out;
}
export function inner$minutesWord$a(m) {
    const a = Math.abs(m);
    return a;
}
export function inner$paramPhrase$days(place) {
    const days = DAY_SPANS.has(place) || place.endsWith('#span');
    return days;
}
export function inner$outcomeOf$gen(title) {
    const gen = /^[^:]+: (.+)$/.exec(title);
    return gen;
}
export function inner$outcomeOf$bits(title) {
    const bits = title.split(' · ').map((b) => b.trim()).filter((b) => b && !/^לפי /.test(b) && !/^[\d:–\-/ ]+$/.test(b));
    return bits;
}
export function inner$composeGoal$saved(caps) {
    const saved = Array.isArray(caps) ? caps : [];
    return saved;
}
export function inner$composeGoal$strong(goal) {
    const strong = goal.places.filter((p) => isStrong(goal, p));
    return strong;
}
export function inner$composeGoal$scores(goal) {
    const strong = goal.places.filter((p) => isStrong(goal, p));
    const scores = [...new Set(strong.map((p) => goal.placeScore[p]))].sort((a, b) => b - a);
    return scores;
}
export function inner$composeGoal$scores$$step(goal, strong) {
    const scores = [...new Set(strong.map((p) => goal.placeScore[p]))].sort((a, b) => b - a);
    return scores;
}
export function inner$composeGoal$roots(proven) {
    const roots = new Set(proven.map((x) => x.d.rootPlace));
    return roots;
}
export function inner$composeGoal$hinted(goal, proven) {
    const hinted = proven.filter((x) => (goal.placeScore[x.d.rootPlace] ?? 0) > 0);
    return hinted;
}
export function inner$composeGoal$hintRoots(goal, proven) {
    const hinted = proven.filter((x) => (goal.placeScore[x.d.rootPlace] ?? 0) > 0);
    const hintRoots = new Set(hinted.map((x) => x.d.rootPlace));
    return hintRoots;
}
export function inner$composeGoal$hintRoots$$step(hinted) {
    const hintRoots = new Set(hinted.map((x) => x.d.rootPlace));
    return hintRoots;
}
export function inner$composeGoal$list(goal, proven) {
    const strong = goal.places.filter((p) => isStrong(goal, p));
    const anyPlace = !strong.length;
    const hinted = proven.filter((x) => (goal.placeScore[x.d.rootPlace] ?? 0) > 0);
    const hintRoots = new Set(hinted.map((x) => x.d.rootPlace));
    const list = anyPlace && hintRoots.size === 1 ? hinted : proven;
    return list;
}
export function inner$composeGoal$list$$step(anyPlace, proven, hinted, hintRoots) {
    const list = anyPlace && hintRoots.size === 1 ? hinted : proven;
    return list;
}
export function inner$prove$forEach$last(d) {
    const last = d.caps[d.caps.length - 1];
    return last;
}
export function inner$prove$forEach$create(saved, d) {
    const last = d.caps[d.caps.length - 1];
    const create = d.caps.filter((c) => {
        const s = saved.find((x) => x.id === c.id);
        return !s || (c.id === last.id && !sameParams(s.params, c.params));
    });
    return create;
}
export function inner$prove$forEach$create$$step(saved, d, last) {
    const create = d.caps.filter((c) => {
        const s = saved.find((x) => x.id === c.id);
        return !s || (c.id === last.id && !sameParams(s.params, c.params));
    });
    return create;
}
export function inner$prove$forEach$filter$s(saved, c) {
    const s = saved.find((x) => x.id === c.id);
    return s;
}
export function inner$prove$forEach$savedSame(saved, d) {
    const last = d.caps[d.caps.length - 1];
    const savedSame = saved.some((x) => x.id === last.id && sameParams(x.params, last.params));
    return savedSame;
}
export function inner$prove$forEach$savedSame$$step(saved, last) {
    const savedSame = saved.some((x) => x.id === last.id && sameParams(x.params, last.params));
    return savedSame;
}
export function inner$prove$forEach$comp(goal, saved, d, pv) {
    const last = d.caps[d.caps.length - 1];
    const create = d.caps.filter((c) => {
        const s = saved.find((x) => x.id === c.id);
        return !s || (c.id === last.id && !sameParams(s.params, c.params));
    });
    const savedSame = saved.some((x) => x.id === last.id && sameParams(x.params, last.params));
    const comp = { id: last.id, engine: d.engine, steps: d.steps, create, title: pv.title, lines: pv.lines, sentence: '', match: matchOf(goal, d), saved: savedSame };
    return comp;
}
export function inner$prove$forEach$comp$$step(goal, d, last, pv, create, savedSame) {
    const comp = { id: last.id, engine: d.engine, steps: d.steps, create, title: pv.title, lines: pv.lines, sentence: '', match: matchOf(goal, d), saved: savedSame };
    return comp;
}
export function inner$atomQuestion$singles(proven) {
    const singles = proven.filter((x) => x.d.steps.length === 1);
    return singles;
}
export function inner$askAtoms$strong(goal) {
    const strong = goal.places.filter((p) => isStrong(goal, p));
    return strong;
}
export function inner$askAtoms$singles(all, place) {
    const singles = all.filter((d) => d.steps.length === 1 && d.rootPlace === place);
    return singles;
}
export function inner$askAtoms$chips(proven, ATOM_EXPLAIN) {
    const chips = proven.map((x) => {
        const a = ATOM_EXPLAIN[x.d.steps[0].atom];
        return { label: a.emoji + ' ' + a.name, pick: { atom: x.d.steps[0].atom } };
    });
    return chips;
}
export function inner$variants$out$$after_loop(tok) {
    const out = [tok];
    let t = tok;
    for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 3; i++) {
        t = t.slice(1);
        out.push(t);
    }
    return out;
}
export function inner$variants$t$$after_loop(tok) {
    const out = [tok];
    let t = tok;
    for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 3; i++) {
        t = t.slice(1);
        out.push(t);
    }
    return t;
}
export function inner$core$t$$after_loop(w) {
    let t = w;
    for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 4; i++)
        t = t.slice(1);
    return t;
}

export const SIGS = {
  inner$wordMatch$vs: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$wordMatch$a: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$wordMatch$b: [{"name":"w","d":{"t":"str"},"opt":false}],
  inner$generatedPlaceWords$head: [{"name":"p","d":{"t":"obj","n":"Place","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false]]},"opt":false}],
  inner$fn$txt: [{"name":"p","d":{"t":"or","of":[{"t":"str"},{"t":"tup","of":[{"t":"str"},{"t":"num"}]}]},"opt":false}],
  inner$fn$w: [{"name":"p","d":{"t":"or","of":[{"t":"str"},{"t":"tup","of":[{"t":"str"},{"t":"num"}]}]},"opt":false}],
  inner$parseNum$s: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$near$i: [{"name":"from","d":{"t":"num"},"opt":false}],
  inner$readParams$tt: [{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false}],
  inner$readParams$dual: [{"name":"DUAL","d":{"t":"rec","of":{"t":"obj","p":[["n",{"t":"num"},false],["unit",{"t":"lit","v":["min","day","group","count","part","hour","night","money"]},false]]}},"opt":false},{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$readParams$dual$$step: [{"name":"DUAL","d":{"t":"rec","of":{"t":"obj","p":[["n",{"t":"num"},false],["unit",{"t":"lit","v":["min","day","group","count","part","hour","night","money"]},false]]}},"opt":false},{"name":"tt","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$readParams$minutes: [{"name":"n","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"unit","d":{"t":"or","of":[{"t":"lit","v":["min","day","group","count","part","hour","night","money"]},{"t":"null"}]},"opt":false}],
  inner$readParams$toRound: [{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$readParams$toRound$$step: [{"name":"tt","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$readParams$tx: [{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false}],
  inner$readParams$tx$$step: [{"name":"tt","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$readGoal$raw: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$readGoal$pre: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$readGoal$pre$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$readGoal$placeToks: [{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false}],
  inner$readGoal$entries: [{"name":"ENTRIES","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"lit","v":["atom"]},false],["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["place"]},false],["id",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]}]}},"opt":false},{"name":"extra","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"lit","v":["atom"]},false],["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["place"]},false],["id",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]}]}},"opt":false}],
  inner$readGoal$list: [{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false},{"name":"e","d":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"lit","v":["atom"]},false],["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["place"]},false],["id",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]}]},"opt":false}],
  inner$readGoal$list$$step: [{"name":"toks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false},{"name":"placeToks","d":{"t":"arr","of":{"t":"obj","n":"Tok","p":[["t",{"t":"str"},false],["used",{"t":"bool"},false]]}},"opt":false},{"name":"e","d":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"lit","v":["atom"]},false],["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["place"]},false],["id",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]}]},"opt":false}],
  inner$readGoal$claims: [{"name":"e","d":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"lit","v":["atom"]},false],["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]},{"t":"obj","p":[["kind",{"t":"lit","v":["place"]},false],["id",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["w",{"t":"num"},false]]}]},"opt":false}],
  inner$readGoal$atoms: [{"name":"atomAt","d":{"t":"map","k":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},"v":{"t":"num"}},"opt":false}],
  inner$readGoal$places: [{"name":"placeScore","d":{"t":"rec","of":{"t":"num"}},"opt":false}],
  inner$withPick$places: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"pick","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"GoalPick","p":[["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true],["place",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$rawParamsFor$amount: [{"name":"place","d":{"t":"obj","n":"Pick","p":[["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["id",{"t":"str"},false]]},"opt":false}],
  inner$rawParamsFor$size: [{"name":"place","d":{"t":"obj","n":"Pick","p":[["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["id",{"t":"str"},false]]},"opt":false},{"name":"gp","d":{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$rawParamsFor$step: [{"name":"place","d":{"t":"obj","n":"Pick","p":[["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["id",{"t":"str"},false]]},"opt":false},{"name":"gp","d":{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$rawParamsFor$step$$step: [{"name":"gp","d":{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"amount","d":{"t":"bool"},"opt":false}],
  inner$earned$every$first: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$enumerate$savedById: [{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$enumerate$grow$last: [{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$enumerate$grow$parent: [{"name":"savedById","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$enumerate$grow$parent$$step: [{"name":"savedById","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"last","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$enumerate$grow$caps: [{"name":"savedById","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false},{"name":"child","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$enumerate$grow$caps$$step: [{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false},{"name":"parent","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"child","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$matchOf$atoms: [{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$matchOf$order: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$matchOf$order$$step: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"atoms","d":{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},"opt":false}],
  inner$sayComposition$out: [{"name":"c","d":{"t":"obj","p":[["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["title",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$minutesWord$a: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$paramPhrase$days: [{"name":"place","d":{"t":"str"},"opt":false}],
  inner$outcomeOf$gen: [{"name":"title","d":{"t":"str"},"opt":false}],
  inner$outcomeOf$bits: [{"name":"title","d":{"t":"str"},"opt":false}],
  inner$composeGoal$saved: [{"name":"caps","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$composeGoal$strong: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false}],
  inner$composeGoal$scores: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false}],
  inner$composeGoal$scores$$step: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"strong","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$composeGoal$roots: [{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false}],
  inner$composeGoal$hinted: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false}],
  inner$composeGoal$hintRoots: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false}],
  inner$composeGoal$hintRoots$$step: [{"name":"hinted","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false}],
  inner$composeGoal$list: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false}],
  inner$composeGoal$list$$step: [{"name":"anyPlace","d":{"t":"bool"},"opt":false},{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false},{"name":"hinted","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false},{"name":"hintRoots","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$prove$forEach$last: [{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$prove$forEach$create: [{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$prove$forEach$create$$step: [{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false},{"name":"last","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$prove$forEach$filter$s: [{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"c","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$prove$forEach$savedSame: [{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$prove$forEach$savedSame$$step: [{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"last","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$prove$forEach$comp: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"saved","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false},{"name":"pv","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false}],
  inner$prove$forEach$comp$$step: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false},{"name":"d","d":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false},{"name":"last","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"pv","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Preview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false},{"name":"create","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"savedSame","d":{"t":"bool"},"opt":false}],
  inner$atomQuestion$singles: [{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false]]}},"opt":false}],
  inner$askAtoms$strong: [{"name":"goal","d":{"t":"obj","n":"Goal","p":[["text",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["places",{"t":"arr","of":{"t":"str"}},false],["params",{"t":"obj","n":"GoalParams","p":[["parts",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["sizeMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["waitMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["nights",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["count",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["stepMoney",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["dir",{"t":"or","of":[{"t":"lit","v":["up","down","nearest"]},{"t":"undef"}]},true],["rotateBy",{"t":"or","of":[{"t":"lit","v":["day","item"]},{"t":"undef"}]},true],["group",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["bare",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},false],["unclear",{"t":"bool"},false],["placeScore",{"t":"rec","of":{"t":"num"}},false],["hits",{"t":"num"},false]]},"opt":false}],
  inner$askAtoms$singles: [{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false},{"name":"place","d":{"t":"str"},"opt":false}],
  inner$askAtoms$chips: [{"name":"proven","d":{"t":"arr","of":{"t":"obj","p":[["d",{"t":"obj","n":"Draft","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["rootPlace",{"t":"str"},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},false],["c",{"t":"obj","n":"Composition","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["steps",{"t":"arr","of":{"t":"obj","n":"GoalStep","p":[["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["place",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false]]}},false],["create",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false],["sentence",{"t":"str"},false],["match",{"t":"num"},false],["saved",{"t":"bool"},false]]},false]]}},"opt":false},{"name":"ATOM_EXPLAIN","d":{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},false],["merge",{"t":"any"},false],["next",{"t":"any"},false],["round",{"t":"any"},false],["offset",{"t":"any"},false],["escalate",{"t":"any"},false],["rotate",{"t":"any"},false],["fuzzy",{"t":"any"},false]]},"opt":false}],
  inner$variants$out$$after_loop: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$variants$t$$after_loop: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$core$t$$after_loop: [{"name":"w","d":{"t":"str"},"opt":false}],
};
