// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/koreh.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PFX = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ', 'ד'];
const toks = (s) => String(s).replace(/[«»"“”()[\]]/g, ' ').split(/\s+/).filter(Boolean);
const bare = (w) => w.replace(/[.,:;!?·—–]+$/g, '');
function entOf(w, names) {
    const cands = [w, ...(PFX.includes(w[0]) ? [w.slice(1)] : []), ...(w.startsWith('וה') || w.startsWith('בה') || w.startsWith('לה') || w.startsWith('מה') ? [w.slice(2)] : [])];
    for (const c of cands)
        for (const n of names) {
            if (n.includes(' '))
                continue;
            if (c === n || c === n + 'ים' || c === n + 'ות' || (n.endsWith('ה') && c === n.slice(0, -1) + 'ות'))
                return n;
        }
    return null;
}
const sentencesOf = (txt) => txt.split(/(?<=[.!?:])\s+|\n+|\s·\s/).map((s) => s.trim()).filter((s) => s.length > 3);
const norm = (x) => x.replace(/\d[\d,.:]*/g, '#').replace(/\s+/g, ' ').trim();
const shortSeg = (x) => { const w = toks(x); return w.length >= 1 && w.length <= 3 && !/\d/.test(x) && !/[?:]/.test(x); };
const keyOf = (w) => w.replace(/(ים|ות)$/, '').replace(/ה$/, '');
const stem = (w) => String(w).replace(/^[ובלמהש]+(?=[֐-׿]{3})/, '').replace(/(ים|ות|ת|ה)$/, '');
export function inner$entOf$cands(w) {
    const cands = [w, ...(PFX.includes(w[0]) ? [w.slice(1)] : []), ...(w.startsWith('וה') || w.startsWith('בה') || w.startsWith('לה') || w.startsWith('מה') ? [w.slice(2)] : [])];
    return cands;
}
export function inner$mine$t(s) {
    const t = toks(s);
    return t;
}
export function inner$mine$v(s, i) {
    const t = toks(s);
    const v = bare(t[i]);
    return v;
}
export function inner$mine$v$$step(t, i) {
    const v = bare(t[i]);
    return v;
}
export function inner$mine$u(s, i) {
    const t = toks(s);
    const u = bare(t[i + 1]);
    return u;
}
export function inner$mine$u$$step(t, i) {
    const u = bare(t[i + 1]);
    return u;
}
export function inner$mine$es(names, s) {
    const t = toks(s);
    const es = new Set(t.map((w) => entOf(bare(w), names)).filter(Boolean));
    return es;
}
export function inner$mine$es$$step(names, t) {
    const es = new Set(t.map((w) => entOf(bare(w), names)).filter(Boolean));
    return es;
}
export function inner$mine$e(names, s, i) {
    const t = toks(s);
    const e = entOf(bare(t[i]), names);
    return e;
}
export function inner$mine$e$$step(names, t, i) {
    const e = entOf(bare(t[i]), names);
    return e;
}
export function inner$mine$nx(s, i) {
    const t = toks(s);
    const nx = bare(t[i + 1]);
    return nx;
}
export function inner$mine$nx$$step(t, i) {
    const nx = bare(t[i + 1]);
    return nx;
}
export function inner$mine$n2(s, i) {
    const t = toks(s);
    const n2 = bare(t[i + 2] || '');
    return n2;
}
export function inner$mine$n2$$step(t, i) {
    const n2 = bare(t[i + 2] || '');
    return n2;
}
export function inner$mine$k(names, s, i, name) {
    const t = toks(s);
    const e = entOf(bare(t[i]), names);
    const k = `${e}|${name}`;
    return k;
}
export function inner$mine$k$$step(e, name) {
    const k = `${e}|${name}`;
    return k;
}
export function inner$mine$cands(minSources, inst, entsPerName) {
    const cands = [...inst.values()].filter((r) => r.srcs.size >= minSources && entsPerName.get(r.name).size <= 2)
        .map((r) => ({ ent: r.ent, name: r.name, sources: r.srcs.size, n: r.n, ex: r.ex, qty: [...r.qty.entries()].filter(([, Q]) => Q.srcs.size >= 1).map(([u, Q]) => ({ unit: u, vals: [...new Set(Q.vals)].slice(0, 5), sources: Q.srcs.size })).sort((a, b) => b.sources - a.sources).slice(0, 4) }))
        .sort((a, b) => b.sources - a.sources || b.n - a.n);
    return cands;
}
export function inner$mine$unitList(minSources, units) {
    const unitList = [...units.entries()].map(([u, s]) => ({ unit: u, sources: s.size })).filter((x) => x.sources >= minSources).sort((a, b) => b.sources - a.sources);
    return unitList;
}
export function inner$mine$m(inst, u) {
    const unitEnts = new Map();
    for (const r of inst.values())
        for (const [u, Q] of r.qty) {
            const m = unitEnts.get(u) || unitEnts.set(u, new Map()).get(u);
            m.set(r.ent, new Set([...(m.get(r.ent) || []), ...Q.srcs]));
        }
    const m = unitEnts.get(u.unit);
    return m;
}
export function inner$mine$m$$step(unitEnts, u) {
    const m = unitEnts.get(u.unit);
    return m;
}
export function inner$mine$u_L56(minSources, units, q) {
    const unitList = [...units.entries()].map(([u, s]) => ({ unit: u, sources: s.size })).filter((x) => x.sources >= minSources).sort((a, b) => b.sources - a.sources);
    const u = unitList.find((x) => x.unit === q.unit);
    return u;
}
export function inner$mine$u_L56$$step(unitList, q) {
    const u = unitList.find((x) => x.unit === q.unit);
    return u;
}
export function inner$rulesOf$WH(when) {
    const WH = when.length ? new RegExp('^(?:.{0,40}?\\s)?(?:' + when.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=[֐-׿A-Za-z])(.{3,120}?)\\s+[—–-]{1,2}\\s+(.{3,140})$') : null;
    return WH;
}
export function inner$rulesOf$subjOf$t(cond) {
    const t = toks(cond).map(bare);
    return t;
}
export function inner$rulesOf$subjOf$w(cond, i) {
    const t = toks(cond).map(bare);
    const w = t[i + 1];
    return w;
}
export function inner$rulesOf$subjOf$w$$step(t, i) {
    const w = t[i + 1];
    return w;
}
export function inner$rulesOf$subjOf$e(names, cond, i) {
    const t = toks(cond).map(bare);
    const w = t[i + 1];
    const e = entOf(w, names);
    return e;
}
export function inner$rulesOf$subjOf$e$$step(names, w) {
    const e = entOf(w, names);
    return e;
}
export function inner$rulesOf$subjOf$w1(cond, i) {
    const t = toks(cond).map(bare);
    const w = t[i + 1];
    const w1 = w.replace(/^[ובלמה](?=[֐-׿]{3})/, '');
    return w1;
}
export function inner$rulesOf$subjOf$w1$$step(w) {
    const w1 = w.replace(/^[ובלמה](?=[֐-׿]{3})/, '');
    return w1;
}
export function inner$rulesOf$subjOf$w0(w) {
    const w0 = w.replace(/^[ובלמהש]/, '');
    return w0;
}
export function inner$rulesOf$put$k(r0) {
    const k = r0.type + ':' + norm(r0.cond) + ' → ' + norm(r0.act);
    return k;
}
export function inner$rulesOf$shortSeg$w(x) {
    const w = toks(x);
    return w;
}
export function inner$rulesOf$cells(s0) {
    const cells = s0.split('|').map((x) => x.trim()).filter(Boolean);
    return cells;
}
export function inner$rulesOf$e(names, s0) {
    const cells = s0.split('|').map((x) => x.trim()).filter(Boolean);
    const e = cells.length && entOf(bare(toks(cells[0])[0] || ''), names);
    return e;
}
export function inner$rulesOf$e$$step(names, cells) {
    const e = cells.length && entOf(bare(toks(cells[0])[0] || ''), names);
    return e;
}
export function inner$rulesOf$seg(c) {
    const seg = c.split(/\s*[→⇒]\s*/);
    return seg;
}
export function inner$rulesOf$s(s0) {
    const s = s0.replace(/[«»"“”]/g, '').trim();
    return s;
}
export function inner$rulesOf$m(s0) {
    const s = s0.replace(/[«»"“”]/g, '').trim();
    let m = s.match(/^(.{3,140}?)\s*[→⇒]\s*(.{2,140})$/);
    return m;
}
export function inner$rulesOf$m$$step(s) {
    let m = s.match(/^(.{3,140}?)\s*[→⇒]\s*(.{2,140})$/);
    return m;
}
export function inner$rulesOf$w(when, s0) {
    const WH = when.length ? new RegExp('^(?:.{0,40}?\\s)?(?:' + when.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=[֐-׿A-Za-z])(.{3,120}?)\\s+[—–-]{1,2}\\s+(.{3,140})$') : null;
    const s = s0.replace(/[«»"“”]/g, '').trim();
    const w = s.match(WH);
    return w;
}
export function inner$rulesOf$w$$step(WH, s) {
    const w = s.match(WH);
    return w;
}
export function inner$rulesOf$cond(m) {
    let cond = m[1].trim();
    return cond;
}
export function inner$rulesOf$act(m) {
    const act = m[2].split(/\s*[→⇒]\s*/)[0].trim();
    return act;
}
export function inner$rulesOf$lm(cond) {
    const lm = cond.match(/^([֐-׿][֐-׿'"׳\- ]{1,24}):\s*(.+)$/);
    return lm;
}
export function inner$rulesOf$chain(m, cond) {
    const chain = [cond, ...m[2].split(/\s*[→⇒]\s*/)].map((x) => x.trim()).filter(Boolean);
    return chain;
}
export function inner$rulesOf$type(names, s0, m, prose, cond) {
    const s = s0.replace(/[«»"“”]/g, '').trim();
    const act = m[2].split(/\s*[→⇒]\s*/)[0].trim();
    const chain = [cond, ...m[2].split(/\s*[→⇒]\s*/)].map((x) => x.trim()).filter(Boolean);
    const type = !prose && chain.length >= 3 && chain.every(shortSeg) ? 'seq' : /←\s*→|↔|<->/.test(s) || (entOf(bare(cond), names) && entOf(bare(act), names)) ? 'link' : /\d[\d.,%]*\s*[→⇒]\s*\d/.test(s) ? 'change' : /\?\s*$/.test(m[2].trim()) ? 'open' : 'rule';
    return type;
}
export function inner$rulesOf$type$$step(names, s, m, prose, cond, act, chain) {
    const type = !prose && chain.length >= 3 && chain.every(shortSeg) ? 'seq' : /←\s*→|↔|<->/.test(s) || (entOf(bare(cond), names) && entOf(bare(act), names)) ? 'link' : /\d[\d.,%]*\s*[→⇒]\s*\d/.test(s) ? 'change' : /\?\s*$/.test(m[2].trim()) ? 'open' : 'rule';
    return type;
}
export function inner$rulesOf$es(names, s0, label) {
    const s = s0.replace(/[«»"“”]/g, '').trim();
    const es = [...new Set([...toks(`${label || ''} ${s}`).map(bare).map((w) => entOf(w, names)).filter(Boolean)])];
    return es;
}
export function inner$rulesOf$es$$step(names, s, label) {
    const es = [...new Set([...toks(`${label || ''} ${s}`).map(bare).map((w) => entOf(w, names)).filter(Boolean)])];
    return es;
}
export function inner$rulesOf$e_L94(names, w) {
    const e = entOf(w, names);
    return e;
}
export function inner$rulesOf$k(names, sub) {
    const k = names.includes(sub) ? sub : keyOf(sub);
    return k;
}
export function inner$rulesOf$r0(m, k) {
    const r0 = m.get(k);
    return r0;
}
export function inner$rulesOf$rows(out, subs) {
    const m = new Map();
    for (const x of subs)
        for (const [k, r] of out.get(x)) {
            const r0 = m.get(k);
            if (r0)
                for (const s2 of r.srcs)
                    r0.srcs.add(s2);
            else
                m.set(k, { ...r, srcs: new Set(r.srcs) });
        }
    const rows = [...m.values()];
    return rows;
}
export function inner$rulesOf$rows$$step(m) {
    const rows = [...m.values()];
    return rows;
}
export function inner$rulesOf$srcs(out, subs) {
    const m = new Map();
    for (const x of subs)
        for (const [k, r] of out.get(x)) {
            const r0 = m.get(k);
            if (r0)
                for (const s2 of r.srcs)
                    r0.srcs.add(s2);
            else
                m.set(k, { ...r, srcs: new Set(r.srcs) });
        }
    const rows = [...m.values()];
    const srcs = new Set(rows.flatMap((r) => [...r.srcs]));
    return srcs;
}
export function inner$rulesOf$srcs$$step(rows) {
    const srcs = new Set(rows.flatMap((r) => [...r.srcs]));
    return srcs;
}
export function inner$modelGaps$srcs(rs) {
    const srcs = new Set(rs.flatMap((r) => String(r.ex).split(':')[0] ? [String(r.ex).split(':')[0]] : []));
    return srcs;
}
export function inner$modelGaps$e(names, w) {
    const e = entOf(w, names);
    return e;
}
export function inner$modelGaps$links(corpus, names, sub) {
    const near = new Map();
    for (const { text } of corpus)
        for (const s of sentencesOf(text)) {
            if (!s.includes(sub))
                continue;
            for (const w of toks(s).map(bare)) {
                const e = entOf(w, names);
                if (e)
                    near.set(e, (near.get(e) || 0) + 1);
            }
        }
    const links = [...near.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([e]) => e);
    return links;
}
export function inner$modelGaps$links$$step(near) {
    const links = [...near.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([e]) => e);
    return links;
}
export function inner$modelGaps$i(sub, line) {
    const i = line.indexOf(sub);
    return i;
}
export function inner$modelGaps$c(sub, line) {
    const i = line.indexOf(sub);
    const c = line.indexOf(':', i);
    return c;
}
export function inner$modelGaps$c$$step(line, i) {
    const c = line.indexOf(':', i);
    return c;
}
export function inner$modelGaps$items(sub, line) {
    const i = line.indexOf(sub);
    const c = line.indexOf(':', i);
    const items = line.slice(c + 1).split(/[.(|]/)[0].split(/\s*,\s*/).map((x) => x.trim()).filter((x) => x && x.split(/\s+/).length <= 4 && !/[\d[\]'׳]/.test(x));
    return items;
}
export function inner$modelGaps$items$$step(line, c) {
    const items = line.slice(c + 1).split(/[.(|]/)[0].split(/\s*,\s*/).map((x) => x.trim()).filter((x) => x && x.split(/\s+/).length <= 4 && !/[\d[\]'׳]/.test(x));
    return items;
}
export function inner$modelGaps$ent(names, r) {
    const ent = toks(r.cond).map(bare).map((w) => entOf(w, names)).find(Boolean);
    return ent;
}
export function inner$modelGaps$add(r) {
    const add = String(r.act).replace(/\s*\(.*?\)\s*/g, ' ').trim();
    return add;
}
export function inner$ruleClauses$rs(rules, t) {
    const rs = rules[t.name] || rules[t.name + 'ים'] || rules[t.name.replace(/ה$/, 'ות')] || [];
    return rs;
}
export function inner$ruleClauses$c(r) {
    const c = `${r.label ? r.label + ' ' : ''}${r.cond}`;
    return c;
}
export function inner$ruleClauses$m(r) {
    const m = r.cond.match(/(\d+)\+?\s+[֐-׿]+.*?(?:ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה|בשעה אחת)|(?=(?:מאותו|מאותה)\s))/);
    return m;
}
export function inner$ruleClauses$dl0(r) {
    const dl0 = r.cond.match(/([֐-׿]+)\s+(?:ש)?לא\s+([֐-׿]+)\s+עד\s*(\d{1,2}:\d{2})/);
    return dl0;
}
export function inner$ruleClauses$dl(t, r) {
    const dl0 = r.cond.match(/([֐-׿]+)\s+(?:ש)?לא\s+([֐-׿]+)\s+עד\s*(\d{1,2}:\d{2})/);
    const dl = dl0 && (stem(dl0[1]) === stem(t.name) || dl0[1].startsWith(stem(t.name))) ? [dl0[0], dl0[2], dl0[3]] : null;
    return dl;
}
export function inner$ruleClauses$dl$$step(t, dl0) {
    const dl = dl0 && (stem(dl0[1]) === stem(t.name) || dl0[1].startsWith(stem(t.name))) ? [dl0[0], dl0[2], dl0[3]] : null;
    return dl;
}
export function inner$ruleClauses$st(t, r) {
    const dl0 = r.cond.match(/([֐-׿]+)\s+(?:ש)?לא\s+([֐-׿]+)\s+עד\s*(\d{1,2}:\d{2})/);
    const dl = dl0 && (stem(dl0[1]) === stem(t.name) || dl0[1].startsWith(stem(t.name))) ? [dl0[0], dl0[2], dl0[3]] : null;
    const st = (t.stages || []).find((x) => stem(x) === stem(dl[1]) || x === dl[1]);
    return st;
}
export function inner$ruleClauses$st$$step(t, dl) {
    const st = (t.stages || []).find((x) => stem(x) === stem(dl[1]) || x === dl[1]);
    return st;
}
export function inner$ruleClauses$counted(r) {
    const counted = (r.cond.match(/\d+\+?\s+([֐-׿]+)/) || [])[1] || '';
    return counted;
}
export function inner$ruleClauses$win(r) {
    const m = r.cond.match(/(\d+)\+?\s+[֐-׿]+.*?(?:ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה|בשעה אחת)|(?=(?:מאותו|מאותה)\s))/);
    const win = m[2] ? +m[2] : m[3] ? 60 : null;
    return win;
}
export function inner$ruleClauses$win$$step(m) {
    const win = m[2] ? +m[2] : m[3] ? 60 : null;
    return win;
}
export function inner$ruleClauses$gw(r) {
    const c = `${r.label ? r.label + ' ' : ''}${r.cond}`;
    const gw = (c.match(/(?:מאותו|באותו|מאותה|באותה|לכל)\s+([֐-׿]+)/) || [])[1];
    return gw;
}
export function inner$ruleClauses$gw$$step(c) {
    const gw = (c.match(/(?:מאותו|באותו|מאותה|באותה|לכל)\s+([֐-׿]+)/) || [])[1];
    return gw;
}
export function inner$ruleClauses$lw(r) {
    const lw = r.label ? r.label.split(/\s+/) : [];
    return lw;
}
export function inner$ruleClauses$g(t, r) {
    const c = `${r.label ? r.label + ' ' : ''}${r.cond}`;
    const gw = (c.match(/(?:מאותו|באותו|מאותה|באותה|לכל)\s+([֐-׿]+)/) || [])[1];
    const lw = r.label ? r.label.split(/\s+/) : [];
    const g = (t.fields || []).find((f) => [gw, ...lw].filter(Boolean).some((w) => stem(f.split(/\s+/)[0]) === stem(w) || f.includes(stem(w))));
    return g;
}
export function inner$ruleClauses$g$$step(t, gw, lw) {
    const g = (t.fields || []).find((f) => [gw, ...lw].filter(Boolean).some((w) => stem(f.split(/\s+/)[0]) === stem(w) || f.includes(stem(w))));
    return g;
}
export function inner$unitMap$e(l) {
    const e = JSON.parse(l);
    return e;
}
export function inner$rowsOf$row(fields) {
    const row = fields.map(() => '');
    return row;
}
export function inner$rowsOf$i(fields, enumField) {
    const i = fields.indexOf(enumField);
    return i;
}
export function inner$rowsOf$e(to) {
    const [e, f] = to.split('.');
    return e;
}
export function inner$rowsOf$f(to) {
    const [e, f] = to.split('.');
    return f;
}
export function inner$rowsOf$i_L164(fields, to) {
    const [e, f] = to.split('.');
    const i = fields.indexOf(f);
    return i;
}
export function inner$rowsOf$i_L164$$step(fields, f) {
    const i = fields.indexOf(f);
    return i;
}
export function inner$rowsOf$row_L166(fields) {
    const row = fields.map(() => '');
    return row;
}
export function inner$rowsOf$e_L167(to) {
    const [e, f] = to.split('.');
    return e;
}
export function inner$rowsOf$f_L167(to) {
    const [e, f] = to.split('.');
    return f;
}
export function inner$rowsOf$i_L167(fields, to) {
    const [e, f] = to.split('.');
    const i = fields.indexOf(f);
    return i;
}
export function inner$rowsOf$i_L167$$step(fields, f) {
    const i = fields.indexOf(f);
    return i;
}
export function inner$mine$df$$after_loop(corpus) {
    const df = new Map();
    for (const { text } of corpus)
        for (const w of new Set(toks(text).map(bare)))
            df.set(w, (df.get(w) || 0) + 1);
    return df;
}
export function inner$mine$unitEnts$$after_loop(inst) {
    const unitEnts = new Map();
    for (const r of inst.values())
        for (const [u, Q] of r.qty) {
            const m = unitEnts.get(u) || unitEnts.set(u, new Map()).get(u);
            m.set(r.ent, new Set([...(m.get(r.ent) || []), ...Q.srcs]));
        }
    return unitEnts;
}
export function inner$rulesOf$df$$after_loop(corpus) {
    const df = new Map();
    for (const { text } of corpus)
        for (const w of new Set(toks(text).map(bare)))
            df.set(w, (df.get(w) || 0) + 1);
    return df;
}
export function inner$rulesOf$res$$after_loop(names, out, groups) {
    const res = {};
    for (const subs of groups.values()) {
        const main = subs.find((x) => names.includes(x)) || subs.sort((a, b) => out.get(b).size - out.get(a).size)[0];
        const m = new Map();
        for (const x of subs)
            for (const [k, r] of out.get(x)) {
                const r0 = m.get(k);
                if (r0)
                    for (const s2 of r.srcs)
                        r0.srcs.add(s2);
                else
                    m.set(k, { ...r, srcs: new Set(r.srcs) });
            }
        const rows = [...m.values()];
        const srcs = new Set(rows.flatMap((r) => [...r.srcs]));
        if (!names.includes(main) && srcs.size < 2)
            continue;
        res[main] = rows.map((r) => ({ type: r.type || 'rule', cond: r.cond, act: r.act, ...(r.seq ? { seq: r.seq } : {}), ...(r.label ? { label: r.label } : {}), sources: r.srcs.size, ex: r.ex })).sort((a, b) => b.sources - a.sources);
    }
    return res;
}
export function inner$rulesOf$m$$after_loop(out, subs) {
    const m = new Map();
    for (const x of subs)
        for (const [k, r] of out.get(x)) {
            const r0 = m.get(k);
            if (r0)
                for (const s2 of r.srcs)
                    r0.srcs.add(s2);
            else
                m.set(k, { ...r, srcs: new Set(r.srcs) });
        }
    return m;
}
export function inner$modelGaps$near$$after_loop(corpus, names, sub) {
    const near = new Map();
    for (const { text } of corpus)
        for (const s of sentencesOf(text)) {
            if (!s.includes(sub))
                continue;
            for (const w of toks(s).map(bare)) {
                const e = entOf(w, names);
                if (e)
                    near.set(e, (near.get(e) || 0) + 1);
            }
        }
    return near;
}
export function inner$modelGaps$fields$$after_loop(corpus, sub) {
    let fields = [];
    for (const { text } of corpus) {
        for (const line of text.split(/\n+/)) {
            const i = line.indexOf(sub);
            const c = line.indexOf(':', i);
            if (i < 0 || c < 0 || c - i > 40)
                continue;
            const items = line.slice(c + 1).split(/[.(|]/)[0].split(/\s*,\s*/).map((x) => x.trim()).filter((x) => x && x.split(/\s+/).length <= 4 && !/[\d[\]'׳]/.test(x));
            if (items.length >= 3 && items.length > fields.length)
                fields = items.slice(0, 10);
        }
    }
    return fields;
}
export function inner$modelGaps$extensions$$after_loop(names, rules, extLabels) {
    const extensions = [];
    for (const rs of Object.values(rules))
        for (const r of rs)
            if (r.label && extLabels.includes(r.label)) {
                const ent = toks(r.cond).map(bare).map((w) => entOf(w, names)).find(Boolean);
                if (!ent)
                    continue;
                const add = String(r.act).replace(/\s*\(.*?\)\s*/g, ' ').trim();
                if (!extensions.some((x) => x.ent === ent && x.add === add))
                    extensions.push({ ent, add, ex: r.ex });
            }
    return extensions;
}
export function inner$ruleClauses$out$$after_loop(rules, tables, perEach, lastWord, minutesWord, sinceWord, notWord) {
    const out = [];
    const skipped = [];
    for (const t of tables) {
        const rs = rules[t.name] || rules[t.name + 'ים'] || rules[t.name.replace(/ה$/, 'ות')] || [];
        if (!rs.length)
            continue;
        for (const r of rs) {
            if (r.type && r.type !== 'rule')
                continue;
            const c = `${r.label ? r.label + ' ' : ''}${r.cond}`;
            const m = r.cond.match(/(\d+)\+?\s+[֐-׿]+.*?(?:ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה|בשעה אחת)|(?=(?:מאותו|מאותה)\s))/); /* גם «3 ילדים מאותו מקום» — קיבוץ בלי חלון */
            const dl0 = r.cond.match(/([֐-׿]+)\s+(?:ש)?לא\s+([֐-׿]+)\s+עד\s*(\d{1,2}:\d{2})/);
            const dl = dl0 && (stem(dl0[1]) === stem(t.name) || dl0[1].startsWith(stem(t.name))) ? [dl0[0], dl0[2], dl0[3]] : null; /* הנושא = המילה לפני «שלא» — חייב להיות הטבלה */
            if (dl0 && !dl)
                continue; // ⏰ «ילד שלא נאסף עד 01:00» ⇒ זמן מאז 01:00 כשלא <שלב>
            if (dl) {
                const st = (t.stages || []).find((x) => stem(x) === stem(dl[1]) || x === dl[1]);
                if (st) {
                    if (!out.some((o) => o.table === t.name && o.clause.includes(dl[2])))
                        out.push({ table: t.name, clause: `התראה כש${sinceWord} ${dl[2]} ${notWord} ${st} מעל 0`, act: r.act, from: r.ex });
                }
                else
                    skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: `חסר שלב «${dl[1]}» ב«${t.name}»`, needStage: dl[1] });
                continue;
            }
            if (!m) {
                skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: 'לא בצורת «N ב-M דקות» / «שלא X עד HH:MM»' });
                continue;
            }
            const counted = (r.cond.match(/\d+\+?\s+([֐-׿]+)/) || [])[1] || ''; /* מה נספר = המילה אחרי המספר — חייבת להיות הטבלה («3 ילדים» ≠ טבלת נקודה) */
            if (stem(counted) !== stem(t.name) && !counted.startsWith(stem(t.name))) {
                skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: `נספר «${counted}», לא «${t.name}»` });
                continue;
            }
            const n = +m[1], win = m[2] ? +m[2] : m[3] ? 60 : null;
            const gw = (c.match(/(?:מאותו|באותו|מאותה|באותה|לכל)\s+([֐-׿]+)/) || [])[1];
            const lw = r.label ? r.label.split(/\s+/) : [];
            const g = (t.fields || []).find((f) => [gw, ...lw].filter(Boolean).some((w) => stem(f.split(/\s+/)[0]) === stem(w) || f.includes(stem(w))));
            if (!win && !g) {
                skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: `«${gw}» אינו שדה ב«${t.name}» — לפי מה לקבץ?` });
                continue;
            }
            out.push({ table: t.name, clause: `התראה כשמונה ${t.name}${g ? ` ${perEach} ${g}` : ''}${win ? ` ב-${win} ${minutesWord} ${lastWord}` : ''} מעל ${n - 1}`, act: r.act, from: r.ex });
        }
    }
    return out;
}
export function inner$ruleClauses$skipped$$after_loop(rules, tables, perEach, lastWord, minutesWord, sinceWord, notWord) {
    const out = [];
    const skipped = [];
    for (const t of tables) {
        const rs = rules[t.name] || rules[t.name + 'ים'] || rules[t.name.replace(/ה$/, 'ות')] || [];
        if (!rs.length)
            continue;
        for (const r of rs) {
            if (r.type && r.type !== 'rule')
                continue;
            const c = `${r.label ? r.label + ' ' : ''}${r.cond}`;
            const m = r.cond.match(/(\d+)\+?\s+[֐-׿]+.*?(?:ב[-־]?(\d+)\s*(?:'|דק'|דקות)|(באותה שעה|בשעה|בשעה אחת)|(?=(?:מאותו|מאותה)\s))/); /* גם «3 ילדים מאותו מקום» — קיבוץ בלי חלון */
            const dl0 = r.cond.match(/([֐-׿]+)\s+(?:ש)?לא\s+([֐-׿]+)\s+עד\s*(\d{1,2}:\d{2})/);
            const dl = dl0 && (stem(dl0[1]) === stem(t.name) || dl0[1].startsWith(stem(t.name))) ? [dl0[0], dl0[2], dl0[3]] : null; /* הנושא = המילה לפני «שלא» — חייב להיות הטבלה */
            if (dl0 && !dl)
                continue; // ⏰ «ילד שלא נאסף עד 01:00» ⇒ זמן מאז 01:00 כשלא <שלב>
            if (dl) {
                const st = (t.stages || []).find((x) => stem(x) === stem(dl[1]) || x === dl[1]);
                if (st) {
                    if (!out.some((o) => o.table === t.name && o.clause.includes(dl[2])))
                        out.push({ table: t.name, clause: `התראה כש${sinceWord} ${dl[2]} ${notWord} ${st} מעל 0`, act: r.act, from: r.ex });
                }
                else
                    skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: `חסר שלב «${dl[1]}» ב«${t.name}»`, needStage: dl[1] });
                continue;
            }
            if (!m) {
                skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: 'לא בצורת «N ב-M דקות» / «שלא X עד HH:MM»' });
                continue;
            }
            const counted = (r.cond.match(/\d+\+?\s+([֐-׿]+)/) || [])[1] || ''; /* מה נספר = המילה אחרי המספר — חייבת להיות הטבלה («3 ילדים» ≠ טבלת נקודה) */
            if (stem(counted) !== stem(t.name) && !counted.startsWith(stem(t.name))) {
                skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: `נספר «${counted}», לא «${t.name}»` });
                continue;
            }
            const n = +m[1], win = m[2] ? +m[2] : m[3] ? 60 : null;
            const gw = (c.match(/(?:מאותו|באותו|מאותה|באותה|לכל)\s+([֐-׿]+)/) || [])[1];
            const lw = r.label ? r.label.split(/\s+/) : [];
            const g = (t.fields || []).find((f) => [gw, ...lw].filter(Boolean).some((w) => stem(f.split(/\s+/)[0]) === stem(w) || f.includes(stem(w))));
            if (!win && !g) {
                skipped.push({ table: t.name, rule: `${r.cond} → ${r.act}`, why: `«${gw}» אינו שדה ב«${t.name}» — לפי מה לקבץ?` });
                continue;
            }
            out.push({ table: t.name, clause: `התראה כשמונה ${t.name}${g ? ` ${perEach} ${g}` : ''}${win ? ` ב-${win} ${minutesWord} ${lastWord}` : ''} מעל ${n - 1}`, act: r.act, from: r.ex });
        }
    }
    return skipped;
}
export function inner$rowsOf$row$$after_loop(ent, fields, map, sr) {
    const row = fields.map(() => '');
    let n = 0;
    for (const q of sr.qs) {
        const to = map[q.u];
        if (!to || to === 'לא')
            continue;
        const [e, f] = to.split('.');
        if (e !== ent.name)
            continue;
        const i = fields.indexOf(f);
        if (i >= 0 && !row[i]) {
            row[i] = String(q.v);
            n++;
        }
    }
    return row;
}
export function inner$rowsOf$n$$after_loop(ent, fields, map, sr) {
    const row = fields.map(() => '');
    let n = 0;
    for (const q of sr.qs) {
        const to = map[q.u];
        if (!to || to === 'לא')
            continue;
        const [e, f] = to.split('.');
        if (e !== ent.name)
            continue;
        const i = fields.indexOf(f);
        if (i >= 0 && !row[i]) {
            row[i] = String(q.v);
            n++;
        }
    }
    return n;
}

export const SIGS = {
  inner$entOf$cands: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$mine$t: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$mine$v: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$v$$step: [{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$u: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$u$$step: [{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$es: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$mine$es$$step: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$mine$e: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$e$$step: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$nx: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$nx$$step: [{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$n2: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$n2$$step: [{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mine$k: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$mine$k$$step: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$mine$cands: [{"name":"minSources","d":{"t":"num"},"opt":false},{"name":"inst","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"entsPerName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$mine$unitList: [{"name":"minSources","d":{"t":"num"},"opt":false},{"name":"units","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$mine$m: [{"name":"inst","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"u","d":{"t":"obj","p":[["unit",{"t":"any"},false],["sources",{"t":"any"},false]]},"opt":false}],
  inner$mine$m$$step: [{"name":"unitEnts","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"u","d":{"t":"obj","p":[["unit",{"t":"any"},false],["sources",{"t":"any"},false]]},"opt":false}],
  inner$mine$u_L56: [{"name":"minSources","d":{"t":"num"},"opt":false},{"name":"units","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"q","d":{"t":"obj","p":[["unit",{"t":"any"},false],["vals",{"t":"arr","of":{"t":"any"}},false],["sources",{"t":"any"},false]]},"opt":false}],
  inner$mine$u_L56$$step: [{"name":"unitList","d":{"t":"arr","of":{"t":"obj","p":[["unit",{"t":"any"},false],["sources",{"t":"any"},false]]}},"opt":false},{"name":"q","d":{"t":"obj","p":[["unit",{"t":"any"},false],["vals",{"t":"arr","of":{"t":"any"}},false],["sources",{"t":"any"},false]]},"opt":false}],
  inner$rulesOf$WH: [{"name":"when","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$rulesOf$subjOf$t: [{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$rulesOf$subjOf$w: [{"name":"cond","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$rulesOf$subjOf$w$$step: [{"name":"t","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$rulesOf$subjOf$e: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"cond","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$rulesOf$subjOf$e$$step: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$rulesOf$subjOf$w1: [{"name":"cond","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$rulesOf$subjOf$w1$$step: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$rulesOf$subjOf$w0: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$rulesOf$put$k: [{"name":"r0","d":{"t":"any"},"opt":false}],
  inner$rulesOf$shortSeg$w: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$rulesOf$cells: [{"name":"s0","d":{"t":"any"},"opt":false}],
  inner$rulesOf$e: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s0","d":{"t":"any"},"opt":false}],
  inner$rulesOf$e$$step: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"cells","d":{"t":"any"},"opt":false}],
  inner$rulesOf$seg: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$rulesOf$s: [{"name":"s0","d":{"t":"any"},"opt":false}],
  inner$rulesOf$m: [{"name":"s0","d":{"t":"any"},"opt":false}],
  inner$rulesOf$m$$step: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$rulesOf$w: [{"name":"when","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s0","d":{"t":"any"},"opt":false}],
  inner$rulesOf$w$$step: [{"name":"WH","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$rulesOf$cond: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$rulesOf$act: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$rulesOf$lm: [{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$rulesOf$chain: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$rulesOf$type: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s0","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"prose","d":{"t":"bool"},"opt":false},{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$rulesOf$type$$step: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"prose","d":{"t":"bool"},"opt":false},{"name":"cond","d":{"t":"any"},"opt":false},{"name":"act","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$rulesOf$es: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s0","d":{"t":"any"},"opt":false},{"name":"label","d":{"t":"any"},"opt":false}],
  inner$rulesOf$es$$step: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"label","d":{"t":"any"},"opt":false}],
  inner$rulesOf$e_L94: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$rulesOf$k: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"sub","d":{"t":"any"},"opt":false}],
  inner$rulesOf$r0: [{"name":"m","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$rulesOf$rows: [{"name":"out","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"subs","d":{"t":"any"},"opt":false}],
  inner$rulesOf$rows$$step: [{"name":"m","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$rulesOf$srcs: [{"name":"out","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"subs","d":{"t":"any"},"opt":false}],
  inner$rulesOf$srcs$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$modelGaps$srcs: [{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$modelGaps$e: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$modelGaps$links: [{"name":"corpus","d":{"t":"any"},"opt":false},{"name":"names","d":{"t":"any"},"opt":false},{"name":"sub","d":{"t":"str"},"opt":false}],
  inner$modelGaps$links$$step: [{"name":"near","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$modelGaps$i: [{"name":"sub","d":{"t":"str"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$modelGaps$c: [{"name":"sub","d":{"t":"str"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$modelGaps$c$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$modelGaps$items: [{"name":"sub","d":{"t":"str"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$modelGaps$items$$step: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$modelGaps$ent: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$modelGaps$add: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$rs: [{"name":"rules","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$c: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$m: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$dl0: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$dl: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$dl$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"dl0","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$st: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$st$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"dl","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},"opt":false}],
  inner$ruleClauses$counted: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$win: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$win$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$gw: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$gw$$step: [{"name":"c","d":{"t":"str"},"opt":false}],
  inner$ruleClauses$lw: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$g: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$ruleClauses$g$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"gw","d":{"t":"str"},"opt":false},{"name":"lw","d":{"t":"any"},"opt":false}],
  inner$unitMap$e: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$rowsOf$row: [{"name":"fields","d":{"t":"any"},"opt":false}],
  inner$rowsOf$i: [{"name":"fields","d":{"t":"any"},"opt":false},{"name":"enumField","d":{"t":"null"},"opt":false}],
  inner$rowsOf$e: [{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rowsOf$f: [{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rowsOf$i_L164: [{"name":"fields","d":{"t":"any"},"opt":false},{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rowsOf$i_L164$$step: [{"name":"fields","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$rowsOf$row_L166: [{"name":"fields","d":{"t":"any"},"opt":false}],
  inner$rowsOf$e_L167: [{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rowsOf$f_L167: [{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rowsOf$i_L167: [{"name":"fields","d":{"t":"any"},"opt":false},{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rowsOf$i_L167$$step: [{"name":"fields","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$mine$df$$after_loop: [{"name":"corpus","d":{"t":"any"},"opt":false}],
  inner$mine$unitEnts$$after_loop: [{"name":"inst","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$rulesOf$df$$after_loop: [{"name":"corpus","d":{"t":"any"},"opt":false}],
  inner$rulesOf$res$$after_loop: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"out","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"groups","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$rulesOf$m$$after_loop: [{"name":"out","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"subs","d":{"t":"any"},"opt":false}],
  inner$modelGaps$near$$after_loop: [{"name":"corpus","d":{"t":"any"},"opt":false},{"name":"names","d":{"t":"any"},"opt":false},{"name":"sub","d":{"t":"str"},"opt":false}],
  inner$modelGaps$fields$$after_loop: [{"name":"corpus","d":{"t":"any"},"opt":false},{"name":"sub","d":{"t":"str"},"opt":false}],
  inner$modelGaps$extensions$$after_loop: [{"name":"names","d":{"t":"any"},"opt":false},{"name":"rules","d":{"t":"any"},"opt":false},{"name":"extLabels","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$ruleClauses$out$$after_loop: [{"name":"rules","d":{"t":"any"},"opt":false},{"name":"tables","d":{"t":"any"},"opt":false},{"name":"perEach","d":{"t":"str"},"opt":false},{"name":"lastWord","d":{"t":"str"},"opt":false},{"name":"minutesWord","d":{"t":"str"},"opt":false},{"name":"sinceWord","d":{"t":"str"},"opt":false},{"name":"notWord","d":{"t":"str"},"opt":false}],
  inner$ruleClauses$skipped$$after_loop: [{"name":"rules","d":{"t":"any"},"opt":false},{"name":"tables","d":{"t":"any"},"opt":false},{"name":"perEach","d":{"t":"str"},"opt":false},{"name":"lastWord","d":{"t":"str"},"opt":false},{"name":"minutesWord","d":{"t":"str"},"opt":false},{"name":"sinceWord","d":{"t":"str"},"opt":false},{"name":"notWord","d":{"t":"str"},"opt":false}],
  inner$rowsOf$row$$after_loop: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fields","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"obj","p":[]},"opt":false},{"name":"sr","d":{"t":"any"},"opt":false}],
  inner$rowsOf$n$$after_loop: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"fields","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"obj","p":[]},"opt":false},{"name":"sr","d":{"t":"any"},"opt":false}],
};
