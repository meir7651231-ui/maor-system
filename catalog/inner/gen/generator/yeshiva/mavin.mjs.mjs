// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/mavin.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const toks = (s) => [...String(s || '').matchAll(/[֐-׿]+(?:["״׳'_][֐-׿]+)*(?:\s*\/\s*[֐-׿]+(?:["״׳'_][֐-׿]+)*)+|[֐-׿]+(?:["״׳'_][֐-׿]+)*|\d+|[A-Za-z]+/g)].map((m) => m[0].replace(/\s*\/\s*/g, '/'));
const stripLead = (w) => { const out = [w]; for (let k = 1; k <= 2 && w.length - k >= 3; k++)
    out.push(w.slice(k)); return out; };
const ARROW = /\s*(?:→|->|⇒|»)\s*/;
const enumOf = (it) => { const g = it.find((w) => w.includes('/')); return g ? g.split('/').filter(Boolean).map((v) => v.replace(/_/g, ' ')) : null; };
const deVav = (it) => (it.length && /^ו[֐-׿]{2,}/.test(it[0]) ? [it[0].slice(1), ...it.slice(1)] : it);
const has = (t, w) => w.includes(' ') ? String(t.label).includes(w) : toks(t.label).some((x) => stripLead(x).includes(w));
const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const KIND_RE = {
    date: /DateTime\.(tryParse|parse)\(\s*value|showDatePicker/,
    bool: /value\s*==\s*.true.|\bbool value\b|Switch\(|Checkbox\(/,
    num: /(num|int|double)\.(tryParse|parse)\(\s*value|TextInputType\.number|\b(int|num|double) (value|high|low)\b/,
    ref: /options\.contains\(\s*value|DropdownButton/,
};
export function inner$hintOf$d(x) {
    const d = x.e.display.size + x.e.data.size;
    return d;
}
export function inner$enumOf$g(it) {
    const g = it.find((w) => w.includes('/'));
    return g;
}
export function inner$listOf$parts(segment) {
    let parts = segment.split(/[,،]/).map((p) => toks(p)).filter((p) => p.length);
    return parts;
}
export function inner$listOf$last(parts) {
    const last = parts[parts.length - 1];
    return last;
}
export function inner$listOf$vi(parts) {
    const last = parts[parts.length - 1];
    const vi = last.findIndex((w, i) => i > 0 && /^ו[֐-׿]{2,}/.test(w));
    return vi;
}
export function inner$listOf$vi$$step(last) {
    const vi = last.findIndex((w, i) => i > 0 && /^ו[֐-׿]{2,}/.test(w));
    return vi;
}
export function inner$listOf$before(first, cut) {
    let before = first.slice(0, cut);
    return before;
}
export function inner$listOf$item0(first, cut) {
    let item0 = first.slice(cut);
    return item0;
}
export function inner$splitExamples$re(EX_WORDS, ST_WORDS) {
    const re = new RegExp(`\\s*(?:${EX_WORDS.join('|')})\\s*:?\\s*(.+?)(?=\\.(?:\\s|$)${ST_WORDS.length ? `|;\\s*(?:${ST_WORDS.join('|')})\\s*:` : ''}|$)`, 'g');
    return re;
}
export function inner$splitExamples$replace$records(body) {
    const records = body.split(';').map((r) => { const c = r.split(/[,،]/).map((v) => v.trim()); while (c.length && !c[c.length - 1])
        c.pop(); return c; }).filter((r) => r.some(Boolean));
    return records;
}
export function inner$splitExamples$replace$map$c(r) {
    const c = r.split(/[,،]/).map((v) => v.trim());
    return c;
}
export function inner$formOf$sentence(sentence0) {
    const sentence = String(sentence0 || '').replace(/\(([^()]*)\)/g, (m, inner) => { const vs = inner.split(/[,،]/).map((s) => s.trim().replace(/\s+/g, '_')).filter(Boolean); return vs.length > 1 ? ' ' + vs.join('/') + ' ' : m; });
    return sentence;
}
export function inner$formOf$replace$vs(inner) {
    const vs = inner.split(/[,،]/).map((s) => s.trim().replace(/\s+/g, '_')).filter(Boolean);
    return vs;
}
export function inner$formOf$words(sentence0) {
    const sentence = String(sentence0 || '').replace(/\(([^()]*)\)/g, (m, inner) => { const vs = inner.split(/[,،]/).map((s) => s.trim().replace(/\s+/g, '_')).filter(Boolean); return vs.length > 1 ? ' ' + vs.join('/') + ' ' : m; });
    const words = toks(sentence);
    return words;
}
export function inner$formOf$words$$step(sentence) {
    const words = toks(sentence);
    return words;
}
export function inner$formOf$segments(sentence0) {
    const sentence = String(sentence0 || '').replace(/\(([^()]*)\)/g, (m, inner) => { const vs = inner.split(/[,،]/).map((s) => s.trim().replace(/\s+/g, '_')).filter(Boolean); return vs.length > 1 ? ' ' + vs.join('/') + ' ' : m; });
    const segments = sentence.split(/(?<!\d):|:(?!\d{2})|;|\.(?=\s|$)/).map((s) => s.trim()).filter(Boolean);
    return segments;
}
export function inner$formOf$segments$$step(sentence) {
    const segments = sentence.split(/(?<!\d):|:(?!\d{2})|;|\.(?=\s|$)/).map((s) => s.trim()).filter(Boolean);
    return segments;
}
export function inner$formOf$unitOf$label(run, plain) {
    const label = plain.length ? plain.join(' ') : run.join(' ');
    return label;
}
export function inner$formOf$unitOf$object(plain, j) {
    let object = j < plain.length ? plain[j] : null;
    return object;
}
export function inner$formOf$unitOf$words(plain, j, object) {
    let words = plain.slice(1, object ? j : plain.length);
    return words;
}
export function inner$formOf$segToks(seg) {
    const segToks = toks(seg);
    return segToks;
}
export function inner$formOf$parts(nxt) {
    const parts = nxt.split(ARROW).flatMap((p) => p.split(/[,،]/)).map((p) => deVav(toks(p))).filter((p) => p.length);
    return parts;
}
export function inner$formOf$owner(things) {
    const owner = [...things].reverse().find((t) => t.fields.length) || things[things.length - 1];
    return owner;
}
export function inner$formOf$ar(seg) {
    const ar = seg.split(ARROW);
    return ar;
}
export function inner$formOf$head(seg) {
    const ar = seg.split(ARROW);
    const head = toks(ar[0]);
    return head;
}
export function inner$formOf$head$$step(ar) {
    const head = toks(ar[0]);
    return head;
}
export function inner$formOf$last(runs) {
    const last = runs.length ? runs[runs.length - 1] : [];
    return last;
}
export function inner$formOf$st0(runs) {
    const last = runs.length ? runs[runs.length - 1] : [];
    const st0 = last[last.length - 1];
    return st0;
}
export function inner$formOf$st0$$step(last) {
    const st0 = last[last.length - 1];
    return st0;
}
export function inner$formOf$ownerRun(runs) {
    const last = runs.length ? runs[runs.length - 1] : [];
    const ownerRun = last.length > 1 ? last.slice(0, -1) : (runs.length > 1 ? runs[runs.length - 2] : []);
    return ownerRun;
}
export function inner$formOf$ownerRun$$step(runs, last) {
    const ownerRun = last.length > 1 ? last.slice(0, -1) : (runs.length > 1 ? runs[runs.length - 2] : []);
    return ownerRun;
}
export function inner$formOf$pre(seg, L, head) {
    const pre = L ? L.before : (head || toks(seg));
    return pre;
}
export function inner$formOf$made(things, before) {
    const made = things.slice(before);
    return made;
}
export function inner$formOf$gap(seg, L, head, runs) {
    const pre = L ? L.before : (head || toks(seg));
    const gap = pre.slice(pre.indexOf(runs[0][runs[0].length - 1]) + 1, pre.indexOf(runs[1][0]));
    return gap;
}
export function inner$formOf$gap$$step(pre, runs) {
    const gap = pre.slice(pre.indexOf(runs[0][runs[0].length - 1]) + 1, pre.indexOf(runs[1][0]));
    return gap;
}
export function inner$formOf$run(runs2) {
    const run = runs2.length ? runs2[runs2.length - 1] : [];
    return run;
}
export function inner$formOf$j(runs2) {
    const run = runs2.length ? runs2[runs2.length - 1] : [];
    let j = run.length - 1;
    return j;
}
export function inner$formOf$j$$step(run) {
    let j = run.length - 1;
    return j;
}
export function inner$formOf$ev(it) {
    const ev = enumOf(it);
    return ev;
}
export function inner$formOf$lbl(it) {
    const ev = enumOf(it);
    const lbl = ev ? it.filter((w) => !w.includes('/')).join(' ') : '';
    return lbl;
}
export function inner$formOf$lbl$$step(it, ev) {
    const lbl = ev ? it.filter((w) => !w.includes('/')).join(' ') : '';
    return lbl;
}
export function inner$formOf$before(sentence0, e) {
    const before = String(sentence0).slice(0, e.at);
    return before;
}
export function inner$formOf$t0(sentence0, things, e) {
    const before = String(sentence0).slice(0, e.at);
    const t0 = [...things].reverse().find((x) => before.includes(x.src));
    return t0;
}
export function inner$formOf$t0$$step(things, before) {
    const t0 = [...things].reverse().find((x) => before.includes(x.src));
    return t0;
}
export function inner$formOf$map$j(r) {
    const j = r.join(', ');
    return j;
}
export function inner$formOf$map$a(ARROWS, r) {
    const j = r.join(', ');
    const a = ARROWS.find((z) => j.includes(z));
    return a;
}
export function inner$formOf$map$a$$step(ARROWS, j) {
    const a = ARROWS.find((z) => j.includes(z));
    return a;
}
export function inner$formOf$map$i(ARROWS, r) {
    const j = r.join(', ');
    const a = ARROWS.find((z) => j.includes(z));
    const [i, o] = j.split(a);
    return i;
}
export function inner$formOf$map$i$$step(j, a) {
    const [i, o] = j.split(a);
    return i;
}
export function inner$formOf$map$o(ARROWS, r) {
    const j = r.join(', ');
    const a = ARROWS.find((z) => j.includes(z));
    const [i, o] = j.split(a);
    return o;
}
export function inner$formOf$map$o$$step(j, a) {
    const [i, o] = j.split(a);
    return o;
}
export function inner$formOf$t(sentence0, things, e) {
    const before = String(sentence0).slice(0, e.at);
    const t = [...things].reverse().find((x) => x.fields.length && before.includes(x.src));
    return t;
}
export function inner$formOf$t$$step(things, before) {
    const t = [...things].reverse().find((x) => x.fields.length && before.includes(x.src));
    return t;
}
export function inner$answerFor$kw(k) {
    const kw = toks(k);
    return kw;
}
export function inner$questionsFor$af(a, f) {
    const af = (a.fields || []).find((x) => x.label === f.label);
    return af;
}
export function inner$questionsFor$inRel(t) {
    const inRel = new Set(t.rel ? t.rel.words : []);
    return inRel;
}
export function inner$needsFrom$fields(t, a) {
    const fields = (a.fields && a.fields.length) ? a.fields : t.fields.map((f) => ({ label: f.label, type: 'text' }));
    return fields;
}
export function inner$needsFrom$nums(t, a) {
    const fields = (a.fields && a.fields.length) ? a.fields : t.fields.map((f) => ({ label: f.label, type: 'text' }));
    const nums = fields.filter((f) => f.type === 'num').length;
    return nums;
}
export function inner$needsFrom$nums$$step(fields) {
    const nums = fields.filter((f) => f.type === 'num').length;
    return nums;
}
export function inner$needsFrom$goal(t) {
    const goal = t.rel.words.join(' ');
    return goal;
}
export function inner$declOf$t(form, decl, skip) {
    const t = form.things.find((t) => t !== skip && has(t, decl.word) && decl.values.some((v) => has(t, v)));
    return t;
}
export function inner$declOf$value(form, decl, skip) {
    const t = form.things.find((t) => t !== skip && has(t, decl.word) && decl.values.some((v) => has(t, v)));
    const value = decl.values.find((v) => has(t, v));
    return value;
}
export function inner$declOf$value$$step(decl, t) {
    const value = decl.values.find((v) => has(t, v));
    return value;
}
export function inner$declOf$vw(form, decl, skip) {
    const t = form.things.find((t) => t !== skip && has(t, decl.word) && decl.values.some((v) => has(t, v)));
    const value = decl.values.find((v) => has(t, v));
    const vw = value.split(' ');
    return vw;
}
export function inner$declOf$vw$$step(value) {
    const vw = value.split(' ');
    return vw;
}
export function inner$declOf$extra(form, decl, skip) {
    const t = form.things.find((t) => t !== skip && has(t, decl.word) && decl.values.some((v) => has(t, v)));
    const value = decl.values.find((v) => has(t, v));
    const vw = value.split(' ');
    const extra = toks(t.label).filter((x) => !stripLead(x).includes(decl.word) && !vw.some((v) => stripLead(x).includes(v))).join(' ') || null;
    return extra;
}
export function inner$declOf$extra$$step(decl, t, vw) {
    const extra = toks(t.label).filter((x) => !stripLead(x).includes(decl.word) && !vw.some((v) => stripLead(x).includes(v))).join(' ') || null;
    return extra;
}
export function inner$sourceDeclsOf$ents(form) {
    const ents = form.things.filter((t) => t.fields && t.fields.length);
    return ents;
}
export function inner$rulesDeclOf$s(form) {
    const s = String(form.sentence || '');
    return s;
}
export function inner$rulesDeclOf$ents(form) {
    const ents = form.things.filter((t) => t.fields && t.fields.length);
    return ents;
}
export function inner$rulesDeclOf$listAfter$m(s, w) {
    const m = s.match(new RegExp('(?:^|[.;]\\s*)' + esc(w) + '\\s*:\\s*([^.;]+)'));
    return m;
}
export function inner$rulesDeclOf$rest(SL, seg) {
    const rest = seg.slice(SL.modeRuleWord.length).trim();
    return rest;
}
export function inner$rulesDeclOf$mode(SL, modes, seg) {
    const rest = seg.slice(SL.modeRuleWord.length).trim();
    const mode = modes.list.find((m) => rest.startsWith(m + ' '));
    return mode;
}
export function inner$rulesDeclOf$mode$$step(modes, rest) {
    const mode = modes.list.find((m) => rest.startsWith(m + ' '));
    return mode;
}
export function inner$rulesDeclOf$tail(SL, modes, seg) {
    const rest = seg.slice(SL.modeRuleWord.length).trim();
    const mode = modes.list.find((m) => rest.startsWith(m + ' '));
    const tail = rest.slice(mode.length).trim();
    return tail;
}
export function inner$rulesDeclOf$tail$$step(rest, mode) {
    const tail = rest.slice(mode.length).trim();
    return tail;
}
export function inner$rulesDeclOf$hw(SL, modes, seg) {
    const rest = seg.slice(SL.modeRuleWord.length).trim();
    const mode = modes.list.find((m) => rest.startsWith(m + ' '));
    const tail = rest.slice(mode.length).trim();
    const hw = (SL.hideWords || []).find((w) => tail.startsWith(w + ' '));
    return hw;
}
export function inner$rulesDeclOf$hw$$step(SL, tail) {
    const hw = (SL.hideWords || []).find((w) => tail.startsWith(w + ' '));
    return hw;
}
export function inner$rulesDeclOf$ow(SL, modes, seg) {
    const rest = seg.slice(SL.modeRuleWord.length).trim();
    const mode = modes.list.find((m) => rest.startsWith(m + ' '));
    const tail = rest.slice(mode.length).trim();
    const ow = (SL.onlyWords || []).find((w) => tail.startsWith(w + ' '));
    return ow;
}
export function inner$rulesDeclOf$ow$$step(SL, tail) {
    const ow = (SL.onlyWords || []).find((w) => tail.startsWith(w + ' '));
    return ow;
}
export function inner$rulesDeclOf$rw(SL, seg) {
    const rw = (SL.roleSeeWords || []).find((w) => seg.includes(' ' + w + ' '));
    return rw;
}
export function inner$rulesDeclOf$role(SL, seg) {
    const rw = (SL.roleSeeWords || []).find((w) => seg.includes(' ' + w + ' '));
    const role = seg.slice(0, seg.indexOf(' ' + rw + ' ')).trim();
    return role;
}
export function inner$rulesDeclOf$role$$step(seg, rw) {
    const role = seg.slice(0, seg.indexOf(' ' + rw + ' ')).trim();
    return role;
}
export function inner$headOf$s(form) {
    const s = String(form.sentence || '');
    return s;
}
export function inner$headOf$ci(form) {
    const s = String(form.sentence || '');
    const ci = s.indexOf(':');
    return ci;
}
export function inner$headOf$ci$$step(s) {
    const ci = s.indexOf(':');
    return ci;
}
export function inner$headOf$seg0(form) {
    const s = String(form.sentence || '');
    const ci = s.indexOf(':');
    const seg0 = s.slice(0, ci).trim();
    return seg0;
}
export function inner$headOf$seg0$$step(s, ci) {
    const seg0 = s.slice(0, ci).trim();
    return seg0;
}
export function inner$headOf$head(form, decl) {
    const s = String(form.sentence || '');
    const ci = s.indexOf(':');
    const seg0 = s.slice(0, ci).trim();
    const head = form.things.filter((t) => t.src === seg0 && !decl.has(t)).map((t) => t.label).join(' ').trim();
    return head;
}
export function inner$headOf$head$$step(form, seg0, decl) {
    const head = form.things.filter((t) => t.src === seg0 && !decl.has(t)).map((t) => t.label).join(' ').trim();
    return head;
}
export function inner$specOf$decl(srv, lk) {
    const decl = new Set([srv && srv.thing, lk && lk.thing].filter(Boolean));
    return decl;
}
export function inner$specOf$names(ents) {
    const names = new Set(ents.map((t) => t.label));
    return names;
}
export function inner$specOf$fields(t, a) {
    const fields = (a.fields && a.fields.length) ? a.fields.map((f) => f.label + (f.enumVals ? `{${f.enumVals.join('|')}}` : '') + (f.formula ? `=${f.formula}` : '')) : t.fields.map((f) => f.label + (f.enumVals ? `{${f.enumVals.join('|')}}` : '') + (f.formula ? `=${f.formula}` : ''));
    return fields;
}
export function inner$specOf$refs(ents, a) {
    const names = new Set(ents.map((t) => t.label));
    const refs = (a.fields || []).filter((f) => f.type === 'ref' && f.to && names.has(f.to)).map((f) => f.to);
    return refs;
}
export function inner$specOf$refs$$step(names, a) {
    const refs = (a.fields || []).filter((f) => f.type === 'ref' && f.to && names.has(f.to)).map((f) => f.to);
    return refs;
}
export function inner$specOf$stagesPart(STAGE_WORDS, t) {
    const stagesPart = t.stages && t.stages.length >= 2 ? ` | ${t.stagesWord || [...STAGE_WORDS][0]}: ${t.stages.join(', ')}` : '';
    return stagesPart;
}
export function inner$specOf$ef(t, a) {
    const ef = (a.fields || []).find((f) => f.enumVals) || t.fields.find((f) => f.enumVals);
    return ef;
}
export function inner$specOf$g(t) {
    const g = `הודעה ${t.label}`;
    return g;
}
export function inner$needsFor$rel(t) {
    const rel = t.rel || { subject: toks(t.label)[0] || t.label, words: toks(t.label).slice(1), object: t.content || null };
    return rel;
}
export function inner$needsFor$id(t) {
    const id = `${toks(t.label)[0]}.${toks(t.label).slice(1, 4).join('_') || 'need'}`;
    return id;
}
export function inner$needsFor$valueWords(t) {
    const valueWords = (t.values || []).map((v) => v.unit).filter(Boolean);
    return valueWords;
}
export function inner$planBehaviors$picks(P) {
    const picks = Object.fromEntries(Object.entries(P).map(([id, p]) => [id, { pick: p.pick || null, nodes: p.nodes || null, chain: p.chain || null, proven: !!p.proven, ties: p.ties || 0, top3: (p.top3 || []).slice(0, 3) }]));
    return picks;
}
export function inner$planBehaviors$trees(needs, P) {
    const trees = Object.fromEntries(Object.entries(P).filter(([, p]) => p.proven && (p.tree || (p.pick && p.file && /^\w+$/.test(p.pick)))).map(([id, p]) => [id, p.tree || { k: 'a', id: p.pick, file: p.file, args: (needs[id].params || []).map((_, i) => ({ k: 'p', i })) }]));
    return trees;
}
export function inner$valueKinds$k(src) {
    let k = Object.entries(KIND_RE).filter(([, re]) => re.test(src)).map(([n]) => n);
    return k;
}
export function inner$valueKinds$fd(src) {
    const fd = src.match(/fieldDemo = <String>\[([^\]]*)\]/);
    return fd;
}
export function inner$valueKinds$demo(src) {
    const fd = src.match(/fieldDemo = <String>\[([^\]]*)\]/);
    const demo = [...fd[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    return demo;
}
export function inner$valueKinds$demo$$step(fd) {
    const demo = [...fd[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    return demo;
}
export function inner$coverNeeds$map$missing(c) {
    let missing = c.missing.slice();
    return missing;
}
export function inner$stripLead$out$$after_loop(w) {
    const out = [w];
    for (let k = 1; k <= 2 && w.length - k >= 3; k++)
        out.push(w.slice(k));
    return out;
}
export function inner$formOf$orphan$$after_loop(sentence0, ex, things, ARROWS) {
    const orphan = [];
    for (const e of ex.examples) {
        const before = String(sentence0).slice(0, e.at);
        if (ARROWS.length && e.records.every((r) => ARROWS.some((a) => r.join(', ').includes(a)))) { // דוגמאות-חץ ⇒ הדבר הקרוב שלפניהן (גם בלי שדות): קלט⇒פלט להרכבת-התנהגות · «3, 4 ⇒ 7» = כמה קלטים (הפסיק נשמר בקלט)
            const t0 = [...things].reverse().find((x) => before.includes(x.src));
            if (t0) {
                t0.ioExamples = (t0.ioExamples || []).concat(e.records.map((r) => { const j = r.join(', '); const a = ARROWS.find((z) => j.includes(z)); const [i, o] = j.split(a); return [i.trim(), o.trim()]; }));
                continue;
            }
        }
        const t = [...things].reverse().find((x) => x.fields.length && before.includes(x.src));
        if (t)
            t.examples = (t.examples || []).concat(e.records);
        else
            orphan.push(e.records);
    }
    return orphan;
}
export function inner$rulesDeclOf$segs$$after_loop(SL, modes, roles, ruleSegs) {
    const segs = new Set([...ruleSegs]);
    for (const [w, x] of [[SL.modesWord, modes], [SL.rolesWord, roles]])
        if (x.raw) {
            segs.add(w);
            segs.add(x.raw);
        }
    return segs;
}

export const SIGS = {
  inner$hintOf$d: [{"name":"x","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["form",{"t":"any"},false],["e",{"t":"any"},false]]}]},"opt":false}],
  inner$enumOf$g: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$listOf$parts: [{"name":"segment","d":{"t":"any"},"opt":false}],
  inner$listOf$last: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$listOf$vi: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$listOf$vi$$step: [{"name":"last","d":{"t":"any"},"opt":false}],
  inner$listOf$before: [{"name":"first","d":{"t":"any"},"opt":false},{"name":"cut","d":{"t":"num"},"opt":false}],
  inner$listOf$item0: [{"name":"first","d":{"t":"any"},"opt":false},{"name":"cut","d":{"t":"num"},"opt":false}],
  inner$splitExamples$re: [{"name":"EX_WORDS","d":{"t":"any"},"opt":false},{"name":"ST_WORDS","d":{"t":"any"},"opt":false}],
  inner$splitExamples$replace$records: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$splitExamples$replace$map$c: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$formOf$sentence: [{"name":"sentence0","d":{"t":"any"},"opt":false}],
  inner$formOf$replace$vs: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$formOf$words: [{"name":"sentence0","d":{"t":"any"},"opt":false}],
  inner$formOf$words$$step: [{"name":"sentence","d":{"t":"str"},"opt":false}],
  inner$formOf$segments: [{"name":"sentence0","d":{"t":"any"},"opt":false}],
  inner$formOf$segments$$step: [{"name":"sentence","d":{"t":"str"},"opt":false}],
  inner$formOf$unitOf$label: [{"name":"run","d":{"t":"any"},"opt":false},{"name":"plain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$unitOf$object: [{"name":"plain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$formOf$unitOf$words: [{"name":"plain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"j","d":{"t":"num"},"opt":false},{"name":"object","d":{"t":"any"},"opt":false}],
  inner$formOf$segToks: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$formOf$parts: [{"name":"nxt","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$formOf$owner: [{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$ar: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$formOf$head: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$formOf$head$$step: [{"name":"ar","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$formOf$last: [{"name":"runs","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false}],
  inner$formOf$st0: [{"name":"runs","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false}],
  inner$formOf$st0$$step: [{"name":"last","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$ownerRun: [{"name":"runs","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false}],
  inner$formOf$ownerRun$$step: [{"name":"runs","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false},{"name":"last","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$pre: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"L","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["rest",{"t":"any"},false],["only",{"t":"bool"},false],["head",{"t":"any"},false],["before",{"t":"undef"},true],["items",{"t":"undef"},true],["dropped",{"t":"undef"},true]]},{"t":"obj","p":[["before",{"t":"any"},false],["items",{"t":"arr","of":{"t":"any"}},false],["rest",{"t":"any"},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["only",{"t":"undef"},true],["head",{"t":"undef"},true]]}]},"opt":false},{"name":"head","d":{"t":"any"},"opt":false}],
  inner$formOf$made: [{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"before","d":{"t":"num"},"opt":false}],
  inner$formOf$gap: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"L","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["rest",{"t":"any"},false],["only",{"t":"bool"},false],["head",{"t":"any"},false],["before",{"t":"undef"},true],["items",{"t":"undef"},true],["dropped",{"t":"undef"},true]]},{"t":"obj","p":[["before",{"t":"any"},false],["items",{"t":"arr","of":{"t":"any"}},false],["rest",{"t":"any"},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["only",{"t":"undef"},true],["head",{"t":"undef"},true]]}]},"opt":false},{"name":"head","d":{"t":"any"},"opt":false},{"name":"runs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$gap$$step: [{"name":"pre","d":{"t":"any"},"opt":false},{"name":"runs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$run: [{"name":"runs2","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$j: [{"name":"runs2","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$formOf$j$$step: [{"name":"run","d":{"t":"any"},"opt":false}],
  inner$formOf$ev: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$formOf$lbl: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$formOf$lbl$$step: [{"name":"it","d":{"t":"any"},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false}],
  inner$formOf$before: [{"name":"sentence0","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$formOf$t0: [{"name":"sentence0","d":{"t":"any"},"opt":false},{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$formOf$t0$$step: [{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"before","d":{"t":"str"},"opt":false}],
  inner$formOf$map$j: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$formOf$map$a: [{"name":"ARROWS","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$formOf$map$a$$step: [{"name":"ARROWS","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$formOf$map$i: [{"name":"ARROWS","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$formOf$map$i$$step: [{"name":"j","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$formOf$map$o: [{"name":"ARROWS","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$formOf$map$o$$step: [{"name":"j","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$formOf$t: [{"name":"sentence0","d":{"t":"any"},"opt":false},{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$formOf$t$$step: [{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"before","d":{"t":"str"},"opt":false}],
  inner$answerFor$kw: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$questionsFor$af: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$questionsFor$inRel: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$needsFrom$fields: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$needsFrom$nums: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$needsFrom$nums$$step: [{"name":"fields","d":{"t":"any"},"opt":false}],
  inner$needsFrom$goal: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$declOf$t: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"decl","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"null"},"opt":false}],
  inner$declOf$value: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"decl","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"null"},"opt":false}],
  inner$declOf$value$$step: [{"name":"decl","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$declOf$vw: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"decl","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"null"},"opt":false}],
  inner$declOf$vw$$step: [{"name":"value","d":{"t":"any"},"opt":false}],
  inner$declOf$extra: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"decl","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"null"},"opt":false}],
  inner$declOf$extra$$step: [{"name":"decl","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"vw","d":{"t":"any"},"opt":false}],
  inner$sourceDeclsOf$ents: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$rulesDeclOf$s: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$rulesDeclOf$ents: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$rulesDeclOf$listAfter$m: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$rulesDeclOf$rest: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$mode: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"modes","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$mode$$step: [{"name":"modes","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"rest","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$tail: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"modes","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$tail$$step: [{"name":"rest","d":{"t":"str"},"opt":false},{"name":"mode","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$rulesDeclOf$hw: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"modes","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$hw$$step: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"tail","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$ow: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"modes","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$ow$$step: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"tail","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$rw: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$role: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$rulesDeclOf$role$$step: [{"name":"seg","d":{"t":"str"},"opt":false},{"name":"rw","d":{"t":"any"},"opt":false}],
  inner$headOf$s: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$headOf$ci: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$headOf$ci$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$headOf$seg0: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$headOf$seg0$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"ci","d":{"t":"num"},"opt":false}],
  inner$headOf$head: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"decl","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$headOf$head$$step: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"seg0","d":{"t":"str"},"opt":false},{"name":"decl","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$specOf$decl: [{"name":"srv","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["thing",{"t":"any"},false],["value",{"t":"any"},false],["extra",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}]},"opt":false},{"name":"lk","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["thing",{"t":"any"},false],["value",{"t":"any"},false],["extra",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}]},"opt":false}],
  inner$specOf$names: [{"name":"ents","d":{"t":"any"},"opt":false}],
  inner$specOf$fields: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$specOf$refs: [{"name":"ents","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$specOf$refs$$step: [{"name":"names","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$specOf$stagesPart: [{"name":"STAGE_WORDS","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$specOf$ef: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$specOf$g: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$needsFor$rel: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$needsFor$id: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$needsFor$valueWords: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$planBehaviors$picks: [{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$planBehaviors$trees: [{"name":"needs","d":{"t":"obj","n":"needs","p":[]},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$valueKinds$k: [{"name":"src","d":{"t":"str"},"opt":false}],
  inner$valueKinds$fd: [{"name":"src","d":{"t":"str"},"opt":false}],
  inner$valueKinds$demo: [{"name":"src","d":{"t":"str"},"opt":false}],
  inner$valueKinds$demo$$step: [{"name":"fd","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$coverNeeds$map$missing: [{"name":"c","d":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"any"},false],["need",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"any"},false],["alts",{"t":"any"},false],["composed",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"str"}},false],["ok",{"t":"bool"},false]]},{"t":"obj","p":[["op",{"t":"any"},false],["need",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"arr","of":{"t":"any"}},false],["alts",{"t":"any"},false],["composed",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"any"}},false],["ok",{"t":"bool"},false]]}]},"opt":false}],
  inner$stripLead$out$$after_loop: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$formOf$orphan$$after_loop: [{"name":"sentence0","d":{"t":"any"},"opt":false},{"name":"ex","d":{"t":"obj","p":[["text",{"t":"any"},false],["examples",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"things","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ARROWS","d":{"t":"any"},"opt":false}],
  inner$rulesDeclOf$segs$$after_loop: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"modes","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"roles","d":{"t":"or","of":[{"t":"obj","p":[["list",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"null"},false]]},{"t":"obj","p":[["list",{"t":"arr","of":{"t":"str"}},false],["raw",{"t":"str"},false]]}]},"opt":false},{"name":"ruleSegs","d":{"t":"set","of":{"t":"any"}},"opt":false}],
};
