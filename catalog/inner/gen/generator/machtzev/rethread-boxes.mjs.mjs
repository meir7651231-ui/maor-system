// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/rethread-boxes.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function ensureSocketImport(src, sockFile, shelf) {
    const alias = (shelf === 'bs' ? 'tdb_' : 'skb_') + sockFile.replace(/-(sockets|data)\.dart$/, '').replace(/-/g, '_');
    const line = shelf === 'bs'
        ? `import '../dart-data/${sockFile}' as ${alias};`
        : `import '../dart-data-maor/${sockFile}' as ${alias};`;
    if (!src.includes(line)) {
        const fi = src.search(/^import /m);
        src = fi >= 0 ? src.slice(0, fi) + line + '\n' + src.slice(fi) : line + '\n' + src;
    }
    return { src, alias };
}
const offAt = (lines, line, col) => lines.slice(0, line - 1).reduce((a, l) => a + l.length + 1, 0) + col - 1;
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--only');
    return i;
}
export function inner$proofErrors$out(e) {
    const out = String(e.stderr || '') + String(e.stdout || '');
    return out;
}
export function inner$atomInfo$re2(fn) {
    const re2 = new RegExp(`(?:^|\\n)([\\w<>,?\\[\\] ]+) ${fn}\\(`, 'g');
    return re2;
}
export function inner$atomInfo$start(m) {
    const start = m.index + m[0].length;
    return start;
}
export function inner$atomInfo$raw(src, m) {
    const start = m.index + m[0].length;
    let d = 1;
    let j = start;
    for (; j < src.length && d; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')')
            d--;
    }
    const raw = src.slice(start, j - 1).replace(/[\[\]{}]/g, '');
    return raw;
}
export function inner$atomInfo$raw$$step(src, start, j) {
    const raw = src.slice(start, j - 1).replace(/[\[\]{}]/g, '');
    return raw;
}
export function inner$atomInfo$base(cand) {
    const base = cand.replace(/\.dart$/, '');
    return base;
}
export function inner$socketFor$cn(param, info) {
    const cn = `${info.camel}_${param}`;
    return cn;
}
export function inner$ensureSocketImport$alias(sockFile, shelf) {
    const alias = (shelf === 'bs' ? 'tdb_' : 'skb_') + sockFile.replace(/-(sockets|data)\.dart$/, '').replace(/-/g, '_');
    return alias;
}
export function inner$ensureSocketImport$line(sockFile, shelf) {
    const alias = (shelf === 'bs' ? 'tdb_' : 'skb_') + sockFile.replace(/-(sockets|data)\.dart$/, '').replace(/-/g, '_');
    const line = shelf === 'bs'
        ? `import '../dart-data/${sockFile}' as ${alias};`
        : `import '../dart-data-maor/${sockFile}' as ${alias};`;
    return line;
}
export function inner$ensureSocketImport$line$$step(sockFile, shelf, alias) {
    const line = shelf === 'bs'
        ? `import '../dart-data/${sockFile}' as ${alias};`
        : `import '../dart-data-maor/${sockFile}' as ${alias};`;
    return line;
}
export function inner$ensureSocketImport$fi(src) {
    const fi = src.search(/^import /m);
    return fi;
}
export function inner$repairBox$boxErrs(box, errs) {
    const boxErrs = errs.filter(e => e.file.endsWith(box + '.dart'));
    return boxErrs;
}
export function inner$repairBox$lines(src) {
    let lines = src.split('\n');
    return lines;
}
export function inner$repairBox$jobs(box, errs, lines) {
    const boxErrs = errs.filter(e => e.file.endsWith(box + '.dart'));
    const jobs = boxErrs.map(e => ({ ...e, at: offAt(lines, e.line, e.col) })).sort((a, b) => b.at - a.at).slice(0, 1);
    return jobs;
}
export function inner$repairBox$jobs$$step(boxErrs, lines) {
    const jobs = boxErrs.map(e => ({ ...e, at: offAt(lines, e.line, e.col) })).sort((a, b) => b.at - a.at).slice(0, 1);
    return jobs;
}
export function inner$repairBox$s(p) {
    let s = p - 1;
    return s;
}
export function inner$repairBox$chain(src, p, s) {
    const chain = src.slice(s + 1, p);
    return chain;
}
export function inner$repairBox$fn(src, p, s) {
    const chain = src.slice(s + 1, p);
    const fn = chain.split('.').pop();
    return fn;
}
export function inner$repairBox$fn$$step(chain) {
    const fn = chain.split('.').pop();
    return fn;
}
export function inner$repairBox$missing(m, params) {
    const need = +m[1];
    const got = +m[2];
    const missing = params.slice(got, need);
    return missing;
}
export function inner$repairBox$missing$$step(need, got, params) {
    const missing = params.slice(got, need);
    return missing;
}
export function inner$repairBox$r(src, sk) {
    const r = ensureSocketImport(src, sk.file, sk.shelf);
    return r;
}
export function inner$repairBox$callAt(src, lines, e, p, s) {
    const chain = src.slice(s + 1, p);
    const callAt = src.indexOf(chain + '(', Math.max(0, src.length === lines.join('\n').length ? offAt(lines, e.line, e.col) - chain.length : 0));
    return callAt;
}
export function inner$repairBox$callAt$$step(src, lines, e, chain) {
    const callAt = src.indexOf(chain + '(', Math.max(0, src.length === lines.join('\n').length ? offAt(lines, e.line, e.col) - chain.length : 0));
    return callAt;
}
export function inner$repairBox$j(src, lines, e, p, s) {
    const chain = src.slice(s + 1, p);
    const callAt = src.indexOf(chain + '(', Math.max(0, src.length === lines.join('\n').length ? offAt(lines, e.line, e.col) - chain.length : 0));
    let j = callAt + chain.length;
    return j;
}
export function inner$repairBox$j$$step(chain, callAt) {
    let j = callAt + chain.length;
    return j;
}
export function inner$repairBox$s_L192(p) {
    let s = p - 1;
    return s;
}
export function inner$repairBox$fn_L194(src, p, s) {
    const fn = src.slice(s + 1, p).split('.').pop();
    return fn;
}
export function inner$repairBox$r_L197(src, sk) {
    const r = ensureSocketImport(src, sk.file, sk.shelf);
    return r;
}
export function inner$repairBox$callAt2(src, p, s) {
    const callAt2 = src.indexOf(src.slice(s + 1, p) + '(');
    return callAt2;
}
export function inner$repairBox$j_L200(src, p, s) {
    const callAt2 = src.indexOf(src.slice(s + 1, p) + '(');
    let j = callAt2 + (p - s - 1);
    return j;
}
export function inner$repairBox$j_L200$$step(p, s, callAt2) {
    let j = callAt2 + (p - s - 1);
    return j;
}
export function inner$repairBox$inner(src, p, s) {
    const callAt2 = src.indexOf(src.slice(s + 1, p) + '(');
    let d = 0;
    let j = callAt2 + (p - s - 1);
    for (; j < src.length; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const inner = src.slice(callAt2, j).includes('(') ? true : false;
    return inner;
}
export function inner$repairBox$inner$$step(src, callAt2, j) {
    const inner = src.slice(callAt2, j).includes('(') ? true : false;
    return inner;
}
export function inner$repairBox$haveN(m) {
    const haveN = m[1].trim() ? m[1].split(',').length : 0;
    return haveN;
}
export function inner$repairBox$wantN(m) {
    const wantN = m[2].trim() ? m[2].split(',').length : 0;
    return wantN;
}
export function inner$repairBox$chain_L215(src, s2, epos) {
    const chain = src.slice(s2, epos);
    return chain;
}
export function inner$repairBox$fn_L216(src, s2, epos) {
    const chain = src.slice(s2, epos);
    const fn = chain.split('.').pop();
    return fn;
}
export function inner$repairBox$fn_L216$$step(chain) {
    const fn = chain.split('.').pop();
    return fn;
}
export function inner$repairBox$missing_L219(m, params) {
    const wantN = m[2].trim() ? m[2].split(',').length : 0;
    const missing = params.slice(wantN);
    return missing;
}
export function inner$repairBox$missing_L219$$step(wantN, params) {
    const missing = params.slice(wantN);
    return missing;
}
export function inner$repairBox$r_L226(src, sk) {
    const r = ensureSocketImport(src, sk.file, sk.shelf);
    return r;
}
export function inner$repairBox$args(m) {
    const wantN = m[2].trim() ? m[2].split(',').length : 0;
    const args = Array.from({ length: wantN }, (_, i) => 'a' + i);
    return args;
}
export function inner$repairBox$args$$step(wantN) {
    const args = Array.from({ length: wantN }, (_, i) => 'a' + i);
    return args;
}
export function inner$repairBox$pos(src, s2, epos, preLen) {
    const chain = src.slice(s2, epos);
    const pos = src.indexOf(chain, s2 + (src.length - preLen));
    return pos;
}
export function inner$repairBox$pos$$step(src, s2, chain, preLen) {
    const pos = src.indexOf(chain, s2 + (src.length - preLen));
    return pos;
}
export function inner$repairBox$feed(m, params, refs, info2) {
    const wantN = m[2].trim() ? m[2].split(',').length : 0;
    const missing = params.slice(wantN);
    const feed = info2?.shelf === 'bs' ? refs.map((r2, ri) => `${missing[ri]}: ${r2}`) : refs;
    return feed;
}
export function inner$repairBox$feed$$step(missing, refs, info2) {
    const feed = info2?.shelf === 'bs' ? refs.map((r2, ri) => `${missing[ri]}: ${r2}`) : refs;
    return feed;
}
export function inner$proofErrors$errs$$after_loop(e) {
    const out = String(e.stderr || '') + String(e.stdout || '');
    const errs = [];
    for (const m of out.matchAll(/^([\w./-]+\.dart):(\d+):(\d+): Error: ([^\n]+)/gm))
        errs.push({ file: m[1], line: +m[2], col: +m[3], msg: m[4] });
    return errs;
}
export function inner$atomInfo$d$$after_loop(src, m) {
    const start = m.index + m[0].length;
    let d = 1;
    let j = start;
    for (; j < src.length && d; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')')
            d--;
    }
    return d;
}
export function inner$atomInfo$j$$after_loop(src, m) {
    const start = m.index + m[0].length;
    let d = 1;
    let j = start;
    for (; j < src.length && d; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')')
            d--;
    }
    return j;
}
export function inner$repairBox$d$$after_loop(src, lines, e, p, s) {
    const chain = src.slice(s + 1, p);
    const callAt = src.indexOf(chain + '(', Math.max(0, src.length === lines.join('\n').length ? offAt(lines, e.line, e.col) - chain.length : 0));
    let d = 0;
    let j = callAt + chain.length;
    for (; j < src.length; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$repairBox$j$$after_loop(src, lines, e, p, s) {
    const chain = src.slice(s + 1, p);
    const callAt = src.indexOf(chain + '(', Math.max(0, src.length === lines.join('\n').length ? offAt(lines, e.line, e.col) - chain.length : 0));
    let d = 0;
    let j = callAt + chain.length;
    for (; j < src.length; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}
export function inner$repairBox$d$$after_loop_L201(src, p, s) {
    const callAt2 = src.indexOf(src.slice(s + 1, p) + '(');
    let d = 0;
    let j = callAt2 + (p - s - 1);
    for (; j < src.length; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$repairBox$j$$after_loop_L201(src, p, s) {
    const callAt2 = src.indexOf(src.slice(s + 1, p) + '(');
    let d = 0;
    let j = callAt2 + (p - s - 1);
    for (; j < src.length; j++) {
        if (src[j] === '(')
            d++;
        else if (src[j] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$proofErrors$out: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$atomInfo$re2: [{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$atomInfo$start: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$atomInfo$raw: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$atomInfo$raw$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$atomInfo$base: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$socketFor$cn: [{"name":"param","d":{"t":"any"},"opt":false},{"name":"info","d":{"t":"any"},"opt":false}],
  inner$ensureSocketImport$alias: [{"name":"sockFile","d":{"t":"any"},"opt":false},{"name":"shelf","d":{"t":"any"},"opt":false}],
  inner$ensureSocketImport$line: [{"name":"sockFile","d":{"t":"any"},"opt":false},{"name":"shelf","d":{"t":"any"},"opt":false}],
  inner$ensureSocketImport$line$$step: [{"name":"sockFile","d":{"t":"any"},"opt":false},{"name":"shelf","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$ensureSocketImport$fi: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$repairBox$boxErrs: [{"name":"box","d":{"t":"any"},"opt":false},{"name":"errs","d":{"t":"arr","of":{"t":"obj","p":[["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]}},"opt":false}],
  inner$repairBox$lines: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$repairBox$jobs: [{"name":"box","d":{"t":"any"},"opt":false},{"name":"errs","d":{"t":"arr","of":{"t":"obj","p":[["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]}},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$repairBox$jobs$$step: [{"name":"boxErrs","d":{"t":"arr","of":{"t":"obj","p":[["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]}},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$repairBox$s: [{"name":"p","d":{"t":"num"},"opt":false}],
  inner$repairBox$chain: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$fn: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$fn$$step: [{"name":"chain","d":{"t":"any"},"opt":false}],
  inner$repairBox$missing: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"params","d":{"t":"any"},"opt":false}],
  inner$repairBox$missing$$step: [{"name":"need","d":{"t":"num"},"opt":false},{"name":"got","d":{"t":"num"},"opt":false},{"name":"params","d":{"t":"any"},"opt":false}],
  inner$repairBox$r: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"sk","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["shelf",{"t":"str"},false],["file",{"t":"str"},false],["constName",{"t":"any"},false]]},{"t":"obj","p":[["file",{"t":"str"},false],["constName",{"t":"str"},false],["shelf",{"t":"undef"},true]]}]},"opt":false}],
  inner$repairBox$callAt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$callAt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false},{"name":"chain","d":{"t":"any"},"opt":false}],
  inner$repairBox$j: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$j$$step: [{"name":"chain","d":{"t":"any"},"opt":false},{"name":"callAt","d":{"t":"any"},"opt":false}],
  inner$repairBox$s_L192: [{"name":"p","d":{"t":"num"},"opt":false}],
  inner$repairBox$fn_L194: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$r_L197: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"sk","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["shelf",{"t":"str"},false],["file",{"t":"str"},false],["constName",{"t":"any"},false]]},{"t":"obj","p":[["file",{"t":"str"},false],["constName",{"t":"str"},false],["shelf",{"t":"undef"},true]]}]},"opt":false}],
  inner$repairBox$callAt2: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$j_L200: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$j_L200$$step: [{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false},{"name":"callAt2","d":{"t":"any"},"opt":false}],
  inner$repairBox$inner: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$inner$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"callAt2","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$repairBox$haveN: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repairBox$wantN: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repairBox$chain_L215: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"s2","d":{"t":"num"},"opt":false},{"name":"epos","d":{"t":"num"},"opt":false}],
  inner$repairBox$fn_L216: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"s2","d":{"t":"num"},"opt":false},{"name":"epos","d":{"t":"num"},"opt":false}],
  inner$repairBox$fn_L216$$step: [{"name":"chain","d":{"t":"any"},"opt":false}],
  inner$repairBox$missing_L219: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"params","d":{"t":"any"},"opt":false}],
  inner$repairBox$missing_L219$$step: [{"name":"wantN","d":{"t":"num"},"opt":false},{"name":"params","d":{"t":"any"},"opt":false}],
  inner$repairBox$r_L226: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"sk","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["shelf",{"t":"str"},false],["file",{"t":"str"},false],["constName",{"t":"any"},false]]},{"t":"obj","p":[["file",{"t":"str"},false],["constName",{"t":"str"},false],["shelf",{"t":"undef"},true]]}]},"opt":false}],
  inner$repairBox$args: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repairBox$args$$step: [{"name":"wantN","d":{"t":"num"},"opt":false}],
  inner$repairBox$pos: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"s2","d":{"t":"num"},"opt":false},{"name":"epos","d":{"t":"num"},"opt":false},{"name":"preLen","d":{"t":"num"},"opt":false}],
  inner$repairBox$pos$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"s2","d":{"t":"num"},"opt":false},{"name":"chain","d":{"t":"any"},"opt":false},{"name":"preLen","d":{"t":"num"},"opt":false}],
  inner$repairBox$feed: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"params","d":{"t":"any"},"opt":false},{"name":"refs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"info2","d":{"t":"any"},"opt":false}],
  inner$repairBox$feed$$step: [{"name":"missing","d":{"t":"any"},"opt":false},{"name":"refs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"info2","d":{"t":"any"},"opt":false}],
  inner$proofErrors$errs$$after_loop: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$atomInfo$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$atomInfo$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repairBox$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$d$$after_loop_L201: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
  inner$repairBox$j$$after_loop_L201: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false}],
};
