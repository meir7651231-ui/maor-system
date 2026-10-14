// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/read.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const STOP = new Set(['את', 'של', 'על', 'עם', 'או', 'אם', 'כי', 'לא', 'כן', 'זה', 'זו', 'יש', 'אין', 'מה', 'מי', 'גם', 'רק', 'כל', 'עוד', 'כבר', 'בלי', 'עד', 'מול', 'ועד', 'ולא', 'הוא', 'היא', 'הם', 'לפי', 'בין', 'אחרי', 'לפני', 'מתי', 'איך', 'למה', 'אז', 'אבל']);
const NUM_RE = /(?<![\d.,])(\d{1,3}(?:[.,]\d{3})*|\d+)(?:\s*[–\-]\s*(\d+))?\s*(%|₪|ימים?|יום|שבועות?|שבוע|חודשים?|חודש|שעות|שנים?|שנה)?/g;
const SLASH_LIST_RE = /([א-ת״׳"' ]{2,30})\s*\/\s*([א-ת״׳"' ]{2,30})(?:\s*\/\s*([א-ת״׳"' ]{2,30}))?/;
const words = (s) => [...String(s).matchAll(/[א-ת״׳"']{2,}/g)].map((m) => m[0]).filter((w) => !STOP.has(w));
const PREFIX = /^[ובלכמשה]/;
const sameWord = (a, b) => a === b || (PREFIX.test(a) && a.slice(1) === b) || (PREFIX.test(b) && b.slice(1) === a);
const norm = (s) => String(s).replace(/[״"'׳]/g, '').replace(/\s+/g, ' ').trim();
function parseSpec(text) {
    const spec = { entities: [], fields: [], enums: [], required: new Set(), particles: [], contents: [], raw: text, lines: text.split('\n') };
    for (const line of spec.lines) {
        let m;
        if ((m = line.match(/^ישות (.+?) עם (.*?)(?: \| |$)/))) {
            const ent = m[1];
            spec.entities.push(ent);
            // «| שלבים: א, ב, ג» — השלבים הם מקרים-בשמם של הישות (כמו enum): «נפרע / חזר» בפירוק מכוסה בשלבים
            const st = line.match(/\|\s*שלבים\s*:?\s*([^|]+)/);
            if (st)
                spec.enums.push({ ent, name: 'שלבים', values: st[1].split(/[,،]/).map(norm).filter(Boolean) });
            for (const raw of m[2].split(',')) {
                const f = raw.trim();
                if (!f)
                    continue;
                const name = norm(f.replace(/[*{(].*$/, ''));
                const req = /\*/.test(f.replace(/\{[^}]*\}|\([^)]*\)/g, ''));
                const en = (f.match(/\{([^}]*)\}/) || [])[1];
                const range = (f.match(/\(([^)]*)\)/) || [])[1];
                spec.fields.push({ ent, name, req, en: en ? en.split('|').map(norm) : null, range: range || null });
                if (req)
                    spec.required.add(name);
                if (en)
                    spec.enums.push({ ent, name, values: en.split('|').map(norm) });
            }
        }
        else if (/^(חלקיק|דוח|לוח בקרה)/.test(line))
            spec.particles.push(line);
        else if (/^תוכן /.test(line))
            spec.contents.push(line);
    }
    return spec;
}
const clean = (w) => String(w).replace(/[״׳"'()]/g, '');
export function inner$parseSpec$spec(text) {
    const spec = { entities: [], fields: [], enums: [], required: new Set(), particles: [], contents: [], raw: text, lines: text.split('\n') };
    return spec;
}
export function inner$parseSpec$st(line) {
    const st = line.match(/\|\s*שלבים\s*:?\s*([^|]+)/);
    return st;
}
export function inner$parseSpec$f(raw) {
    const f = raw.trim();
    return f;
}
export function inner$parseSpec$name(raw) {
    const f = raw.trim();
    const name = norm(f.replace(/[*{(].*$/, ''));
    return name;
}
export function inner$parseSpec$name$$step(f) {
    const name = norm(f.replace(/[*{(].*$/, ''));
    return name;
}
export function inner$parseSpec$req(raw) {
    const f = raw.trim();
    const req = /\*/.test(f.replace(/\{[^}]*\}|\([^)]*\)/g, ''));
    return req;
}
export function inner$parseSpec$req$$step(f) {
    const req = /\*/.test(f.replace(/\{[^}]*\}|\([^)]*\)/g, ''));
    return req;
}
export function inner$parseSpec$en(raw) {
    const f = raw.trim();
    const en = (f.match(/\{([^}]*)\}/) || [])[1];
    return en;
}
export function inner$parseSpec$en$$step(f) {
    const en = (f.match(/\{([^}]*)\}/) || [])[1];
    return en;
}
export function inner$parseSpec$range(raw) {
    const f = raw.trim();
    const range = (f.match(/\(([^)]*)\)/) || [])[1];
    return range;
}
export function inner$parseSpec$range$$step(f) {
    const range = (f.match(/\(([^)]*)\)/) || [])[1];
    return range;
}
export function inner$roundTrip$PFX(SL) {
    const PFX = new RegExp(`^[${SL.prefixLetters}]`);
    return PFX;
}
export function inner$roundTrip$SFX(SL) {
    const SFX = new RegExp(`(${SL.stemSuffixes.join('|')})$`);
    return SFX;
}
export function inner$roundTrip$formsOf$w(w0) {
    const w = clean(w0);
    return w;
}
export function inner$roundTrip$formsOf$out(SFX, w0) {
    const w = clean(w0);
    const out = new Set([w, w.replace(SFX, '')]);
    return out;
}
export function inner$roundTrip$formsOf$out$$step(SFX, w) {
    const out = new Set([w, w.replace(SFX, '')]);
    return out;
}
export function inner$roundTrip$formsOf$b(w0) {
    const w = clean(w0);
    const b = w.slice(1);
    return b;
}
export function inner$roundTrip$formsOf$b$$step(w) {
    const b = w.slice(1);
    return b;
}
export function inner$roundTrip$GRAM(SL) {
    const GRAM = new Set([...(SL.perEach || []), SL.haveWord, SL.withWord, ...(SL.orWords || []), ...(SL.exampleWords || []), ...(SL.stagePrefixes || []), ...(SL.entityNouns || [])].filter(Boolean));
    return GRAM;
}
export function inner$roundTrip$S(spec) {
    const S = parseSpec(spec || '');
    return S;
}
export function inner$roundTrip$claims(spec, covered) {
    const S = parseSpec(spec || '');
    const claims = [...S.entities.map((t) => ({ role: 'table', text: t })), ...S.fields.map((f) => ({ role: 'field', text: f.name, of: f.ent })), ...S.enums.flatMap((e) => e.values.map((v) => ({ role: e.name, text: v, of: e.ent }))), ...covered];
    return claims;
}
export function inner$roundTrip$claims$$step(covered, S) {
    const claims = [...S.entities.map((t) => ({ role: 'table', text: t })), ...S.fields.map((f) => ({ role: 'field', text: f.name, of: f.ent })), ...S.enums.flatMap((e) => e.values.map((v) => ({ role: e.name, text: v, of: e.ent }))), ...covered];
    return claims;
}
export function inner$roundTrip$NAME_GRAM(SL) {
    const NAME_GRAM = new Set([...(SL.perEach || []), SL.haveWord, SL.withWord].filter(Boolean));
    return NAME_GRAM;
}
export function inner$roundTrip$tableForms(spec, SL) {
    const SFX = new RegExp(`(${SL.stemSuffixes.join('|')})$`);
    const S = parseSpec(spec || '');
    const tableForms = new Set(S.entities.map((t) => clean(t)).flatMap((t) => [t, t.replace(SFX, '')]));
    return tableForms;
}
export function inner$roundTrip$tableForms$$step(SFX, S) {
    const tableForms = new Set(S.entities.map((t) => clean(t)).flatMap((t) => [t, t.replace(SFX, '')]));
    return tableForms;
}
export function inner$roundTrip$ws(seg) {
    const ws = seg.trim().split(/\s+/);
    return ws;
}
export function inner$roundTrip$hi(SL, seg) {
    const ws = seg.trim().split(/\s+/);
    const hi = ws.indexOf(SL.haveWord);
    return hi;
}
export function inner$roundTrip$hi$$step(SL, ws) {
    const hi = ws.indexOf(SL.haveWord);
    return hi;
}
export function inner$roundTrip$ph(SL, seg) {
    const ws = seg.trim().split(/\s+/);
    const hi = ws.indexOf(SL.haveWord);
    let ph = ws.slice(0, hi);
    return ph;
}
export function inner$roundTrip$ph$$step(ws, hi) {
    let ph = ws.slice(0, hi);
    return ph;
}
export function inner$roundTrip$pe(SL, ph) {
    const pe = ph.findIndex((w) => (SL.perEach || []).includes(w));
    return pe;
}
export function inner$roundTrip$x(ph) {
    const x = ph.map(clean).join(' ');
    return x;
}
export function inner$roundTrip$O(other) {
    const O = parseSpec(other);
    return O;
}
export function inner$roundTrip$fs0(spec, t) {
    const S = parseSpec(spec || '');
    const fs0 = S.fields.filter((f) => f.ent === t);
    return fs0;
}
export function inner$roundTrip$fs0$$step(S, t) {
    const fs0 = S.fields.filter((f) => f.ent === t);
    return fs0;
}
export function inner$parsePeruk$lines(text) {
    const lines = text.split('\n');
    return lines;
}
export function inner$parsePeruk$doc(text) {
    const lines = text.split('\n');
    const doc = { lines, title: (lines[0] || '').replace(/^#\s*/, ''), sections: {}, optional: [], mandatory: [] };
    return doc;
}
export function inner$parsePeruk$doc$$step(lines) {
    const doc = { lines, title: (lines[0] || '').replace(/^#\s*/, ''), sections: {}, optional: [], mandatory: [] };
    return doc;
}
export function inner$parsePeruk$item(l) {
    const item = l.match(/^\s*[-•]\s*(.+)$/);
    return item;
}
export function inner$check$specText(spec) {
    const specText = norm(spec.raw);
    return specText;
}
export function inner$check$specWords(spec) {
    const specText = norm(spec.raw);
    const specWords = new Set(words(specText));
    return specWords;
}
export function inner$check$specWords$$step(specText) {
    const specWords = new Set(words(specText));
    return specWords;
}
export function inner$check$m(l) {
    const m = l.match(SLASH_LIST_RE);
    return m;
}
export function inner$check$opts(l) {
    const m = l.match(SLASH_LIST_RE);
    const opts = [m[1], m[2], m[3]].filter(Boolean).map(norm);
    return opts;
}
export function inner$check$opts$$step(m) {
    const opts = [m[1], m[2], m[3]].filter(Boolean).map(norm);
    return opts;
}
export function inner$check$covered(spec, l) {
    const m = l.match(SLASH_LIST_RE);
    const opts = [m[1], m[2], m[3]].filter(Boolean).map(norm);
    const covered = spec.enums.some((e) => opts.filter((o) => e.values.some((v) => v.includes(o) || o.includes(v))).length >= 2);
    return covered;
}
export function inner$check$covered$$step(spec, opts) {
    const covered = spec.enums.some((e) => opts.filter((o) => e.values.some((v) => v.includes(o) || o.includes(v))).length >= 2);
    return covered;
}
export function inner$check$key(m) {
    const key = m[0].trim();
    return key;
}
export function inner$check$fs_(spec, ent) {
    const fs_ = spec.fields.filter((f) => f.ent === ent);
    return fs_;
}
export function inner$check$j(i) {
    let j = i + 1;
    return j;
}
export function inner$check$shared(a, b) {
    const shared = words(a.name).filter((w) => w.length >= 3 && words(b.name).some((v) => sameWord(w, v)));
    return shared;
}
export function inner$check$sameKind(a, b) {
    const sameKind = (!!a.en === !!b.en) && (!!a.range === !!b.range);
    return sameKind;
}
export function inner$check$paired(spec, a, b) {
    const paired = spec.particles.some((pl) => pl.includes(a.name) && pl.includes(b.name));
    return paired;
}
export function inner$check$body(c) {
    const body = c.replace(/^תוכן [^:]*:\s*/, '').trim();
    return body;
}
export function inner$check$qn(m) {
    const qn = norm(m[1]);
    return qn;
}
export function inner$check$f(spec, o) {
    const f = spec.fields.find((x) => words(x.name).some((w) => words(o).some((v) => sameWord(w, v))));
    return f;
}
export function inner$check$f_L178(spec, o) {
    const f = spec.fields.find((x) => words(x.name).some((w) => words(o).some((v) => sameWord(w, v))));
    return f;
}
export function inner$check$mn(doc, spec) {
    const mn = doc.optional.filter((o) => spec.fields.some((x) => !x.req && words(x.name).some((w) => words(o).some((v) => sameWord(w, v)))));
    return mn;
}
export function inner$render$qs(findings) {
    const qs = findings.filter((f) => f.q);
    return qs;
}
export function inner$render$fixes(findings) {
    const fixes = findings.filter((f) => !f.q && f.kind !== 'ממה נפשך');
    return fixes;
}
export function inner$render$notes(findings) {
    const notes = findings.filter((f) => f.kind === 'ממה נפשך');
    return notes;
}
export function inner$render$lines(name, doc, findings) {
    const qs = findings.filter((f) => f.q);
    const fixes = findings.filter((f) => !f.q && f.kind !== 'ממה נפשך');
    const notes = findings.filter((f) => f.kind === 'ממה נפשך');
    const lines = [`# ${name} · ${doc.title}`, '', `שאלות לבעלים: ${qs.length} · תיקונים מכניים: ${fixes.length} · הערות: ${notes.length}`, ''];
    return lines;
}
export function inner$render$lines$$step(name, doc, qs, fixes, notes) {
    const lines = [`# ${name} · ${doc.title}`, '', `שאלות לבעלים: ${qs.length} · תיקונים מכניים: ${fixes.length} · הערות: ${notes.length}`, ''];
    return lines;
}
export function inner$render$fs_(findings, k) {
    const fs_ = findings.filter((f) => f.kind === k);
    return fs_;
}
export function inner$main$all(argv) {
    const all = argv.includes('--all') || !argv.some((a) => /^peruk-\d+$/.test(a));
    return all;
}
export function inner$main$json(argv) {
    const json = argv.includes('--json');
    return json;
}
export function inner$main$want(argv, names) {
    const all = argv.includes('--all') || !argv.some((a) => /^peruk-\d+$/.test(a));
    const want = all ? names : names.filter((n) => argv.includes(n));
    return want;
}
export function inner$main$want$$step(argv, all, names) {
    const want = all ? names : names.filter((n) => argv.includes(n));
    return want;
}
export function inner$main$tq(summary) {
    const tq = summary.reduce((s, x) => s + (x.questions || 0), 0);
    return tq;
}
export function inner$main$tf(summary) {
    const tf = summary.reduce((s, x) => s + (x.fixes || 0), 0);
    return tf;
}
export function inner$parseSpec$spec$$after_loop(text) {
    const spec = { entities: [], fields: [], enums: [], required: new Set(), particles: [], contents: [], raw: text, lines: text.split('\n') };
    for (const line of spec.lines) {
        let m;
        if ((m = line.match(/^ישות (.+?) עם (.*?)(?: \| |$)/))) {
            const ent = m[1];
            spec.entities.push(ent);
            // «| שלבים: א, ב, ג» — השלבים הם מקרים-בשמם של הישות (כמו enum): «נפרע / חזר» בפירוק מכוסה בשלבים
            const st = line.match(/\|\s*שלבים\s*:?\s*([^|]+)/);
            if (st)
                spec.enums.push({ ent, name: 'שלבים', values: st[1].split(/[,،]/).map(norm).filter(Boolean) });
            for (const raw of m[2].split(',')) {
                const f = raw.trim();
                if (!f)
                    continue;
                const name = norm(f.replace(/[*{(].*$/, ''));
                const req = /\*/.test(f.replace(/\{[^}]*\}|\([^)]*\)/g, ''));
                const en = (f.match(/\{([^}]*)\}/) || [])[1];
                const range = (f.match(/\(([^)]*)\)/) || [])[1];
                spec.fields.push({ ent, name, req, en: en ? en.split('|').map(norm) : null, range: range || null });
                if (req)
                    spec.required.add(name);
                if (en)
                    spec.enums.push({ ent, name, values: en.split('|').map(norm) });
            }
        }
        else if (/^(חלקיק|דוח|לוח בקרה)/.test(line))
            spec.particles.push(line);
        else if (/^תוכן /.test(line))
            spec.contents.push(line);
    }
    return spec;
}
export function inner$parsePeruk$doc$$after_loop(text) {
    const lines = text.split('\n');
    const doc = { lines, title: (lines[0] || '').replace(/^#\s*/, ''), sections: {}, optional: [], mandatory: [] };
    let sec = '';
    let sub = '';
    for (const l of lines) {
        if (/^## /.test(l)) {
            sec = l.replace(/^##\s*\d*\.?\s*/, '').trim();
            sub = '';
            doc.sections[sec] = [];
            continue;
        }
        if (/^### /.test(l)) {
            sub = l.replace(/^###\s*/, '').trim();
            continue;
        }
        if (!sec)
            continue;
        doc.sections[sec].push(l);
        if (/^רשות/.test(l))
            sub = 'רשות';
        else if (/^חובה/.test(l))
            sub = 'חובה';
        const item = l.match(/^\s*[-•]\s*(.+)$/);
        if (item && /[א-ת]/.test(item[1]) && sub === 'רשות')
            doc.optional.push(norm(item[1]));
        if (item && /[א-ת]/.test(item[1]) && sub === 'חובה')
            doc.mandatory.push(norm(item[1]));
    }
    return doc;
}
export function inner$parsePeruk$sec$$after_loop(text) {
    const lines = text.split('\n');
    const doc = { lines, title: (lines[0] || '').replace(/^#\s*/, ''), sections: {}, optional: [], mandatory: [] };
    let sec = '';
    let sub = '';
    for (const l of lines) {
        if (/^## /.test(l)) {
            sec = l.replace(/^##\s*\d*\.?\s*/, '').trim();
            sub = '';
            doc.sections[sec] = [];
            continue;
        }
        if (/^### /.test(l)) {
            sub = l.replace(/^###\s*/, '').trim();
            continue;
        }
        if (!sec)
            continue;
        doc.sections[sec].push(l);
        if (/^רשות/.test(l))
            sub = 'רשות';
        else if (/^חובה/.test(l))
            sub = 'חובה';
        const item = l.match(/^\s*[-•]\s*(.+)$/);
        if (item && /[א-ת]/.test(item[1]) && sub === 'רשות')
            doc.optional.push(norm(item[1]));
        if (item && /[א-ת]/.test(item[1]) && sub === 'חובה')
            doc.mandatory.push(norm(item[1]));
    }
    return sec;
}
export function inner$parsePeruk$sub$$after_loop(text) {
    const lines = text.split('\n');
    const doc = { lines, title: (lines[0] || '').replace(/^#\s*/, ''), sections: {}, optional: [], mandatory: [] };
    let sec = '';
    let sub = '';
    for (const l of lines) {
        if (/^## /.test(l)) {
            sec = l.replace(/^##\s*\d*\.?\s*/, '').trim();
            sub = '';
            doc.sections[sec] = [];
            continue;
        }
        if (/^### /.test(l)) {
            sub = l.replace(/^###\s*/, '').trim();
            continue;
        }
        if (!sec)
            continue;
        doc.sections[sec].push(l);
        if (/^רשות/.test(l))
            sub = 'רשות';
        else if (/^חובה/.test(l))
            sub = 'חובה';
        const item = l.match(/^\s*[-•]\s*(.+)$/);
        if (item && /[א-ת]/.test(item[1]) && sub === 'רשות')
            doc.optional.push(norm(item[1]));
        if (item && /[א-ת]/.test(item[1]) && sub === 'חובה')
            doc.mandatory.push(norm(item[1]));
    }
    return sub;
}
export function inner$check$docNums$$after_loop(doc) {
    const docNums = new Map();
    for (const [sec, ls] of Object.entries(doc.sections)) {
        if (/דוגמ/.test(sec))
            continue; // דוגמת-פלט = נתוני-דמו, לא כלל
        for (const l of ls)
            for (const m of l.matchAll(NUM_RE)) {
                if (!m[3] && !m[2])
                    continue; // מספר חשוף בלי יחידה ובלי טווח — לא שיעור
                const key = m[0].trim();
                if (!docNums.has(key))
                    docNums.set(key, { ctx: norm(l).slice(0, 90), line: l });
            }
    }
    return docNums;
}
export function inner$main$by$$after_loop(findings) {
    const by = {};
    for (const f of findings)
        by[f.kind] = (by[f.kind] || 0) + 1;
    return by;
}

export const SIGS = {
  inner$parseSpec$spec: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseSpec$st: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseSpec$f: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseSpec$name: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseSpec$name$$step: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$parseSpec$req: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseSpec$req$$step: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$parseSpec$en: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseSpec$en$$step: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$parseSpec$range: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseSpec$range$$step: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$roundTrip$PFX: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$roundTrip$SFX: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$roundTrip$formsOf$w: [{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$roundTrip$formsOf$out: [{"name":"SFX","d":{"t":"any"},"opt":false},{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$roundTrip$formsOf$out$$step: [{"name":"SFX","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"str"},"opt":false}],
  inner$roundTrip$formsOf$b: [{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$roundTrip$formsOf$b$$step: [{"name":"w","d":{"t":"str"},"opt":false}],
  inner$roundTrip$GRAM: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$roundTrip$S: [{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$roundTrip$claims: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"covered","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$roundTrip$claims$$step: [{"name":"covered","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"S","d":{"t":"obj","p":[["entities",{"t":"arr","of":{"t":"undef"}},false],["fields",{"t":"arr","of":{"t":"undef"}},false],["enums",{"t":"arr","of":{"t":"undef"}},false],["required",{"t":"set","of":{"t":"any"}},false],["particles",{"t":"arr","of":{"t":"undef"}},false],["contents",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"any"},false],["lines",{"t":"any"},false]]},"opt":false}],
  inner$roundTrip$NAME_GRAM: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$roundTrip$tableForms: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$roundTrip$tableForms$$step: [{"name":"SFX","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"obj","p":[["entities",{"t":"arr","of":{"t":"undef"}},false],["fields",{"t":"arr","of":{"t":"undef"}},false],["enums",{"t":"arr","of":{"t":"undef"}},false],["required",{"t":"set","of":{"t":"any"}},false],["particles",{"t":"arr","of":{"t":"undef"}},false],["contents",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"any"},false],["lines",{"t":"any"},false]]},"opt":false}],
  inner$roundTrip$ws: [{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$roundTrip$hi: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$roundTrip$hi$$step: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$roundTrip$ph: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$roundTrip$ph$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"hi","d":{"t":"num"},"opt":false}],
  inner$roundTrip$pe: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"ph","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$roundTrip$x: [{"name":"ph","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$roundTrip$O: [{"name":"other","d":{"t":"null"},"opt":false}],
  inner$roundTrip$fs0: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"t","d":{"t":"undef"},"opt":false}],
  inner$roundTrip$fs0$$step: [{"name":"S","d":{"t":"obj","p":[["entities",{"t":"arr","of":{"t":"undef"}},false],["fields",{"t":"arr","of":{"t":"undef"}},false],["enums",{"t":"arr","of":{"t":"undef"}},false],["required",{"t":"set","of":{"t":"any"}},false],["particles",{"t":"arr","of":{"t":"undef"}},false],["contents",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"any"},false],["lines",{"t":"any"},false]]},"opt":false},{"name":"t","d":{"t":"undef"},"opt":false}],
  inner$parsePeruk$lines: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$doc: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$doc$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$item: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$check$specText: [{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$check$specWords: [{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$check$specWords$$step: [{"name":"specText","d":{"t":"str"},"opt":false}],
  inner$check$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$check$opts: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$check$opts$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$check$covered: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$check$covered$$step: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"opts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$check$key: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$check$fs_: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$check$j: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$check$shared: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$check$sameKind: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$check$paired: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$check$body: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$check$qn: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$check$f: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$check$f_L178: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$check$mn: [{"name":"doc","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$render$qs: [{"name":"findings","d":{"t":"any"},"opt":false}],
  inner$render$fixes: [{"name":"findings","d":{"t":"any"},"opt":false}],
  inner$render$notes: [{"name":"findings","d":{"t":"any"},"opt":false}],
  inner$render$lines: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"doc","d":{"t":"any"},"opt":false},{"name":"findings","d":{"t":"any"},"opt":false}],
  inner$render$lines$$step: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"doc","d":{"t":"any"},"opt":false},{"name":"qs","d":{"t":"any"},"opt":false},{"name":"fixes","d":{"t":"any"},"opt":false},{"name":"notes","d":{"t":"any"},"opt":false}],
  inner$render$fs_: [{"name":"findings","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$main$all: [{"name":"argv","d":{"t":"any"},"opt":false}],
  inner$main$json: [{"name":"argv","d":{"t":"any"},"opt":false}],
  inner$main$want: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"names","d":{"t":"any"},"opt":false}],
  inner$main$want$$step: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"names","d":{"t":"any"},"opt":false}],
  inner$main$tq: [{"name":"summary","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$main$tf: [{"name":"summary","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$parseSpec$spec$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$doc$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$sec$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parsePeruk$sub$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$check$docNums$$after_loop: [{"name":"doc","d":{"t":"any"},"opt":false}],
  inner$main$by$$after_loop: [{"name":"findings","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["opts",{"t":"arr","of":{"t":"str"}},false],["name",{"t":"str"},false],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["ent",{"t":"any"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true]]},false],["pair",{"t":"obj","p":[["ent",{"t":"any"},false],["a",{"t":"any"},false],["b",{"t":"any"},false]]},false],["line",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"any"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["readings",{"t":"arr","of":{"t":"str"}},false],["pair",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["doc_says",{"t":"any"},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["line",{"t":"undef"},true],["apply",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]}]}},"opt":false}],
};
