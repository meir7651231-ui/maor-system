// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/peruk.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heW = (s) => [...String(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]);
const clean = (s) => heW(s).join(' ').trim();
const norm = (s) => String(s || '').replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
const strip = (s) => norm(s).replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').replace(/\.$/, '').trim();
const items = (lines) => lines.map((l) => l.trim()).filter((l) => /^([-*•]|\d+[.)])\s/.test(l)).map(strip).filter(Boolean);
const prose = (lines) => lines.map((l) => l.trim()).filter((l) => l && !/^([-*•]|\d+[.)])\s/.test(l)).map(norm);
const allText = (sec) => [...sec.lines, ...sec.subs.flatMap((s) => s.lines)];
const longest = (ws) => ws.slice().sort((a, b) => b.length - a.length).join('|');
const stemOf = (w) => w.replace(/^[בלהומשכ](?=..)/, '').replace(/(יות|ים|ות|ה)$/, '');
export function inner$parsePeruk$lines(md) {
    const lines = md.split(/\r?\n/);
    return lines;
}
export function inner$parsePeruk$line(raw) {
    const line = raw.replace(/\s+$/, '');
    return line;
}
export function inner$parsePeruk$tm(P, raw) {
    const tRe = new RegExp(P.titleRe);
    const line = raw.replace(/\s+$/, '');
    const tm = line.match(tRe);
    return tm;
}
export function inner$parsePeruk$tm$$step(tRe, line) {
    const tm = line.match(tRe);
    return tm;
}
export function inner$parsePeruk$h2(raw) {
    const line = raw.replace(/\s+$/, '');
    const h2 = line.match(/^##\s+(.+)$/);
    return h2;
}
export function inner$parsePeruk$h2$$step(line) {
    const h2 = line.match(/^##\s+(.+)$/);
    return h2;
}
export function inner$parsePeruk$h3(raw) {
    const line = raw.replace(/\s+$/, '');
    const h3 = line.match(/^###\s+(.+)$/);
    return h3;
}
export function inner$parsePeruk$h3$$step(line) {
    const h3 = line.match(/^###\s+(.+)$/);
    return h3;
}
export function inner$parsePeruk$mm(P, raw) {
    const line = raw.replace(/\s+$/, '');
    const mm = line.match(new RegExp('^' + P.momentKey + '\\s*[:：]\\s*(.+)$'));
    return mm;
}
export function inner$parsePeruk$mm$$step(P, line) {
    const mm = line.match(new RegExp('^' + P.momentKey + '\\s*[:：]\\s*(.+)$'));
    return mm;
}
export function inner$parsePeruk$cm(P, raw) {
    const line = raw.replace(/\s+$/, '');
    const cm = line.match(new RegExp('^' + P.categoryKey + '\\s*[:：]\\s*(.+)$'));
    return cm;
}
export function inner$parsePeruk$cm$$step(P, line) {
    const cm = line.match(new RegExp('^' + P.categoryKey + '\\s*[:：]\\s*(.+)$'));
    return cm;
}
export function inner$kindOf$h(head) {
    const h = String(head).replace(/^\d+[.)]\s*/, '');
    return h;
}
export function inner$fieldsFrom$push$base(txt) {
    const base = txt.split('/')[0].replace(/\(.*?\)/g, '').trim();
    return base;
}
export function inner$fieldsFrom$push$or(P, txt) {
    const base = txt.split('/')[0].replace(/\(.*?\)/g, '').trim();
    const or = base.split(new RegExp('\\s+' + P.orWord + '\\s+'));
    return or;
}
export function inner$fieldsFrom$push$or$$step(P, base) {
    const or = base.split(new RegExp('\\s+' + P.orWord + '\\s+'));
    return or;
}
export function inner$fieldsFrom$push$cj(G, txt) {
    const base = txt.split('/')[0].replace(/\(.*?\)/g, '').trim();
    const cj = base.match(new RegExp('^(.+?)\\s+ו(' + [...G.typeDate, ...G.typeNum].join('|') + ')(.*)$'));
    return cj;
}
export function inner$fieldsFrom$push$cj$$step(G, base) {
    const cj = base.match(new RegExp('^(.+?)\\s+ו(' + [...G.typeDate, ...G.typeNum].join('|') + ')(.*)$'));
    return cj;
}
export function inner$fieldsFrom$push$label(P, txt) {
    const base = txt.split('/')[0].replace(/\(.*?\)/g, '').trim();
    const label = heW(base).slice(0, P.fieldMaxWords).join(' ');
    return label;
}
export function inner$fieldsFrom$push$label$$step(P, base) {
    const label = heW(base).slice(0, P.fieldMaxWords).join(' ');
    return label;
}
export function inner$fieldsFrom$l(l0) {
    const l = l0.trim();
    return l;
}
export function inner$fieldsFrom$it(l0) {
    const l = l0.trim();
    const it = /^([-*•]|\d+[.)])\s/.test(l) ? strip(l) : norm(l);
    return it;
}
export function inner$fieldsFrom$it$$step(l) {
    const it = /^([-*•]|\d+[.)])\s/.test(l) ? strip(l) : norm(l);
    return it;
}
export function inner$fieldsFrom$parts(l0) {
    const l = l0.trim();
    const it = /^([-*•]|\d+[.)])\s/.test(l) ? strip(l) : norm(l);
    const parts = it.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    return parts;
}
export function inner$fieldsFrom$parts$$step(it) {
    const parts = it.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    return parts;
}
export function inner$outputsFrom$l(l0) {
    const l = l0.replace(/\s+$/, '');
    return l;
}
export function inner$outputsFrom$num(l0) {
    const l = l0.replace(/\s+$/, '');
    const num = l.match(/^\s*(\d+)[.)]\s+(.+)$/);
    return num;
}
export function inner$outputsFrom$num$$step(l) {
    const num = l.match(/^\s*(\d+)[.)]\s+(.+)$/);
    return num;
}
export function inner$outputsFrom$rest(l0) {
    const l = l0.replace(/\s+$/, '');
    const num = l.match(/^\s*(\d+)[.)]\s+(.+)$/);
    const rest = num[2].split(/[:：]/).slice(1).join(':').trim();
    return rest;
}
export function inner$outputsFrom$rest$$step(num) {
    const rest = num[2].split(/[:：]/).slice(1).join(':').trim();
    return rest;
}
export function inner$outputsFrom$opt(l0) {
    const l = l0.replace(/\s+$/, '');
    const opt = l.match(/^\s+[-*•]\s+(.+)$/);
    return opt;
}
export function inner$outputsFrom$opt$$step(l) {
    const opt = l.match(/^\s+[-*•]\s+(.+)$/);
    return opt;
}
export function inner$outputsFrom$o(l0) {
    const l = l0.replace(/\s+$/, '');
    const opt = l.match(/^\s+[-*•]\s+(.+)$/);
    const o = strip(opt[1]);
    return o;
}
export function inner$outputsFrom$o$$step(opt) {
    const o = strip(opt[1]);
    return o;
}
export function inner$contentOf$add$t(text) {
    const t = norm(text);
    return t;
}
export function inner$contentOf$tag(s) {
    const tag = clean(s.head).split(' ').slice(0, 2).join(' ');
    return tag;
}
export function inner$contentOf$its(s) {
    const its = items(s.lines);
    return its;
}
export function inner$perukToSpec$S$hit(d, k) {
    const hit = d.sections.find((s) => s.kind === k) || null;
    return hit;
}
export function inner$perukToSpec$S$kinds(d) {
    const kinds = d.sections.map((x) => x.kind).filter(Boolean);
    return kinds;
}
export function inner$perukToSpec$inputSec(P, product) {
    const inputSec = product ? product.subs.find((s) => P.inputsHead.some((h) => s.head.includes(h))) : null;
    return inputSec;
}
export function inner$perukToSpec$outputSec(P, product) {
    const outputSec = product ? product.subs.find((s) => P.outputsHead.some((h) => s.head.includes(h))) : null;
    return outputSec;
}
export function inner$perukToSpec$forbRe(P) {
    const forbRe = new RegExp('^' + P.groups.forbidden + '(?![֐-׿])');
    return forbRe;
}
export function inner$perukToSpec$mustRe(P) {
    const mustRe = new RegExp('^' + P.mustKey + '(?![֐-׿])');
    return mustRe;
}
export function inner$perukToSpec$ls(sec) {
    const ls = allText(sec);
    return ls;
}
export function inner$perukToSpec$mode(sec) {
    let mode = sec.kind === 'forbidden' ? 'forb' : null;
    return mode;
}
export function inner$perukToSpec$t(raw) {
    const t = norm(raw);
    return t;
}
export function inner$perukToSpec$t_L153(raw) {
    const t = norm(raw);
    return t;
}
export function inner$perukToSpec$chain(chainSec) {
    const chain = chainSec ? items(chainSec.lines).map((x) => x.replace(/^\d+[.)]\s*/, '')) : [];
    return chain;
}
export function inner$perukToSpec$prices(price) {
    const prices = price ? items(price.lines).concat(prose(price.lines)).map((l) => { const m = l.match(/(\d[\d,]*)\s*₪/); return m ? { label: l.split(/[:：]/)[0].trim(), ils: +m[1].replace(/,/g, '') } : null; }).filter(Boolean) : [];
    return prices;
}
export function inner$perukToSpec$map$m(l) {
    const m = l.match(/(\d[\d,]*)\s*₪/);
    return m;
}
export function inner$perukToSpec$pairRe(P) {
    const pairRe = new RegExp('^(.+?)\\s+(' + longest(P.oldWords) + ')\\s+' + P.vsWord + '\\s+(' + longest(P.newWords) + ')');
    return pairRe;
}
export function inner$perukToSpec$m(P, raw) {
    const pairRe = new RegExp('^(.+?)\\s+(' + longest(P.oldWords) + ')\\s+' + P.vsWord + '\\s+(' + longest(P.newWords) + ')');
    const m = norm(raw).replace(/^\d+[.)]\s*/, '').match(pairRe);
    return m;
}
export function inner$perukToSpec$m$$step(pairRe, raw) {
    const m = norm(raw).replace(/^\d+[.)]\s*/, '').match(pairRe);
    return m;
}
export function inner$perukToSpec$base(P, raw) {
    const pairRe = new RegExp('^(.+?)\\s+(' + longest(P.oldWords) + ')\\s+' + P.vsWord + '\\s+(' + longest(P.newWords) + ')');
    const m = norm(raw).replace(/^\d+[.)]\s*/, '').match(pairRe);
    const base = heW(m[1].replace(/\(.*?\)/g, '')).slice(-2).join(' ');
    return base;
}
export function inner$perukToSpec$base$$step(m) {
    const base = heW(m[1].replace(/\(.*?\)/g, '')).slice(-2).join(' ');
    return base;
}
export function inner$perukToSpec$monthly(P, raw) {
    const pairRe = new RegExp('^(.+?)\\s+(' + longest(P.oldWords) + ')\\s+' + P.vsWord + '\\s+(' + longest(P.newWords) + ')');
    const m = norm(raw).replace(/^\d+[.)]\s*/, '').match(pairRe);
    const base = heW(m[1].replace(/\(.*?\)/g, '')).slice(-2).join(' ');
    const monthly = P.monthlyWords.some((w) => base.includes(w));
    return monthly;
}
export function inner$perukToSpec$monthly$$step(P, base) {
    const monthly = P.monthlyWords.some((w) => base.includes(w));
    return monthly;
}
export function inner$perukToSpec$decisions(P, outputs) {
    const decisions = outputs.filter((o) => o.options.length >= P.decisionMinOptions && o.options.length <= P.decisionMaxOptions).map((o) => ({ label: o.name, enumVals: o.options.map((x) => clean(x).split(' ').slice(0, 4).join(' ')).filter(Boolean) }));
    return decisions;
}
export function inner$perukToSpec$groupNames(content) {
    const groupNames = [...new Set(content.map((c) => c.group))];
    return groupNames;
}
export function inner$perukToSpec$matchField$ws(txt) {
    const ws = heW(txt).map(stemOf);
    return ws;
}
export function inner$perukToSpec$matchField$find$fw(f) {
    const fw = heW(f).map(stemOf);
    return fw;
}
export function inner$perukToSpec$dec(P, outputs, o) {
    const decisions = outputs.filter((o) => o.options.length >= P.decisionMinOptions && o.options.length <= P.decisionMaxOptions).map((o) => ({ label: o.name, enumVals: o.options.map((x) => clean(x).split(' ').slice(0, 4).join(' ')).filter(Boolean) }));
    const dec = decisions.find((dd) => dd.label === o.name);
    return dec;
}
export function inner$perukToSpec$dec$$step(decisions, o) {
    const dec = decisions.find((dd) => dd.label === o.name);
    return dec;
}
export function inner$perukToSpec$texts(rest) {
    const texts = rest.filter((t) => heW(t).length >= 2);
    return texts;
}
export function inner$perukToSpec$phone(P) {
    const phone = P.personFields.find((f) => /טלפון/.test(f));
    return phone;
}
export function inner$outputsFrom$secs$$after_loop(P, lines) {
    const secs = [];
    let cur = null;
    for (const l0 of lines) {
        const l = l0.replace(/\s+$/, '');
        if (!l.trim())
            continue;
        const num = l.match(/^\s*(\d+)[.)]\s+(.+)$/);
        if (num && !/^\s{3,}/.test(l)) {
            cur = { name: clean(num[2].split(/[:：]/)[0]).split(' ').slice(0, 4).join(' ') || strip(num[2]), detail: [], options: [] };
            const rest = num[2].split(/[:：]/).slice(1).join(':').trim();
            if (rest)
                cur.detail.push(norm(rest));
            secs.push(cur);
            continue;
        }
        if (!cur)
            continue;
        const opt = l.match(/^\s+[-*•]\s+(.+)$/);
        if (opt) {
            const o = strip(opt[1]);
            if (heW(o).length <= P.decisionMaxWords)
                cur.options.push(o);
            else
                cur.detail.push(o);
            continue;
        }
        cur.detail.push(norm(l));
    }
    return secs;
}
export function inner$outputsFrom$cur$$after_loop(P, lines) {
    const secs = [];
    let cur = null;
    for (const l0 of lines) {
        const l = l0.replace(/\s+$/, '');
        if (!l.trim())
            continue;
        const num = l.match(/^\s*(\d+)[.)]\s+(.+)$/);
        if (num && !/^\s{3,}/.test(l)) {
            cur = { name: clean(num[2].split(/[:：]/)[0]).split(' ').slice(0, 4).join(' ') || strip(num[2]), detail: [], options: [] };
            const rest = num[2].split(/[:：]/).slice(1).join(':').trim();
            if (rest)
                cur.detail.push(norm(rest));
            secs.push(cur);
            continue;
        }
        if (!cur)
            continue;
        const opt = l.match(/^\s+[-*•]\s+(.+)$/);
        if (opt) {
            const o = strip(opt[1]);
            if (heW(o).length <= P.decisionMaxWords)
                cur.options.push(o);
            else
                cur.detail.push(o);
            continue;
        }
        cur.detail.push(norm(l));
    }
    return cur;
}
export function inner$perukToSpec$pairs$$after_loop(P, blocks) {
    const pairs = [];
    const pairRe = new RegExp('^(.+?)\\s+(' + longest(P.oldWords) + ')\\s+' + P.vsWord + '\\s+(' + longest(P.newWords) + ')');
    for (const sec of [blocks].filter(Boolean))
        for (const raw of allText(sec)) {
            const m = norm(raw).replace(/^\d+[.)]\s*/, '').match(pairRe);
            if (!m)
                continue;
            const base = heW(m[1].replace(/\(.*?\)/g, '')).slice(-2).join(' ');
            if (!base)
                continue;
            const monthly = P.monthlyWords.some((w) => base.includes(w));
            pairs.push({ a: `${base} ${m[2]}`, b: `${base} ${m[3]}`, factor: monthly ? 12 : 0 });
        }
    return pairs;
}

export const SIGS = {
  inner$parsePeruk$lines: [{"name":"md","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$line: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$tm: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$tm$$step: [{"name":"tRe","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$h2: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$h2$$step: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$h3: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$h3$$step: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$mm: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$mm$$step: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$cm: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$cm$$step: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$kindOf$h: [{"name":"head","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$base: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$or: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$or$$step: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$cj: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$cj$$step: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$label: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$push$label$$step: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$l: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$it: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$it$$step: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$parts: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$fieldsFrom$parts$$step: [{"name":"it","d":{"t":"str"},"opt":false}],
  inner$outputsFrom$l: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$num: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$num$$step: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$rest: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$rest$$step: [{"name":"num","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$opt: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$opt$$step: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$o: [{"name":"l0","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$o$$step: [{"name":"opt","d":{"t":"any"},"opt":false}],
  inner$contentOf$add$t: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$contentOf$tag: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$contentOf$its: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$S$hit: [{"name":"d","d":{"t":"obj","p":[["id",{"t":"null"},false],["title",{"t":"null"},false],["moment",{"t":"null"},false],["category",{"t":"null"},false],["not",{"t":"arr","of":{"t":"undef"}},false],["sections",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$S$kinds: [{"name":"d","d":{"t":"obj","p":[["id",{"t":"null"},false],["title",{"t":"null"},false],["moment",{"t":"null"},false],["category",{"t":"null"},false],["not",{"t":"arr","of":{"t":"undef"}},false],["sections",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$perukToSpec$inputSec: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"product","d":{"t":"null"},"opt":false}],
  inner$perukToSpec$outputSec: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"product","d":{"t":"null"},"opt":false}],
  inner$perukToSpec$forbRe: [{"name":"P","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$mustRe: [{"name":"P","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$ls: [{"name":"sec","d":{"t":"undef"},"opt":false}],
  inner$perukToSpec$mode: [{"name":"sec","d":{"t":"undef"},"opt":false}],
  inner$perukToSpec$t: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$t_L153: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$chain: [{"name":"chainSec","d":{"t":"null"},"opt":false}],
  inner$perukToSpec$prices: [{"name":"price","d":{"t":"null"},"opt":false}],
  inner$perukToSpec$map$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$pairRe: [{"name":"P","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$m: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$m$$step: [{"name":"pairRe","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$base: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$base$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$perukToSpec$monthly: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$monthly$$step: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"str"},"opt":false}],
  inner$perukToSpec$decisions: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"outputs","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["detail",{"t":"arr","of":{"t":"undef"}},false],["options",{"t":"arr","of":{"t":"undef"}},false]]}},"opt":false}],
  inner$perukToSpec$groupNames: [{"name":"content","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$perukToSpec$matchField$ws: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$matchField$find$fw: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$dec: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"outputs","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["detail",{"t":"arr","of":{"t":"undef"}},false],["options",{"t":"arr","of":{"t":"undef"}},false]]}},"opt":false},{"name":"o","d":{"t":"obj","p":[["name",{"t":"str"},false],["detail",{"t":"arr","of":{"t":"undef"}},false],["options",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$perukToSpec$dec$$step: [{"name":"decisions","d":{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["enumVals",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"o","d":{"t":"obj","p":[["name",{"t":"str"},false],["detail",{"t":"arr","of":{"t":"undef"}},false],["options",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$perukToSpec$texts: [{"name":"rest","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$perukToSpec$phone: [{"name":"P","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$secs$$after_loop: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$outputsFrom$cur$$after_loop: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$perukToSpec$pairs$$after_loop: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"blocks","d":{"t":"null"},"opt":false}],
};
