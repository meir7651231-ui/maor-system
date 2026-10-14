// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/apply.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const STOP = new Set(['את', 'של', 'על', 'עם', 'או', 'אם', 'כי', 'לא', 'כן', 'זה', 'זו', 'יש', 'אין', 'מה', 'מי', 'גם', 'רק', 'כל', 'עוד', 'כבר', 'בלי', 'עד', 'מול', 'ועד', 'ולא', 'הוא', 'היא', 'הם', 'לפי', 'בין', 'אחרי', 'לפני', 'מתי', 'איך', 'למה', 'אז', 'אבל']);
const PREFIX = /^[ובלכמשה]/;
const words = (s) => [...String(s).matchAll(/[א-ת״׳"']{2,}/g)].map((m) => m[0]).filter((w) => !STOP.has(w));
const sameWord = (a, b) => a === b || (PREFIX.test(a) && a.slice(1) === b) || (PREFIX.test(b) && b.slice(1) === a);
const namedIn = (name, pool) => { const ws = words(name); return ws.length > 0 && ws.every((w) => pool.some((v) => sameWord(w, v))); };
const norm = (s) => String(s).replace(/[״"'׳]/g, '').replace(/\s+/g, ' ').trim();
function fieldSeg(line, name) {
    const m = line.match(/^ישות (.+?) עם (.*?)(?: \| |$)/);
    if (!m)
        return null;
    let off = `ישות ${m[1]} עם `.length;
    for (const raw of m[2].split(',')) {
        if (norm(raw.trim().replace(/[*{(].*$/, '')) === name)
            return { start: off, end: off + raw.length, raw };
        off += raw.length + 1;
    }
    return null;
}
const starAt = (seg) => { const i = seg.search(/[*{(]/); return i >= 0 && seg[i] === '*' ? i : -1; };
function moveOf(f) {
    const t = f.apply && f.apply.type;
    if (f.kind === 'ורמינהו')
        return t === 'dropField' ? 'ורמינהו · שדות תאומים' : t === 'require' ? 'ורמינהו · חובה בפירוק' : 'ורמינהו · רשות בפירוק';
    if (f.kind === 'ייתור')
        return t === 'field' ? 'ייתור · חובה בלי שדה' : 'ייתור · ציטוט';
    return f.kind;
}
function pasak(f, doc, spec) {
    const move = moveOf(f);
    const docWords = words(doc.lines.join(' '));
    const base = { move, kind: f.kind, text: f.text, apply: f.apply || null };
    if (f.kind === 'ממה נפשך')
        return { ...base, ruling: 'אין שאלה', decided: true, apply: null, basis: ['שתי הקריאות נותנות אותה בנייה — לא שואלים כלל'] };
    if (f.kind === 'מאי X')
        return { ...base, ruling: 'מכני — מוחל לבד', decided: true, basis: [`מציין-מקום בשורת תוכן בספק: «${f.apply.line.slice(0, 70)}»`] };
    if (f.kind === 'אין מערבין')
        return { ...base, ruling: 'מכני — מוחל לבד', decided: true, basis: [`כותרת בשורת תוכן בספק: «${f.apply.line.slice(0, 70)}»`] };
    if (f.kind === 'שיעור')
        return { ...base, ruling: 'סף — מוחל לבד', decided: true, basis: [`מספר עם יחידה במסמך: «${f.line ? f.line.trim().slice(0, 90) : f.text.slice(0, 90)}»`, 'ולא בספק — לכן סף שנשמט'] };
    if (f.kind === 'איכא דאמרי')
        return { ...base, ruling: 'enum — מוחל לבד', decided: true, basis: [`רשימת-מקרים במסמך: «${f.line ? f.line.trim().slice(0, 90) : ''}»`, `הערכים כתובים במסמך: ${f.apply.opts.map((o) => `«${o}»`).join(' · ')}`] };
    if (move === 'ורמינהו · חובה בפירוק' || move === 'ורמינהו · רשות בפירוק') {
        const side = move === 'ורמינהו · חובה בפירוק' ? 'חובה' : 'רשות';
        return { ...base, ruling: `פליגא — המסמך גובר (${side})`, decided: true,
            basis: [`מקור א (המסמך, מה שהבעלים כתב): «${f.doc_says}» תחת ${side}`, `מקור ב (הספק, מה ש-peruk.mjs גזר): «${f.apply.name}» ההפך`, 'הספק נגזר מהמסמך ⇒ המסמך גובר'] };
    }
    if (move === 'ייתור · חובה בלי שדה') {
        return { ...base, ruling: 'פליגא — המסמך גובר (חובה)', decided: true,
            basis: [`מקור א (המסמך): «${f.doc_says}» תחת חובה ב"מה שולחים"`, 'מקור ב (הספק): אין שדה כלל', 'הספק נגזר מהמסמך ⇒ השדה נכנס'] };
    }
    if (move === 'ורמינהו · שדות תאומים') {
        // מבחן הקריסה: המסמך מכריע אם השניים הם אחד בשתי לשונות, או שניים בכוונה.
        const { ent, a, b } = f.pair;
        const inA = namedIn(a, docWords), inB = namedIn(b, docWords);
        if (inA && !inB)
            return { ...base, ruling: 'חד שיעורא — הספק פיצל אחד לשניים', decided: true, apply: { type: 'dropField', ent, name: b }, basis: [`«${a}» נקוב במסמך`, `«${b}» אינו נקוב במסמך`, `הספק נגזר מהמסמך ⇒ «${b}» נשמט`] };
        if (inB && !inA)
            return { ...base, ruling: 'חד שיעורא — הספק פיצל אחד לשניים', decided: true, apply: { type: 'dropField', ent, name: a }, basis: [`«${b}» נקוב במסמך`, `«${a}» אינו נקוב במסמך`, `הספק נגזר מהמסמך ⇒ «${a}» נשמט`] };
        if (inA && inB)
            return { ...base, ruling: 'לא שייך — שניהם נקובים במסמך', decided: true, apply: null, basis: [`«${a}» נקוב במסמך`, `«${b}» נקוב במסמך`, 'שני דברים שהבעלים כתב, לא סתירה ⇒ אין שינוי'] };
        return { ...base, ruling: 'מתג', decided: false,
            basis: [`«${a}» אינו נקוב במסמך`, `«${b}» אינו נקוב במסמך`, 'אין עדות לאף צד — לא נופלים לברירה'],
            options: [{ label: `א · «${b}» יורד מ${ent}`, apply: { type: 'dropField', ent, name: b } }, { label: 'ב · שניהם נשארים', apply: null }] };
    }
    // ייתור · ציטוט — המסמך מצטט ואינו אומר מה תפקיד הציטוט. שלוש קריאות, אף לא אחת כתובה.
    return { ...base, ruling: 'מתג', decided: false,
        basis: ['הציטוט במסמך ואינו בספק', `המסמך אינו אומר איזה מן ${f.readings.map((r) => `«${r}»`).join(' / ')} הוא`],
        options: [{ label: `א · נכנס כשורת תוכן: «${f.apply.line}»`, apply: f.apply }, { label: 'ב · נשאר פרוזה במסמך בלבד', apply: null }] };
}
export function inner$namedIn$ws(name) {
    const ws = words(name);
    return ws;
}
export function inner$fieldSeg$m(line) {
    const m = line.match(/^ישות (.+?) עם (.*?)(?: \| |$)/);
    return m;
}
export function inner$fieldSeg$off(line) {
    const m = line.match(/^ישות (.+?) עם (.*?)(?: \| |$)/);
    let off = `ישות ${m[1]} עם `.length;
    return off;
}
export function inner$fieldSeg$off$$step(m) {
    let off = `ישות ${m[1]} עם `.length;
    return off;
}
export function inner$starAt$i(seg) {
    const i = seg.search(/[*{(]/);
    return i;
}
export function inner$addStar$i(seg) {
    const i = seg.search(/[*{(]/);
    return i;
}
export function inner$addStar$at(seg) {
    const i = seg.search(/[*{(]/);
    const at = i < 0 ? seg.replace(/\s+$/, '').length : i;
    return at;
}
export function inner$addStar$at$$step(seg, i) {
    const at = i < 0 ? seg.replace(/\s+$/, '').length : i;
    return at;
}
export function inner$dropStar$i(seg) {
    const i = starAt(seg);
    return i;
}
export function inner$pasak$move(f) {
    const move = moveOf(f);
    return move;
}
export function inner$pasak$docWords(doc) {
    const docWords = words(doc.lines.join(' '));
    return docWords;
}
export function inner$pasak$side(f) {
    const move = moveOf(f);
    const side = move === 'ורמינהו · חובה בפירוק' ? 'חובה' : 'רשות';
    return side;
}
export function inner$pasak$side$$step(move) {
    const side = move === 'ורמינהו · חובה בפירוק' ? 'חובה' : 'רשות';
    return side;
}
export function inner$pasak$inA(doc, a) {
    const docWords = words(doc.lines.join(' '));
    const inA = namedIn(a, docWords);
    return inA;
}
export function inner$pasak$inA$$step(docWords, a) {
    const inA = namedIn(a, docWords);
    return inA;
}
export function inner$pasak$inB(doc, b) {
    const docWords = words(doc.lines.join(' '));
    const inB = namedIn(b, docWords);
    return inB;
}
export function inner$pasak$inB$$step(docWords, b) {
    const inB = namedIn(b, docWords);
    return inB;
}
export function inner$applyPsak$lines(spec) {
    const lines = spec.raw.split('\n');
    return lines;
}
export function inner$applyPsak$insert$cut(l) {
    const cut = l.indexOf(' | ');
    return cut;
}
export function inner$applyPsak$i(spec) {
    const lines = spec.raw.split('\n');
    const i = lines.findIndex((l) => /^ישות /.test(l));
    return i;
}
export function inner$applyPsak$i$$step(lines) {
    const i = lines.findIndex((l) => /^ישות /.test(l));
    return i;
}
export function inner$applyPsak$sg(ap, l) {
    const sg = fieldSeg(l, ap.name);
    return sg;
}
export function inner$applyPsak$cutFrom(ap, l) {
    const sg = fieldSeg(l, ap.name);
    const cutFrom = l[sg.start - 1] === ',' ? sg.start - 1 : sg.start;
    return cutFrom;
}
export function inner$applyPsak$cutFrom$$step(l, sg) {
    const cutFrom = l[sg.start - 1] === ',' ? sg.start - 1 : sg.start;
    return cutFrom;
}
export function inner$applyPsak$cutTo(ap, l) {
    const sg = fieldSeg(l, ap.name);
    const cutFrom = l[sg.start - 1] === ',' ? sg.start - 1 : sg.start;
    const cutTo = cutFrom === sg.start && l[sg.end] === ',' ? sg.end + 1 : sg.end;
    return cutTo;
}
export function inner$applyPsak$cutTo$$step(l, sg, cutFrom) {
    const cutTo = cutFrom === sg.start && l[sg.end] === ',' ? sg.end + 1 : sg.end;
    return cutTo;
}
export function inner$applyPsak$sg_L125(ap, l) {
    const sg = fieldSeg(l, ap.name);
    return sg;
}
export function inner$applyPsak$i_L130(spec, ap) {
    const lines = spec.raw.split('\n');
    const i = lines.indexOf(ap.line);
    return i;
}
export function inner$applyPsak$i_L130$$step(lines, ap) {
    const i = lines.indexOf(ap.line);
    return i;
}
export function inner$applyPsak$i_L133(spec, ap) {
    const lines = spec.raw.split('\n');
    const i = lines.indexOf(ap.line);
    return i;
}
export function inner$applyPsak$i_L133$$step(lines, ap) {
    const i = lines.indexOf(ap.line);
    return i;
}
export function inner$applyPsak$outLines(spec, marks) {
    const lines = spec.raw.split('\n');
    const outLines = lines.map((l, i) => { const m = marks.get(i); if (!m)
        return l; return m.cls === 'del' ? null : m.txt; }).filter((l) => l !== null);
    return outLines;
}
export function inner$applyPsak$outLines$$step(lines, marks) {
    const outLines = lines.map((l, i) => { const m = marks.get(i); if (!m)
        return l; return m.cls === 'del' ? null : m.txt; }).filter((l) => l !== null);
    return outLines;
}
export function inner$applyPsak$map$m(marks, i) {
    const m = marks.get(i);
    return m;
}
export function inner$buildOptions$map$bl(fixedText) {
    const bl = fixedText.split('\n');
    return bl;
}
export function inner$buildOptions$map$nl(built) {
    const nl = built.text.split('\n');
    return nl;
}
export function inner$renderPsak$dec(rulings) {
    const dec = rulings.filter((r) => r.decided);
    return dec;
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
export function inner$main$rulings(doc, spec, findings) {
    const rulings = findings.map((f) => pasak(f, doc, spec));
    return rulings;
}
export function inner$main$switches(doc, spec, findings) {
    const rulings = findings.map((f) => pasak(f, doc, spec));
    const switches = rulings.filter((r) => !r.decided);
    return switches;
}
export function inner$main$switches$$step(rulings) {
    const switches = rulings.filter((r) => !r.decided);
    return switches;
}
export function inner$main$k(r) {
    const k = r.move + (r.decided ? '' : ' → מתג');
    return k;
}
export function inner$main$td(summary) {
    const td = summary.reduce((a, x) => a + (x.decided || 0), 0);
    return td;
}
export function inner$main$ts(summary) {
    const ts = summary.reduce((a, x) => a + (x.switches || 0), 0);
    return ts;
}

export const SIGS = {
  inner$namedIn$ws: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$fieldSeg$m: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$fieldSeg$off: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$fieldSeg$off$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$starAt$i: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$addStar$i: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$addStar$at: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$addStar$at$$step: [{"name":"seg","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$dropStar$i: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$pasak$move: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$pasak$docWords: [{"name":"doc","d":{"t":"any"},"opt":false}],
  inner$pasak$side: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$pasak$side$$step: [{"name":"move","d":{"t":"any"},"opt":false}],
  inner$pasak$inA: [{"name":"doc","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$pasak$inA$$step: [{"name":"docWords","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$pasak$inB: [{"name":"doc","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$pasak$inB$$step: [{"name":"docWords","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$applyPsak$lines: [{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$applyPsak$insert$cut: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$applyPsak$i: [{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$applyPsak$i$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$applyPsak$sg: [{"name":"ap","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$applyPsak$cutFrom: [{"name":"ap","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$applyPsak$cutFrom$$step: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"sg","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false],["raw",{"t":"any"},false]]}]},"opt":false}],
  inner$applyPsak$cutTo: [{"name":"ap","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$applyPsak$cutTo$$step: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"sg","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false],["raw",{"t":"any"},false]]}]},"opt":false},{"name":"cutFrom","d":{"t":"num"},"opt":false}],
  inner$applyPsak$sg_L125: [{"name":"ap","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$applyPsak$i_L130: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"ap","d":{"t":"any"},"opt":false}],
  inner$applyPsak$i_L130$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"ap","d":{"t":"any"},"opt":false}],
  inner$applyPsak$i_L133: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"ap","d":{"t":"any"},"opt":false}],
  inner$applyPsak$i_L133$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"ap","d":{"t":"any"},"opt":false}],
  inner$applyPsak$outLines: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"marks","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$applyPsak$outLines$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"marks","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$applyPsak$map$m: [{"name":"marks","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$buildOptions$map$bl: [{"name":"fixedText","d":{"t":"any"},"opt":false}],
  inner$buildOptions$map$nl: [{"name":"built","d":{"t":"obj","p":[["text",{"t":"any"},false],["changed",{"t":"num"},false]]},"opt":false}],
  inner$renderPsak$dec: [{"name":"rulings","d":{"t":"any"},"opt":false}],
  inner$main$all: [{"name":"argv","d":{"t":"any"},"opt":false}],
  inner$main$json: [{"name":"argv","d":{"t":"any"},"opt":false}],
  inner$main$want: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"names","d":{"t":"any"},"opt":false}],
  inner$main$want$$step: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"names","d":{"t":"any"},"opt":false}],
  inner$main$rulings: [{"name":"doc","d":{"t":"obj","p":[["lines",{"t":"any"},false],["title",{"t":"any"},false],["sections",{"t":"obj","p":[]},false],["optional",{"t":"arr","of":{"t":"undef"}},false],["mandatory",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"spec","d":{"t":"obj","p":[["entities",{"t":"arr","of":{"t":"undef"}},false],["fields",{"t":"arr","of":{"t":"undef"}},false],["enums",{"t":"arr","of":{"t":"undef"}},false],["required",{"t":"set","of":{"t":"any"}},false],["particles",{"t":"arr","of":{"t":"undef"}},false],["contents",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"any"},false],["lines",{"t":"any"},false]]},"opt":false},{"name":"findings","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["opts",{"t":"arr","of":{"t":"str"}},false],["name",{"t":"str"},false],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["ent",{"t":"any"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true]]},false],["pair",{"t":"obj","p":[["ent",{"t":"any"},false],["a",{"t":"any"},false],["b",{"t":"any"},false]]},false],["line",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"any"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["readings",{"t":"arr","of":{"t":"str"}},false],["pair",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["doc_says",{"t":"any"},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["line",{"t":"undef"},true],["apply",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]}]}},"opt":false}],
  inner$main$switches: [{"name":"doc","d":{"t":"obj","p":[["lines",{"t":"any"},false],["title",{"t":"any"},false],["sections",{"t":"obj","p":[]},false],["optional",{"t":"arr","of":{"t":"undef"}},false],["mandatory",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"spec","d":{"t":"obj","p":[["entities",{"t":"arr","of":{"t":"undef"}},false],["fields",{"t":"arr","of":{"t":"undef"}},false],["enums",{"t":"arr","of":{"t":"undef"}},false],["required",{"t":"set","of":{"t":"any"}},false],["particles",{"t":"arr","of":{"t":"undef"}},false],["contents",{"t":"arr","of":{"t":"undef"}},false],["raw",{"t":"any"},false],["lines",{"t":"any"},false]]},"opt":false},{"name":"findings","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["opts",{"t":"arr","of":{"t":"str"}},false],["name",{"t":"str"},false],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["ent",{"t":"any"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true]]},false],["pair",{"t":"obj","p":[["ent",{"t":"any"},false],["a",{"t":"any"},false],["b",{"t":"any"},false]]},false],["line",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"any"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["readings",{"t":"arr","of":{"t":"str"}},false],["pair",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["doc_says",{"t":"any"},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["line",{"t":"undef"},true],["apply",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]}]}},"opt":false}],
  inner$main$switches$$step: [{"name":"rulings","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["ruling",{"t":"str"},false],["decided",{"t":"bool"},false],["basis",{"t":"arr","of":{"t":"str"}},false],["move",{"t":"any"},false],["kind",{"t":"any"},false],["text",{"t":"any"},false],["apply",{"t":"any"},false]]},{"t":"obj","p":[["ruling",{"t":"str"},false],["decided",{"t":"bool"},false],["basis",{"t":"arr","of":{"t":"str"}},false],["options",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["apply",{"t":"any"},false]]}},false],["move",{"t":"any"},false],["kind",{"t":"any"},false],["text",{"t":"any"},false],["apply",{"t":"any"},false]]}]}},"opt":false}],
  inner$main$k: [{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["ruling",{"t":"str"},false],["decided",{"t":"bool"},false],["basis",{"t":"arr","of":{"t":"str"}},false],["move",{"t":"any"},false],["kind",{"t":"any"},false],["text",{"t":"any"},false],["apply",{"t":"any"},false]]},{"t":"obj","p":[["ruling",{"t":"str"},false],["decided",{"t":"bool"},false],["basis",{"t":"arr","of":{"t":"str"}},false],["options",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["apply",{"t":"any"},false]]}},false],["move",{"t":"any"},false],["kind",{"t":"any"},false],["text",{"t":"any"},false],["apply",{"t":"any"},false]]}]},"opt":false}],
  inner$main$td: [{"name":"summary","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$main$ts: [{"name":"summary","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
