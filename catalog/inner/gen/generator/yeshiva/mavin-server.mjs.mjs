// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/mavin-server.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clean = (v) => String(v ?? '').replace(/[,;:.«»]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
export function inner$opt$i(args, k) {
    const i = args.indexOf(k);
    return i;
}
export function inner$decisionsCollection$m(l) {
    const m = l.match(/^(\d+)\.\s+\S+\s+(?:\((\d{1,2}\.\d{1,2})\)\s+)?\*\*(.+?)\*\*(?:\s*\((\d{1,2}\.\d{1,2}))?/);
    return m;
}
export function inner$parseDoor$lines(out) {
    const lines = out.split('\n');
    return lines;
}
export function inner$parseDoor$i0(out) {
    const lines = out.split('\n');
    const i0 = lines.findIndex((l) => /^אפיון:/.test(l));
    return i0;
}
export function inner$parseDoor$i0$$step(lines) {
    const i0 = lines.findIndex((l) => /^אפיון:/.test(l));
    return i0;
}
export function inner$parseDoor$map$km(l) {
    const km = l.match(/ \[([^\]]+)\]\s*$/);
    return km;
}
export function inner$parseDoor$map$text(l) {
    const [text, def = ''] = l.replace(/^\s+\? /, '').replace(/ \[[^\]]+\]\s*$/, '').split(' ⇒ ');
    return text;
}
export function inner$parseDoor$map$def(l) {
    const [text, def = ''] = l.replace(/^\s+\? /, '').replace(/ \[[^\]]+\]\s*$/, '').split(' ⇒ ');
    return def;
}
export function inner$parseDoor$sc(out) {
    const lines = out.split('\n');
    const sc = lines.find((l) => /^מסכים: /.test(l));
    return sc;
}
export function inner$parseDoor$sc$$step(lines) {
    const sc = lines.find((l) => /^מסכים: /.test(l));
    return sc;
}
export function inner$parseDoor$v(out) {
    const lines = out.split('\n');
    const v = lines.map((l) => l.match(/^מוצג-בפועל: (\d+)\/(\d+) מסכים · עבר (\d+) · נכשל (\d+)/)).find(Boolean);
    return v;
}
export function inner$parseDoor$v$$step(lines) {
    const v = lines.map((l) => l.match(/^מוצג-בפועל: (\d+)\/(\d+) מסכים · עבר (\d+) · נכשל (\d+)/)).find(Boolean);
    return v;
}
export function inner$acceptData$ei(D) {
    const ei = D.entities.findIndex((e) => e.collection === 'builds');
    return ei;
}
export function inner$acceptData$qi(D) {
    const qi = D.entities.findIndex((e) => e.collection === 'questions');
    return qi;
}
export function inner$acceptData$label(row) {
    const label = String(row[0] || '').trim();
    return label;
}
export function inner$acceptData$sentence(row) {
    const sentence = String(row[1] || '').trim();
    return sentence;
}
export function inner$acceptData$t(row) {
    const t = String(row[1] || '').trim();
    return t;
}
export function inner$acceptData$q(row, b) {
    const t = String(row[1] || '').trim();
    const q = b && b.questions.find((x) => x.text === t || (x.key && x.key === t));
    return q;
}
export function inner$acceptData$q$$step(b, t) {
    const q = b && b.questions.find((x) => x.text === t || (x.key && x.key === t));
    return q;
}
export function inner$selfSentence$ents(D, c, P) {
    const ents = D.entities.map((e) => { const rows = (c[e.collection] || []).slice(0, 3).map((r) => r.slice(0, e.fields.length).map(clean).join(', ')); return `${P.each} ${e.name} ${P.has} ${e.fields.join(', ')}${e.stages ? `; ${P.stages}: ${e.stages.join(', ')}` : ''}${rows.length ? `; ${P.example}: ${rows.join('; ')}` : ''}.`; });
    return ents;
}
export function inner$selfSentence$map$rows(c, e) {
    const rows = (c[e.collection] || []).slice(0, 3).map((r) => r.slice(0, e.fields.length).map(clean).join(', '));
    return rows;
}
export function inner$feedRoute$since(u) {
    const since = +(u.searchParams.get('since') || 0);
    return since;
}
export function inner$feedRoute$fresh(u, all) {
    const since = +(u.searchParams.get('since') || 0);
    const fresh = all.filter((x) => x.seq > since);
    return fresh;
}
export function inner$feedRoute$fresh$$step(since, all) {
    const fresh = all.filter((x) => x.seq > since);
    return fresh;
}
export function inner$feedRoute$tok(req, u) {
    const tok = req.headers['x-feed-token'] || u.searchParams.get('token');
    return tok;
}
export function inner$feedRoute$rows(d) {
    const rows = Array.isArray(d) ? d : Array.isArray(d && d.rows) ? d.rows : null;
    return rows;
}
export function inner$feedRoute$seq(all) {
    let seq = all.length ? all[all.length - 1].seq : 0;
    return seq;
}
export function inner$createServer$m(p) {
    const m = p.match(/^\/build\/(\d+)(?:\/(.*))?$/);
    return m;
}
export function inner$createServer$fm(p) {
    const fm = p.match(/^(?:\/build\/(\d+))?\/flutter\/(.*)$/);
    return fm;
}
export function inner$createServer$b(builds, cockpit, p) {
    const fm = p.match(/^(?:\/build\/(\d+))?\/flutter\/(.*)$/);
    const b = fm[1] ? builds.find((x) => x.id === +fm[1]) : cockpit;
    return b;
}
export function inner$createServer$b$$step(builds, cockpit, fm) {
    const b = fm[1] ? builds.find((x) => x.id === +fm[1]) : cockpit;
    return b;
}
export function inner$createServer$base(builds, cockpit, p) {
    const fm = p.match(/^(?:\/build\/(\d+))?\/flutter\/(.*)$/);
    const b = fm[1] ? builds.find((x) => x.id === +fm[1]) : cockpit;
    const base = fm[1] ? `/build/${b.id}/flutter/` : '/flutter/';
    return base;
}
export function inner$createServer$base$$step(fm, b) {
    const base = fm[1] ? `/build/${b.id}/flutter/` : '/flutter/';
    return base;
}
export function inner$createServer$fd(p) {
    const fm = p.match(/^(?:\/build\/(\d+))?\/flutter\/(.*)$/);
    const rel = fm[2] || 'index.html';
    const fd = rel.match(/^api\/feed\/([\w-]+)$/);
    return fd;
}
export function inner$createServer$fd$$step(rel) {
    const fd = rel.match(/^api\/feed\/([\w-]+)$/);
    return fd;
}
export function inner$createServer$b_L203(builds, d) {
    const b = builds.find((x) => x.id === +d.id);
    return b;
}
export function inner$createServer$b_L206(builds, p) {
    const m = p.match(/^\/build\/(\d+)(?:\/(.*))?$/);
    const b = builds.find((x) => x.id === +m[1]);
    return b;
}
export function inner$createServer$b_L206$$step(builds, m) {
    const b = builds.find((x) => x.id === +m[1]);
    return b;
}
export function inner$createServer$fd_L209(p) {
    const m = p.match(/^\/build\/(\d+)(?:\/(.*))?$/);
    const sub = m[2] || '';
    const fd = sub.match(/^api\/feed\/([\w-]+)$/);
    return fd;
}
export function inner$createServer$fd_L209$$step(sub) {
    const fd = sub.match(/^api\/feed\/([\w-]+)$/);
    return fd;
}
export function inner$createServer$f(p) {
    const m = p.match(/^\/build\/(\d+)(?:\/(.*))?$/);
    const sub = m[2] || '';
    const f = sub.match(/^files\/([^/]+)$/);
    return f;
}
export function inner$createServer$f$$step(sub) {
    const f = sub.match(/^files\/([^/]+)$/);
    return f;
}

export const SIGS = {
  inner$opt$i: [{"name":"args","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$decisionsCollection$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$parseDoor$lines: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseDoor$i0: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseDoor$i0$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$parseDoor$map$km: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$parseDoor$map$text: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$parseDoor$map$def: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$parseDoor$sc: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseDoor$sc$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$parseDoor$v: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseDoor$v$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$acceptData$ei: [{"name":"D","d":{"t":"any"},"opt":false}],
  inner$acceptData$qi: [{"name":"D","d":{"t":"any"},"opt":false}],
  inner$acceptData$label: [{"name":"row","d":{"t":"any"},"opt":false}],
  inner$acceptData$sentence: [{"name":"row","d":{"t":"any"},"opt":false}],
  inner$acceptData$t: [{"name":"row","d":{"t":"any"},"opt":false}],
  inner$acceptData$q: [{"name":"row","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$acceptData$q$$step: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"str"},"opt":false}],
  inner$selfSentence$ents: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"obj","p":[["builds",{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},false],["questions",{"t":"arr","of":{"t":"any"}},false],["picks",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"arr","of":{"t":"undef"}},false],["capabilities",{"t":"any"},false],["decisions",{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},false],["gates",{"t":"any"},false]]},"opt":false},{"name":"P","d":{"t":"any"},"opt":false}],
  inner$selfSentence$map$rows: [{"name":"c","d":{"t":"obj","p":[["builds",{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},false],["questions",{"t":"arr","of":{"t":"any"}},false],["picks",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"arr","of":{"t":"undef"}},false],["capabilities",{"t":"any"},false],["decisions",{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},false],["gates",{"t":"any"},false]]},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$feedRoute$since: [{"name":"u","d":{"t":"any"},"opt":false}],
  inner$feedRoute$fresh: [{"name":"u","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false}],
  inner$feedRoute$fresh$$step: [{"name":"since","d":{"t":"num"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false}],
  inner$feedRoute$tok: [{"name":"req","d":{"t":"any"},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
  inner$feedRoute$rows: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$feedRoute$seq: [{"name":"all","d":{"t":"any"},"opt":false}],
  inner$createServer$m: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$fm: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$b: [{"name":"builds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cockpit","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$b$$step: [{"name":"builds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cockpit","d":{"t":"any"},"opt":false},{"name":"fm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$createServer$base: [{"name":"builds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cockpit","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$base$$step: [{"name":"fm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$createServer$fd: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$fd$$step: [{"name":"rel","d":{"t":"str"},"opt":false}],
  inner$createServer$b_L203: [{"name":"builds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$createServer$b_L206: [{"name":"builds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$b_L206$$step: [{"name":"builds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$createServer$fd_L209: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$fd_L209$$step: [{"name":"sub","d":{"t":"str"},"opt":false}],
  inner$createServer$f: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$createServer$f$$step: [{"name":"sub","d":{"t":"str"},"opt":false}],
};
