// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/purpose.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const norm = (s) => String(s).replace(/[״"'׳]/g, '').replace(/\s+/g, ' ').trim();
const soleOption = (e) => {
    const real = (e.options || []).filter((o) => o.cls && (o.fields || []).length && o.strict !== false);
    return real.length === 1 ? real[0] : null;
};
const TYPE_SHAPE = { typeDate: /date/i, typeNum: /number/i, typePercent: /number/i, typeBool: /bool/i };
const DATE_SHAPE = TYPE_SHAPE.typeDate;
const heW = (s) => [...String(s || '').matchAll(/[א-ת][א-ת'"״׳]*/g)].map((m) => m[0]);
const PART_RE = /^[ \t]*(\S+)[ \t]+.*\(([A-Za-z_]\w*)\)[ \t]*$/;
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const slotOf = (r, pool) => {
    if (!r.slot)
        return null;
    const [cls, field] = String(r.slot).split('.');
    const f = pool.find((x) => x.cls === cls && x.name === field) || null;
    return { cls, field, type: f ? f.type : null, src: r.slotSrc || (f ? f.src : null) };
};
export function inner$soleOption$real(e) {
    const real = (e.options || []).filter((o) => o.cls && (o.fields || []).length && o.strict !== false);
    return real;
}
export function inner$declaredDemands$s(text) {
    const s = String(text || '');
    return s;
}
export function inner$declaredDemands$mm(line) {
    const mm = line.match(PART_RE);
    return mm;
}
export function inner$declaredDemands$head(line) {
    const head = line.trim().split(/\s+/)[0] || '';
    return head;
}
export function inner$demandsOf$w(tok) {
    const w = heW(tok)[0] || '';
    return w;
}
export function inner$typeHint$kinds(hits) {
    const kinds = [...new Set(hits.map((h) => h.type))];
    return kinds;
}
export function inner$kasheObserve$asked(k) {
    const asked = k.seeds.filter((s) => s.kind === 'מאי' || s.kind === 'מאן קתני').map((s) => s.kind);
    return asked;
}
export function inner$kasheObserve$nWith(demands) {
    const nWith = demands.filter((d) => d && d.src).length;
    return nWith;
}
export function inner$goalPsak$forEach$tail(d, m) {
    const tail = d.text.slice(m.index + m[0].length);
    return tail;
}
export function inner$goalPsak$forEach$head(d, m) {
    const head = d.text.slice(0, m.index);
    return head;
}
export function inner$goalPsak$forEach$unit(d, m) {
    const tail = d.text.slice(m.index + m[0].length);
    const unit = heW(tail)[0] || null;
    return unit;
}
export function inner$goalPsak$forEach$unit$$step(tail) {
    const unit = heW(tail)[0] || null;
    return unit;
}
export function inner$goalPsak$forEach$cmp(CMP_WORDS, d, m) {
    const head = d.text.slice(0, m.index);
    const cmp = CMP_WORDS.find(([, ws]) => ws.some((x) => head.trim().endsWith(x)))?.[0] || null;
    return cmp;
}
export function inner$goalPsak$forEach$cmp$$step(CMP_WORDS, head) {
    const cmp = CMP_WORDS.find(([, ws]) => ws.some((x) => head.trim().endsWith(x)))?.[0] || null;
    return cmp;
}
export function inner$goalPsak$forEach$t(t0) {
    const t = (t0 && t0.type) ? t0 : null;
    return t;
}
export function inner$goalPsak$cls(reqs) {
    const cls = reqs.filter((r) => r.kind === 'ישות' && r.cls);
    return cls;
}
export function inner$goalPsak$hit(pool, shape) {
    const hit = pool.find((f) => shape.test(String(f.type || '')));
    return hit;
}
export function inner$goalPsak$sourced(reqs) {
    const sourced = reqs.filter((r) => r.src);
    return sourced;
}
export function inner$slotOf$cls(r) {
    const [cls, field] = String(r.slot).split('.');
    return cls;
}
export function inner$slotOf$field(r) {
    const [cls, field] = String(r.slot).split('.');
    return field;
}
export function inner$slotOf$f(r, pool) {
    const [cls, field] = String(r.slot).split('.');
    const f = pool.find((x) => x.cls === cls && x.name === field) || null;
    return f;
}
export function inner$slotOf$f$$step(pool, cls, field) {
    const f = pool.find((x) => x.cls === cls && x.name === field) || null;
    return f;
}
export function inner$goalNeeds$forEach$reqs(g, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    return reqs;
}
export function inner$goalNeeds$forEach$words(g, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const words = reqs.map((r) => r.word);
    return words;
}
export function inner$goalNeeds$forEach$words$$step(reqs) {
    const words = reqs.map((r) => r.word);
    return words;
}
export function inner$goalNeeds$forEach$ents(g, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const ents = reqs.filter((r) => r.kind === 'ישות' && r.cls);
    return ents;
}
export function inner$goalNeeds$forEach$ents$$step(reqs) {
    const ents = reqs.filter((r) => r.kind === 'ישות' && r.cls);
    return ents;
}
export function inner$goalNeeds$forEach$amb(g, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const amb = reqs.filter((r) => r.kind === 'ישות' && !r.cls);
    return amb;
}
export function inner$goalNeeds$forEach$amb$$step(reqs) {
    const amb = reqs.filter((r) => r.kind === 'ישות' && !r.cls);
    return amb;
}
export function inner$goalNeeds$forEach$thr(g, pool, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const thr = reqs.filter((r) => r.kind === 'קבוע' && r.cmp && r.slot).map((r) => ({ r, s: slotOf(r, pool) }));
    return thr;
}
export function inner$goalNeeds$forEach$thr$$step(pool, reqs) {
    const thr = reqs.filter((r) => r.kind === 'קבוע' && r.cmp && r.slot).map((r) => ({ r, s: slotOf(r, pool) }));
    return thr;
}
export function inner$goalNeeds$forEach$nums(g, pool, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const nums = reqs.filter((r) => r.kind === 'שדה' && r.type === 'typeNum' && r.slot).map((r) => ({ r, s: slotOf(r, pool) }));
    return nums;
}
export function inner$goalNeeds$forEach$nums$$step(pool, reqs) {
    const nums = reqs.filter((r) => r.kind === 'שדה' && r.type === 'typeNum' && r.slot).map((r) => ({ r, s: slotOf(r, pool) }));
    return nums;
}
export function inner$goalNeeds$forEach$clockNeed$id(i, F) {
    const id = `g${i + 1}.clock.${F}Days`;
    return id;
}
export function inner$goalNeeds$forEach$Fc(F) {
    const Fc = cap(F);
    return Fc;
}
export function inner$goalNeeds$forEach$src(r, s, K, F) {
    const src = [{ token: `'${F}'`, src: s.src }, { token: K, src: r.src }];
    return src;
}
export function inner$goalNeeds$forEach$thrReqs(g, pool, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const thr = reqs.filter((r) => r.kind === 'קבוע' && r.cmp && r.slot).map((r) => ({ r, s: slotOf(r, pool) }));
    const thrReqs = new Set(thr.map((x) => x.r));
    return thrReqs;
}
export function inner$goalNeeds$forEach$thrReqs$$step(thr) {
    const thrReqs = new Set(thr.map((x) => x.r));
    return thrReqs;
}
export function inner$goalNeeds$forEach$poolDates(pool) {
    const poolDates = pool.filter((f) => DATE_SHAPE.test(String(f.type || '')));
    return poolDates;
}
export function inner$goalNeeds$forEach$dates(g, pool, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const thr = reqs.filter((r) => r.kind === 'קבוע' && r.cmp && r.slot).map((r) => ({ r, s: slotOf(r, pool) }));
    const thrReqs = new Set(thr.map((x) => x.r));
    const dates = reqs.filter((r) => r.slot && !thrReqs.has(r)).map((r) => ({ r, s: slotOf(r, pool) }))
        .filter((x) => x.s && DATE_SHAPE.test(String(x.s.type || '')));
    return dates;
}
export function inner$goalNeeds$forEach$dates$$step(pool, reqs, thrReqs) {
    const dates = reqs.filter((r) => r.slot && !thrReqs.has(r)).map((r) => ({ r, s: slotOf(r, pool) }))
        .filter((x) => x.s && DATE_SHAPE.test(String(x.s.type || '')));
    return dates;
}
export function inner$goalNeeds$forEach$fam(sig) {
    const fam = sig.sum ? 'sum' : sig.avg ? 'avg' : 'count';
    return fam;
}
export function inner$goalNeeds$forEach$conn(g, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const conn = reqs.filter((r) => r.slot).length;
    return conn;
}
export function inner$goalNeeds$forEach$conn$$step(reqs) {
    const conn = reqs.filter((r) => r.slot).length;
    return conn;
}
export function inner$goalNeeds$forEach$q(g, d, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const words = reqs.map((r) => r.word);
    const ents = reqs.filter((r) => r.kind === 'ישות' && r.cls);
    const amb = reqs.filter((r) => r.kind === 'ישות' && !r.cls);
    const q = amb.length
        ? (amb[0].ask || `«${amb[0].word}» — ${(amb[0].options || []).length} מועמדי-סכמה (${(amb[0].options || []).slice(0, 4).join(', ')}): איזה?`)
        : !ents.length
            ? `«${d.verb}»: אין מילה בתביעה שיש לה מחלקת-סכמה (${words.filter((w) => w !== d.verb).slice(0, 6).join(' · ') || '—'}) — על איזו ישות?`
            : `«${d.verb}» על ${ents.map((e) => e.cls).join('/')}: אין שקע-סכמה מחובר ואין קבוע-סף במטרה — מה נמדד ומול מה?`;
    return q;
}
export function inner$goalNeeds$forEach$q$$step(d, words, ents, amb) {
    const q = amb.length
        ? (amb[0].ask || `«${amb[0].word}» — ${(amb[0].options || []).length} מועמדי-סכמה (${(amb[0].options || []).slice(0, 4).join(', ')}): איזה?`)
        : !ents.length
            ? `«${d.verb}»: אין מילה בתביעה שיש לה מחלקת-סכמה (${words.filter((w) => w !== d.verb).slice(0, 6).join(' · ') || '—'}) — על איזו ישות?`
            : `«${d.verb}» על ${ents.map((e) => e.cls).join('/')}: אין שקע-סכמה מחובר ואין קבוע-סף במטרה — מה נמדד ומול מה?`;
    return q;
}
export function inner$goalNeeds$forEach$nil(g, i) {
    const reqs = g.requirements.filter((r) => r.demand === i);
    const nil = reqs.filter((r) => r.kind === '∅').map((r) => r.word);
    return nil;
}
export function inner$goalNeeds$forEach$nil$$step(reqs) {
    const nil = reqs.filter((r) => r.kind === '∅').map((r) => r.word);
    return nil;
}
export function inner$purposeDoc$doc(sentence, sw) {
    const doc = {
        lines: [sentence], title: norm(sentence), sections: {}, optional: [], mandatory: [],
        sources: new Map(), open: [], domain: sw.domain, entities: [],
    };
    return doc;
}
export function inner$purposeDoc$o(e) {
    const o = soleOption(e);
    return o;
}
export function inner$purposeDoc$n(e) {
    const n = (e.options || []).filter((x) => x.cls).length;
    return n;
}
export function inner$purposeDoc$n_L578(f) {
    const n = norm(f.name);
    return n;
}

export const SIGS = {
  inner$soleOption$real: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$declaredDemands$s: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$declaredDemands$mm: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$declaredDemands$head: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$demandsOf$w: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$typeHint$kinds: [{"name":"hits","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$kasheObserve$asked: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$kasheObserve$nWith: [{"name":"demands","d":{"t":"any"},"opt":false}],
  inner$goalPsak$forEach$tail: [{"name":"d","d":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]},"opt":false},{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$goalPsak$forEach$head: [{"name":"d","d":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]},"opt":false},{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$goalPsak$forEach$unit: [{"name":"d","d":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]},"opt":false},{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$goalPsak$forEach$unit$$step: [{"name":"tail","d":{"t":"str"},"opt":false}],
  inner$goalPsak$forEach$cmp: [{"name":"CMP_WORDS","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false},{"name":"d","d":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]},"opt":false},{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$goalPsak$forEach$cmp$$step: [{"name":"CMP_WORDS","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false},{"name":"head","d":{"t":"str"},"opt":false}],
  inner$goalPsak$forEach$t: [{"name":"t0","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["type",{"t":"str"},false],["form",{"t":"any"},false],["src",{"t":"str"},false],["options",{"t":"undef"},true],["forms",{"t":"undef"},true]]},{"t":"obj","p":[["type",{"t":"null"},false],["options",{"t":"arr","of":{"t":"str"}},false],["forms",{"t":"arr","of":{"t":"any"}},false],["src",{"t":"null"},false],["form",{"t":"undef"},true]]}]},"opt":false}],
  inner$goalPsak$cls: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalPsak$hit: [{"name":"pool","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"shape","d":{"t":"any"},"opt":false}],
  inner$goalPsak$sourced: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$slotOf$cls: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$slotOf$field: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$slotOf$f: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"any"},"opt":false}],
  inner$slotOf$f$$step: [{"name":"pool","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"field","d":{"t":"str"},"opt":false}],
  inner$goalNeeds$forEach$reqs: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$words: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$words$$step: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$ents: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$ents$$step: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$amb: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$amb$$step: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$thr: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"pool","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$thr$$step: [{"name":"pool","d":{"t":"any"},"opt":false},{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$nums: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"pool","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$nums$$step: [{"name":"pool","d":{"t":"any"},"opt":false},{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$clockNeed$id: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"F","d":{"t":"any"},"opt":false}],
  inner$goalNeeds$forEach$Fc: [{"name":"F","d":{"t":"str"},"opt":false}],
  inner$goalNeeds$forEach$src: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"str"},false],["field",{"t":"str"},false],["type",{"t":"any"},false],["src",{"t":"any"},false]]}]},"opt":false},{"name":"K","d":{"t":"any"},"opt":false},{"name":"F","d":{"t":"str"},"opt":false}],
  inner$goalNeeds$forEach$thrReqs: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"pool","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$thrReqs$$step: [{"name":"thr","d":{"t":"arr","of":{"t":"obj","p":[["r",{"t":"any"},false],["s",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"str"},false],["field",{"t":"str"},false],["type",{"t":"any"},false],["src",{"t":"any"},false]]}]},false]]}},"opt":false}],
  inner$goalNeeds$forEach$poolDates: [{"name":"pool","d":{"t":"any"},"opt":false}],
  inner$goalNeeds$forEach$dates: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"pool","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$dates$$step: [{"name":"pool","d":{"t":"any"},"opt":false},{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"thrReqs","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$fam: [{"name":"sig","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$conn: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$conn$$step: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$q: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"d","d":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$q$$step: [{"name":"d","d":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]},"opt":false},{"name":"words","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"amb","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$goalNeeds$forEach$nil: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalNeeds$forEach$nil$$step: [{"name":"reqs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purposeDoc$doc: [{"name":"sentence","d":{"t":"any"},"opt":false},{"name":"sw","d":{"t":"obj","p":[["text",{"t":"any"},false],["origin",{"t":"str"},false],["domain",{"t":"obj","p":[["ranked",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["hits",{"t":"num"},false],["src",{"t":"str"},false],["evidence",{"t":"arr","of":{"t":"str"}},false]]}},false],["pick",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},false],["entities",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]}},false]]},"opt":false}],
  inner$purposeDoc$o: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$purposeDoc$n: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$purposeDoc$n_L578: [{"name":"f","d":{"t":"any"},"opt":false}],
};
