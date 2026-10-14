// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/atom-sig.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const S = { value: /^(value|val|amount|total|count|num)$/, label: /^(label|title|caption|name|text)$/, tap: /^(onTap|onPressed)$/, labels: /^(labels|cols|columns|headers)$/, fraction: /^(fraction|pct|percent|progress)$/, selected: /^(selected|activeIndex|index)$/, onSelect: /^(onSelect|onChanged)$/ };
const NUM_T = /^(int|double|num)$/;
const FAMILIES = new Set(['action', 'card', 'chat', 'composite', 'dataviz', 'feedback', 'header', 'input', 'list', 'media', 'motion', 'nav', 'selection', 'spatial', 'status', 'temporal', 'text']);
const bodyOf = (src, i) => { let j = src.indexOf('(', i); if (j < 0)
    return ''; let d = 0, k = j; for (; k < src.length; k++) {
    if (src[k] === '(')
        d++;
    else if (src[k] === ')') {
        d--;
        if (!d)
            break;
    }
} return src.slice(j + 1, k); };
const stripC = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
function slotStyle(code, sock) {
    const re = /\bText\(/g;
    let m;
    while ((m = re.exec(code))) {
        const args = bodyOf(code, m.index + 4);
        const first = args.split(',')[0].trim();
        if (!new RegExp(`(^|[^\\w.])(widget\\.)?${sock}\\b`).test(first) && !new RegExp(`\\$\\{?${sock}\\b`).test(first))
            continue;
        const fs = args.match(/fontSize:\s*([0-9.]+)/), fw = args.match(/FontWeight\.(w(\d{3})|bold|normal)/);
        return { fs: fs ? +fs[1] : 14, fw: fw ? (fw[2] ? +fw[2] : fw[1] === 'bold' ? 700 : 400) : 400, inBtn: false };
    }
    return null;
}
const classBody = (src, cls) => { const m = new RegExp(`\\bclass\\s+${cls}\\b[^{]*\\{`).exec(src); if (!m)
    return src; let d = 0, k = m.index + m[0].length - 1; for (; k < src.length; k++) {
    if (src[k] === '{')
        d++;
    else if (src[k] === '}') {
        d--;
        if (!d)
            break;
    }
} return src.slice(m.index, k + 1); };
const isNumSock = ([n, t]) => NUM_T.test(t.replace(/\?$/, '')) || (t.replace(/\?$/, '') === 'String' && S.value.test(n));
const isTxtSock = ([n, t]) => t.replace(/\?$/, '') === 'String' && !S.value.test(n);
export function inner$bodyOf$j(src, i) {
    let j = src.indexOf('(', i);
    return j;
}
export function inner$slotStyle$args(code, m) {
    const args = bodyOf(code, m.index + 4);
    return args;
}
export function inner$slotStyle$first(code, m) {
    const args = bodyOf(code, m.index + 4);
    const first = args.split(',')[0].trim();
    return first;
}
export function inner$slotStyle$first$$step(args) {
    const first = args.split(',')[0].trim();
    return first;
}
export function inner$slotStyle$fs(code, m) {
    const args = bodyOf(code, m.index + 4);
    const fs = args.match(/fontSize:\s*([0-9.]+)/);
    return fs;
}
export function inner$slotStyle$fs$$step(args) {
    const fs = args.match(/fontSize:\s*([0-9.]+)/);
    return fs;
}
export function inner$slotStyle$fw(code, m) {
    const args = bodyOf(code, m.index + 4);
    const fw = args.match(/FontWeight\.(w(\d{3})|bold|normal)/);
    return fw;
}
export function inner$slotStyle$fw$$step(args) {
    const fw = args.match(/FontWeight\.(w(\d{3})|bold|normal)/);
    return fw;
}
export function inner$classBody$m(src, cls) {
    const m = new RegExp(`\\bclass\\s+${cls}\\b[^{]*\\{`).exec(src);
    return m;
}
export function inner$classBody$k(src, cls) {
    const m = new RegExp(`\\bclass\\s+${cls}\\b[^{]*\\{`).exec(src);
    let k = m.index + m[0].length - 1;
    return k;
}
export function inner$classBody$k$$step(m) {
    let k = m.index + m[0].length - 1;
    return k;
}
export function inner$sigOfDart$code(w, src) {
    const code = stripC(classBody(src, w.cls));
    return code;
}
export function inner$sigOfDart$types(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    return types;
}
export function inner$sigOfDart$drawn(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    return drawn;
}
export function inner$sigOfDart$drawn$$step(code, types) {
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    return drawn;
}
export function inner$sigOfDart$slots(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    return slots;
}
export function inner$sigOfDart$slots$$step(types, drawn) {
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    return slots;
}
export function inner$sigOfDart$fieldDemo(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const fieldDemo = slots.map((x) => (isNumSock(x) ? '0' : 'Label'));
    return fieldDemo;
}
export function inner$sigOfDart$fieldDemo$$step(slots) {
    const fieldDemo = slots.map((x) => (isNumSock(x) ? '0' : 'Label'));
    return fieldDemo;
}
export function inner$sigOfDart$sigSlots(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    return sigSlots;
}
export function inner$sigOfDart$sigSlots$$step(drawn, slots) {
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    return sigSlots;
}
export function inner$sigOfDart$numFs(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    const numFs = slots.map((x, i) => (isNumSock(x) ? sigSlots[i].fs : 0));
    return numFs;
}
export function inner$sigOfDart$numFs$$step(slots, sigSlots) {
    const numFs = slots.map((x, i) => (isNumSock(x) ? sigSlots[i].fs : 0));
    return numFs;
}
export function inner$sigOfDart$txtFs(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    const txtFs = slots.map((x, i) => (isNumSock(x) ? 0 : sigSlots[i].fs));
    return txtFs;
}
export function inner$sigOfDart$txtFs$$step(slots, sigSlots) {
    const txtFs = slots.map((x, i) => (isNumSock(x) ? 0 : sigSlots[i].fs));
    return txtFs;
}
export function inner$sigOfDart$numEmph(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    const numFs = slots.map((x, i) => (isNumSock(x) ? sigSlots[i].fs : 0));
    const txtFs = slots.map((x, i) => (isNumSock(x) ? 0 : sigSlots[i].fs));
    const numEmph = Math.max(0, ...numFs) && Math.max(0, ...txtFs) ? +(Math.max(...numFs) / Math.max(...txtFs)).toFixed(2) : 0;
    return numEmph;
}
export function inner$sigOfDart$numEmph$$step(numFs, txtFs) {
    const numEmph = Math.max(0, ...numFs) && Math.max(0, ...txtFs) ? +(Math.max(...numFs) / Math.max(...txtFs)).toFixed(2) : 0;
    return numEmph;
}
export function inner$sigOfDart$bi(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    return bi;
}
export function inner$sigOfDart$bi$$step(code) {
    const bi = code.search(/Widget build\(BuildContext context\)/);
    return bi;
}
export function inner$sigOfDart$build(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    return build;
}
export function inner$sigOfDart$build$$step(code, bi) {
    const build = bi >= 0 ? code.slice(bi) : code;
    return build;
}
export function inner$sigOfDart$ret(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    return ret;
}
export function inner$sigOfDart$ret$$step(build) {
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    return ret;
}
export function inner$sigOfDart$rootCls(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootCls = ret ? ret[1] : null;
    return rootCls;
}
export function inner$sigOfDart$rootCls$$step(ret) {
    const rootCls = ret ? ret[1] : null;
    return rootCls;
}
export function inner$sigOfDart$rootArgs(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootArgs = ret ? bodyOf(build, build.indexOf(ret[0]) + ret[0].length - 1) : '';
    return rootArgs;
}
export function inner$sigOfDart$rootArgs$$step(build, ret) {
    const rootArgs = ret ? bodyOf(build, build.indexOf(ret[0]) + ret[0].length - 1) : '';
    return rootArgs;
}
export function inner$sigOfDart$top(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootArgs = ret ? bodyOf(build, build.indexOf(ret[0]) + ret[0].length - 1) : '';
    const top = rootArgs.replace(/\((?:[^()]|\([^()]*\))*\)/g, '()');
    return top;
}
export function inner$sigOfDart$top$$step(rootArgs) {
    const top = rootArgs.replace(/\((?:[^()]|\([^()]*\))*\)/g, '()');
    return top;
}
export function inner$sigOfDart$decorated(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootCls = ret ? ret[1] : null;
    const rootArgs = ret ? bodyOf(build, build.indexOf(ret[0]) + ret[0].length - 1) : '';
    const top = rootArgs.replace(/\((?:[^()]|\([^()]*\))*\)/g, '()');
    const decorated = /\bdecoration:/.test(top) || /^(Card|DecoratedBox|Material)$/.test(rootCls || '') || (/^Container$/.test(rootCls || '') && /\bcolor:/.test(top));
    return decorated;
}
export function inner$sigOfDart$decorated$$step(rootCls, top) {
    const decorated = /\bdecoration:/.test(top) || /^(Card|DecoratedBox|Material)$/.test(rootCls || '') || (/^Container$/.test(rootCls || '') && /\bcolor:/.test(top));
    return decorated;
}
export function inner$sigOfDart$btnRoot(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootCls = ret ? ret[1] : null;
    const btnRoot = /Button$|^InkWell$|^GestureDetector$/.test(rootCls || '');
    return btnRoot;
}
export function inner$sigOfDart$btnRoot$$step(rootCls) {
    const btnRoot = /Button$|^InkWell$|^GestureDetector$/.test(rootCls || '');
    return btnRoot;
}
export function inner$sigOfDart$interactive(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootCls = ret ? ret[1] : null;
    const btnRoot = /Button$|^InkWell$|^GestureDetector$/.test(rootCls || '');
    const interactive = btnRoot || types.some(([n]) => S.tap.test(n));
    return interactive;
}
export function inner$sigOfDart$interactive$$step(types, btnRoot) {
    const interactive = btnRoot || types.some(([n]) => S.tap.test(n));
    return interactive;
}
export function inner$sigOfDart$dirM(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const dirM = build.match(/\b(Row|Column)\(/);
    return dirM;
}
export function inner$sigOfDart$dirM$$step(build) {
    const dirM = build.match(/\b(Row|Column)\(/);
    return dirM;
}
export function inner$sigOfDart$dir(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const dirM = build.match(/\b(Row|Column)\(/);
    const dir = dirM ? (dirM[1] === 'Row' ? 'row' : 'column') : 'block';
    return dir;
}
export function inner$sigOfDart$dir$$step(dirM) {
    const dir = dirM ? (dirM[1] === 'Row' ? 'row' : 'column') : 'block';
    return dir;
}
export function inner$sigOfDart$svg(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const svg = /\b(Icon\(|CustomPaint\(|Icons\.)/.test(build);
    return svg;
}
export function inner$sigOfDart$svg$$step(build) {
    const svg = /\b(Icon\(|CustomPaint\(|Icons\.)/.test(build);
    return svg;
}
export function inner$sigOfDart$control(w, src) {
    const code = stripC(classBody(src, w.cls));
    const control = /\bTextField\(|\bTextFormField\(/.test(code);
    return control;
}
export function inner$sigOfDart$control$$step(code) {
    const control = /\bTextField\(|\bTextFormField\(/.test(code);
    return control;
}
export function inner$sigOfDart$input(w, src) {
    const code = stripC(classBody(src, w.cls));
    const control = /\bTextField\(|\bTextFormField\(/.test(code);
    const input = control ? { ph: /hintText:/.test(code), numPh: /keyboardType:\s*(const\s+)?TextInputType\.number/.test(code), readonly: /readOnly:\s*true/.test(code), datePh: false } : null;
    return input;
}
export function inner$sigOfDart$input$$step(code, control) {
    const input = control ? { ph: /hintText:/.test(code), numPh: /keyboardType:\s*(const\s+)?TextInputType\.number/.test(code), readonly: /readOnly:\s*true/.test(code), datePh: false } : null;
    return input;
}
export function inner$sigOfDart$actions(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const actions = types.filter(([, t]) => /VoidCallback|void Function\(\)/.test(t)).length;
    return actions;
}
export function inner$sigOfDart$actions$$step(types) {
    const actions = types.filter(([, t]) => /VoidCallback|void Function\(\)/.test(t)).length;
    return actions;
}
export function inner$sigOfDart$child(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const child = types.some(([, t]) => /^(Widget|List<Widget>)\??$/.test(t));
    return child;
}
export function inner$sigOfDart$child$$step(types) {
    const child = types.some(([, t]) => /^(Widget|List<Widget>)\??$/.test(t));
    return child;
}
export function inner$sigOfDart$bare(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const bare = types.some(([n, t]) => n === 'bare' && /^bool/.test(t));
    return bare;
}
export function inner$sigOfDart$bare$$step(types) {
    const bare = types.some(([n, t]) => n === 'bare' && /^bool/.test(t));
    return bare;
}
export function inner$sigOfDart$lists(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const lists = types.filter(([n, t]) => /^List</.test(t) && !/^List<(double|num|int|Widget)>/.test(t) && !S.labels.test(n));
    return lists;
}
export function inner$sigOfDart$lists$$step(types) {
    const lists = types.filter(([n, t]) => /^List</.test(t) && !/^List<(double|num|int|Widget)>/.test(t) && !S.labels.test(n));
    return lists;
}
export function inner$sigOfDart$items(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const lists = types.filter(([n, t]) => /^List</.test(t) && !/^List<(double|num|int|Widget)>/.test(t) && !S.labels.test(n));
    const items = lists.length ? { slots: lists.some(([, t]) => /^List<List</.test(t)) ? 2 : 1, demo: 0, selectable: types.some(([n]) => S.onSelect.test(n)), selected: types.some(([n]) => S.selected.test(n)), cells: lists.some(([, t]) => /^List<List</.test(t)) ? 1 : 0, variants: null } : null;
    return items;
}
export function inner$sigOfDart$items$$step(types, lists) {
    const items = lists.length ? { slots: lists.some(([, t]) => /^List<List</.test(t)) ? 2 : 1, demo: 0, selectable: types.some(([n]) => S.onSelect.test(n)), selected: types.some(([n]) => S.selected.test(n)), cells: lists.some(([, t]) => /^List<List</.test(t)) ? 1 : 0, variants: null } : null;
    return items;
}
export function inner$sigOfDart$columns(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const columns = types.filter(([n, t]) => S.labels.test(n) && /^List<String>/.test(t)).length;
    return columns;
}
export function inner$sigOfDart$columns$$step(types) {
    const columns = types.filter(([n, t]) => S.labels.test(n) && /^List<String>/.test(t)).length;
    return columns;
}
export function inner$sigOfDart$values(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const values = types.filter(([n, t]) => /^List<(double|num|int)>/.test(t) || S.fraction.test(n)).length;
    return values;
}
export function inner$sigOfDart$values$$step(types) {
    const values = types.filter(([n, t]) => /^List<(double|num|int)>/.test(t) || S.fraction.test(n)).length;
    return values;
}
export function inner$sigOfDart$famDir(w) {
    const famDir = w.file.split('/').slice(0, -1).find((d) => FAMILIES.has(d)) || null;
    return famDir;
}
export function inner$sigOfDart$paint(w, src) {
    const code = stripC(classBody(src, w.cls));
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const paint = /\bCustomPaint\(/.test(build);
    return paint;
}
export function inner$sigOfDart$paint$$step(build) {
    const paint = /\bCustomPaint\(/.test(build);
    return paint;
}
export function inner$sigOfDart$toneSock(w) {
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const toneSock = types.some(([n, t]) => /^(tone|severity|level|status|state)$/.test(n) && /^(int|bool)/.test(t));
    return toneSock;
}
export function inner$sigOfDart$toneSock$$step(types) {
    const toneSock = types.some(([n, t]) => /^(tone|severity|level|status|state)$/.test(n) && /^(int|bool)/.test(t));
    return toneSock;
}
export function inner$sigOfDart$heading(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    const heading = sigSlots.some((x) => x.fs >= 15 && x.fw >= 600);
    return heading;
}
export function inner$sigOfDart$heading$$step(sigSlots) {
    const heading = sigSlots.some((x) => x.fs >= 15 && x.fw >= 600);
    return heading;
}
export function inner$sigOfDart$famForm(w, src) {
    const code = stripC(classBody(src, w.cls));
    const types = [...w.types].filter(([n]) => !/^(key)$/.test(n));
    const drawn = new Map(types.map(([n]) => [n, slotStyle(code, n)]));
    const slots = types.filter((x) => (isNumSock(x) || isTxtSock(x)) && (drawn.get(x[0]) || (x[1].replace(/\?$/, '') === 'String' && (S.value.test(x[0]) || S.label.test(x[0]) || /^(sub|subtitle|desc|body|note|message)$/.test(x[0])))));
    const sigSlots = slots.map(([n]) => drawn.get(n) || { fs: 14, fw: 400, inBtn: false, defaulted: true });
    const bi = code.search(/Widget build\(BuildContext context\)/);
    const build = bi >= 0 ? code.slice(bi) : code;
    const ret = build.match(/return\s+(?:const\s+)?([A-Z]\w*)\(/) || build.match(/=>\s*(?:const\s+)?([A-Z]\w*)\(/);
    const rootCls = ret ? ret[1] : null;
    const rootArgs = ret ? bodyOf(build, build.indexOf(ret[0]) + ret[0].length - 1) : '';
    const top = rootArgs.replace(/\((?:[^()]|\([^()]*\))*\)/g, '()');
    const decorated = /\bdecoration:/.test(top) || /^(Card|DecoratedBox|Material)$/.test(rootCls || '') || (/^Container$/.test(rootCls || '') && /\bcolor:/.test(top));
    const btnRoot = /Button$|^InkWell$|^GestureDetector$/.test(rootCls || '');
    const interactive = btnRoot || types.some(([n]) => S.tap.test(n));
    const svg = /\b(Icon\(|CustomPaint\(|Icons\.)/.test(build);
    const control = /\bTextField\(|\bTextFormField\(/.test(code);
    const child = types.some(([, t]) => /^(Widget|List<Widget>)\??$/.test(t));
    const lists = types.filter(([n, t]) => /^List</.test(t) && !/^List<(double|num|int|Widget)>/.test(t) && !S.labels.test(n));
    const items = lists.length ? { slots: lists.some(([, t]) => /^List<List</.test(t)) ? 2 : 1, demo: 0, selectable: types.some(([n]) => S.onSelect.test(n)), selected: types.some(([n]) => S.selected.test(n)), cells: lists.some(([, t]) => /^List<List</.test(t)) ? 1 : 0, variants: null } : null;
    const columns = types.filter(([n, t]) => S.labels.test(n) && /^List<String>/.test(t)).length;
    const values = types.filter(([n, t]) => /^List<(double|num|int)>/.test(t) || S.fraction.test(n)).length;
    const paint = /\bCustomPaint\(/.test(build);
    const toneSock = types.some(([n, t]) => /^(tone|severity|level|status|state)$/.test(n) && /^(int|bool)/.test(t));
    const heading = sigSlots.some((x) => x.fs >= 15 && x.fw >= 600);
    const famForm = control ? 'input' : (btnRoot || (interactive && slots.length <= 1 && !child && !items)) ? 'action' : (values >= 1 || paint) ? 'dataviz' : items ? (columns ? 'spatial' : items.selectable ? 'selection' : 'list') : toneSock ? (slots.length >= 2 ? 'feedback' : 'status') : child ? (heading ? 'header' : 'card') : (interactive && svg) ? 'nav' : decorated ? 'card' : 'text';
    return famForm;
}
export function inner$sigOfDart$famForm$$step(slots, decorated, btnRoot, interactive, svg, control, child, items, columns, values, paint, toneSock, heading) {
    const famForm = control ? 'input' : (btnRoot || (interactive && slots.length <= 1 && !child && !items)) ? 'action' : (values >= 1 || paint) ? 'dataviz' : items ? (columns ? 'spatial' : items.selectable ? 'selection' : 'list') : toneSock ? (slots.length >= 2 ? 'feedback' : 'status') : child ? (heading ? 'header' : 'card') : (interactive && svg) ? 'nav' : decorated ? 'card' : 'text';
    return famForm;
}
export function inner$bodyOf$d$$after_loop(src, i) {
    let j = src.indexOf('(', i);
    let d = 0;
    let k = j;
    for (; k < src.length; k++) {
        if (src[k] === '(')
            d++;
        else if (src[k] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$bodyOf$k$$after_loop(src, i) {
    let j = src.indexOf('(', i);
    let d = 0;
    let k = j;
    for (; k < src.length; k++) {
        if (src[k] === '(')
            d++;
        else if (src[k] === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return k;
}
export function inner$classBody$d$$after_loop(src, cls) {
    const m = new RegExp(`\\bclass\\s+${cls}\\b[^{]*\\{`).exec(src);
    let d = 0;
    let k = m.index + m[0].length - 1;
    for (; k < src.length; k++) {
        if (src[k] === '{')
            d++;
        else if (src[k] === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$classBody$k$$after_loop(src, cls) {
    const m = new RegExp(`\\bclass\\s+${cls}\\b[^{]*\\{`).exec(src);
    let d = 0;
    let k = m.index + m[0].length - 1;
    for (; k < src.length; k++) {
        if (src[k] === '{')
            d++;
        else if (src[k] === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return k;
}

export const SIGS = {
  inner$bodyOf$j: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$slotStyle$args: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$slotStyle$first: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$slotStyle$first$$step: [{"name":"args","d":{"t":"any"},"opt":false}],
  inner$slotStyle$fs: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$slotStyle$fs$$step: [{"name":"args","d":{"t":"any"},"opt":false}],
  inner$slotStyle$fw: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$slotStyle$fw$$step: [{"name":"args","d":{"t":"any"},"opt":false}],
  inner$classBody$m: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$classBody$k: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$classBody$k$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$sigOfDart$code: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$types: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$drawn: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$drawn$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$slots: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$slots$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"drawn","d":{"t":"map","k":{"t":"any"},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false]]}]}},"opt":false}],
  inner$sigOfDart$fieldDemo: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$fieldDemo$$step: [{"name":"slots","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$sigSlots: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$sigSlots$$step: [{"name":"drawn","d":{"t":"map","k":{"t":"any"},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false]]}]}},"opt":false},{"name":"slots","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$numFs: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$numFs$$step: [{"name":"slots","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sigSlots","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false]]},{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false],["defaulted",{"t":"bool"},false]]}]}},"opt":false}],
  inner$sigOfDart$txtFs: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$txtFs$$step: [{"name":"slots","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sigSlots","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false]]},{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false],["defaulted",{"t":"bool"},false]]}]}},"opt":false}],
  inner$sigOfDart$numEmph: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$numEmph$$step: [{"name":"numFs","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"txtFs","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$sigOfDart$bi: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$bi$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$build: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$build$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"bi","d":{"t":"num"},"opt":false}],
  inner$sigOfDart$ret: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$ret$$step: [{"name":"build","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$rootCls: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$rootCls$$step: [{"name":"ret","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$rootArgs: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$rootArgs$$step: [{"name":"build","d":{"t":"any"},"opt":false},{"name":"ret","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$top: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$top$$step: [{"name":"rootArgs","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$decorated: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$decorated$$step: [{"name":"rootCls","d":{"t":"any"},"opt":false},{"name":"top","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$btnRoot: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$btnRoot$$step: [{"name":"rootCls","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$interactive: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$interactive$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"btnRoot","d":{"t":"bool"},"opt":false}],
  inner$sigOfDart$dirM: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$dirM$$step: [{"name":"build","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$dir: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$dir$$step: [{"name":"dirM","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$svg: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$svg$$step: [{"name":"build","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$control: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$control$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$input: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$input$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"control","d":{"t":"bool"},"opt":false}],
  inner$sigOfDart$actions: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$actions$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$child: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$child$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$bare: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$bare$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$lists: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$lists$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$items: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$items$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"lists","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$columns: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$columns$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$values: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$values$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$famDir: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$paint: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$paint$$step: [{"name":"build","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$toneSock: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$toneSock$$step: [{"name":"types","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sigOfDart$heading: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$heading$$step: [{"name":"sigSlots","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false]]},{"t":"obj","p":[["fs",{"t":"num"},false],["fw",{"t":"num"},false],["inBtn",{"t":"bool"},false],["defaulted",{"t":"bool"},false]]}]}},"opt":false}],
  inner$sigOfDart$famForm: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sigOfDart$famForm$$step: [{"name":"slots","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"decorated","d":{"t":"bool"},"opt":false},{"name":"btnRoot","d":{"t":"bool"},"opt":false},{"name":"interactive","d":{"t":"bool"},"opt":false},{"name":"svg","d":{"t":"bool"},"opt":false},{"name":"control","d":{"t":"bool"},"opt":false},{"name":"child","d":{"t":"bool"},"opt":false},{"name":"items","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["slots",{"t":"num"},false],["demo",{"t":"num"},false],["selectable",{"t":"bool"},false],["selected",{"t":"bool"},false],["cells",{"t":"num"},false],["variants",{"t":"null"},false]]}]},"opt":false},{"name":"columns","d":{"t":"num"},"opt":false},{"name":"values","d":{"t":"num"},"opt":false},{"name":"paint","d":{"t":"bool"},"opt":false},{"name":"toneSock","d":{"t":"bool"},"opt":false},{"name":"heading","d":{"t":"bool"},"opt":false}],
  inner$bodyOf$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$bodyOf$k$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$classBody$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$classBody$k$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
};
