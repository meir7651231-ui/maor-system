// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/verify/factory.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - [...String(s)].length));
function rejectedByReason(res) {
    const m = new Map();
    for (const r of res.rejected) {
        const reason = r.why.replace(/^(DB-הבדיקה|האמיתי|הדמו|אקראי #\d+|דמו מטולטל #\d+) — /, '').replace(/:.*$/, '');
        const list = m.get(reason) ?? [];
        list.push(r.key);
        m.set(reason, list);
    }
    return [...m.entries()].map(([reason, keys]) => ({ reason, keys })).sort((a, b) => b.keys.length - a.keys.length || (a.reason < b.reason ? -1 : 1));
}
export function inner$runFactory$engineOf$t(targets, key) {
    const t = targets.find((x) => x.key === key);
    return t;
}
export function inner$runFactory$direct(mine) {
    const direct = mine.filter((t) => !t.caps.length);
    return direct;
}
export function inner$runFactory$chains(mine) {
    const chains = mine.filter((t) => t.caps.length);
    return chains;
}
export function inner$renderVerified$keys(res) {
    const keys = Object.keys(res.verified).sort();
    return keys;
}
export function inner$renderVerified$body(res) {
    const keys = Object.keys(res.verified).sort();
    const body = keys.map((k) => '  ' + JSON.stringify(k) + ': ' + res.verified[k] + ',').join('\n');
    return body;
}
export function inner$renderVerified$body$$step(res, keys) {
    const body = keys.map((k) => '  ' + JSON.stringify(k) + ': ' + res.verified[k] + ',').join('\n');
    return body;
}
export function inner$factoryTable$lines() {
    const lines = [pad('מנוע', 26) + pad('מקומות', 8) + pad('אפשרויות', 10) + pad('שרשראות', 9) + pad('מאומתים', 9) + pad('שרשראות ✓', 11) + 'נדחו'];
    return lines;
}
export function inner$rejectedByReason$reason(r) {
    const reason = r.why.replace(/^(DB-הבדיקה|האמיתי|הדמו|אקראי #\d+|דמו מטולטל #\d+) — /, '').replace(/:.*$/, '');
    return reason;
}
export function inner$rejectedByReason$list(m, r) {
    const reason = r.why.replace(/^(DB-הבדיקה|האמיתי|הדמו|אקראי #\d+|דמו מטולטל #\d+) — /, '').replace(/:.*$/, '');
    const list = m.get(reason) ?? [];
    return list;
}
export function inner$rejectedByReason$list$$step(m, reason) {
    const list = m.get(reason) ?? [];
    return list;
}
export function inner$renderReport$atomRows(res) {
    const atomRows = Object.entries(res.atoms).map(([k, v]) => '| ' + k + ' | ' + v.passed + '/' + v.cases + ' | ' + (v.passed === v.cases ? '✅' : '❌ ' + (v.law ?? '') + ' — ' + (v.why ?? '')) + ' |');
    return atomRows;
}
export function inner$renderReport$eng(res) {
    const eng = res.engines.map((e) => '| ' + e.emoji + ' ' + e.name + (e.generated ? ' 🔨' : '') + ' | ' + e.places + ' | ' + e.options + ' | ' + e.chains + ' | ' + e.verified + ' | ' + e.verifiedChains + ' | ' + e.rejected + ' |');
    return eng;
}
export function inner$renderReport$reasons(res) {
    const reasons = rejectedByReason(res).map((r) => '| ' + r.reason + ' | ' + r.keys.length + ' | ' + r.keys.slice(0, 4).map((k) => '`' + k + '`').join(' · ') + (r.keys.length > 4 ? ' · …' : '') + ' |');
    return reasons;
}
export function inner$runFactory$atoms$$after_loop(atomRep) {
    const atoms = {};
    for (const [k, v] of Object.entries(atomRep))
        atoms[k] = { cases: v.cases, passed: v.passed, ...(v.counterexample ? { law: v.counterexample.law, why: v.counterexample.why } : {}) };
    return atoms;
}
export function inner$factoryTable$lines$$after_loop(res) {
    const lines = [pad('מנוע', 26) + pad('מקומות', 8) + pad('אפשרויות', 10) + pad('שרשראות', 9) + pad('מאומתים', 9) + pad('שרשראות ✓', 11) + 'נדחו'];
    for (const e of res.engines)
        lines.push(pad(e.emoji + ' ' + e.name + (e.generated ? ' 🔨' : ''), 26) + pad(e.places, 8) + pad(e.options, 10) + pad(e.chains, 9) + pad(e.verified, 9) + pad(e.verifiedChains, 11) + e.rejected);
    return lines;
}
export function inner$rejectedByReason$m$$after_loop(res) {
    const m = new Map();
    for (const r of res.rejected) {
        const reason = r.why.replace(/^(DB-הבדיקה|האמיתי|הדמו|אקראי #\d+|דמו מטולטל #\d+) — /, '').replace(/:.*$/, '');
        const list = m.get(reason) ?? [];
        list.push(r.key);
        m.set(reason, list);
    }
    return m;
}

export const SIGS = {
  inner$runFactory$engineOf$t: [{"name":"targets","d":{"t":"arr","of":{"t":"obj","n":"ConnTarget","p":[["key",{"t":"str"},false],["cap",{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["gen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$runFactory$direct: [{"name":"mine","d":{"t":"arr","of":{"t":"obj","n":"ConnTarget","p":[["key",{"t":"str"},false],["cap",{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["gen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$runFactory$chains: [{"name":"mine","d":{"t":"arr","of":{"t":"obj","n":"ConnTarget","p":[["key",{"t":"str"},false],["cap",{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["caps",{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false],["gen",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$renderVerified$keys: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
  inner$renderVerified$body: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
  inner$renderVerified$body$$step: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$factoryTable$lines: [],
  inner$rejectedByReason$reason: [{"name":"r","d":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]},"opt":false}],
  inner$rejectedByReason$list: [{"name":"m","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"r","d":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]},"opt":false}],
  inner$rejectedByReason$list$$step: [{"name":"m","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"reason","d":{"t":"str"},"opt":false}],
  inner$renderReport$atomRows: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
  inner$renderReport$eng: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
  inner$renderReport$reasons: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
  inner$runFactory$atoms$$after_loop: [{"name":"atomRep","d":{"t":"obj","n":"Record","p":[["divide",{"t":"any"},false],["merge",{"t":"any"},false],["next",{"t":"any"},false],["round",{"t":"any"},false],["offset",{"t":"any"},false],["escalate",{"t":"any"},false],["rotate",{"t":"any"},false],["fuzzy",{"t":"any"},false]]},"opt":false}],
  inner$factoryTable$lines$$after_loop: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
  inner$rejectedByReason$m$$after_loop: [{"name":"res","d":{"t":"obj","n":"FactoryResult","p":[["seed",{"t":"num"},false],["opts",{"t":"obj","p":[["n",{"t":"num"},false],["dbs",{"t":"num"},false],["genDbs",{"t":"num"},false],["demoDbs",{"t":"num"},false]]},false],["atoms",{"t":"rec","of":{"t":"obj","p":[["cases",{"t":"num"},false],["passed",{"t":"num"},false],["law",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["verified",{"t":"rec","of":{"t":"num"}},false],["rejected",{"t":"arr","of":{"t":"obj","n":"Rejected","p":[["key",{"t":"str"},false],["why",{"t":"str"},false]]}},false],["engines",{"t":"arr","of":{"t":"obj","n":"EngineRow","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["generated",{"t":"bool"},false],["places",{"t":"num"},false],["options",{"t":"num"},false],["chains",{"t":"num"},false],["verified",{"t":"num"},false],["verifiedChains",{"t":"num"},false],["rejected",{"t":"num"},false]]}},false],["totals",{"t":"obj","p":[["targets",{"t":"num"},false],["verified",{"t":"num"},false],["rejected",{"t":"num"},false],["checks",{"t":"num"},false]]},false]]},"opt":false}],
};
