// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/tzinor.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SRC = {
    packs: 'new/atoms/vertical-packs.mjs',
    terms: 'machtzev/generator/entity-terms.data.json',
    fields: 'new/atoms/schema-fields.mjs',
    lang: 'machtzev/generator/nl-lang.data.json',
    sentence: 'machtzev/generator/sentence.mjs',
    screens: 'machtzev/generator/screen-entities.data.json', // G64 · ישויות-מסך חצובות (screen-decomp ש8)
    ops: 'machtzev/generator/shape-ops.json', // שלב-3 · שקעי-החציבה של op-census (perField)
};
const heWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿'"׳״]*/g)].map((m) => m[0]);
const PREFIX = /^[הולבמשכ]/;
const strip = (w) => PREFIX.test(w) ? w.slice(1) : w;
const HE_RE = /[\u05d0-\u05ea]/;
const PLURAL_M = /ים$/;
const SKELETON = 'שם';
export function inner$altForms$ws(f) {
    const ws = String(f).split(' ');
    return ws;
}
export function inner$altForms$i(f) {
    const ws = String(f).split(' ');
    const i = ws.findIndex((w) => w.includes('/'));
    return i;
}
export function inner$altForms$i$$step(ws) {
    const i = ws.findIndex((w) => w.includes('/'));
    return i;
}
export function inner$keyToClass$x(key) {
    const x = key.startsWith('entity.') ? key.slice(7) : key;
    return x;
}
export function inner$keyToClass$t(BY_KEY, key) {
    const t = BY_KEY.get(key);
    return t;
}
export function inner$keyToClass$c(key) {
    const x = key.startsWith('entity.') ? key.slice(7) : key;
    const c = x[0].toUpperCase() + x.slice(1);
    return c;
}
export function inner$keyToClass$c$$step(x) {
    const c = x[0].toUpperCase() + x.slice(1);
    return c;
}
export function inner$keyToClass$sing(key) {
    const x = key.startsWith('entity.') ? key.slice(7) : key;
    const c = x[0].toUpperCase() + x.slice(1);
    const sing = c.endsWith('s') ? c.slice(0, -1) : null;
    return sing;
}
export function inner$keyToClass$sing$$step(c) {
    const sing = c.endsWith('s') ? c.slice(0, -1) : null;
    return sing;
}
export function inner$slotSources$baseNames(base) {
    const baseNames = new Set(base.map((f) => f.name));
    return baseNames;
}
export function inner$slotSources$out(cls, base) {
    const out = [{ family: 'שרשרת', src: `${SRC.fields}:FIELDS#${cls}`, slots: base.map((f) => ({ name: f.name, type: f.type })), adds: [],
            why: base.length ? null : `אין ל-${cls} אף שדה ב-FIELDS` }];
    return out;
}
export function inner$slotSources$so(SHAPE_OPS, cls) {
    const so = SHAPE_OPS.find((x) => x.entity === cls);
    return so;
}
export function inner$slotSources$se(SCREEN_ENTS, cls) {
    const se = SCREEN_ENTS.find((e) => e.cls === cls);
    return se;
}
export function inner$entityWords$t(text) {
    const t = String(text || '').replace(/[•]/g, ' ');
    return t;
}
export function inner$entityWords$clauses(text) {
    const t = String(text || '').replace(/[•]/g, ' ');
    const clauses = t.split(/[.;\n]+/).map((c) => c.trim()).filter((c) => heWords(c).length);
    return clauses;
}
export function inner$entityWords$clauses$$step(t) {
    const clauses = t.split(/[.;\n]+/).map((c) => c.trim()).filter((c) => heWords(c).length);
    return clauses;
}
export function inner$entityWords$forEach$clause(IMPLIED, EACH_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    return clause;
}
export function inner$entityWords$forEach$iParts(IMPLIED, EACH_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    return iParts;
}
export function inner$entityWords$forEach$iParts$$step(INTRO_RE, clause) {
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    return iParts;
}
export function inner$entityWords$forEach$work(IMPLIED, EACH_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    return work;
}
export function inner$entityWords$forEach$work$$step(clause, iParts) {
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    return work;
}
export function inner$entityWords$forEach$seg(IMPLIED, EACH_RE, MARK_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    const seg = MARK_RE ? work.split(MARK_RE) : [work];
    return seg;
}
export function inner$entityWords$forEach$seg$$step(MARK_RE, work) {
    const seg = MARK_RE ? work.split(MARK_RE) : [work];
    return seg;
}
export function inner$entityWords$forEach$tailStr(IMPLIED, EACH_RE, MARK_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    const seg = MARK_RE ? work.split(MARK_RE) : [work];
    const tailStr = seg.slice(1).join(' ');
    return tailStr;
}
export function inner$entityWords$forEach$tailStr$$step(seg) {
    const tailStr = seg.slice(1).join(' ');
    return tailStr;
}
export function inner$entityWords$prev(byStem, k) {
    const prev = byStem.get(k);
    return prev;
}
export function inner$domainsFor$top(ranked) {
    const top = ranked.filter((d) => ranked.length && d.hits === ranked[0].hits);
    return top;
}
export function inner$candidatesFor$note$p(byKey, key) {
    const p = byKey.get(key);
    return p;
}
export function inner$candidatesFor$p(byClass, cls) {
    const p = byClass.get(cls);
    return p;
}
export function inner$candidatesFor$p_L334(byClass, cls) {
    const p = byClass.get(cls);
    return p;
}
export function inner$candidatesFor$p_L340(out, h) {
    const p = out.find((o) => o.cls === h.e.cls);
    return p;
}
export function inner$psakFingerprint$norm(cands) {
    const norm = cands.map((c) => [c.cls, c.score, [...c.kinds].sort().join('+')].join(':')).sort().join('|');
    return norm;
}
export function inner$soleClassOf$applied(P) {
    const applied = P && !P.stale ? P : null;
    return applied;
}
export function inner$soleClassOf$w(c, P) {
    const applied = P && !P.stale ? P : null;
    const w = c.find((x) => x.cls === applied.cls);
    return w;
}
export function inner$soleClassOf$w$$step(c, applied) {
    const w = c.find((x) => x.cls === applied.cls);
    return w;
}
export function inner$toSwitches$all(words) {
    const all = words.map((w) => w.word);
    return all;
}
export function inner$toSwitches$map$options(cands) {
    const options = cands.map((c) => ({
        id: c.cls ? `schema:${c.cls}` : `term:${c.key}`,
        kind: c.kind, on: false, cls: c.cls, keys: c.keys || [c.key],
        via: Array.isArray(c.via) ? c.via : [c.via],
        score: c.score, strict: c.strict !== false, fields: c.fields, evidence: c.evidence,
    }));
    return options;
}
export function inner$toSwitches$map$schema(options) {
    const schema = options.filter((o) => o.cls);
    return schema;
}
export function inner$audit$DEF(LANG) {
    const DEF = (LANG.defaultFields || []).join('|');
    return DEF;
}
export function inner$measure$forEach$schema(e) {
    const schema = e.options.filter((o) => o.cls && o.strict);
    return schema;
}
export function inner$arg$i(k, process) {
    const i = process.argv.indexOf(k);
    return i;
}
export function inner$screenEntityMap$targets(base) {
    const targets = base.filter((b) => b.claims && !b.needs && b.kinds.join('/') === 'אין-ישות');
    return targets;
}
export function inner$screenEntityMap$map$rq(g, i) {
    const rq = g.requirements.filter((r) => r.demand === i);
    return rq;
}
export function inner$screenEntityMap$picked(e, res) {
    const picked = res.claims.some((c) => (c.entities || []).includes(e.cls));
    return picked;
}
export function inner$screenEntityMap$n(res) {
    const n = Object.keys(res.needs).length;
    return n;
}
export function inner$screenEntityMap$e(SCREEN_ENTS, r) {
    const e = SCREEN_ENTS.find((x) => x.cls === r.cls && x.src === r.src) || { fields: [] };
    return e;
}
export function inner$screenEntityMap$stillOn(SCREEN_ENTS) {
    const stillOn = SCREEN_ENTS.filter((e) => e.he !== null).map((e) => e.cls);
    return stillOn;
}
export function inner$then$sorted(m) {
    const sorted = m.rows.slice().sort((a, b) => (b.opens || 0) - (a.opens || 0) || String(a.cls).localeCompare(String(b.cls)));
    return sorted;
}
export function inner$then$tot(m) {
    const sorted = m.rows.slice().sort((a, b) => (b.opens || 0) - (a.opens || 0) || String(a.cls).localeCompare(String(b.cls)));
    const tot = sorted.reduce((a, r) => a + (r.opens || 0), 0);
    return tot;
}
export function inner$then$tot$$step(sorted) {
    const tot = sorted.reduce((a, r) => a + (r.opens || 0), 0);
    return tot;
}
export function inner$specFromSentence$real(e) {
    const real = e.options.filter((o) => o.cls && o.fields.length && o.strict !== false);
    return real;
}
export function inner$specFromSentence$noSrc(e) {
    const real = e.options.filter((o) => o.cls && o.fields.length && o.strict !== false);
    const noSrc = real[0].fields.filter((f) => !f.src);
    return noSrc;
}
export function inner$specFromSentence$noSrc$$step(real) {
    const noSrc = real[0].fields.filter((f) => !f.src);
    return noSrc;
}
export function inner$specFromSentence$named(e) {
    const real = e.options.filter((o) => o.cls && o.fields.length && o.strict !== false);
    const named = real.length === 1 ? real[0].fields.filter((f) => HE_RE.test(f.name)) : [];
    return named;
}
export function inner$specFromSentence$named$$step(real) {
    const named = real.length === 1 ? real[0].fields.filter((f) => HE_RE.test(f.name)) : [];
    return named;
}
export function inner$specFromSentence$unnamed(e) {
    const real = e.options.filter((o) => o.cls && o.fields.length && o.strict !== false);
    const unnamed = real.length === 1 ? real[0].fields.filter((f) => !HE_RE.test(f.name)) : [];
    return unnamed;
}
export function inner$specFromSentence$unnamed$$step(real) {
    const unnamed = real.length === 1 ? real[0].fields.filter((f) => !HE_RE.test(f.name)) : [];
    return unnamed;
}
export function inner$specFromSentence$said(e) {
    const said = (e.sentenceFields || []).map((f) => (typeof f === 'string' ? f : f && f.name)).filter(Boolean);
    return said;
}
export function inner$specFromSentence$ident(e) {
    const ident = (e.forms || []).find((f) => f && f !== e.word && e.word.startsWith(f))
        || (PLURAL_M.test(e.word) && e.word.length > 3 ? e.word.replace(PLURAL_M, '') : e.word);
    return ident;
}
export function inner$specFromSentence$fs_(e) {
    const said = (e.sentenceFields || []).map((f) => (typeof f === 'string' ? f : f && f.name)).filter(Boolean);
    const ident = (e.forms || []).find((f) => f && f !== e.word && e.word.startsWith(f))
        || (PLURAL_M.test(e.word) && e.word.length > 3 ? e.word.replace(PLURAL_M, '') : e.word);
    const fs_ = said.length ? said : [ident || SKELETON];
    return fs_;
}
export function inner$specFromSentence$fs_$$step(said, ident) {
    const fs_ = said.length ? said : [ident || SKELETON];
    return fs_;
}
export function inner$scoreForm$best$$after_loop(words, fw, vs) {
    let best = 0;
    for (const w of words) {
        let s = 0;
        if (w === fw)
            s = 3;
        else if (vs.has(w) || vs.has(strip(w)))
            s = 2;
        else if (fw.length >= 3 && (w.startsWith(fw) || strip(w).startsWith(fw)))
            s = 1;
        if (s > best)
            best = s;
    }
    return best;
}
export function inner$evidenceKinds$k$$after_loop(evidence) {
    const k = new Set();
    for (const e of evidence || []) {
        if (e.startsWith(SRC.terms))
            k.add('terms');
        else if (e.startsWith(SRC.packs))
            k.add('packs');
        else if (e.startsWith(SRC.sentence))
            k.add('sentence');
        else if (e.startsWith(SRC.screens))
            k.add('screens');
        else
            k.add('אחר');
    }
    return k;
}

export const SIGS = {
  inner$altForms$ws: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$altForms$i: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$altForms$i$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$keyToClass$x: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$keyToClass$t: [{"name":"BY_KEY","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$keyToClass$c: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$keyToClass$c$$step: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$keyToClass$sing: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$keyToClass$sing$$step: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$slotSources$baseNames: [{"name":"base","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["optional",{"t":"bool"},false],["src",{"t":"str"},false]]}},"opt":false}],
  inner$slotSources$out: [{"name":"cls","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["optional",{"t":"bool"},false],["src",{"t":"str"},false]]}},"opt":false}],
  inner$slotSources$so: [{"name":"SHAPE_OPS","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$slotSources$se: [{"name":"SCREEN_ENTS","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$entityWords$t: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$entityWords$clauses: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$entityWords$clauses$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$clause: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$iParts: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$iParts$$step: [{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$work: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$work$$step: [{"name":"clause","d":{"t":"str"},"opt":false},{"name":"iParts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$entityWords$forEach$seg: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"MARK_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$seg$$step: [{"name":"MARK_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"work","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$tailStr: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"MARK_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$entityWords$forEach$tailStr$$step: [{"name":"seg","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$entityWords$prev: [{"name":"byStem","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$domainsFor$top: [{"name":"ranked","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$candidatesFor$note$p: [{"name":"byKey","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$p: [{"name":"byClass","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$p_L334: [{"name":"byClass","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$candidatesFor$p_L340: [{"name":"out","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"h","d":{"t":"obj","p":[["e",{"t":"any"},false],["score",{"t":"num"},false],["src",{"t":"str"},false]]},"opt":false}],
  inner$psakFingerprint$norm: [{"name":"cands","d":{"t":"any"},"opt":false}],
  inner$soleClassOf$applied: [{"name":"P","d":{"t":"any"},"opt":false}],
  inner$soleClassOf$w: [{"name":"c","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"P","d":{"t":"any"},"opt":false}],
  inner$soleClassOf$w$$step: [{"name":"c","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"applied","d":{"t":"any"},"opt":false}],
  inner$toSwitches$all: [{"name":"words","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$toSwitches$map$options: [{"name":"cands","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$toSwitches$map$schema: [{"name":"options","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},"opt":false}],
  inner$audit$DEF: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$measure$forEach$schema: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$arg$i: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$screenEntityMap$targets: [{"name":"base","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$screenEntityMap$map$rq: [{"name":"g","d":{"t":"obj","p":[["sentence",{"t":"any"},false],["demands",{"t":"arr","of":{"t":"obj","p":[["verb",{"t":"str"},false],["text",{"t":"str"},false],["src",{"t":"any"},false],["declared",{"t":"any"},false]]}},false],["requirements",{"t":"arr","of":{"t":"any"}},false],["sourced",{"t":"arr","of":{"t":"any"}},false],["missing",{"t":"arr","of":{"t":"any"}},false],["byKind",{"t":"rec","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$screenEntityMap$picked: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$screenEntityMap$n: [{"name":"res","d":{"t":"any"},"opt":false}],
  inner$screenEntityMap$e: [{"name":"SCREEN_ENTS","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["skipped",{"t":"str"},false],["fields",{"t":"undef"},true],["ask",{"t":"undef"},true],["opens",{"t":"undef"},true],["units",{"t":"undef"},true],["blocked",{"t":"undef"},true]]},{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["fields",{"t":"any"},false],["ask",{"t":"any"},false],["opens",{"t":"num"},false],["units",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["at",{"t":"str"},false],["word",{"t":"any"},false],["needs",{"t":"num"},false]]}},false],["blocked",{"t":"arr","of":{"t":"str"}},false],["skipped",{"t":"undef"},true]]}]},"opt":false}],
  inner$screenEntityMap$stillOn: [{"name":"SCREEN_ENTS","d":{"t":"any"},"opt":false}],
  inner$then$sorted: [{"name":"m","d":{"t":"obj","p":[["units",{"t":"num"},false],["targets",{"t":"num"},false],["probes",{"t":"num"},false],["rows",{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["skipped",{"t":"str"},false],["fields",{"t":"undef"},true],["ask",{"t":"undef"},true],["opens",{"t":"undef"},true],["units",{"t":"undef"},true],["blocked",{"t":"undef"},true]]},{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["fields",{"t":"any"},false],["ask",{"t":"any"},false],["opens",{"t":"num"},false],["units",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["at",{"t":"str"},false],["word",{"t":"any"},false],["needs",{"t":"num"},false]]}},false],["blocked",{"t":"arr","of":{"t":"str"}},false],["skipped",{"t":"undef"},true]]}]}},false],["restored",{"t":"obj","p":[["memory",{"t":"num"},false],["disk",{"t":"any"},false]]},false]]},"opt":false}],
  inner$then$tot: [{"name":"m","d":{"t":"obj","p":[["units",{"t":"num"},false],["targets",{"t":"num"},false],["probes",{"t":"num"},false],["rows",{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["skipped",{"t":"str"},false],["fields",{"t":"undef"},true],["ask",{"t":"undef"},true],["opens",{"t":"undef"},true],["units",{"t":"undef"},true],["blocked",{"t":"undef"},true]]},{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["fields",{"t":"any"},false],["ask",{"t":"any"},false],["opens",{"t":"num"},false],["units",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["at",{"t":"str"},false],["word",{"t":"any"},false],["needs",{"t":"num"},false]]}},false],["blocked",{"t":"arr","of":{"t":"str"}},false],["skipped",{"t":"undef"},true]]}]}},false],["restored",{"t":"obj","p":[["memory",{"t":"num"},false],["disk",{"t":"any"},false]]},false]]},"opt":false}],
  inner$then$tot$$step: [{"name":"sorted","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["skipped",{"t":"str"},false],["fields",{"t":"undef"},true],["ask",{"t":"undef"},true],["opens",{"t":"undef"},true],["units",{"t":"undef"},true],["blocked",{"t":"undef"},true]]},{"t":"obj","p":[["cls",{"t":"any"},false],["src",{"t":"any"},false],["fields",{"t":"any"},false],["ask",{"t":"any"},false],["opens",{"t":"num"},false],["units",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["at",{"t":"str"},false],["word",{"t":"any"},false],["needs",{"t":"num"},false]]}},false],["blocked",{"t":"arr","of":{"t":"str"}},false],["skipped",{"t":"undef"},true]]}]}},"opt":false}],
  inner$specFromSentence$real: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$noSrc: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$noSrc$$step: [{"name":"real","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},"opt":false}],
  inner$specFromSentence$named: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$named$$step: [{"name":"real","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},"opt":false}],
  inner$specFromSentence$unnamed: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$unnamed$$step: [{"name":"real","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},"opt":false}],
  inner$specFromSentence$said: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$ident: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$fs_: [{"name":"e","d":{"t":"obj","p":[["word",{"t":"any"},false],["forms",{"t":"any"},false],["role",{"t":"any"},false],["clause",{"t":"any"},false],["sentenceFields",{"t":"any"},false],["pick",{"t":"null"},false],["options",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"any"},false],["on",{"t":"bool"},false],["cls",{"t":"any"},false],["keys",{"t":"any"},false],["via",{"t":"any"},false],["score",{"t":"any"},false],["strict",{"t":"bool"},false],["fields",{"t":"any"},false],["evidence",{"t":"any"},false]]}},false],["schemaOptions",{"t":"num"},false]]},"opt":false}],
  inner$specFromSentence$fs_$$step: [{"name":"said","d":{"t":"any"},"opt":false},{"name":"ident","d":{"t":"any"},"opt":false}],
  inner$scoreForm$best$$after_loop: [{"name":"words","d":{"t":"any"},"opt":false},{"name":"fw","d":{"t":"str"},"opt":false},{"name":"vs","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$evidenceKinds$k$$after_loop: [{"name":"evidence","d":{"t":"any"},"opt":false}],
};
