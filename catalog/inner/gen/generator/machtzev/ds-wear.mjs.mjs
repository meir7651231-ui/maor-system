// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/ds-wear.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const BS_SEM = { brand: 'accent', brandDark: 'accentDark', danger: 'danger', dangerDark: 'danger', success: 'success' };
const BS_NAME = { ...BS_SEM, successDark: 'success', bgLight: 'bg', bgDark: 'bg', cardLight: 'card', cardDark: 'card', inkLight: 'ink', inkDark: 'ink', mutedLight: 'muted', mutedDark: 'muted', warnText: 'warn', warnBright: 'warn', divider: 'line', surfaceMid: 'cardAlt', bgLightAlt: 'cardAlt' };
const rgb = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const dist = (a, b) => { const A = rgb(a), B = rgb(b); return Math.sqrt((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2); };
function roleExpr(R, aarrggbb) {
    const a = parseInt(aarrggbb.slice(0, 2), 16), h = aarrggbb.slice(2);
    let best = null;
    for (const [role, [ra, rh]] of Object.entries(R)) {
        const d = dist(h, rh), da = Math.abs(a - ra);
        if (!best || d < best.d || (d === best.d && da < best.da))
            best = { role, d, da };
    }
    const alpha = a === 255 ? '' : `.withValues(alpha: ${(a / 255).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0')})`;
    return `(l) => l.${best.role}${alpha}`;
}
export function inner$opt$i(argv, k) {
    const i = argv.indexOf(k);
    return i;
}
export function inner$hexOf$m(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    return m;
}
export function inner$hexOf$r(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return r;
}
export function inner$hexOf$r$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return r;
}
export function inner$hexOf$g(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return g;
}
export function inner$hexOf$g$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return g;
}
export function inner$hexOf$b(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return b;
}
export function inner$hexOf$b$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return b;
}
export function inner$hexOf$a(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return a;
}
export function inner$hexOf$a$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
    return a;
}
export function inner$dist$A(a) {
    const A = rgb(a);
    return A;
}
export function inner$dist$B(b) {
    const B = rgb(b);
    return B;
}
export function inner$roleExpr$a(aarrggbb) {
    const a = parseInt(aarrggbb.slice(0, 2), 16);
    return a;
}
export function inner$roleExpr$h(aarrggbb) {
    const h = aarrggbb.slice(2);
    return h;
}
export function inner$roleExpr$d(aarrggbb, rh) {
    const h = aarrggbb.slice(2);
    const d = dist(h, rh);
    return d;
}
export function inner$roleExpr$d$$step(h, rh) {
    const d = dist(h, rh);
    return d;
}
export function inner$roleExpr$da(aarrggbb, ra) {
    const a = parseInt(aarrggbb.slice(0, 2), 16);
    const da = Math.abs(a - ra);
    return da;
}
export function inner$roleExpr$da$$step(a, ra) {
    const da = Math.abs(a - ra);
    return da;
}
export function inner$roleExpr$alpha(aarrggbb) {
    const a = parseInt(aarrggbb.slice(0, 2), 16);
    const alpha = a === 255 ? '' : `.withValues(alpha: ${(a / 255).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0')})`;
    return alpha;
}
export function inner$roleExpr$alpha$$step(a) {
    const alpha = a === 255 ? '' : `.withValues(alpha: ${(a / 255).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0')})`;
    return alpha;
}
export function inner$ctxInScope$lines(code, i) {
    const lines = code.slice(0, i).split('\n');
    return lines;
}
export function inner$ctxInScope$k(code, i) {
    const lines = code.slice(0, i).split('\n');
    let k = lines.length - 1;
    return k;
}
export function inner$ctxInScope$k$$step(lines) {
    let k = lines.length - 1;
    return k;
}
export function inner$ctxInScope$body(ln) {
    const body = ln.replace(/'[^']*'|"[^"]*"/g, '').replace(/\/\/.*$/, '');
    return body;
}
export function inner$constScope$k(i) {
    let k = i - 1;
    return k;
}
export function inner$constScope$pre(code, k) {
    const pre = code.slice(Math.max(0, k - 40), k);
    return pre;
}
export function inner$constScope$cm(code, k) {
    const pre = code.slice(Math.max(0, k - 40), k);
    const cm = pre.match(/const\s+(\w+(<[^>]*>)?\s*)?$/) || pre.match(/const\s*$/);
    return cm;
}
export function inner$constScope$cm$$step(pre) {
    const cm = pre.match(/const\s+(\w+(<[^>]*>)?\s*)?$/) || pre.match(/const\s*$/);
    return cm;
}
export function inner$constScope$at(code, k) {
    const pre = code.slice(Math.max(0, k - 40), k);
    const cm = pre.match(/const\s+(\w+(<[^>]*>)?\s*)?$/) || pre.match(/const\s*$/);
    const at = k - (pre.length - cm.index);
    return at;
}
export function inner$constScope$at$$step(k, pre, cm) {
    const at = k - (pre.length - cm.index);
    return at;
}
export function inner$constScope$line(code, i) {
    const line = code.slice(code.lastIndexOf('\n', i) + 1, i);
    return line;
}
export function inner$wear$cols(seed, rel) {
    const cols = seed.files[rel] ? [...seed.files[rel]] : [];
    return cols;
}
export function inner$wear$idx$i(cols, hex) {
    let i = cols.indexOf(hex);
    return i;
}
export function inner$wear$inComment$ls(code, i) {
    const ls = code.lastIndexOf('\n', i) + 1;
    return ls;
}
export function inner$wear$inComment$line(code, i) {
    const ls = code.lastIndexOf('\n', i) + 1;
    const line = code.slice(ls, i);
    return line;
}
export function inner$wear$inComment$line$$step(code, i, ls) {
    const line = code.slice(ls, i);
    return line;
}
export function inner$wear$inComment$bo(code, i) {
    const bo = code.lastIndexOf('/*', i);
    return bo;
}
export function inner$wear$inComment$bc(code, i) {
    const bc = code.lastIndexOf('*/', i);
    return bc;
}
export function inner$wear$replace$h(hex, named, FLUTTER_COLORS) {
    const h = hex ? hex.toUpperCase() : FLUTTER_COLORS[named];
    return h;
}
export function inner$wear$replace$role(R, hexByName, src0, atom) {
    const role = src0 === 'DsAtomColors' ? (hexByName[atom] ? roleExpr(R, hexByName[atom]) : null) : (BS_NAME[atom] ? `(l) => l.${BS_NAME[atom]}` : null);
    return role;
}
export function inner$wear$re(name) {
    const re = new RegExp(`(?<!dsWear\\(context, )(?<!0 = )DsAtomColors\\.${name}\\b`, 'g');
    return re;
}
export function inner$wear$role(k) {
    const role = BS_NAME[k] ? `(l) => l.${BS_NAME[k]}` : null;
    return role;
}
export function inner$wear$re_L108(name) {
    const re = new RegExp(`(?<![\\w.])${name}\\b(?![\\w(])`, 'g');
    return re;
}
export function inner$wear$m(code, at) {
    const m = code.slice(at).match(/^const\s+/);
    return m;
}
export function inner$roleExpr$best$$after_loop(R, aarrggbb) {
    const a = parseInt(aarrggbb.slice(0, 2), 16);
    const h = aarrggbb.slice(2);
    let best = null;
    for (const [role, [ra, rh]] of Object.entries(R)) {
        const d = dist(h, rh), da = Math.abs(a - ra);
        if (!best || d < best.d || (d === best.d && da < best.da))
            best = { role, d, da };
    }
    return best;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$hexOf$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$hexOf$r: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$hexOf$r$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hexOf$g: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$hexOf$g$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hexOf$b: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$hexOf$b$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hexOf$a: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$hexOf$a$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$dist$A: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$dist$B: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$roleExpr$a: [{"name":"aarrggbb","d":{"t":"any"},"opt":false}],
  inner$roleExpr$h: [{"name":"aarrggbb","d":{"t":"any"},"opt":false}],
  inner$roleExpr$d: [{"name":"aarrggbb","d":{"t":"any"},"opt":false},{"name":"rh","d":{"t":"any"},"opt":false}],
  inner$roleExpr$d$$step: [{"name":"h","d":{"t":"any"},"opt":false},{"name":"rh","d":{"t":"any"},"opt":false}],
  inner$roleExpr$da: [{"name":"aarrggbb","d":{"t":"any"},"opt":false},{"name":"ra","d":{"t":"num"},"opt":false}],
  inner$roleExpr$da$$step: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"ra","d":{"t":"num"},"opt":false}],
  inner$roleExpr$alpha: [{"name":"aarrggbb","d":{"t":"any"},"opt":false}],
  inner$roleExpr$alpha$$step: [{"name":"a","d":{"t":"num"},"opt":false}],
  inner$ctxInScope$lines: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$ctxInScope$k: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$ctxInScope$k$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$ctxInScope$body: [{"name":"ln","d":{"t":"any"},"opt":false}],
  inner$constScope$k: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$constScope$pre: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$constScope$cm: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$constScope$cm$$step: [{"name":"pre","d":{"t":"any"},"opt":false}],
  inner$constScope$at: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$constScope$at$$step: [{"name":"k","d":{"t":"num"},"opt":false},{"name":"pre","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$constScope$line: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$wear$cols: [{"name":"seed","d":{"t":"any"},"opt":false},{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$wear$idx$i: [{"name":"cols","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$wear$inComment$ls: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$wear$inComment$line: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$wear$inComment$line$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$wear$inComment$bo: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$wear$inComment$bc: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$wear$replace$h: [{"name":"hex","d":{"t":"any"},"opt":false},{"name":"named","d":{"t":"any"},"opt":false},{"name":"FLUTTER_COLORS","d":{"t":"obj","p":[["white",{"t":"str"},false],["white70",{"t":"str"},false],["white60",{"t":"str"},false],["white54",{"t":"str"},false],["white38",{"t":"str"},false],["white30",{"t":"str"},false],["white24",{"t":"str"},false],["white12",{"t":"str"},false],["white10",{"t":"str"},false],["black",{"t":"str"},false],["black87",{"t":"str"},false],["black54",{"t":"str"},false],["black45",{"t":"str"},false],["black38",{"t":"str"},false],["black26",{"t":"str"},false],["black12",{"t":"str"},false],["redAccent",{"t":"str"},false],["red",{"t":"str"},false],["grey",{"t":"str"},false]]},"opt":false}],
  inner$wear$replace$role: [{"name":"R","d":{"t":"obj","p":[["bg",{"t":"arr","of":{"t":"any"}},false],["card",{"t":"arr","of":{"t":"any"}},false],["cardAlt",{"t":"arr","of":{"t":"any"}},false],["ink",{"t":"arr","of":{"t":"any"}},false],["muted",{"t":"arr","of":{"t":"any"}},false],["faint",{"t":"arr","of":{"t":"any"}},false],["line",{"t":"arr","of":{"t":"any"}},false],["track",{"t":"arr","of":{"t":"any"}},false],["accent",{"t":"arr","of":{"t":"any"}},false],["accentDark",{"t":"arr","of":{"t":"any"}},false],["accentSoft",{"t":"arr","of":{"t":"any"}},false],["success",{"t":"arr","of":{"t":"any"}},false],["successSoft",{"t":"arr","of":{"t":"any"}},false],["warn",{"t":"arr","of":{"t":"any"}},false],["danger",{"t":"arr","of":{"t":"any"}},false],["dangerSoft",{"t":"arr","of":{"t":"any"}},false],["dangerLine",{"t":"arr","of":{"t":"any"}},false],["chipBg",{"t":"arr","of":{"t":"any"}},false],["onAccent",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"hexByName","d":{"t":"obj","n":"hexByName","p":[]},"opt":false},{"name":"src0","d":{"t":"any"},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false}],
  inner$wear$re: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$wear$role: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$wear$re_L108: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$wear$m: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$roleExpr$best$$after_loop: [{"name":"R","d":{"t":"any"},"opt":false},{"name":"aarrggbb","d":{"t":"any"},"opt":false}],
};
