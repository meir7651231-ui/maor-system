// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/carve/carve-land.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const usedImports = (imports, body) => (imports || []).filter(im => {
    const pfx = /\bas\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/.exec(im);
    if (pfx)
        return new RegExp('\\b' + pfx[1] + '\\.').test(body);
    return true;
});
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/^_+/, '').toLowerCase();
const elemLit = (t, samples = {}) => {
    const b = t.replace(/\?$/, '');
    const core = { String: "'a'", int: '1', double: '1.5', num: '1', bool: 'true' }[b];
    if (core)
        return core;
    const ex = samples[b];
    return (ex && ex.length) ? ex[0] : null;
};
function parseParams(fnSrc) {
    // ⚠️ בלי הסרת-הערות הרגקס תופס סוגריים מתוך dartdoc (`/// ... (…)`) ולא את
    // החתימה — והפונקציה נדחתה «אין-קלט-סל» בזמן שהפרמטרים שלה פרימיטיביים.
    const clean = fnSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // חתימה גנרית (`famEmoji<T>(T f)`): בלי לאפשר `<…>` בין השם לסוגריים הרגקס
    // אינו מוצא את החתימה **וממשיך לגוף** — ותופס את הפרמטרים של קריאה אקראית.
    const m = clean.match(/\b[\w$]+\s*(?:<[^>()]*>)?\s*\(([^)]*)\)/);
    if (!m)
        return null;
    const raw = m[1].trim();
    if (!raw)
        return [];
    if (/[{[]/.test(raw))
        return null;
    return raw.split(',').map(p => { const parts = p.trim().split(/\s+/); return { type: parts.slice(0, -1).join(' '), name: parts.at(-1) }; });
}
const heToks = (s) => [...String(s || '').matchAll(/[\u0590-\u05FF]{2,}/g)].map((m) => m[0]);
const seedKey = (rel) => rel.replace(/\.dart$/, '').replace(/\//g, '__');
export function inner$usedImports$filter$pfx(im) {
    const pfx = /\bas\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/.exec(im);
    return pfx;
}
export function inner$elemLit$b(t) {
    const b = t.replace(/\?$/, '');
    return b;
}
export function inner$compat$nul(pt) {
    const nul = pt.endsWith('?');
    return nul;
}
export function inner$compat$base(pt) {
    const base = pt.replace(/\?$/, '');
    return base;
}
export function inner$compat$out(pt, ex) {
    const base = pt.replace(/\?$/, '');
    const out = ex.map(d => ({ d, t: base }));
    return out;
}
export function inner$compat$out$$step(base, ex) {
    const out = ex.map(d => ({ d, t: base }));
    return out;
}
export function inner$compat$mL(pt) {
    const base = pt.replace(/\?$/, '');
    const mL = base.match(/^(List|Set|Iterable)<(.+)>$/);
    return mL;
}
export function inner$compat$mL$$step(base) {
    const mL = base.match(/^(List|Set|Iterable)<(.+)>$/);
    return mL;
}
export function inner$compat$el(pt, samples) {
    const base = pt.replace(/\?$/, '');
    const mL = base.match(/^(List|Set|Iterable)<(.+)>$/);
    const el = elemLit(mL[2], samples);
    return el;
}
export function inner$compat$el$$step(samples, mL) {
    const el = elemLit(mL[2], samples);
    return el;
}
export function inner$compat$c(pt) {
    const base = pt.replace(/\?$/, '');
    const mL = base.match(/^(List|Set|Iterable)<(.+)>$/);
    const c = mL[1] === 'List' ? '[]' : '{}';
    return c;
}
export function inner$compat$c$$step(mL) {
    const c = mL[1] === 'List' ? '[]' : '{}';
    return c;
}
export function inner$compat$out_L84(pt) {
    const base = pt.replace(/\?$/, '');
    const mL = base.match(/^(List|Set|Iterable)<(.+)>$/);
    const c = mL[1] === 'List' ? '[]' : '{}';
    const out = [{ d: `const <${mL[2]}>${c}`, t: base }];
    return out;
}
export function inner$compat$out_L84$$step(base, mL, c) {
    const out = [{ d: `const <${mL[2]}>${c}`, t: base }];
    return out;
}
export function inner$compat$kw(pt, samples) {
    const base = pt.replace(/\?$/, '');
    const mL = base.match(/^(List|Set|Iterable)<(.+)>$/);
    const el = elemLit(mL[2], samples);
    const kw = /^const /.test(el) || /^['\d]/.test(el) || el === 'true' ? 'const ' : '';
    return kw;
}
export function inner$compat$kw$$step(el) {
    const kw = /^const /.test(el) || /^['\d]/.test(el) || el === 'true' ? 'const ' : '';
    return kw;
}
export function inner$compat$mM(pt) {
    const base = pt.replace(/\?$/, '');
    const mM = base.match(/^Map<\s*(.+?)\s*,\s*(.+)>$/);
    return mM;
}
export function inner$compat$mM$$step(base) {
    const mM = base.match(/^Map<\s*(.+?)\s*,\s*(.+)>$/);
    return mM;
}
export function inner$compat$k(pt, samples) {
    const base = pt.replace(/\?$/, '');
    const mM = base.match(/^Map<\s*(.+?)\s*,\s*(.+)>$/);
    const k = elemLit(mM[1], samples);
    return k;
}
export function inner$compat$k$$step(samples, mM) {
    const k = elemLit(mM[1], samples);
    return k;
}
export function inner$compat$v(pt, samples) {
    const base = pt.replace(/\?$/, '');
    const mM = base.match(/^Map<\s*(.+?)\s*,\s*(.+)>$/);
    const v = elemLit(mM[2], samples);
    return v;
}
export function inner$compat$v$$step(samples, mM) {
    const v = elemLit(mM[2], samples);
    return v;
}
export function inner$compat$out_L86(pt) {
    const base = pt.replace(/\?$/, '');
    const mM = base.match(/^Map<\s*(.+?)\s*,\s*(.+)>$/);
    const out = [{ d: `const <${mM[1]}, ${mM[2]}>{}`, t: base }];
    return out;
}
export function inner$compat$out_L86$$step(base, mM) {
    const out = [{ d: `const <${mM[1]}, ${mM[2]}>{}`, t: base }];
    return out;
}
export function inner$parseParams$clean(fnSrc) {
    const clean = fnSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    return clean;
}
export function inner$parseParams$m(fnSrc) {
    const clean = fnSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = clean.match(/\b[\w$]+\s*(?:<[^>()]*>)?\s*\(([^)]*)\)/);
    return m;
}
export function inner$parseParams$m$$step(clean) {
    const m = clean.match(/\b[\w$]+\s*(?:<[^>()]*>)?\s*\(([^)]*)\)/);
    return m;
}
export function inner$parseParams$raw(fnSrc) {
    const clean = fnSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = clean.match(/\b[\w$]+\s*(?:<[^>()]*>)?\s*\(([^)]*)\)/);
    const raw = m[1].trim();
    return raw;
}
export function inner$parseParams$raw$$step(m) {
    const raw = m[1].trim();
    return raw;
}
export function inner$parseParams$map$parts(p) {
    const parts = p.trim().split(/\s+/);
    return parts;
}
export function inner$purposeOf$own(r) {
    const own = (r.fnSource.match(/\/\/\/[^\n]*/g) || []).join(' ').match(/[\u0590-\u05FF][\u0590-\u05FF'"\u05F3\u05F4-]*/g) || [];
    return own;
}
export function inner$purposeOf$rel(srcRef) {
    const rel = String(srcRef || '').replace(/^buildsmart\/app_flutter\/lib\//, '').replace(/:\d+(-\d+)?$/, '');
    return rel;
}
export function inner$purposeOf$k(srcRef) {
    const rel = String(srcRef || '').replace(/^buildsmart\/app_flutter\/lib\//, '').replace(/:\d+(-\d+)?$/, '');
    const k = seedKey(rel);
    return k;
}
export function inner$purposeOf$k$$step(rel) {
    const k = seedKey(rel);
    return k;
}
export function inner$purposeOf$re(r) {
    const re = new RegExp('\\b' + String(r.origName || r.name).replace(/^_/, '_?') + '\\s*\\(');
    return re;
}
export function inner$purposeOf$body(r) {
    const body = [...new Set(heToks(r.fnSource.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n')))];
    return body;
}
export function inner$atomFile$pure(r) {
    const imports = (r.imports || []);
    const pure = imports.length
        ? `// טוהר: פונקציית top-level עצמאית; הייבוא היחיד הוא ספריית-שפה טהורה (${imports.join(' ')}).\n`
        : `// טוהר: פונקציית top-level עצמאית, אפס-import (אומת ע"י פותר-המזהים).\n`;
    return pure;
}
export function inner$atomFile$pure$$step(imports) {
    const pure = imports.length
        ? `// טוהר: פונקציית top-level עצמאית; הייבוא היחיד הוא ספריית-שפה טהורה (${imports.join(' ')}).\n`
        : `// טוהר: פונקציית top-level עצמאית, אפס-import (אומת ע"י פותר-המזהים).\n`;
    return pure;
}
export function inner$atomFile$sock(r) {
    const sock = (r.autoSocket && r.socketMeta && r.socketMeta.length)
        ? `// שקעים (חוק-3 — הוזרקו אוטומטית מקריאות-שכן במקור): ${r.socketMeta.map(x => x.name).join(' · ')}.\n`
        : '';
    return sock;
}
export function inner$atomFile$header(r, srcRef) {
    const imports = (r.imports || []);
    const pure = imports.length
        ? `// טוהר: פונקציית top-level עצמאית; הייבוא היחיד הוא ספריית-שפה טהורה (${imports.join(' ')}).\n`
        : `// טוהר: פונקציית top-level עצמאית, אפס-import (אומת ע"י פותר-המזהים).\n`;
    const sock = (r.autoSocket && r.socketMeta && r.socketMeta.length)
        ? `// שקעים (חוק-3 — הוזרקו אוטומטית מקריאות-שכן במקור): ${r.socketMeta.map(x => x.name).join(' · ')}.\n`
        : '';
    const header = `// ⚛️ אטום-Dart (דרגת-חוזה) · ${r.name}\n// מוצא: ${srcRef} (חצב-AST · חוק-4 — התנהגות זהה, לא-משופרת).\n${pure}${sock}${r.inlineTypes.length ? `// טיפוסים מוטבעים (חוק-1, verbatim מהמקור): ${r.inlineTypes.join(', ')}.\n` : ''}`;
    return header;
}
export function inner$atomFile$header$$step(r, srcRef, pure, sock) {
    const header = `// ⚛️ אטום-Dart (דרגת-חוזה) · ${r.name}\n// מוצא: ${srcRef} (חצב-AST · חוק-4 — התנהגות זהה, לא-משופרת).\n${pure}${sock}${r.inlineTypes.length ? `// טיפוסים מוטבעים (חוק-1, verbatim מהמקור): ${r.inlineTypes.join(', ')}.\n` : ''}`;
    return header;
}
export function inner$atomFile$types(r) {
    const types = r.copiedTypes.length ? r.copiedTypes.join('\n\n') + '\n\n' : '';
    return types;
}
export function inner$atomFile$purp(purpose) {
    const purp = purpose && purpose.from !== 'own-doc' && purpose.words.length ? `// ייעוד-עברי (G63 · מקור: ${purpose.from === 'source-screen' ? 'מונחי-מסך-המקור ' + purpose.key : purpose.from === 'caller-screen' ? 'מונחי-מסך-הקורא ' + purpose.key : 'ליטרלים-בגוף'} — כמו purposeFrom באינדקס-התצוגה, אפס-המצאה): ${purpose.words.slice(0, 12).join(' · ')}\n` : '';
    return purp;
}
export function inner$landOne$kb(r) {
    const kb = kebab(r.name);
    return kb;
}
export function inner$landOne$kebabName(r) {
    const kb = kebab(r.name);
    const kebabName = kb.replace(/_/g, '-');
    return kebabName;
}
export function inner$landOne$kebabName$$step(kb) {
    const kebabName = kb.replace(/_/g, '-');
    return kebabName;
}
export function inner$landOne$params(r) {
    const params = ('paramsSimple' in r)
        ? (r.paramsSimple ? r.origParams : null)
        : (r.autoSocket ? r.origParams : parseParams(r.fnSource));
    return params;
}
export function inner$landOne$socketArgs(r) {
    const socketArgs = (r.autoSocket && r.socketMeta) ? r.socketMeta.map(s => `${s.name}: ${s.init}`).join(', ') : '';
    return socketArgs;
}
export function inner$landOne$sockSrc(r) {
    const sockSrc = (r.autoSocket && r.socketDecls && r.socketDecls.length)
        ? '\n// --- מימוש-השקע verbatim מהמקור (לבדיקה בלבד; לא אטום מיובא) ---\n' + r.socketDecls.join('\n\n') + '\n'
        : '';
    return sockSrc;
}
export function inner$landOne$harnessBody(r, callArgs) {
    const sockSrc = (r.autoSocket && r.socketDecls && r.socketDecls.length)
        ? '\n// --- מימוש-השקע verbatim מהמקור (לבדיקה בלבד; לא אטום מיובא) ---\n' + r.socketDecls.join('\n\n') + '\n'
        : '';
    const harnessBody = callArgs.join(' ') + sockSrc;
    return harnessBody;
}
export function inner$landOne$harnessBody$$step(callArgs, sockSrc) {
    const harnessBody = callArgs.join(' ') + sockSrc;
    return harnessBody;
}
export function inner$landOne$harness(r, callArgs) {
    const kb = kebab(r.name);
    const sockSrc = (r.autoSocket && r.socketDecls && r.socketDecls.length)
        ? '\n// --- מימוש-השקע verbatim מהמקור (לבדיקה בלבד; לא אטום מיובא) ---\n' + r.socketDecls.join('\n\n') + '\n'
        : '';
    const harnessBody = callArgs.join(' ') + sockSrc;
    const harness = `import 'dart:convert';\nimport '${kb}.dart';\n${usedImports(r.imports, harnessBody).join('\n')}${sockSrc}\nvoid main(){\n${callArgs.map((a, i) => `  try { print(jsonEncode([${i}, (${r.name}(${a})).toString()])); } catch(e){ print(jsonEncode([${i}, {"__t":1}])); }`).join('\n')}\n}\n`;
    return harness;
}
export function inner$landOne$harness$$step(r, kb, callArgs, sockSrc, harnessBody) {
    const harness = `import 'dart:convert';\nimport '${kb}.dart';\n${usedImports(r.imports, harnessBody).join('\n')}${sockSrc}\nvoid main(){\n${callArgs.map((a, i) => `  try { print(jsonEncode([${i}, (${r.name}(${a})).toString()])); } catch(e){ print(jsonEncode([${i}, {"__t":1}])); }`).join('\n')}\n}\n`;
    return harness;
}
export function inner$landOne$rows(raw) {
    const rows = raw.trim().split('\n').filter(l => l.startsWith('[')).map(l => JSON.parse(l));
    return rows;
}
export function inner$landOne$msg(e) {
    const msg = [e.stderr, e.stdout, e.message].map(x => (x || '').toString().trim()).filter(Boolean).join(' | ');
    return msg;
}
export function inner$landOne$test(r, asserts) {
    const kb = kebab(r.name);
    const sockSrc = (r.autoSocket && r.socketDecls && r.socketDecls.length)
        ? '\n// --- מימוש-השקע verbatim מהמקור (לבדיקה בלבד; לא אטום מיובא) ---\n' + r.socketDecls.join('\n\n') + '\n'
        : '';
    const test = `// בדיקת-Golden · ${r.name} — אפיון-חצב (חוק-4). מייבאת רק את האטום.\nimport '${kb}.dart';\n${usedImports(r.imports, asserts + sockSrc).join('\n')}${sockSrc}\nvoid _eq(String got, String want, String lbl){ if(got!=want) throw StateError('FAIL [\$lbl]: got=\$got want=\$want'); }\nvoid main(){\n  var n=0;\n${asserts}\n  print('✓ ${r.name}: '+n.toString()+' Golden');\n}\n`;
    return test;
}
export function inner$landOne$test$$step(r, kb, sockSrc, asserts) {
    const test = `// בדיקת-Golden · ${r.name} — אפיון-חצב (חוק-4). מייבאת רק את האטום.\nimport '${kb}.dart';\n${usedImports(r.imports, asserts + sockSrc).join('\n')}${sockSrc}\nvoid _eq(String got, String want, String lbl){ if(got!=want) throw StateError('FAIL [\$lbl]: got=\$got want=\$want'); }\nvoid main(){\n  var n=0;\n${asserts}\n  print('✓ ${r.name}: '+n.toString()+' Golden');\n}\n`;
    return test;
}
export function inner$landOne$doc(r) {
    const doc = (r.fnSource.match(/\/\/\/[^\n]*/g) || []).join('\n').replace(/\/\/\/ ?/g, '');
    return doc;
}
export function inner$landOne$md(r, purpose) {
    const kb = kebab(r.name);
    const srcRef = r._srcRef || '(מקור)';
    const doc = (r.fnSource.match(/\/\/\/[^\n]*/g) || []).join('\n').replace(/\/\/\/ ?/g, '');
    const md = `# חוזה · ${r.name}\n\n> אטום-Dart · נחצב אוטומטית ע"י חצב-AST (חוק-4 — verbatim מהמקור).\n\n## מקור\n${srcRef}\n\n## התנהגות\n${doc || '(ראה גוף-האטום)'}\n\n## ייעוד-עברי\n${purpose.from === 'none' ? '(אין — לא נמצא הקשר עברי במקור/בקוראים/בגוף)' : `מקור: ${purpose.from}${purpose.key ? ' · ' + purpose.key : ''} — ${purpose.words.slice(0, 12).join(' · ')}`}\n\n## אימות\nבדיקת-Golden (\`${kb}_test.dart\`): אפיון דטרמיניסטי על סל-קלטים — הוקלט מהרצת הקוד-החלוץ. הרצה: \`dart run --enable-asserts new/dart/${kb}_test.dart\`.\n`;
    return md;
}
export function inner$landOne$md$$step(r, kb, srcRef, purpose, doc) {
    const md = `# חוזה · ${r.name}\n\n> אטום-Dart · נחצב אוטומטית ע"י חצב-AST (חוק-4 — verbatim מהמקור).\n\n## מקור\n${srcRef}\n\n## התנהגות\n${doc || '(ראה גוף-האטום)'}\n\n## ייעוד-עברי\n${purpose.from === 'none' ? '(אין — לא נמצא הקשר עברי במקור/בקוראים/בגוף)' : `מקור: ${purpose.from}${purpose.key ? ' · ' + purpose.key : ''} — ${purpose.words.slice(0, 12).join(' · ')}`}\n\n## אימות\nבדיקת-Golden (\`${kb}_test.dart\`): אפיון דטרמיניסטי על סל-קלטים — הוקלט מהרצת הקוד-החלוץ. הרצה: \`dart run --enable-asserts new/dart/${kb}_test.dart\`.\n`;
    return md;
}

export const SIGS = {
  inner$usedImports$filter$pfx: [{"name":"im","d":{"t":"any"},"opt":false}],
  inner$elemLit$b: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$compat$nul: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$base: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$out: [{"name":"pt","d":{"t":"any"},"opt":false},{"name":"ex","d":{"t":"any"},"opt":false}],
  inner$compat$out$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"ex","d":{"t":"any"},"opt":false}],
  inner$compat$mL: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$mL$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$compat$el: [{"name":"pt","d":{"t":"any"},"opt":false},{"name":"samples","d":{"t":"obj","p":[]},"opt":false}],
  inner$compat$el$$step: [{"name":"samples","d":{"t":"obj","p":[]},"opt":false},{"name":"mL","d":{"t":"any"},"opt":false}],
  inner$compat$c: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$c$$step: [{"name":"mL","d":{"t":"any"},"opt":false}],
  inner$compat$out_L84: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$out_L84$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"mL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"lit","v":["[]","{}"]},"opt":false}],
  inner$compat$kw: [{"name":"pt","d":{"t":"any"},"opt":false},{"name":"samples","d":{"t":"obj","p":[]},"opt":false}],
  inner$compat$kw$$step: [{"name":"el","d":{"t":"any"},"opt":false}],
  inner$compat$mM: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$mM$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$compat$k: [{"name":"pt","d":{"t":"any"},"opt":false},{"name":"samples","d":{"t":"obj","p":[]},"opt":false}],
  inner$compat$k$$step: [{"name":"samples","d":{"t":"obj","p":[]},"opt":false},{"name":"mM","d":{"t":"any"},"opt":false}],
  inner$compat$v: [{"name":"pt","d":{"t":"any"},"opt":false},{"name":"samples","d":{"t":"obj","p":[]},"opt":false}],
  inner$compat$v$$step: [{"name":"samples","d":{"t":"obj","p":[]},"opt":false},{"name":"mM","d":{"t":"any"},"opt":false}],
  inner$compat$out_L86: [{"name":"pt","d":{"t":"any"},"opt":false}],
  inner$compat$out_L86$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"mM","d":{"t":"any"},"opt":false}],
  inner$parseParams$clean: [{"name":"fnSrc","d":{"t":"any"},"opt":false}],
  inner$parseParams$m: [{"name":"fnSrc","d":{"t":"any"},"opt":false}],
  inner$parseParams$m$$step: [{"name":"clean","d":{"t":"any"},"opt":false}],
  inner$parseParams$raw: [{"name":"fnSrc","d":{"t":"any"},"opt":false}],
  inner$parseParams$raw$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseParams$map$parts: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$purposeOf$own: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purposeOf$rel: [{"name":"srcRef","d":{"t":"any"},"opt":false}],
  inner$purposeOf$k: [{"name":"srcRef","d":{"t":"any"},"opt":false}],
  inner$purposeOf$k$$step: [{"name":"rel","d":{"t":"str"},"opt":false}],
  inner$purposeOf$re: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purposeOf$body: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$atomFile$pure: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$atomFile$pure$$step: [{"name":"imports","d":{"t":"any"},"opt":false}],
  inner$atomFile$sock: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$atomFile$header: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"srcRef","d":{"t":"any"},"opt":false}],
  inner$atomFile$header$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"srcRef","d":{"t":"any"},"opt":false},{"name":"pure","d":{"t":"str"},"opt":false},{"name":"sock","d":{"t":"str"},"opt":false}],
  inner$atomFile$types: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$atomFile$purp: [{"name":"purpose","d":{"t":"any"},"opt":false}],
  inner$landOne$kb: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$landOne$kebabName: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$landOne$kebabName$$step: [{"name":"kb","d":{"t":"any"},"opt":false}],
  inner$landOne$params: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$landOne$socketArgs: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$landOne$sockSrc: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$landOne$harnessBody: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"callArgs","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$landOne$harnessBody$$step: [{"name":"callArgs","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"sockSrc","d":{"t":"str"},"opt":false}],
  inner$landOne$harness: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"callArgs","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$landOne$harness$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"kb","d":{"t":"any"},"opt":false},{"name":"callArgs","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"sockSrc","d":{"t":"str"},"opt":false},{"name":"harnessBody","d":{"t":"str"},"opt":false}],
  inner$landOne$rows: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$landOne$msg: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$landOne$test: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"asserts","d":{"t":"str"},"opt":false}],
  inner$landOne$test$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"kb","d":{"t":"any"},"opt":false},{"name":"sockSrc","d":{"t":"str"},"opt":false},{"name":"asserts","d":{"t":"str"},"opt":false}],
  inner$landOne$doc: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$landOne$md: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"purpose","d":{"t":"obj","p":[["words",{"t":"any"},false],["from",{"t":"str"},false],["key",{"t":"any"},false]]},"opt":false}],
  inner$landOne$md$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"kb","d":{"t":"any"},"opt":false},{"name":"srcRef","d":{"t":"any"},"opt":false},{"name":"purpose","d":{"t":"obj","p":[["words",{"t":"any"},false],["from",{"t":"str"},false],["key",{"t":"any"},false]]},"opt":false},{"name":"doc","d":{"t":"any"},"opt":false}],
};
