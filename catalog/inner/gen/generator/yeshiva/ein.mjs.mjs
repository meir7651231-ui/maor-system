// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/ein.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isNum = (v) => /^-?\d+(\.\d+)?$/.test(String(v).trim());
const escRe = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const defin = (x) => String(x).replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ');
const hit = (op, v, n) => (op === '>' ? v > n : op === '<' ? v < n : v === n);
const wantOf = (t) => { const m = [...String(t || '').matchAll(/([^,;:\d\-−]+?)\s*[:=]?\s*([-−]?\d+(?:\.\d+)?)/g)].map((x) => [x[1].trim(), Number(x[2].replace('−', '-'))]).filter(([k]) => k); return m.length ? Object.fromEntries(m) : null; };
export function inner$defineByMarks$keys(thing) {
    const keys = new Set((thing.examples || []).map((r) => String(r[0]).trim()));
    return keys;
}
export function inner$defineByMarks$marks(ans) {
    const marks = ans.split(/[,;\s]+/).filter(Boolean);
    return marks;
}
export function inner$defineByMarks$numIdx(thing) {
    const numIdx = thing.fields.map((f, i) => i).filter((i) => i > 0 && thing.examples.every((r) => isNum(r[i])));
    return numIdx;
}
export function inner$defineByMarks$textIdx(thing, dateIdx) {
    const numIdx = thing.fields.map((f, i) => i).filter((i) => i > 0 && thing.examples.every((r) => isNum(r[i])));
    const textIdx = thing.fields.map((f, i) => i).filter((i) => i > 0 && !numIdx.includes(i) && !dateIdx.includes(i));
    return textIdx;
}
export function inner$defineByMarks$textIdx$$step(thing, numIdx, dateIdx) {
    const textIdx = thing.fields.map((f, i) => i).filter((i) => i > 0 && !numIdx.includes(i) && !dateIdx.includes(i));
    return textIdx;
}
export function inner$defineByMarks$dayWord(SL) {
    const dayWord = Object.keys(SL.timeUnits || {}).find((u) => (SL.timeUnits || {})[u] === 1) || '';
    return dayWord;
}
export function inner$defineByMarks$p(w, P, i) {
    const p = P[`def.${w}.${i}`];
    return p;
}
export function inner$defineByMarks$sm(w, P, i) {
    const p = P[`def.${w}.${i}`];
    const sm = String(p.pick).match(/'([^']*)'/);
    return sm;
}
export function inner$defineByMarks$sm$$step(p) {
    const sm = String(p.pick).match(/'([^']*)'/);
    return sm;
}
export function inner$defineByMarks$cv(w, P, i) {
    const p = P[`def.${w}.${i}`];
    const sm = String(p.pick).match(/'([^']*)'/);
    const cv = sm ? sm[1] : null;
    return cv;
}
export function inner$defineByMarks$cv$$step(sm) {
    const cv = sm ? sm[1] : null;
    return cv;
}
export function inner$defineByMarks$m(w, P, i) {
    const p = P[`def.${w}.${i}`];
    const m = String(p.pick).match(/^\w+\(([^)]*)\)$/);
    return m;
}
export function inner$defineByMarks$m$$step(p) {
    const m = String(p.pick).match(/^\w+\(([^)]*)\)$/);
    return m;
}
export function inner$defineByMarks$c(w, P, i) {
    const p = P[`def.${w}.${i}`];
    const m = String(p.pick).match(/^\w+\(([^)]*)\)$/);
    const c = m ? m[1].split(',').map((x) => x.trim()).find((x) => isNum(x)) : null;
    return c;
}
export function inner$defineByMarks$c$$step(m) {
    const c = m ? m[1].split(',').map((x) => x.trim()).find((x) => isNum(x)) : null;
    return c;
}
export function inner$defineByMarks$below(w, P, i, marked, rest) {
    const p = P[`def.${w}.${i}`];
    const m = String(p.pick).match(/^\w+\(([^)]*)\)$/);
    const c = m ? m[1].split(',').map((x) => x.trim()).find((x) => isNum(x)) : null;
    const below = marked.every((v) => v < +c) && rest.every((v) => v >= +c);
    return below;
}
export function inner$defineByMarks$below$$step(c, marked, rest) {
    const below = marked.every((v) => v < +c) && rest.every((v) => v >= +c);
    return below;
}
export function inner$defineByMarks$above(w, P, i, marked, rest) {
    const p = P[`def.${w}.${i}`];
    const m = String(p.pick).match(/^\w+\(([^)]*)\)$/);
    const c = m ? m[1].split(',').map((x) => x.trim()).find((x) => isNum(x)) : null;
    const above = marked.every((v) => v > +c) && rest.every((v) => v <= +c);
    return above;
}
export function inner$defineByMarks$above$$step(c, marked, rest) {
    const above = marked.every((v) => v > +c) && rest.every((v) => v <= +c);
    return above;
}
export function inner$defineByMarks$word(w, SL, P, i, marked, rest) {
    const p = P[`def.${w}.${i}`];
    const m = String(p.pick).match(/^\w+\(([^)]*)\)$/);
    const c = m ? m[1].split(',').map((x) => x.trim()).find((x) => isNum(x)) : null;
    const below = marked.every((v) => v < +c) && rest.every((v) => v >= +c);
    const word = below ? (SL.amountBelow || [])[1] || (SL.amountBelow || [])[0] : (SL.amountAbove || [])[0];
    return word;
}
export function inner$defineByMarks$word$$step(SL, below) {
    const word = below ? (SL.amountBelow || [])[1] || (SL.amountBelow || [])[0] : (SL.amountAbove || [])[0];
    return word;
}
export function inner$defineByMarks$unit(SL, dateIdx, i) {
    const dayWord = Object.keys(SL.timeUnits || {}).find((u) => (SL.timeUnits || {})[u] === 1) || '';
    const unit = dateIdx.includes(i) && dayWord ? ` ${dayWord}` : '';
    return unit;
}
export function inner$defineByMarks$unit$$step(dateIdx, dayWord, i) {
    const unit = dateIdx.includes(i) && dayWord ? ` ${dayWord}` : '';
    return unit;
}
export function inner$expandDefinitions$ents(form) {
    const ents = form.things.filter((t) => t.fields && t.fields.length);
    return ents;
}
export function inner$expandDefinitions$thing(form, r) {
    const thing = form.things.find((t) => t.label === r.thing);
    return thing;
}
export function inner$expandDefinitions$said(answers, w) {
    let said = typeof answers[w] === 'string' ? answers[w].trim() : '';
    return said;
}
export function inner$expandDefinitions$def(proposals, said, rec) {
    const def = said || (proposals && rec ? String(rec.proposal) : '');
    return def;
}
export function inner$expandDefinitions$sx(r, w) {
    const sx = (r.search || []).find((x) => x.word === w);
    return sx;
}
export function inner$expandDefinitions$parts(proposals, said, rec) {
    const def = said || (proposals && rec ? String(rec.proposal) : '');
    const parts = [def.trim()].filter(Boolean);
    return parts;
}
export function inner$expandDefinitions$parts$$step(def) {
    const parts = [def.trim()].filter(Boolean);
    return parts;
}
export function inner$expandDefinitions$clauses(proposals, tokens, ei, w, said, rec, lead) {
    const def = said || (proposals && rec ? String(rec.proposal) : '');
    const parts = [def.trim()].filter(Boolean);
    const clauses = parts.map((p) => ei >= 0 ? [...tokens.slice(0, ei), lead + p].join(' ') : tokens.map((t) => (t === w ? p : t)).join(' '));
    return clauses;
}
export function inner$expandDefinitions$clauses$$step(tokens, ei, w, parts, lead) {
    const clauses = parts.map((p) => ei >= 0 ? [...tokens.slice(0, ei), lead + p].join(' ') : tokens.map((t) => (t === w ? p : t)).join(' '));
    return clauses;
}
export function inner$examplesIO$t(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    return t;
}
export function inner$examplesIO$ins(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    const ins = t.ioExamples.map((e) => e[0]);
    return ins;
}
export function inner$examplesIO$ins$$step(t) {
    const ins = t.ioExamples.map((e) => e[0]);
    return ins;
}
export function inner$examplesIO$outs(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    const outs = t.ioExamples.map((e) => e[1]);
    return outs;
}
export function inner$examplesIO$outs$$step(t) {
    const outs = t.ioExamples.map((e) => e[1]);
    return outs;
}
export function inner$examplesIO$parts(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    const ins = t.ioExamples.map((e) => e[0]);
    const parts = ins.map((i) => String(i).split(/\s*[,،]\s*/));
    return parts;
}
export function inner$examplesIO$parts$$step(ins) {
    const parts = ins.map((i) => String(i).split(/\s*[,،]\s*/));
    return parts;
}
export function inner$examplesIO$multi(form, r, k) {
    const t = form.things.find((x) => x.label === r.thing);
    const ins = t.ioExamples.map((e) => e[0]);
    const parts = ins.map((i) => String(i).split(/\s*[,،]\s*/));
    const multi = k >= 2 && parts.every((p) => p.length === k);
    return multi;
}
export function inner$examplesIO$multi$$step(parts, k) {
    const multi = k >= 2 && parts.every((p) => p.length === k);
    return multi;
}
export function inner$learnForms$ents(form) {
    const ents = form.things.filter((t) => t.fields && t.fields.length && t.examples && t.examples.length);
    return ents;
}
export function inner$learnForms$t(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    return t;
}
export function inner$learnForms$ws(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    return ws;
}
export function inner$learnForms$ws$$step(src) {
    const ws = src.split(/\s+/);
    return ws;
}
export function inner$learnForms$fIdx(ent, fld) {
    const fIdx = ent.fields.indexOf(fld);
    return fIdx;
}
export function inner$learnForms$rows(ent, fld) {
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    return rows;
}
export function inner$learnForms$rows$$step(ent, fIdx) {
    const rows = ent.examples.filter((x) => x.length > fIdx);
    return rows;
}
export function inner$learnForms$names(ent, fld) {
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const names = rows.map((x) => String(x[0]).trim());
    return names;
}
export function inner$learnForms$names$$step(rows) {
    const names = rows.map((x) => String(x[0]).trim());
    return names;
}
export function inner$learnForms$raw(ent, fld) {
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    return raw;
}
export function inner$learnForms$raw$$step(fIdx, rows) {
    const raw = rows.map((x) => String(x[fIdx]).trim());
    return raw;
}
export function inner$learnForms$i(fEnd) {
    let i = fEnd + 1;
    return i;
}
export function inner$learnForms$m(ATT, w) {
    const m = w.match(ATT);
    return m;
}
export function inner$learnForms$m_L142(ATTX, w) {
    const m = w.match(ATTX);
    return m;
}
export function inner$learnForms$cut(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    const cut = Math.max(tmpl.lastIndexOf('#'), tmpl.lastIndexOf('$'));
    return cut;
}
export function inner$learnForms$cut$$step(tmpl) {
    const cut = Math.max(tmpl.lastIndexOf('#'), tmpl.lastIndexOf('$'));
    return cut;
}
export function inner$learnForms$pat(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    const cut = Math.max(tmpl.lastIndexOf('#'), tmpl.lastIndexOf('$'));
    const pat = tmpl.slice(0, cut + 1);
    return pat;
}
export function inner$learnForms$pat$$step(tmpl, cut) {
    const pat = tmpl.slice(0, cut + 1);
    return pat;
}
export function inner$learnForms$words(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    const cut = Math.max(tmpl.lastIndexOf('#'), tmpl.lastIndexOf('$'));
    const pat = tmpl.slice(0, cut + 1);
    const words = pat.filter((x) => x !== '#' && x !== '$');
    return words;
}
export function inner$learnForms$words$$step(pat) {
    const words = pat.filter((x) => x !== '#' && x !== '$');
    return words;
}
export function inner$learnForms$unit(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    const unit = unitWord ? ` ${unitWord}` : '';
    return unit;
}
export function inner$learnForms$unit$$step(unitWord) {
    const unit = unitWord ? ` ${unitWord}` : '';
    return unit;
}
export function inner$learnForms$rewrite$parts(relWord, fld, consts, unit, e) {
    const parts = e.ops.map((op, i) => `${i ? fld.label + ' ' : ''}${relWord[op]}${/-$/.test(relWord[op]) ? '' : ' '}${consts[i]}${unit}`);
    return parts;
}
export function inner$learnForms$said(answers, key) {
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    return said;
}
export function inner$learnForms$marks(answers, key) {
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    const marks = said.split(/[,;\s]+/).filter(Boolean);
    return marks;
}
export function inner$learnForms$marks$$step(said) {
    const marks = said.split(/[,;\s]+/).filter(Boolean);
    return marks;
}
export function inner$learnForms$cmpC(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    const cmpC = consts.map((c) => (kind === 'date' ? c * mult : c));
    return cmpC;
}
export function inner$learnForms$cmpC$$step(kind, consts, mult) {
    const cmpC = consts.map((c) => (kind === 'date' ? c * mult : c));
    return cmpC;
}
export function inner$learnForms$ops(kind) {
    const ops = kind === 'text' ? ['='] : ['>', '<', '='];
    return ops;
}
export function inner$learnForms$filter$filter$hs(vals, cmpC, c, i) {
    const hs = c.ops.map((o, k) => hit(o, vals[i], cmpC[k]));
    return hs;
}
export function inner$learnForms$wantT(kind) {
    const wantT = kind === 'text' ? 'String' : 'num';
    return wantT;
}
export function inner$learnForms$pattern(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    const cut = Math.max(tmpl.lastIndexOf('#'), tmpl.lastIndexOf('$'));
    const pat = tmpl.slice(0, cut + 1);
    const words = pat.filter((x) => x !== '#' && x !== '$');
    const pattern = words.map((w) => escRe(defin(w))).join('\\s+') + '-?';
    return pattern;
}
export function inner$learnForms$pattern$$step(words) {
    const pattern = words.map((w) => escRe(defin(w))).join('\\s+') + '-?';
    return pattern;
}
export function inner$wantOf$m(t) {
    const m = [...String(t || '').matchAll(/([^,;:\d\-−]+?)\s*[:=]?\s*([-−]?\d+(?:\.\d+)?)/g)].map((x) => [x[1].trim(), Number(x[2].replace('−', '-'))]).filter(([k]) => k);
    return m;
}
export function inner$shapeSearch$ents(form) {
    const ents = form.things.filter((t) => t.fields && t.fields.length && t.examples && t.examples.length);
    return ents;
}
export function inner$shapeSearch$loose(form, routed, skip) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    return loose;
}
export function inner$shapeSearch$looseL(form, routed, skip) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    return looseL;
}
export function inner$shapeSearch$looseL$$step(routed, skip, loose) {
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    return looseL;
}
export function inner$shapeSearch$thingsL(form, routed, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    const thingsL = form.things.filter((t) => t.src === seg && [...loose, ...looseL].some((r) => r.thing === t.label)).map((t) => t.label);
    return thingsL;
}
export function inner$shapeSearch$thingsL$$step(form, loose, looseL, seg) {
    const thingsL = form.things.filter((t) => t.src === seg && [...loose, ...looseL].some((r) => r.thing === t.label)).map((t) => t.label);
    return thingsL;
}
export function inner$shapeSearch$key(form, routed, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    const thingsL = form.things.filter((t) => t.src === seg && [...loose, ...looseL].some((r) => r.thing === t.label)).map((t) => t.label);
    const key = thingsL[thingsL.length - 1];
    return key;
}
export function inner$shapeSearch$key$$step(thingsL) {
    const key = thingsL[thingsL.length - 1];
    return key;
}
export function inner$shapeSearch$said(form, routed, answers, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    const thingsL = form.things.filter((t) => t.src === seg && [...loose, ...looseL].some((r) => r.thing === t.label)).map((t) => t.label);
    const key = thingsL[thingsL.length - 1];
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    return said;
}
export function inner$shapeSearch$said$$step(answers, key) {
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    return said;
}
export function inner$shapeSearch$want(D, form, routed, answers, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    const thingsL = form.things.filter((t) => t.src === seg && [...loose, ...looseL].some((r) => r.thing === t.label)).map((t) => t.label);
    const key = thingsL[thingsL.length - 1];
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    const want = said && (D.T.yesWords || []).includes(said) ? null : wantOf(said);
    return want;
}
export function inner$shapeSearch$want$$step(D, said) {
    const want = said && (D.T.yesWords || []).includes(said) ? null : wantOf(said);
    return want;
}
export function inner$shapeSearch$sig(r) {
    const sig = 'link:' + r.children.map((c) => `${c}(${r.shapes[c].map((x) => x.kind).join(',')})`).join('+');
    return sig;
}
export function inner$shapeSearch$pick(D, form, routed, answers, skip, seg, r, known) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const looseL = routed.routes.filter((r) => !skip.has(r.thing) && !loose.includes(r) && r.proposal);
    const thingsL = form.things.filter((t) => t.src === seg && [...loose, ...looseL].some((r) => r.thing === t.label)).map((t) => t.label);
    const key = thingsL[thingsL.length - 1];
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    const pick = known ? r.results.find((y) => y.atom.name === known.atom) : r.pick ? r.pick : said && (D.T.yesWords || []).includes(said) ? r.results[0] : said ? r.results.find((y) => y.atom.name === said) : null;
    return pick;
}
export function inner$shapeSearch$pick$$step(D, said, r, known) {
    const pick = known ? r.results.find((y) => y.atom.name === known.atom) : r.pick ? r.pick : said && (D.T.yesWords || []).includes(said) ? r.results[0] : said ? r.results.find((y) => y.atom.name === said) : null;
    return pick;
}
export function inner$shapeSearch$things(form, routed, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const things = form.things.filter((t) => t.src === seg && loose.some((r) => r.thing === t.label)).map((t) => t.label);
    return things;
}
export function inner$shapeSearch$things$$step(form, loose, seg) {
    const things = form.things.filter((t) => t.src === seg && loose.some((r) => r.thing === t.label)).map((t) => t.label);
    return things;
}
export function inner$shapeSearch$sig_L206(r) {
    const sig = r.shape.map((c) => c.kind).join(',');
    return sig;
}
export function inner$shapeSearch$key_L206(form, routed, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const things = form.things.filter((t) => t.src === seg && loose.some((r) => r.thing === t.label)).map((t) => t.label);
    const key = things[things.length - 1];
    return key;
}
export function inner$shapeSearch$key_L206$$step(things) {
    const key = things[things.length - 1];
    return key;
}
export function inner$shapeSearch$said_L209(form, routed, answers, skip, seg) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const things = form.things.filter((t) => t.src === seg && loose.some((r) => r.thing === t.label)).map((t) => t.label);
    const key = things[things.length - 1];
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    return said;
}
export function inner$shapeSearch$said_L209$$step(answers, key) {
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    return said;
}
export function inner$shapeSearch$pick_L210(D, form, routed, answers, skip, seg, r, known) {
    const loose = routed.routes.filter((r) => !skip.has(r.thing) && (r.route === 'none' || (r.route === 'appds' && !((form.things.find((t) => t.label === r.thing) || {}).fields || []).length)));
    const things = form.things.filter((t) => t.src === seg && loose.some((r) => r.thing === t.label)).map((t) => t.label);
    const key = things[things.length - 1];
    const said = typeof answers[key] === 'string' ? answers[key].trim() : '';
    const pick = known ? r.results.find((y) => y.atom.name === known.atom) : said && (D.T.yesWords || []).includes(said) && r.results.length === 1 ? r.results[0] : said ? r.results.find((y) => y.atom.name === said) : null;
    return pick;
}
export function inner$shapeSearch$pick_L210$$step(D, r, known, said) {
    const pick = known ? r.results.find((y) => y.atom.name === known.atom) : said && (D.T.yesWords || []).includes(said) && r.results.length === 1 ? r.results[0] : said ? r.results.find((y) => y.atom.name === said) : null;
    return pick;
}
export function inner$bornRecall$t(form, r) {
    const t = form.things.find((x) => x.label === r.thing);
    return t;
}
export function inner$learnForms$tmpl$$after_loop(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    return tmpl;
}
export function inner$learnForms$consts$$after_loop(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    return consts;
}
export function inner$learnForms$last$$after_loop(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    return last;
}
export function inner$learnForms$unitWord$$after_loop(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    return unitWord;
}
export function inner$learnForms$mult$$after_loop(form, SL, NUM, ATT, ATTX, r, fEnd, ent, fld, kind) {
    const TU = SL.timeUnits || {};
    const t = form.things.find((x) => x.label === r.thing);
    const src = t && t.src;
    const ws = src.split(/\s+/);
    const fIdx = ent.fields.indexOf(fld);
    const rows = ent.examples.filter((x) => x.length > fIdx);
    const raw = rows.map((x) => String(x[fIdx]).trim());
    const tmpl = [];
    const consts = [];
    let last = -1;
    let unitWord = null;
    let mult = 1;
    for (let i = fEnd + 1; i < ws.length; i++) {
        const w = ws[i];
        if (kind !== 'text') {
            if (NUM.test(w)) {
                tmpl.push('#');
                consts.push(+w);
                last = i;
                continue;
            }
            const m = w.match(ATT);
            if (m) {
                tmpl.push(m[1], '#');
                consts.push(+m[2]);
                last = i;
                continue;
            }
            if (kind === 'date' && TU[w] && last === i - 1) {
                unitWord = w;
                mult = TU[w] === 'ask' ? NaN : +TU[w];
                last = i;
                continue;
            }
            tmpl.push(w);
            continue;
        }
        const m = w.match(ATTX);
        if (m) {
            tmpl.push(m[1], '$');
            consts.push(m[2]);
            last = i;
            continue;
        }
        if (raw.includes(w)) {
            tmpl.push('$');
            consts.push(w);
            last = i;
            continue;
        }
        tmpl.push(w);
    }
    return mult;
}

export const SIGS = {
  inner$defineByMarks$keys: [{"name":"thing","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$marks: [{"name":"ans","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$numIdx: [{"name":"thing","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$textIdx: [{"name":"thing","d":{"t":"any"},"opt":false},{"name":"dateIdx","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$textIdx$$step: [{"name":"thing","d":{"t":"any"},"opt":false},{"name":"numIdx","d":{"t":"any"},"opt":false},{"name":"dateIdx","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$dayWord: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$p: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$sm: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$sm$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$cv: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$cv$$step: [{"name":"sm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$defineByMarks$m: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$m$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$c: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$c$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$defineByMarks$below: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"marked","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$below$$step: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"marked","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$above: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"marked","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$above$$step: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"marked","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$word: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"marked","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$word$$step: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"below","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$unit: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"dateIdx","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$defineByMarks$unit$$step: [{"name":"dateIdx","d":{"t":"any"},"opt":false},{"name":"dayWord","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$expandDefinitions$ents: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$expandDefinitions$thing: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$expandDefinitions$said: [{"name":"answers","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"str"},"opt":false}],
  inner$expandDefinitions$def: [{"name":"proposals","d":{"t":"any"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false},{"name":"rec","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["proposal",{"t":"any"},false],["times",{"t":"any"},false]]}]},"opt":false}],
  inner$expandDefinitions$sx: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"str"},"opt":false}],
  inner$expandDefinitions$parts: [{"name":"proposals","d":{"t":"any"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false},{"name":"rec","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["proposal",{"t":"any"},false],["times",{"t":"any"},false]]}]},"opt":false}],
  inner$expandDefinitions$parts$$step: [{"name":"def","d":{"t":"str"},"opt":false}],
  inner$expandDefinitions$clauses: [{"name":"proposals","d":{"t":"any"},"opt":false},{"name":"tokens","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"ei","d":{"t":"num"},"opt":false},{"name":"w","d":{"t":"str"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false},{"name":"rec","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["proposal",{"t":"any"},false],["times",{"t":"any"},false]]}]},"opt":false},{"name":"lead","d":{"t":"any"},"opt":false}],
  inner$expandDefinitions$clauses$$step: [{"name":"tokens","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"ei","d":{"t":"num"},"opt":false},{"name":"w","d":{"t":"str"},"opt":false},{"name":"parts","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"lead","d":{"t":"any"},"opt":false}],
  inner$examplesIO$t: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$examplesIO$ins: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$examplesIO$ins$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$examplesIO$outs: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$examplesIO$outs$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$examplesIO$parts: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$examplesIO$parts$$step: [{"name":"ins","d":{"t":"any"},"opt":false}],
  inner$examplesIO$multi: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$examplesIO$multi$$step: [{"name":"parts","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$learnForms$ents: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$learnForms$t: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$learnForms$ws: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$learnForms$ws$$step: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$learnForms$fIdx: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false}],
  inner$learnForms$rows: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false}],
  inner$learnForms$rows$$step: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fIdx","d":{"t":"num"},"opt":false}],
  inner$learnForms$names: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false}],
  inner$learnForms$names$$step: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$learnForms$raw: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false}],
  inner$learnForms$raw$$step: [{"name":"fIdx","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$learnForms$i: [{"name":"fEnd","d":{"t":"num"},"opt":false}],
  inner$learnForms$m: [{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$learnForms$m_L142: [{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$learnForms$cut: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$cut$$step: [{"name":"tmpl","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$learnForms$pat: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$pat$$step: [{"name":"tmpl","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cut","d":{"t":"num"},"opt":false}],
  inner$learnForms$words: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$words$$step: [{"name":"pat","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$learnForms$unit: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$unit$$step: [{"name":"unitWord","d":{"t":"any"},"opt":false}],
  inner$learnForms$rewrite$parts: [{"name":"relWord","d":{"t":"obj","p":[[">",{"t":"any"},false],["<",{"t":"any"},false],["=",{"t":"any"},false]]},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"consts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"unit","d":{"t":"str"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$learnForms$said: [{"name":"answers","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$learnForms$marks: [{"name":"answers","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$learnForms$marks$$step: [{"name":"said","d":{"t":"str"},"opt":false}],
  inner$learnForms$cmpC: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$cmpC$$step: [{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false},{"name":"consts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"mult","d":{"t":"num"},"opt":false}],
  inner$learnForms$ops: [{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$filter$filter$hs: [{"name":"vals","d":{"t":"any"},"opt":false},{"name":"cmpC","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$learnForms$wantT: [{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$pattern: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$pattern$$step: [{"name":"words","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$wantOf$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$ents: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$loose: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$shapeSearch$looseL: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$shapeSearch$looseL$$step: [{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"loose","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$thingsL: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$thingsL$$step: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"loose","d":{"t":"any"},"opt":false},{"name":"looseL","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$key: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$key$$step: [{"name":"thingsL","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$said: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$said$$step: [{"name":"answers","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$want: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$want$$step: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false}],
  inner$shapeSearch$sig: [{"name":"r","d":{"t":"obj","p":[["shapes",{"t":"obj","n":"shapes","p":[]},false],["results",{"t":"arr","of":{"t":"obj","p":[["atom",{"t":"obj","p":[["name",{"t":"str"},false],["dart",{"t":"str"},false],["call",{"t":"null"},false]]},false],["calc",{"t":"obj","p":[["terms",{"t":"arr","of":{"t":"obj","p":[["child",{"t":"any"},false],["op",{"t":"str"},false],["n",{"t":"any"},false],["to",{"t":"any"},false],["from",{"t":"any"},false],["filt",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["col",{"t":"any"},false],["cmp",{"t":"any"},false],["v",{"t":"any"},false]]}]},false]]}},false]]},false],["map",{"t":"arr","of":{"t":"undef"}},false],["out",{"t":"any"},false],["score",{"t":"num"},false]]}},false],["tried",{"t":"num"},false],["kush",{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["k",{"t":"str"},false],["v",{"t":"num"},false],["col",{"t":"any"},false],["child",{"t":"any"},false],["list",{"t":"undef"},true],["n",{"t":"undef"},true]]},{"t":"obj","p":[["k",{"t":"str"},false],["list",{"t":"arr","of":{"t":"any"}},false],["v",{"t":"undef"},true],["col",{"t":"undef"},true],["child",{"t":"undef"},true],["n",{"t":"undef"},true]]},{"t":"obj","p":[["k",{"t":"str"},false],["n",{"t":"num"},false],["v",{"t":"undef"},true],["col",{"t":"undef"},true],["child",{"t":"undef"},true],["list",{"t":"undef"},true]]}]}},false],["pick",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["atom",{"t":"obj","p":[["name",{"t":"str"},false],["dart",{"t":"str"},false],["call",{"t":"null"},false]]},false],["calc",{"t":"obj","p":[["terms",{"t":"arr","of":{"t":"obj","p":[["child",{"t":"any"},false],["op",{"t":"str"},false],["n",{"t":"any"},false],["to",{"t":"any"},false],["from",{"t":"any"},false],["filt",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["col",{"t":"any"},false],["cmp",{"t":"any"},false],["v",{"t":"any"},false]]}]},false]]}},false]]},false],["map",{"t":"arr","of":{"t":"undef"}},false],["out",{"t":"any"},false],["score",{"t":"num"},false]]}]},false],["children",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$shapeSearch$pick: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"obj","p":[["shapes",{"t":"obj","n":"shapes","p":[]},false],["results",{"t":"arr","of":{"t":"obj","p":[["atom",{"t":"obj","p":[["name",{"t":"str"},false],["dart",{"t":"str"},false],["call",{"t":"null"},false]]},false],["calc",{"t":"obj","p":[["terms",{"t":"arr","of":{"t":"obj","p":[["child",{"t":"any"},false],["op",{"t":"str"},false],["n",{"t":"any"},false],["to",{"t":"any"},false],["from",{"t":"any"},false],["filt",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["col",{"t":"any"},false],["cmp",{"t":"any"},false],["v",{"t":"any"},false]]}]},false]]}},false]]},false],["map",{"t":"arr","of":{"t":"undef"}},false],["out",{"t":"any"},false],["score",{"t":"num"},false]]}},false],["tried",{"t":"num"},false],["kush",{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["k",{"t":"str"},false],["v",{"t":"num"},false],["col",{"t":"any"},false],["child",{"t":"any"},false],["list",{"t":"undef"},true],["n",{"t":"undef"},true]]},{"t":"obj","p":[["k",{"t":"str"},false],["list",{"t":"arr","of":{"t":"any"}},false],["v",{"t":"undef"},true],["col",{"t":"undef"},true],["child",{"t":"undef"},true],["n",{"t":"undef"},true]]},{"t":"obj","p":[["k",{"t":"str"},false],["n",{"t":"num"},false],["v",{"t":"undef"},true],["col",{"t":"undef"},true],["child",{"t":"undef"},true],["list",{"t":"undef"},true]]}]}},false],["pick",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["atom",{"t":"obj","p":[["name",{"t":"str"},false],["dart",{"t":"str"},false],["call",{"t":"null"},false]]},false],["calc",{"t":"obj","p":[["terms",{"t":"arr","of":{"t":"obj","p":[["child",{"t":"any"},false],["op",{"t":"str"},false],["n",{"t":"any"},false],["to",{"t":"any"},false],["from",{"t":"any"},false],["filt",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["col",{"t":"any"},false],["cmp",{"t":"any"},false],["v",{"t":"any"},false]]}]},false]]}},false]]},false],["map",{"t":"arr","of":{"t":"undef"}},false],["out",{"t":"any"},false],["score",{"t":"num"},false]]}]},false],["children",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"known","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$pick$$step: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"obj","p":[["shapes",{"t":"obj","n":"shapes","p":[]},false],["results",{"t":"arr","of":{"t":"obj","p":[["atom",{"t":"obj","p":[["name",{"t":"str"},false],["dart",{"t":"str"},false],["call",{"t":"null"},false]]},false],["calc",{"t":"obj","p":[["terms",{"t":"arr","of":{"t":"obj","p":[["child",{"t":"any"},false],["op",{"t":"str"},false],["n",{"t":"any"},false],["to",{"t":"any"},false],["from",{"t":"any"},false],["filt",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["col",{"t":"any"},false],["cmp",{"t":"any"},false],["v",{"t":"any"},false]]}]},false]]}},false]]},false],["map",{"t":"arr","of":{"t":"undef"}},false],["out",{"t":"any"},false],["score",{"t":"num"},false]]}},false],["tried",{"t":"num"},false],["kush",{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["k",{"t":"str"},false],["v",{"t":"num"},false],["col",{"t":"any"},false],["child",{"t":"any"},false],["list",{"t":"undef"},true],["n",{"t":"undef"},true]]},{"t":"obj","p":[["k",{"t":"str"},false],["list",{"t":"arr","of":{"t":"any"}},false],["v",{"t":"undef"},true],["col",{"t":"undef"},true],["child",{"t":"undef"},true],["n",{"t":"undef"},true]]},{"t":"obj","p":[["k",{"t":"str"},false],["n",{"t":"num"},false],["v",{"t":"undef"},true],["col",{"t":"undef"},true],["child",{"t":"undef"},true],["list",{"t":"undef"},true]]}]}},false],["pick",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["atom",{"t":"obj","p":[["name",{"t":"str"},false],["dart",{"t":"str"},false],["call",{"t":"null"},false]]},false],["calc",{"t":"obj","p":[["terms",{"t":"arr","of":{"t":"obj","p":[["child",{"t":"any"},false],["op",{"t":"str"},false],["n",{"t":"any"},false],["to",{"t":"any"},false],["from",{"t":"any"},false],["filt",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["col",{"t":"any"},false],["cmp",{"t":"any"},false],["v",{"t":"any"},false]]}]},false]]}},false]]},false],["map",{"t":"arr","of":{"t":"undef"}},false],["out",{"t":"any"},false],["score",{"t":"num"},false]]}]},false],["children",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"known","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$things: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$things$$step: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"loose","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$sig_L206: [{"name":"r","d":{"t":"obj","p":[["shape",{"t":"any"},false],["results",{"t":"arr","of":{"t":"obj","p":[["atom",{"t":"any"},false],["map",{"t":"any"},false],["sockets",{"t":"any"},false],["out",{"t":"any"},false],["score",{"t":"any"},false]]}},false],["tried",{"t":"num"},false]]},"opt":false}],
  inner$shapeSearch$key_L206: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$key_L206$$step: [{"name":"things","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$said_L209: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$said_L209$$step: [{"name":"answers","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$pick_L210: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"form","d":{"t":"any"},"opt":false},{"name":"routed","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"obj","p":[["shape",{"t":"any"},false],["results",{"t":"arr","of":{"t":"obj","p":[["atom",{"t":"any"},false],["map",{"t":"any"},false],["sockets",{"t":"any"},false],["out",{"t":"any"},false],["score",{"t":"any"},false]]}},false],["tried",{"t":"num"},false]]},"opt":false},{"name":"known","d":{"t":"any"},"opt":false}],
  inner$shapeSearch$pick_L210$$step: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"obj","p":[["shape",{"t":"any"},false],["results",{"t":"arr","of":{"t":"obj","p":[["atom",{"t":"any"},false],["map",{"t":"any"},false],["sockets",{"t":"any"},false],["out",{"t":"any"},false],["score",{"t":"any"},false]]}},false],["tried",{"t":"num"},false]]},"opt":false},{"name":"known","d":{"t":"any"},"opt":false},{"name":"said","d":{"t":"str"},"opt":false}],
  inner$bornRecall$t: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$learnForms$tmpl$$after_loop: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$consts$$after_loop: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$last$$after_loop: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$unitWord$$after_loop: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
  inner$learnForms$mult$$after_loop: [{"name":"form","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"NUM","d":{"t":"any"},"opt":false},{"name":"ATT","d":{"t":"any"},"opt":false},{"name":"ATTX","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"fEnd","d":{"t":"num"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fld","d":{"t":"any"},"opt":false},{"name":"kind","d":{"t":"lit","v":["text","num","date"]},"opt":false}],
};
