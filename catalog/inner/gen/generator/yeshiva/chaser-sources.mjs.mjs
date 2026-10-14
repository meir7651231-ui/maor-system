// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/chaser-sources.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const partKey = (g) => (g.part === 'table' ? `מילה ${g.word}` : g.part === 'field' ? `שדה ${g.T.name}: ${g.word}` : g.part === 'value' ? `תואר ${g.T.name}: ${g.word}` : `שלבים ${g.T.name}`);
const refNums = (t) => { const out = new Set(); for (const m of String(t || '').matchAll(/\(([^()]*)\)/g))
    for (const tok of m[1].split(/[\s,←→⇐⇒·]+/))
        if (/^\d{1,3}$/.test(tok))
            out.add(String(+tok)); return out; };
const ruleRefs = (r) => { if (!r)
    return new Set(); const s = refNums(`${r.cond || ''} ${r.act || ''} ${r.ex || ''}`); const src = String(r.ex || '').match(/^(\d{1,3})-/); if (src)
    s.add(String(+src[1])); return s; };
const stem = (w) => String(w).replace(/^[ובלמהש]+(?=[֐-׿]{3})/, '').replace(/(ים|ות|ה)$/, '');
export function inner$ruleRefs$s(r) {
    const s = refNums(`${r.cond || ''} ${r.act || ''} ${r.ex || ''}`);
    return s;
}
export function inner$ruleRefs$src(r) {
    const src = String(r.ex || '').match(/^(\d{1,3})-/);
    return src;
}
export function inner$registerAll$register$m(c) {
    const m = c.match(/\d+\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)\s+([\u0590-\u05FF]+)/);
    return m;
}
export function inner$registerAll$register$key(g) {
    const key = `שלבים ${g.table.name}`;
    return key;
}
export function inner$registerAll$register$f(g, cl) {
    const f = (g.table.fields || []).find((x) => stem(x) === stem(cl.x) || x === cl.x);
    return f;
}
export function inner$registerAll$register$f_L42(g, c) {
    const f = (g.table.fields || []).filter((x) => x.length >= 4 && c.includes(x)).sort((a, b) => b.length - a.length)[0];
    return f;
}
export function inner$registerAll$register$cw(ctx, c) {
    const cw = (ctx.compareWords || []).find((w) => c.split(/\s+/).includes(w));
    return cw;
}
export function inner$registerAll$register$key_L44(g, c) {
    const f = (g.table.fields || []).filter((x) => x.length >= 4 && c.includes(x)).sort((a, b) => b.length - a.length)[0];
    const key = `סף ${g.table.name}: ${f}`;
    return key;
}
export function inner$registerAll$register$key_L44$$step(g, f) {
    const key = `סף ${g.table.name}: ${f}`;
    return key;
}
export function inner$registerAll$register$said(ctx, g, c) {
    const f = (g.table.fields || []).filter((x) => x.length >= 4 && c.includes(x)).sort((a, b) => b.length - a.length)[0];
    const key = `סף ${g.table.name}: ${f}`;
    const said = typeof ctx.answers[key] === 'string' ? ctx.answers[key].trim() : '';
    return said;
}
export function inner$registerAll$register$said$$step(ctx, key) {
    const said = typeof ctx.answers[key] === 'string' ? ctx.answers[key].trim() : '';
    return said;
}
export function inner$registerAll$register$dup(ctx, g, c) {
    const f = (g.table.fields || []).filter((x) => x.length >= 4 && c.includes(x)).sort((a, b) => b.length - a.length)[0];
    const key = `סף ${g.table.name}: ${f}`;
    const dup = ctx.asked.has(key);
    return dup;
}
export function inner$registerAll$register$dup$$step(ctx, key) {
    const dup = ctx.asked.has(key);
    return dup;
}
export function inner$registerAll$register$m_L52(g) {
    const m = g.rule.cond.match(/^([\u0590-\u05FF]+)\s+ב([\u0590-\u05FF]+)\s+(מתחת ל|מעל)\s*([\u0590-\u05FF][\u0590-\u05FF\s]*)$/);
    return m;
}
export function inner$registerAll$register$P(pp) {
    const P = pp.outcome === 'built' ? pp.value : null;
    return P;
}
export function inner$registerAll$register$Ch(cp) {
    const Ch = cp.outcome === 'built' ? cp.value : null;
    return Ch;
}
export function inner$registerAll$register$no(parts) {
    const no = parts.find((p) => p.outcome === 'declared');
    return no;
}
export function inner$registerAll$register$qs(parts) {
    const qs = parts.filter((p) => p.outcome === 'question');
    return qs;
}
export function inner$registerAll$register$m_L63(g) {
    const m = g.rule.cond.trim().match(/^([\u0590-\u05FF]+)\s+([\u0590-\u05FF]+)$/);
    return m;
}
export function inner$registerAll$register$act(g) {
    const act = g.rule.act.trim();
    return act;
}
export function inner$registerAll$register$cond(g) {
    const cond = g.rule.cond.trim();
    return cond;
}
export function inner$registerAll$register$vm(ctx, g) {
    const act = g.rule.act.trim();
    const vm = act.match(new RegExp(`^([\\u0590-\\u05FF\\s]+?)\\s+(${(ctx.effectVerbs || []).join('|') || '$^'})$`));
    return vm;
}
export function inner$registerAll$register$vm$$step(ctx, act) {
    const vm = act.match(new RegExp(`^([\\u0590-\\u05FF\\s]+?)\\s+(${(ctx.effectVerbs || []).join('|') || '$^'})$`));
    return vm;
}
export function inner$registerAll$register$cause(g) {
    const cond = g.rule.cond.trim();
    const cause = (cond.match(/^([\u0590-\u05FF]+)/) || [])[1];
    return cause;
}
export function inner$registerAll$register$cause$$step(cond) {
    const cause = (cond.match(/^([\u0590-\u05FF]+)/) || [])[1];
    return cause;
}
export function inner$registerAll$register$key_L77$$step(cause, T, fp) {
    const key = `השפעה ${T.name}: ${fp.value} במצב ${cause}`;
    return key;
}
export function inner$registerAll$register$said_L77$$step(ctx, key) {
    const said = typeof ctx.answers[key] === 'string' ? ctx.answers[key].trim() : '';
    return said;
}
export function inner$registerAll$register$ent$$step(T, fp) {
    const [ent, fld] = String(fp.value).includes('.') ? String(fp.value).split('.') : [T.name, fp.value];
    return ent;
}
export function inner$registerAll$register$fld$$step(T, fp) {
    const [ent, fld] = String(fp.value).includes('.') ? String(fp.value).split('.') : [T.name, fp.value];
    return fld;
}
export function inner$registerAll$register$dup_L81$$step(ctx, key) {
    const dup = ctx.asked.has(key);
    return dup;
}
export function inner$registerAll$register$m_L88(c) {
    const m = c.match(/(\d+)\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)/);
    return m;
}
export function inner$registerAll$register$rest(c) {
    const m = c.match(/(\d+)\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)/);
    const rest = c.slice(c.indexOf(m[0]) + m[0].length);
    return rest;
}
export function inner$registerAll$register$rest$$step(c, m) {
    const rest = c.slice(c.indexOf(m[0]) + m[0].length);
    return rest;
}
export function inner$registerAll$register$entNames(ctx) {
    const entNames = (ctx.tables || []).map((t) => t.name);
    return entNames;
}
export function inner$registerAll$register$neg(c) {
    const m = c.match(/(\d+)\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)/);
    const rest = c.slice(c.indexOf(m[0]) + m[0].length);
    const neg = rest.match(/(?:ש)?לא\s+([\u0590-\u05FF]+)/);
    return neg;
}
export function inner$registerAll$register$neg$$step(rest) {
    const neg = rest.match(/(?:ש)?לא\s+([\u0590-\u05FF]+)/);
    return neg;
}
export function inner$registerAll$register$t0(c) {
    const m = c.match(/(\d+)\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)/);
    const rest = c.slice(c.indexOf(m[0]) + m[0].length);
    const t0 = (rest.trim().split(/\s+/)[0] || '').replace(/[.,:;]+$/, '');
    return t0;
}
export function inner$registerAll$register$t0$$step(rest) {
    const t0 = (rest.trim().split(/\s+/)[0] || '').replace(/[.,:;]+$/, '');
    return t0;
}
export function inner$registerAll$register$adj$$step(noun, t0, construct) {
    const adj = (/(ים|ות)$/.test(noun) && /^[\u0590-\u05FF]{3,}(ים|ות)$/.test(t0) && !/^(ב|ל|ש|כ|ו|מאות)/.test(t0)) || (construct && /^[\u0590-\u05FF]{3,}$/.test(t0)) ? t0 : null;
    return adj;
}
export function inner$registerAll$register$wm(c) {
    const m = c.match(/(\d+)\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)/);
    const rest = c.slice(c.indexOf(m[0]) + m[0].length);
    const wm = rest.match(/ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה)/);
    return wm;
}
export function inner$registerAll$register$wm$$step(rest) {
    const wm = rest.match(/ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה)/);
    return wm;
}
export function inner$registerAll$register$win(c) {
    const m = c.match(/(\d+)\+?\s+([\u0590-\u05FF][\u0590-\u05FF\-"׳']*)/);
    const rest = c.slice(c.indexOf(m[0]) + m[0].length);
    const wm = rest.match(/ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה)/);
    const win = wm ? (wm[1] ? +wm[1] : 60) : null;
    return win;
}
export function inner$registerAll$register$win$$step(wm) {
    const win = wm ? (wm[1] ? +wm[1] : 60) : null;
    return win;
}
export function inner$registerAll$register$T_L100(parts) {
    const T = parts[0].outcome === 'built' ? parts[0].value : null;
    return T;
}
export function inner$registerAll$register$no_L107(parts) {
    const no = parts.find((p) => p.outcome === 'declared');
    return no;
}
export function inner$registerAll$register$qs_L108(parts) {
    const qs = parts.filter((p) => p.outcome === 'question');
    return qs;
}
export function inner$registerAll$register$key_L112(g) {
    const key = partKey(g);
    return key;
}
export function inner$registerAll$register$said_L112(ctx, g) {
    const key = partKey(g);
    const said = key && typeof ctx.answers[key] === 'string' ? ctx.answers[key].trim() : '';
    return said;
}
export function inner$registerAll$register$said_L112$$step(ctx, key) {
    const said = key && typeof ctx.answers[key] === 'string' ? ctx.answers[key].trim() : '';
    return said;
}
export function inner$registerAll$register$t(ctx, g) {
    const key = partKey(g);
    const said = key && typeof ctx.answers[key] === 'string' ? ctx.answers[key].trim() : '';
    const t = (ctx.tables || []).find((x) => x.name === said);
    return t;
}
export function inner$registerAll$register$t$$step(ctx, said) {
    const t = (ctx.tables || []).find((x) => x.name === said);
    return t;
}
export function inner$registerAll$register$u(ctx, g) {
    const u = ctx.answers[`יחידה ${g.word}`];
    return u;
}
export function inner$registerAll$register$t_L118(ctx, g) {
    const u = ctx.answers[`יחידה ${g.word}`];
    const t = typeof u === 'string' && (ctx.tables || []).find((x) => x.name === u.trim());
    return t;
}
export function inner$registerAll$register$t_L118$$step(ctx, u) {
    const t = typeof u === 'string' && (ctx.tables || []).find((x) => x.name === u.trim());
    return t;
}
export function inner$registerAll$register$refs(ctx) {
    const refs = ruleRefs(ctx.cur && ctx.cur.rule);
    return refs;
}
export function inner$registerAll$register$hits(ctx) {
    const refs = ruleRefs(ctx.cur && ctx.cur.rule);
    const hits = [...refs].flatMap((n) => ctx.docRefs[n] || []);
    return hits;
}
export function inner$registerAll$register$hits$$step(ctx, refs) {
    const hits = [...refs].flatMap((n) => ctx.docRefs[n] || []);
    return hits;
}
export function inner$registerAll$register$ts(ctx) {
    const refs = ruleRefs(ctx.cur && ctx.cur.rule);
    const hits = [...refs].flatMap((n) => ctx.docRefs[n] || []);
    const ts = [...new Set(hits.map((h) => h.table))].map((n) => (ctx.tables || []).find((t) => t.name === n)).filter(Boolean);
    return ts;
}
export function inner$registerAll$register$ts$$step(ctx, hits) {
    const ts = [...new Set(hits.map((h) => h.table))].map((n) => (ctx.tables || []).find((t) => t.name === n)).filter(Boolean);
    return ts;
}
export function inner$registerAll$register$kf(ctx, g) {
    const kf = (g.T.fields || []).find((f) => (ctx.typeFieldWords || []).includes(f));
    return kf;
}
export function inner$registerAll$register$mine(ctx, g) {
    const mine = new Set(Object.entries(ctx.docRefs).filter(([, hs]) => hs.some((h) => h.table === g.T.name)).map(([n]) => n));
    return mine;
}
export function inner$registerAll$register$ev(ctx, g) {
    const mine = new Set(Object.entries(ctx.docRefs).filter(([, hs]) => hs.some((h) => h.table === g.T.name)).map(([n]) => n));
    const ev = ctx.corpus.flatMap((d) => d.text.split(/[\n!?]|\.\s/)).find((snt) => snt.includes(g.word) && [...refNums(snt)].some((n) => mine.has(n)));
    return ev;
}
export function inner$registerAll$register$ev$$step(ctx, g, mine) {
    const ev = ctx.corpus.flatMap((d) => d.text.split(/[\n!?]|\.\s/)).find((snt) => snt.includes(g.word) && [...refNums(snt)].some((n) => mine.has(n)));
    return ev;
}
export function inner$registerAll$register$al$$step(E) {
    const al = (E.alias || []).map((a) => a.toLowerCase());
    return al;
}
export function inner$registerAll$register$f_L146$$step(g, al) {
    const f = (g.T.fields || []).find((x) => al.some((a) => x.toLowerCase() === a || x.toLowerCase() === `${a} id` || x.toLowerCase() === `${a}_id`));
    return f;
}
export function inner$registerAll$register$ws(d) {
    const ws = d.text.split(/[\s,.:;()"״]+/);
    return ws;
}
export function inner$registerAll$register$ok$$step(all, with_, src) {
    const ok = (all >= 3 && with_ / all >= 0.5) || (with_ >= 10 && src.size >= 5);
    return ok;
}
export function inner$registerAll$register$key_L155(g) {
    const key = partKey(g);
    return key;
}
export function inner$registerAll$register$dup_L155(ctx, g) {
    const key = partKey(g);
    const dup = ctx.asked.has(key);
    return dup;
}
export function inner$registerAll$register$dup_L155$$step(ctx, key) {
    const dup = ctx.asked.has(key);
    return dup;
}
export function inner$registerAll$register$ask$$step(g, via) {
    const ask = `«${g.word}» — איזה שדה ב«${g.T.name}»? (${(g.T.fields || []).join(' · ')})${via.length ? ` · בטבלה המקושרת: ${via.join(' · ')}` : ''} — או שם שדה חדש, או «לא»`;
    return ask;
}
export function inner$registerAll$register$ask_L159(ctx, g) {
    const ask = `«${g.noun} ${g.word}» — «${g.word}» הוא שלב של ${g.T.name}? (${(g.T.stages || []).join(' · ') || '—'}) — ענה שם-שלב (קיים או חדש), או «${ctx.descWord || 'תיאור'}» אם כל ה${g.noun} כאלה`;
    return ask;
}
export function inner$registerAll$register$ask_L160(g) {
    const ask = `סינון «לא ${g.word}» — אין שלב כזה ב«${g.T.name}» (עכשיו: ${(g.T.stages || []).join(' · ') || '—'}). אילו שלבים להוסיף? (למשל: לא ${g.word})`;
    return ask;
}
export function inner$registerAll$register$txt(g) {
    const txt = `${g.rule.cond} ${g.rule.act}`;
    return txt;
}
export function inner$registerAll$register$words(g) {
    const txt = `${g.rule.cond} ${g.rule.act}`;
    const words = [...new Set((txt.match(/[\u0590-\u05FF][\u0590-\u05FF"׳'\-]{2,}/g) || []))];
    return words;
}
export function inner$registerAll$register$words$$step(txt) {
    const words = [...new Set((txt.match(/[\u0590-\u05FF][\u0590-\u05FF"׳'\-]{2,}/g) || []))];
    return words;
}
export function inner$registerAll$register$refs_L168(g) {
    const refs = ruleRefs(g.rule);
    return refs;
}
export function inner$registerAll$register$act_L169(g) {
    const act = g.rule.act.replace(/\(.*?\)/g, ' ').replace(/[.,;:]+\s*$/, '').trim();
    return act;
}
export function inner$registerAll$register$cut(g) {
    const act = g.rule.act.replace(/\(.*?\)/g, ' ').replace(/[.,;:]+\s*$/, '').trim();
    const cut = act.split(/\s+/);
    return cut;
}
export function inner$registerAll$register$cut$$step(act) {
    const cut = act.split(/\s+/);
    return cut;
}
export function inner$registerAll$register$vi(ctx, g) {
    const V = ctx.decideVerbs || [];
    const act = g.rule.act.replace(/\(.*?\)/g, ' ').replace(/[.,;:]+\s*$/, '').trim();
    const cut = act.split(/\s+/);
    const vi = cut.findIndex((w) => V.includes(w.replace(/[,.;:]+$/, '')));
    return vi;
}
export function inner$registerAll$register$vi$$step(V, cut) {
    const vi = cut.findIndex((w) => V.includes(w.replace(/[,.;:]+$/, '')));
    return vi;
}
export function inner$registerAll$register$who0(ctx, g) {
    const V = ctx.decideVerbs || [];
    const act = g.rule.act.replace(/\(.*?\)/g, ' ').replace(/[.,;:]+\s*$/, '').trim();
    const cut = act.split(/\s+/);
    const vi = cut.findIndex((w) => V.includes(w.replace(/[,.;:]+$/, '')));
    const who0 = (vi > 0 ? cut.slice(0, vi) : cut).join(' ').replace(/[,.;].*$/, '').trim();
    return who0;
}
export function inner$registerAll$register$who0$$step(cut, vi) {
    const who0 = (vi > 0 ? cut.slice(0, vi) : cut).join(' ').replace(/[,.;].*$/, '').trim();
    return who0;
}
export function inner$registerAll$register$who(ctx, g) {
    const A = ctx.actorWords || [];
    const V = ctx.decideVerbs || [];
    const act = g.rule.act.replace(/\(.*?\)/g, ' ').replace(/[.,;:]+\s*$/, '').trim();
    const cut = act.split(/\s+/);
    const vi = cut.findIndex((w) => V.includes(w.replace(/[,.;:]+$/, '')));
    const who0 = (vi > 0 ? cut.slice(0, vi) : cut).join(' ').replace(/[,.;].*$/, '').trim();
    const who = who0 && who0.split(/\s+/).length <= 4 && A.some((a) => who0.includes(a)) ? who0 : null;
    return who;
}
export function inner$registerAll$register$who$$step(A, who0) {
    const who = who0 && who0.split(/\s+/).length <= 4 && A.some((a) => who0.includes(a)) ? who0 : null;
    return who;
}
export function inner$registerAll$register$numBefore$m(g, w) {
    const m = g.rule.cond.match(new RegExp(`(\\d+)\\s+${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    return m;
}
export function inner$registerAll$register$map$raw(ctx, T) {
    const raw = Object.fromEntries(((ctx.docRaw || {})[T.name] || []).map((x) => [x.field, x.raw]));
    return raw;
}
export function inner$registerAll$register$map$heRaw(ctx, T, f) {
    const raw = Object.fromEntries(((ctx.docRaw || {})[T.name] || []).map((x) => [x.field, x.raw]));
    const fr = raw[f] || '';
    const heRaw = (fr.match(/[\u0590-\u05FF]{3,}/g) || []);
    return heRaw;
}
export function inner$registerAll$register$map$heRaw$$step(fr) {
    const heRaw = (fr.match(/[\u0590-\u05FF]{3,}/g) || []);
    return heRaw;
}
export function inner$registerAll$register$map$rf(ctx, refs, T, f) {
    const raw = Object.fromEntries(((ctx.docRaw || {})[T.name] || []).map((x) => [x.field, x.raw]));
    const fr = raw[f] || '';
    const rf = [...refNums(fr)].some((n) => refs.has(n));
    return rf;
}
export function inner$registerAll$register$map$rf$$step(refs, fr) {
    const rf = [...refNums(fr)].some((n) => refs.has(n));
    return rf;
}
export function inner$registerAll$register$map$cf(ctx, T) {
    const cf = T.fields.find((f) => (ctx.condFieldWords || []).includes(f));
    return cf;
}
export function inner$registerAll$register$c(g) {
    const c = g.rule.cond.trim();
    return c;
}
export function inner$registerAll$register$full(g) {
    const c = g.rule.cond.trim();
    const full = `${c} → ${g.rule.act}`;
    return full;
}
export function inner$registerAll$register$full$$step(g, c) {
    const full = `${c} → ${g.rule.act}`;
    return full;
}
export function inner$registerAll$register$T_L192(ctx) {
    const T = (ctx.tables || []).map((t) => t.name);
    return T;
}
export function inner$registerAll$register$said_L201(ctx, g) {
    const said = typeof ctx.answers[g.key] === 'string' ? ctx.answers[g.key].trim() : '';
    return said;
}
export function inner$refNums$out$$after_loop(t) {
    const out = new Set();
    for (const m of String(t || '').matchAll(/\(([^()]*)\)/g))
        for (const tok of m[1].split(/[\s,←→⇐⇒·]+/))
            if (/^\d{1,3}$/.test(tok))
                out.add(String(+tok));
    return out;
}

export const SIGS = {
  inner$ruleRefs$s: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleRefs$src: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$m: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$key: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$f: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"cl","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$f_L42: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$cw: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$key_L44: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$key_L44$$step: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$said: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$said$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$dup: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$dup$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$m_L52: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$P: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$Ch: [{"name":"cp","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$no: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$qs: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$m_L63: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$act: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$cond: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$vm: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$vm$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"act","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$cause: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$cause$$step: [{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$key_L77$$step: [{"name":"cause","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"fp","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$said_L77$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$ent$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"fp","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$fld$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"fp","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$dup_L81$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$m_L88: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$rest: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$rest$$step: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$entNames: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$neg: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$neg$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$t0: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$t0$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$adj$$step: [{"name":"noun","d":{"t":"any"},"opt":false},{"name":"t0","d":{"t":"any"},"opt":false},{"name":"construct","d":{"t":"bool"},"opt":false}],
  inner$registerAll$register$wm: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$wm$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$win: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$win$$step: [{"name":"wm","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$T_L100: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$no_L107: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$qs_L108: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$key_L112: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$said_L112: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$said_L112$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$t: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$t$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$u: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$t_L118: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$t_L118$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$refs: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$hits: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$hits$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"refs","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$ts: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ts$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"hits","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$kf: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$mine: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ev: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ev$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$registerAll$register$al$$step: [{"name":"E","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$f_L146$$step: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"al","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ws: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ok$$step: [{"name":"all","d":{"t":"num"},"opt":false},{"name":"with_","d":{"t":"num"},"opt":false},{"name":"src","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$registerAll$register$key_L155: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$dup_L155: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$dup_L155$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$ask$$step: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"via","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ask_L159: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$ask_L160: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$txt: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$words: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$words$$step: [{"name":"txt","d":{"t":"str"},"opt":false}],
  inner$registerAll$register$refs_L168: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$act_L169: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$cut: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$cut$$step: [{"name":"act","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$vi: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$vi$$step: [{"name":"V","d":{"t":"any"},"opt":false},{"name":"cut","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$who0: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$who0$$step: [{"name":"cut","d":{"t":"any"},"opt":false},{"name":"vi","d":{"t":"num"},"opt":false}],
  inner$registerAll$register$who: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$who$$step: [{"name":"A","d":{"t":"any"},"opt":false},{"name":"who0","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$numBefore$m: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$map$raw: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$map$heRaw: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$map$heRaw$$step: [{"name":"fr","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$map$rf: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"refs","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$map$rf$$step: [{"name":"refs","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"fr","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$map$cf: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$c: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$full: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$full$$step: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$T_L192: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$said_L201: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$refNums$out$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false}],
};
