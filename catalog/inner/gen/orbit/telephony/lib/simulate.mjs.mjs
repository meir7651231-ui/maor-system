// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/simulate.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function addDaysIso(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12) + n * 86400000).toISOString().slice(0, 10);
}
function hhmmToMin(s) {
    const [h, m] = String(s).split(':').map(Number);
    return h * 60 + m;
}
const padHHMM = (s) => { const [h, m] = String(s).split(':'); return `${String(Number(h) || 0).padStart(2, '0')}:${String(Number(m) || 0).padStart(2, '0')}`; };
const DOW_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
function resolveMoment(call) {
    if (call.dow != null && call.hhmm)
        return { dow: call.dow, minutes: hhmmToMin(call.hhmm) };
    if (call.date) {
        const d = new Date(`${call.date}T${call.hhmm || '12:00'}:00Z`);
        return { dow: d.getUTCDay(), minutes: hhmmToMin(call.hhmm || '12:00') };
    }
    return { dow: 0, minutes: 12 * 60 };
}
export function inner$addDaysIso$y(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return y;
}
export function inner$addDaysIso$m(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return m;
}
export function inner$addDaysIso$d(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d;
}
export function inner$zmanimClosedReason$at(call) {
    const at = `${call.date}T${padHHMM(call.hhmm || '12:00')}`;
    return at;
}
export function inner$zmanimClosedReason$fullEnd(opts) {
    const fullEnd = addDaysIso(opts.anchorDate, (opts.calendarWindow || 400) - 1);
    return fullEnd;
}
export function inner$hhmmToMin$h(s) {
    const [h, m] = String(s).split(':').map(Number);
    return h;
}
export function inner$hhmmToMin$m(s) {
    const [h, m] = String(s).split(':').map(Number);
    return m;
}
export function inner$padHHMM$h(s) {
    const [h, m] = String(s).split(':');
    return h;
}
export function inner$padHHMM$m(s) {
    const [h, m] = String(s).split(':');
    return m;
}
export function inner$withinHorizon$end(opts) {
    const end = addDaysIso(opts.anchorDate, (opts.calendarWindow || 400) - 1);
    return end;
}
export function inner$simulateCall$sims(tenant) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
        .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
    return sims;
}
export function inner$simulateCall$pick(tenant, kosherMode) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
        .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
    const pick = kosherMode ? sims.filter((n) => n.kosher) : sims;
    return pick;
}
export function inner$simulateCall$pick$$step(kosherMode, sims) {
    const pick = kosherMode ? sims.filter((n) => n.kosher) : sims;
    return pick;
}
export function inner$simulateCall$m(call) {
    const target = call.did || '';
    const m = /^(\d+)#(\+?\d+)$/.exec(target);
    return m;
}
export function inner$simulateCall$m$$step(target) {
    const m = /^(\d+)#(\+?\d+)$/.exec(target);
    return m;
}
export function inner$simulateCall$sim(tenant, call) {
    const target = call.did || '';
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
        .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
    const m = /^(\d+)#(\+?\d+)$/.exec(target);
    const sim = sims.find((n) => n.gatewayChannel === Number(m[1]));
    return sim;
}
export function inner$simulateCall$sim$$step(sims, m) {
    const sim = sims.find((n) => n.gatewayChannel === Number(m[1]));
    return sim;
}
export function inner$simulateCall$def(tenant, kosherMode) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
        .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
    const pick = kosherMode ? sims.filter((n) => n.kosher) : sims;
    const def = pick.find((n) => n.id === tenant.outbound.defaultNumberId) || pick[0];
    return def;
}
export function inner$simulateCall$def$$step(tenant, pick) {
    const def = pick.find((n) => n.id === tenant.outbound.defaultNumberId) || pick[0];
    return def;
}
export function inner$simulateCall$num(tenant, call, didE164) {
    const num = tenant.numbers.find((n) => (n.e164 === didE164 || n.e164 === call.did)
        && (n.channels || []).includes('voice') && n.onramp !== 'device-link'
        // נחיל-7 R7-7: הפניית-לקוח עם forwardTo היא alias שנוחת על הקשר-שער-היעד — הגנרטור
        // מדלג עליה (בלי in_/line_ משלה); הסימולטור חייב לדלג גם, אחרת in:<alias> שגוי.
        && !(n.onramp === 'customer-forward' && n.forwardTo));
    return num;
}
export function inner$simulateCall$anon(call) {
    const anon = !call.callerId || /^(anonymous|unknown|restricted|private|withheld|clir)$/i.test(String(call.callerId));
    return anon;
}
export function inner$simulateCall$at(call) {
    const at = resolveMoment(call);
    return at;
}
export function inner$simulateCall$opt(tenant, call) {
    const R = tenant.routing || {};
    const opt = R.ivr.options.find((o) => o.digit === String(call.digit));
    return opt;
}
export function inner$simulateCall$opt$$step(call, R) {
    const opt = R.ivr.options.find((o) => o.digit === String(call.digit));
    return opt;
}
export function inner$simulateCall$chain(tenant) {
    const R = tenant.routing || {};
    const chain = ['manager', ...((R.overflow || []).map((e) => `overflow:${e}`)), 'voicemail'];
    return chain;
}
export function inner$simulateCall$chain$$step(R) {
    const chain = ['manager', ...((R.overflow || []).map((e) => `overflow:${e}`)), 'voicemail'];
    return chain;
}
export function inner$explainCall$office(tenant) {
    const office = tenant.destinations?.office?.ext?.join(', ') || '—';
    return office;
}
export function inner$explainCall$when(call) {
    const when = call.dow != null ? `יום ${DOW_HE[call.dow]} ${call.hhmm || ''}` : call.date ? `${call.date} ${call.hhmm || ''}` : '';
    return when;
}
export function inner$explainCall$trg(sim) {
    const trg = sim.path.includes('ivr-invalid') ? 'בחירה לא-תקינה ב-IVR' : 'אין-מענה במשרד';
    return trg;
}
export function inner$resolveMoment$d(call) {
    const d = new Date(`${call.date}T${call.hhmm || '12:00'}:00Z`);
    return d;
}

export const SIGS = {
  inner$addDaysIso$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addDaysIso$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addDaysIso$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$zmanimClosedReason$at: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$zmanimClosedReason$fullEnd: [{"name":"opts","d":{"t":"any"},"opt":false}],
  inner$hhmmToMin$h: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$hhmmToMin$m: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$padHHMM$h: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$padHHMM$m: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$withinHorizon$end: [{"name":"opts","d":{"t":"any"},"opt":false}],
  inner$simulateCall$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$simulateCall$pick: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false}],
  inner$simulateCall$pick$$step: [{"name":"kosherMode","d":{"t":"bool"},"opt":false},{"name":"sims","d":{"t":"any"},"opt":false}],
  inner$simulateCall$m: [{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$simulateCall$m$$step: [{"name":"target","d":{"t":"str"},"opt":false}],
  inner$simulateCall$sim: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$simulateCall$sim$$step: [{"name":"sims","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$simulateCall$def: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false}],
  inner$simulateCall$def$$step: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"pick","d":{"t":"any"},"opt":false}],
  inner$simulateCall$num: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"didE164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$simulateCall$anon: [{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$simulateCall$at: [{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$simulateCall$opt: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$simulateCall$opt$$step: [{"name":"call","d":{"t":"obj","p":[["did",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["callerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["hhmm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["digit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"R","d":{"t":"any"},"opt":false}],
  inner$simulateCall$chain: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$simulateCall$chain$$step: [{"name":"R","d":{"t":"any"},"opt":false}],
  inner$explainCall$office: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$explainCall$when: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$explainCall$trg: [{"name":"sim","d":{"t":"obj","p":[["path",{"t":"arr","of":{"t":"str"}},false],["outcome",{"t":"str"},false],["reason",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$resolveMoment$d: [{"name":"call","d":{"t":"any"},"opt":false}],
};
