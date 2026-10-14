// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/quarry-golden.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isHeader = (l) => /^\s*\/\/ ═══/.test(l);
const isSub = (l) => /^\s*\/\/ ───/.test(l);
const isClass = (l) => /^(abstract\s+)?class\s+\w+/.test(l);
const isBuilder = (l) => /^\s+Widget\s+_\w+\(/.test(l) || /^\s+@override\s*$/.test(l);
const isClose = (l) => /^}\s*$/.test(l);
const grab = (str, at) => { let d = 0; for (let i = at; i < str.length; i++) {
    if (str[i] === '(')
        d++;
    else if (str[i] === ')') {
        d--;
        if (d === 0)
            return str.slice(at, i + 1);
    }
} return null; };
export function inner$importsOf$map$m(l) {
    const m = l.match(/^import '([^']+)'/);
    return m;
}
export function inner$importsOf$map$sym(p, base) {
    const sym = /dart-ui-bs/.test(p) ? base.replace(/(^|_)([a-z0-9])/g, (_, __, c) => c.toUpperCase()) : base.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    return sym;
}
export function inner$quarry$lines(src) {
    const lines = src.split('\n');
    return lines;
}
export function inner$quarry$map$code(lines, f) {
    const code = lines.slice(f.start, f.end);
    return code;
}
export function inner$quarry$map$first(lines, f) {
    const code = lines.slice(f.start, f.end);
    const first = code.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || code.find((l) => l.trim().length) || '';
    return first;
}
export function inner$quarry$map$first$$step(code) {
    const first = code.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || code.find((l) => l.trim().length) || '';
    return first;
}
export function inner$quarry$map$hdrLine(lines, f) {
    const code = lines.slice(f.start, f.end);
    const hdrLine = code.find((l) => isHeader(l) || isSub(l));
    return hdrLine;
}
export function inner$quarry$map$hdrLine$$step(code) {
    const hdrLine = code.find((l) => isHeader(l) || isSub(l));
    return hdrLine;
}
export function inner$quarry$map$header(lines, f) {
    const code = lines.slice(f.start, f.end);
    const first = code.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || code.find((l) => l.trim().length) || '';
    const hdrLine = code.find((l) => isHeader(l) || isSub(l));
    const header = hdrLine ? hdrLine.replace(/^\s*\/\/\s*[═─]+\s*/, '').replace(/\s*[═─]+\s*$/, '').trim() : (isBuilder(first) ? first.trim() : (isClass(first) ? first.trim() : ''));
    return header;
}
export function inner$quarry$map$header$$step(first, hdrLine) {
    const header = hdrLine ? hdrLine.replace(/^\s*\/\/\s*[═─]+\s*/, '').replace(/\s*[═─]+\s*$/, '').trim() : (isBuilder(first) ? first.trim() : (isClass(first) ? first.trim() : ''));
    return header;
}
export function inner$quarry$map$rawDecl(lines, f) {
    const code = lines.slice(f.start, f.end);
    const first = code.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || code.find((l) => l.trim().length) || '';
    const hdrLine = code.find((l) => isHeader(l) || isSub(l));
    const header = hdrLine ? hdrLine.replace(/^\s*\/\/\s*[═─]+\s*/, '').replace(/\s*[═─]+\s*$/, '').trim() : (isBuilder(first) ? first.trim() : (isClass(first) ? first.trim() : ''));
    const rawDecl = hdrLine && header.includes('=') ? [...header.split('=').pop().matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]) : [];
    return rawDecl;
}
export function inner$quarry$map$rawDecl$$step(hdrLine, header) {
    const rawDecl = hdrLine && header.includes('=') ? [...header.split('=').pop().matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]) : [];
    return rawDecl;
}
export function inner$quarry$map$declared(ATOM_IDS, lines, f) {
    const code = lines.slice(f.start, f.end);
    const first = code.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || code.find((l) => l.trim().length) || '';
    const hdrLine = code.find((l) => isHeader(l) || isSub(l));
    const header = hdrLine ? hdrLine.replace(/^\s*\/\/\s*[═─]+\s*/, '').replace(/\s*[═─]+\s*$/, '').trim() : (isBuilder(first) ? first.trim() : (isClass(first) ? first.trim() : ''));
    const rawDecl = hdrLine && header.includes('=') ? [...header.split('=').pop().matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]) : [];
    const declared = rawDecl.filter((s) => ATOM_IDS.has(s));
    return declared;
}
export function inner$quarry$map$declared$$step(ATOM_IDS, rawDecl) {
    const declared = rawDecl.filter((s) => ATOM_IDS.has(s));
    return declared;
}
export function inner$quarry$map$ids(lines, f) {
    const code = lines.slice(f.start, f.end);
    const ids = new Set([...code.join('\n').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
    return ids;
}
export function inner$quarry$map$ids$$step(code) {
    const ids = new Set([...code.join('\n').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
    return ids;
}
export function inner$quarry$map$used(ATOM_IDS, lines, f) {
    const code = lines.slice(f.start, f.end);
    const ids = new Set([...code.join('\n').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
    const used = [...ids].filter((s) => ATOM_IDS.has(s) && !/^(String|List|Map|Set|Widget|Text|int|num|bool)$/.test(s));
    return used;
}
export function inner$quarry$map$used$$step(ATOM_IDS, ids) {
    const used = [...ids].filter((s) => ATOM_IDS.has(s) && !/^(String|List|Map|Set|Widget|Text|int|num|bool)$/.test(s));
    return used;
}
export function inner$quarry$map$ops(atomById, ATOM_IDS, lines, f) {
    const code = lines.slice(f.start, f.end);
    const ids = new Set([...code.join('\n').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
    const used = [...ids].filter((s) => ATOM_IDS.has(s) && !/^(String|List|Map|Set|Widget|Text|int|num|bool)$/.test(s));
    const ops = [...new Set(used.map((s) => atomById.get(s).op))];
    return ops;
}
export function inner$quarry$map$ops$$step(atomById, used) {
    const ops = [...new Set(used.map((s) => atomById.get(s).op))];
    return ops;
}
export function inner$quarry$map$need(lines, imports, f) {
    const code = lines.slice(f.start, f.end);
    const ids = new Set([...code.join('\n').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
    const need = imports.filter((im) => ids.has(im.sym)).map((im) => im.path);
    return need;
}
export function inner$quarry$map$need$$step(imports, ids) {
    const need = imports.filter((im) => ids.has(im.sym)).map((im) => im.path);
    return need;
}
export function inner$quarry$map$body(lines, f) {
    const code = lines.slice(f.start, f.end);
    const body = code.join('\n');
    return body;
}
export function inner$quarry$map$body$$step(code) {
    const body = code.join('\n');
    return body;
}
export function inner$quarry$map$role(lines, f, idx) {
    const code = lines.slice(f.start, f.end);
    const first = code.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || code.find((l) => l.trim().length) || '';
    const body = code.join('\n');
    const role = isClass(first) ? 'class-head' : isClose(first) ? 'class-close' : /\bWidget\s+build\s*\(/.test(body) ? 'build' : /^\s+Widget\s+_\w+\(/.test(first) ? 'builder' : idx === 0 ? 'preamble' : 'member';
    return role;
}
export function inner$quarry$map$role$$step(idx, first, body) {
    const role = isClass(first) ? 'class-head' : isClose(first) ? 'class-close' : /\bWidget\s+build\s*\(/.test(body) ? 'build' : /^\s+Widget\s+_\w+\(/.test(first) ? 'builder' : idx === 0 ? 'preamble' : 'member';
    return role;
}
export function inner$quarry$map$grabSites$args(tail, m) {
    const args = grab(tail, m.index + m[1].length);
    return args;
}
export function inner$quarry$map$grabSites$before(tail, m) {
    const before = tail.slice(Math.max(0, m.index - 80), m.index);
    return before;
}
export function inner$quarry$map$grabSites$fm(tail, m) {
    const before = tail.slice(Math.max(0, m.index - 80), m.index);
    const fm = before.match(/for \(final (\w+) in ([\w.]+)\)\s*$/);
    return fm;
}
export function inner$quarry$map$grabSites$fm$$step(before) {
    const fm = before.match(/for \(final (\w+) in ([\w.]+)\)\s*$/);
    return fm;
}
export function inner$quarry$map$grabSites$site(tail, m) {
    const args = grab(tail, m.index + m[1].length);
    const before = tail.slice(Math.max(0, m.index - 80), m.index);
    const fm = before.match(/for \(final (\w+) in ([\w.]+)\)\s*$/);
    const site = fm ? `for (final ${fm[1]} in ${fm[2]}) ${m[1]}${args}` : `${m[1]}${args}`;
    return site;
}
export function inner$quarry$map$grabSites$site$$step(m, args, fm) {
    const site = fm ? `for (final ${fm[1]} in ${fm[2]}) ${m[1]}${args}` : `${m[1]}${args}`;
    return site;
}
export function inner$quarry$map$bi(lines, f) {
    const code = lines.slice(f.start, f.end);
    const bi = code.findIndex((l) => /^\s+Widget\s+_\w+\(/.test(l));
    return bi;
}
export function inner$quarry$map$bi$$step(code) {
    const bi = code.findIndex((l) => /^\s+Widget\s+_\w+\(/.test(l));
    return bi;
}
export function inner$quarry$map$bi_L113(lines, f) {
    const code = lines.slice(f.start, f.end);
    const bi = code.findIndex((l) => /^\s+Widget\s+build\s*\(/.test(l));
    return bi;
}
export function inner$quarry$map$bi_L113$$step(code) {
    const bi = code.findIndex((l) => /^\s+Widget\s+build\s*\(/.test(l));
    return bi;
}
export function inner$quarry$map$i(lines, f) {
    const code = lines.slice(f.start, f.end);
    const bi = code.findIndex((l) => /^\s+Widget\s+build\s*\(/.test(l));
    let i = bi + 1;
    return i;
}
export function inner$quarry$map$i$$step(bi) {
    let i = bi + 1;
    return i;
}
export function inner$quarry$roundTrip(src, out) {
    const roundTrip = out.map((f) => f.lines.join('\n')).join('\n') === src;
    return roundTrip;
}
export function inner$quarry$map$grabSites$sites$$after_loop(tail) {
    const sites = {};
    for (const m of tail.matchAll(/(?<![\w.])(_\w+)\(/g)) {
        const args = grab(tail, m.index + m[1].length);
        if (args === null)
            continue;
        const before = tail.slice(Math.max(0, m.index - 80), m.index);
        const fm = before.match(/for \(final (\w+) in ([\w.]+)\)\s*$/);
        const site = fm ? `for (final ${fm[1]} in ${fm[2]}) ${m[1]}${args}` : `${m[1]}${args}`;
        (sites[m[1]] ??= []);
        if (!sites[m[1]].includes(site) && sites[m[1]].length < 4)
            sites[m[1]].push(site);
    }
    return sites;
}
export function inner$quarry$map$lastRet$$after_loop(lines, f) {
    const code = lines.slice(f.start, f.end);
    const bi = code.findIndex((l) => /^\s+Widget\s+build\s*\(/.test(l));
    let lastRet = -1;
    for (let i = bi + 1; i < code.length; i++)
        if (/^ {4}return\b/.test(code[i]))
            lastRet = i;
    return lastRet;
}

export const SIGS = {
  inner$importsOf$map$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$importsOf$map$sym: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$quarry$lines: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$quarry$map$code: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$first: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$first$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$hdrLine: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$hdrLine$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$header: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$header$$step: [{"name":"first","d":{"t":"any"},"opt":false},{"name":"hdrLine","d":{"t":"any"},"opt":false}],
  inner$quarry$map$rawDecl: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$rawDecl$$step: [{"name":"hdrLine","d":{"t":"any"},"opt":false},{"name":"header","d":{"t":"any"},"opt":false}],
  inner$quarry$map$declared: [{"name":"ATOM_IDS","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$declared$$step: [{"name":"ATOM_IDS","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"rawDecl","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$quarry$map$ids: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$ids$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$used: [{"name":"ATOM_IDS","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$used$$step: [{"name":"ATOM_IDS","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"ids","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$quarry$map$ops: [{"name":"atomById","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"ATOM_IDS","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$ops$$step: [{"name":"atomById","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"used","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$quarry$map$need: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"imports","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$need$$step: [{"name":"imports","d":{"t":"any"},"opt":false},{"name":"ids","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$quarry$map$body: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$body$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$role: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$quarry$map$role$$step: [{"name":"idx","d":{"t":"num"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$quarry$map$grabSites$args: [{"name":"tail","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$quarry$map$grabSites$before: [{"name":"tail","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$quarry$map$grabSites$fm: [{"name":"tail","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$quarry$map$grabSites$fm$$step: [{"name":"before","d":{"t":"any"},"opt":false}],
  inner$quarry$map$grabSites$site: [{"name":"tail","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$quarry$map$grabSites$site$$step: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"args","d":{"t":"any"},"opt":false},{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$quarry$map$bi: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$bi$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$bi_L113: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$bi_L113$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$i: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$quarry$map$i$$step: [{"name":"bi","d":{"t":"num"},"opt":false}],
  inner$quarry$roundTrip: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"out","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["module",{"t":"any"},false],["cls",{"t":"str"},false],["role",{"t":"str"},false],["prelude",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["callSites",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"sites","p":[]}]},false],["range",{"t":"arr","of":{"t":"any"}},false],["header",{"t":"any"},false],["declaredAtoms",{"t":"arr","of":{"t":"any"}},false],["atomsUsed",{"t":"arr","of":{"t":"any"}},false],["ops",{"t":"arr","of":{"t":"any"}},false],["imports",{"t":"any"},false],["defs",{"t":"arr","of":{"t":"any"}},false],["lines",{"t":"any"},false]]}},"opt":false}],
  inner$quarry$map$grabSites$sites$$after_loop: [{"name":"tail","d":{"t":"any"},"opt":false}],
  inner$quarry$map$lastRet$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"any"},false]]},"opt":false}],
};
