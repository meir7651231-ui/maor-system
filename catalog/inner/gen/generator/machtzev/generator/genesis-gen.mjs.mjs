// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/genesis-gen.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const norm = (w) => w.replace(/^ה(?=..)/, '').replace(/[^֐-׿\w]/g, '');
const norm4 = (w) => w.replace(/^ה(?=..)/, '');
const norm2 = (w) => w.replace(/^ה(?=..)/, '');
export function inner$parsePart$ci(txt) {
    const ci = txt.indexOf(':');
    return ci;
}
export function inner$parsePart$em(body) {
    const em = body.match(/(\p{Extended_Pictographic}(?:️)?)/u);
    return em;
}
export function inner$parsePart$emoji(body) {
    const em = body.match(/(\p{Extended_Pictographic}(?:️)?)/u);
    const emoji = em ? em[1] : null;
    return emoji;
}
export function inner$parsePart$emoji$$step(em) {
    const emoji = em ? em[1] : null;
    return emoji;
}
export function inner$parsePart$pi(body) {
    const pi = body.indexOf('|');
    return pi;
}
export function inner$parsePart$firstWord(body) {
    const firstWord = body.split(/\s+/)[0];
    return firstWord;
}
export function inner$parsePart$values(NAV_WORD, body, numRe) {
    const firstWord = body.split(/\s+/)[0];
    const values = firstWord === NAV_WORD ? [] : [...body.matchAll(numRe)].map(mm => mm[0]);
    return values;
}
export function inner$parsePart$values$$step(NAV_WORD, body, firstWord, numRe) {
    const values = firstWord === NAV_WORD ? [] : [...body.matchAll(numRe)].map(mm => mm[0]);
    return values;
}
export function inner$parsePart$words(body) {
    const words = body.split(/\s+/);
    return words;
}
export function inner$pickAtom$score(part, role) {
    let score = role === part.role ? 5 : role === 'row' ? 1 : 0;
    return score;
}
export function inner$pickAtom$t(a, rq) {
    const t = (a.types.get(rq) || '').replace(/\?$/, '');
    return t;
}
export function inner$pickAtom$scalars(a) {
    const scalars = [...a.types.entries()].filter(([n, t]) => /^(int|double|num)$/.test(t.replace(/\?$/, '')) && !/radius/i.test(n) && (a.required.has(n) || a.positional.includes(n))).length;
    return scalars;
}
export function inner$generate$rawLines(specText) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    return rawLines;
}
export function inner$generate$lines(specText) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    return lines;
}
export function inner$generate$lines$$step(rawLines) {
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    return lines;
}
export function inner$generate$oneLine(specText) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    const oneLine = lines.length === 1;
    return oneLine;
}
export function inner$generate$oneLine$$step(lines) {
    const oneLine = lines.length === 1;
    return oneLine;
}
export function inner$generate$rawTitle(specText, first) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    const oneLine = lines.length === 1;
    const rawTitle = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
    return rawTitle;
}
export function inner$generate$rawTitle$$step(first, oneLine) {
    const rawTitle = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
    return rawTitle;
}
export function inner$generate$title(HERO_WORD, specText, first) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    const oneLine = lines.length === 1;
    const rawTitle = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
    const title = (HERO_WORD ? rawTitle.replace(new RegExp('^' + HERO_WORD + '\\s*'), '') : rawTitle).replace(/\s*\|.*$/, '').trim() || rawTitle;
    return title;
}
export function inner$generate$title$$step(HERO_WORD, rawTitle) {
    const title = (HERO_WORD ? rawTitle.replace(new RegExp('^' + HERO_WORD + '\\s*'), '') : rawTitle).replace(/\s*\|.*$/, '').trim() || rawTitle;
    return title;
}
export function inner$generate$indented(specText, i) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const indented = /^(\s{2,}|\t)/.test(rawLines[i]);
    return indented;
}
export function inner$generate$indented$$step(rawLines, i) {
    const indented = /^(\s{2,}|\t)/.test(rawLines[i]);
    return indented;
}
export function inner$generate$parts(nodes) {
    const parts = [...nodes.map(n => n.part), ...nodes.flatMap(n => n.children)];
    return parts;
}
export function inner$generate$bindArgs$nums(part) {
    const nums = [...part.txt.matchAll(/\d[\d.]*/g)].map(m => m[0]);
    return nums;
}
export function inner$generate$bindArgs$strs(part) {
    const strs = [...part.txt.matchAll(/"([^"]*)"/g)].map(m => m[1]);
    return strs;
}
export function inner$generate$bindArgs$t(p) {
    const t = p.type.replace(/\?$/, '');
    return t;
}
export function inner$generate$cls(slug) {
    const cls = 'Gen' + slug.replace(/(^|[_-])([a-z])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
    return cls;
}
export function inner$generate$constFor$n(slug, purpose) {
    let n = 'gen_' + slug + '_' + (purpose || 'text');
    return n;
}
export function inner$generate$imports(PURE, slug) {
    const imports = new Set(["import 'package:flutter/material.dart';", `import '../dart-ui-bs/auto/${PURE ? 'bs_pure_tokens' : 'bs_tokens'}.dart';`, `import '../dart-data-bs/auto/gen_${slug}_content.dart';`]);
    return imports;
}
export function inner$generate$pinM(part) {
    const pinM = part.txt.match(/\(([a-z]\w*)\)\s*$/);
    return pinM;
}
export function inner$generate$pf(atlas, part) {
    const pinM = part.txt.match(/\(([a-z]\w*)\)\s*$/);
    const pf = atlas.functions.find(f => f.name === pinM[1]);
    return pf;
}
export function inner$generate$pf$$step(atlas, pinM) {
    const pf = atlas.functions.find(f => f.name === pinM[1]);
    return pf;
}
export function inner$generate$rule(LOGIC_RULES, part, fnHit) {
    const rule = !fnHit && LOGIC_RULES.find(r => part.txt.includes(r.match));
    return rule;
}
export function inner$generate$words(part) {
    const words = new Set(part.label.split(/\s+/).map(norm).filter(w => w.length > 1));
    return words;
}
export function inner$generate$overlap(part, f) {
    const words = new Set(part.label.split(/\s+/).map(norm).filter(w => w.length > 1));
    const overlap = f.he.filter(w => words.has(norm(w))).length;
    return overlap;
}
export function inner$generate$overlap$$step(words, f) {
    const overlap = f.he.filter(w => words.has(norm(w))).length;
    return overlap;
}
export function inner$generate$fillProp$t(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    return t;
}
export function inner$generate$fillProp$da(atlas, part) {
    const da = atlas.data.find(d => d.name === part.dataPin && d.type === 'List<String>');
    return da;
}
export function inner$generate$fillProp$optWidget(a) {
    const optWidget = [...a.types.entries()].some(([n2, t2]) => /^(options|items)$/.test(n2) && /^List</.test(t2.replace(/\?$/, '')));
    return optWidget;
}
export function inner$generate$fillProp$texts(a, part) {
    const optWidget = [...a.types.entries()].some(([n2, t2]) => /^(options|items)$/.test(n2) && /^List</.test(t2.replace(/\?$/, '')));
    const texts = optWidget || !part.options ? [] : part.options;
    return texts;
}
export function inner$generate$fillProp$texts$$step(part, optWidget) {
    const texts = optWidget || !part.options ? [] : part.options;
    return texts;
}
export function inner$generate$fillProp$pick(a, part) {
    const optWidget = [...a.types.entries()].some(([n2, t2]) => /^(options|items)$/.test(n2) && /^List</.test(t2.replace(/\?$/, '')));
    const texts = optWidget || !part.options ? [] : part.options;
    const pick = part._si === 0 ? part.label : (texts[part._si - 1] ?? part.sub ?? part.label);
    return pick;
}
export function inner$generate$fillProp$pick$$step(part, texts) {
    const pick = part._si === 0 ? part.label : (texts[part._si - 1] ?? part.sub ?? part.label);
    return pick;
}
export function inner$generate$fillProp$inner(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const inner = t.match(/<(\w+)>/)[1];
    return inner;
}
export function inner$generate$fillProp$inner$$step(t) {
    const inner = t.match(/<(\w+)>/)[1];
    return inner;
}
export function inner$generate$fillProp$lit(a, name, rest) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const inner = t.match(/<(\w+)>/)[1];
    const lit = rest.map((x) => inner === 'int' ? String(parseInt(x) || 0) : String(parseFloat(x) || 0));
    return lit;
}
export function inner$generate$fillProp$lit$$step(rest, inner) {
    const lit = rest.map((x) => inner === 'int' ? String(parseInt(x) || 0) : String(parseFloat(x) || 0));
    return lit;
}
export function inner$generate$fillProp$rm2(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const rm2 = t.match(/^List<(\(\{[^}]*\}\))>$/);
    return rm2;
}
export function inner$generate$fillProp$rm2$$step(t) {
    const rm2 = t.match(/^List<(\(\{[^}]*\}\))>$/);
    return rm2;
}
export function inner$generate$fillProp$fields2(recT) {
    const fields2 = [...recT.matchAll(/(String|bool|int)\s+(\w+)/g)];
    return fields2;
}
export function inner$generate$fillProp$rmT(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const rmT = t.match(/^List<\(([^{}()]+)\)>$/);
    return rmT;
}
export function inner$generate$fillProp$rmT$$step(t) {
    const rmT = t.match(/^List<\(([^{}()]+)\)>$/);
    return rmT;
}
export function inner$generate$fillProp$fts(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const rmT = t.match(/^List<\(([^{}()]+)\)>$/);
    const fts = rmT[1].split(',').map(x => x.trim());
    return fts;
}
export function inner$generate$fillProp$fts$$step(rmT) {
    const fts = rmT[1].split(',').map(x => x.trim());
    return fts;
}
export function inner$generate$fillProp$rmR(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const rmR = t.match(/^\(\{([^}]*)\}\)$/);
    return rmR;
}
export function inner$generate$fillProp$rmR$$step(t) {
    const rmR = t.match(/^\(\{([^}]*)\}\)$/);
    return rmR;
}
export function inner$generate$fillProp$fields3(a, name) {
    const t = (a.types.get(name) || 'String').replace(/\?$/, '');
    const rmR = t.match(/^\(\{([^}]*)\}\)$/);
    const fields3 = [...rmR[1].matchAll(/(String|bool|int)\s+(\w+)/g)];
    return fields3;
}
export function inner$generate$fillProp$fields3$$step(rmR) {
    const fields3 = [...rmR[1].matchAll(/(String|bool|int)\s+(\w+)/g)];
    return fields3;
}
export function inner$generate$chosen(nodes, atomOf) {
    const parts = [...nodes.map(n => n.part), ...nodes.flatMap(n => n.children)];
    const chosen = parts.map(part => ({ part, atom: atomOf.get(part) })).filter(c => c.atom);
    return chosen;
}
export function inner$generate$chosen$$step(parts, atomOf) {
    const chosen = parts.map(part => ({ part, atom: atomOf.get(part) })).filter(c => c.atom);
    return chosen;
}
export function inner$generate$buildCall$req(atom, pn) {
    const req = atom.required.has(pn);
    return req;
}
export function inner$generate$buildCall$t(atom, pn) {
    const t = (atom.types.get(pn) || '').replace(/\?$/, '');
    return t;
}
export function inner$generate$atom(atomOf, node) {
    const atom = atomOf.get(node.part);
    return atom;
}
export function inner$generate$kids(atomOf, node) {
    const kids = node.children.map(c => ({ part: c, atom: atomOf.get(c) })).filter(k => k.atom);
    return kids;
}
export function inner$generate$body(calls) {
    const body = calls.join('\n');
    return body;
}
export function inner$generate$usedDecls(stateDecls, calls) {
    const body = calls.join('\n');
    const usedDecls = stateDecls.filter((d) => { const m = d.match(/(_[a-z]\d+)\b/); return !m || body.includes(m[1]); });
    return usedDecls;
}
export function inner$generate$usedDecls$$step(stateDecls, body) {
    const usedDecls = stateDecls.filter((d) => { const m = d.match(/(_[a-z]\d+)\b/); return !m || body.includes(m[1]); });
    return usedDecls;
}
export function inner$generate$filter$m(d) {
    const m = d.match(/(_[a-z]\d+)\b/);
    return m;
}
export function inner$generate$code(HERO_WORD, TOK, slug, specText, look, first, nodes, stateDecls, imports, atomOf, calls, titleConst) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    const oneLine = lines.length === 1;
    const rawTitle = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
    const title = (HERO_WORD ? rawTitle.replace(new RegExp('^' + HERO_WORD + '\\s*'), '') : rawTitle).replace(/\s*\|.*$/, '').trim() || rawTitle;
    const parts = [...nodes.map(n => n.part), ...nodes.flatMap(n => n.children)];
    const cls = 'Gen' + slug.replace(/(^|[_-])([a-z])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
    const chosen = parts.map(part => ({ part, atom: atomOf.get(part) })).filter(c => c.atom);
    const body = calls.join('\n');
    const usedDecls = stateDecls.filter((d) => { const m = d.match(/(_[a-z]\d+)\b/); return !m || body.includes(m[1]); });
    const code = `// 🧬 חולל ע"י המחולל (genesis-gen, הכרעות 17+18) — בקשה ⇒ בחירת-אטומים ⇒ חיווט ⇒ מסך. אל תערוך ידנית.
  // 🧬 שם: ${title}
  // 🧬 בקשה: ${lines.join(' · ')}
  // 🧬 אטומים שנבחרו: ${chosen.map(c => c.atom.cls).join(' · ')}
  ${look ? `// 🎨 מראה: ${look}\n` : ''}${[...imports].sort().join('\n')}
  
  class ${cls} extends StatefulWidget {
    const ${cls}({super.key});
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    ${usedDecls.join('\n  ')}
  
    void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
        );
  
    @override
    Widget build(BuildContext context) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: ${look === 'dark' ? 'DsDark.bg' : TOK + '.bgLight'},
          appBar: AppBar(title: Text(${titleConst})),
          body: ListView(
            padding: const EdgeInsets.symmetric(vertical: 12),
            children: [
  ${calls.join('\n')}
            ],
          ),
        ),
      );
    }
  }
  `;
    return code;
}
export function inner$generate$code$$step(TOK, lines, look, title, cls, imports, chosen, calls, titleConst, usedDecls) {
    const code = `// 🧬 חולל ע"י המחולל (genesis-gen, הכרעות 17+18) — בקשה ⇒ בחירת-אטומים ⇒ חיווט ⇒ מסך. אל תערוך ידנית.
  // 🧬 שם: ${title}
  // 🧬 בקשה: ${lines.join(' · ')}
  // 🧬 אטומים שנבחרו: ${chosen.map(c => c.atom.cls).join(' · ')}
  ${look ? `// 🎨 מראה: ${look}\n` : ''}${[...imports].sort().join('\n')}
  
  class ${cls} extends StatefulWidget {
    const ${cls}({super.key});
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    ${usedDecls.join('\n  ')}
  
    void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
        );
  
    @override
    Widget build(BuildContext context) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: ${look === 'dark' ? 'DsDark.bg' : TOK + '.bgLight'},
          appBar: AppBar(title: Text(${titleConst})),
          body: ListView(
            padding: const EdgeInsets.symmetric(vertical: 12),
            children: [
  ${calls.join('\n')}
            ],
          ),
        ),
      );
    }
  }
  `;
    return code;
}
export function inner$writeShowcaseSpec$pct(orders, proven) {
    const pct = orders ? Math.round((proven / orders) * 100) : 0;
    return pct;
}
export function inner$writeSelfEntry$swapRoles(LEXICON) {
    const roleWord = new Map();
    for (const [w, r] of LEXICON)
        if (!roleWord.has(r))
            roleWord.set(r, w);
    const swapRoles = ['switch', 'textfield', 'stat'].filter(r => roleWord.has(r));
    return swapRoles;
}
export function inner$writeSelfEntry$swapRoles$$step(roleWord) {
    const swapRoles = ['switch', 'textfield', 'stat'].filter(r => roleWord.has(r));
    return swapRoles;
}
export function inner$writeSelfEntry$swapTerms(LEXICON) {
    const roleWord = new Map();
    for (const [w, r] of LEXICON)
        if (!roleWord.has(r))
            roleWord.set(r, w);
    const swapRoles = ['switch', 'textfield', 'stat'].filter(r => roleWord.has(r));
    const swapTerms = swapRoles.map(r => roleWord.get(r));
    return swapTerms;
}
export function inner$writeSelfEntry$swapTerms$$step(roleWord, swapRoles) {
    const swapTerms = swapRoles.map(r => roleWord.get(r));
    return swapTerms;
}
export function inner$writeSelfEntry$shapeWords(LEXICON) {
    const roleWord = new Map();
    for (const [w, r] of LEXICON)
        if (!roleWord.has(r))
            roleWord.set(r, w);
    const shapeWords = [...roleWord.values()];
    return shapeWords;
}
export function inner$writeSelfEntry$shapeWords$$step(roleWord) {
    const shapeWords = [...roleWord.values()];
    return shapeWords;
}
export function inner$writeSelfEntry$map$slug(f) {
    const slug = f.replace('.txt', '');
    return slug;
}
export function inner$writeSelfEntry$fn$rich(atlas) {
    const rich = atlas.data.filter(d => d.type === 'List<String>' && (d.items || []).length >= 4);
    return rich;
}
export function inner$writeSelfEntry$fn$pick2(atlas) {
    const rich = atlas.data.filter(d => d.type === 'List<String>' && (d.items || []).length >= 4);
    const pick2 = rich[Math.floor(rich.length / 2)];
    return pick2;
}
export function inner$writeSelfEntry$fn$pick2$$step(rich) {
    const pick2 = rich[Math.floor(rich.length / 2)];
    return pick2;
}
export function inner$writeImprovSpec$rnd$t(seed) {
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    return t;
}
export function inner$writeImprovSpec$pool(atlas) {
    const RETS3 = new Set(['String', 'String?', 'int', 'bool', 'double', 'num']);
    const byName = new Map();
    for (const f of atlas.functions) {
        if (!(RETS3.has(f.ret) && f.params.length === 1 && /^String\??$/.test(f.params[0].type.trim()) && f.he.length >= 1))
            continue;
        if (!byName.has(f.name))
            byName.set(f.name, f);
    }
    const pool = [...byName.values()];
    return pool;
}
export function inner$writeImprovSpec$pool$$step(byName) {
    const pool = [...byName.values()];
    return pool;
}
export function inner$writeImprovSpec$domain(dm) {
    const domain = [...dm[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    return domain;
}
export function inner$writeImprovSpec$wm(f, tt) {
    const wm = tt.match(new RegExp(`__pure_${f.name}\\(\\.\\.\\.a,\\s*\\.\\.\\.Array\\(Math\\.max\\([^)]*\\)\\)\\.fill\\(undefined\\),\\s*([^)]+)\\)`));
    return wm;
}
export function inner$writeImprovSpec$cm(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    return cm;
}
export function inner$writeImprovSpec$st2(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    return st2;
}
export function inner$writeImprovSpec$st2$$step(cm) {
    const st2 = cm.index + cm[0].length;
    return st2;
}
export function inner$writeImprovSpec$testable(starts, twins) {
    const testable = starts.filter(s => twins.has(s.fn.name));
    return testable;
}
export function inner$writeImprovSpec$dataRich(atlas) {
    const dataRich = atlas.data.filter(d => d.type === 'List<String>' && (d.items || []).filter(x => x && !/[<>{}$]/.test(x)).length >= 3);
    return dataRich;
}
export function inner$writeImprovSpec$cands2(atlas, twins, chain) {
    const RETS3 = new Set(['String', 'String?', 'int', 'bool', 'double', 'num']);
    const byName = new Map();
    for (const f of atlas.functions) {
        if (!(RETS3.has(f.ret) && f.params.length === 1 && /^String\??$/.test(f.params[0].type.trim()) && f.he.length >= 1))
            continue;
        if (!byName.has(f.name))
            byName.set(f.name, f);
    }
    const pool = [...byName.values()];
    const cands2 = pool.filter(f => twins.has(f.name) && !chain.includes(f));
    return cands2;
}
export function inner$writeImprovSpec$cands2$$step(pool, twins, chain) {
    const cands2 = pool.filter(f => twins.has(f.name) && !chain.includes(f));
    return cands2;
}
export function inner$writeImprovSpec$topic(dataPick, start) {
    const topic = new Set(((dataPick && dataPick.he) || (start && start.fn.he) || []).map(norm4));
    return topic;
}
export function inner$writeImprovSpec$inputLine(SM, dataPick, start) {
    const inputLine = dataPick
        ? `דאטה ${dataPick.name} ${dataPick.name}`
        : start
            ? `אטום ChipWrap ${start.fn.he.join(' ')}: ${start.domain.join(' / ')}`
            : `שדה ${SM.phrases.improvType}`;
    return inputLine;
}
export function inner$writeImprovSpec$lines(ins, SM, dataPick, start, chain) {
    const inputLine = dataPick
        ? `דאטה ${dataPick.name} ${dataPick.name}`
        : start
            ? `אטום ChipWrap ${start.fn.he.join(' ')}: ${start.domain.join(' / ')}`
            : `שדה ${SM.phrases.improvType}`;
    const lines = [
        'יכולת מאולתרת - שרשרת חמישה:',
        `הירו 🎲 ${SM.phrases.improvHero} | ${ins}`,
        `כותרת ${SM.phrases.mixTitle || SM.phrases.chainTitle}`,
        inputLine,
        ...chain.map(f => `  חישוב ${f.he.join(' ')} (${f.name})`),
        `באנר ${SM.phrases.mixBanner || SM.phrases.chainBanner}`,
    ];
    return lines;
}
export function inner$writeImprovSpec$lines$$step(ins, SM, chain, inputLine) {
    const lines = [
        'יכולת מאולתרת - שרשרת חמישה:',
        `הירו 🎲 ${SM.phrases.improvHero} | ${ins}`,
        `כותרת ${SM.phrases.mixTitle || SM.phrases.chainTitle}`,
        inputLine,
        ...chain.map(f => `  חישוב ${f.he.join(' ')} (${f.name})`),
        `באנר ${SM.phrases.mixBanner || SM.phrases.chainBanner}`,
    ];
    return lines;
}
export function inner$writeGoalSpecs$gname(gf) {
    const gname = gf.replace(/\.txt$/, '');
    return gname;
}
export function inner$writeGoalSpecs$rnd$t(seed) {
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    return t;
}
export function inner$writeGoalSpecs$gwords(goal) {
    const gwords = new Set((goal.match(/[֐-׿]+/g) || []).map(norm2));
    return gwords;
}
export function inner$writeGoalSpecs$domain(dm) {
    const domain = dm ? [...dm[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
    return domain;
}
export function inner$writeGoalSpecs$usedSwap(swaps) {
    const usedSwap = swaps.length >= 2;
    return usedSwap;
}
export function inner$writeGoalSpecs$shortGoal(goal) {
    const shortGoal = (goal.match(/[֐-׿]+/g) || []).slice(0, 3).join(' ');
    return shortGoal;
}
export function inner$writeGoalSpecs$forEach$slug(gname, i) {
    const slug = `${gname}${i + 1}`;
    return slug;
}
export function inner$writeGoalSpecs$forEach$lines(P, goal, shortGoal, i) {
    const lines = [`${shortGoal} - ${P.goalRoom} ${i + 1}:`, `הירו 🎯 ${goal} | ${P.goalHeroSub}`];
    return lines;
}
export function inner$writeGoalSpecs$forEach$labels(u) {
    const labels = u.swaps.map(f => f.he.slice(0, 2).join(' '));
    return labels;
}
export function inner$writeGoalSpecs$forEach$next(gname, rooms, i) {
    const next = i < rooms.length - 1 ? `${gname}${i + 2}` : `${gname}1`;
    return next;
}
export function inner$generate$parentOf$$after_loop(nodes) {
    const parentOf = new Map();
    for (const n of nodes)
        for (const c of n.children)
            parentOf.set(c, n.part);
    return parentOf;
}
export function inner$generate$best$$after_loop(atlas, part) {
    const RETS = new Set(['String', 'String?', 'int', 'double', 'num', 'bool']);
    const words = new Set(part.label.split(/\s+/).map(norm).filter(w => w.length > 1));
    let best = null;
    let bestScore = 1;
    for (const f of atlas.functions) {
        if (!RETS.has(f.ret) || !f.he.length)
            continue;
        const overlap = f.he.filter(w => words.has(norm(w))).length;
        if (overlap > bestScore) {
            bestScore = overlap;
            best = f;
        }
    }
    return best;
}
export function inner$generate$bestScore$$after_loop(atlas, part) {
    const RETS = new Set(['String', 'String?', 'int', 'double', 'num', 'bool']);
    const words = new Set(part.label.split(/\s+/).map(norm).filter(w => w.length > 1));
    let best = null;
    let bestScore = 1;
    for (const f of atlas.functions) {
        if (!RETS.has(f.ret) || !f.he.length)
            continue;
        const overlap = f.he.filter(w => words.has(norm(w))).length;
        if (overlap > bestScore) {
            bestScore = overlap;
            best = f;
        }
    }
    return bestScore;
}
export function inner$generate$prev$$after_loop(n) {
    let prev = '__FIELD__';
    for (const c of n.children) {
        if (!c.calcExpr || !c.calcExpr.includes('__FIELD__'))
            continue;
        c.calcExpr = c.calcExpr.replace('__FIELD__', prev);
        prev = '(' + c.calcExpr + ')';
    }
    return prev;
}
export function inner$writeSelfEntry$roleWord$$after_loop(LEXICON) {
    const roleWord = new Map();
    for (const [w, r] of LEXICON)
        if (!roleWord.has(r))
            roleWord.set(r, w);
    return roleWord;
}
export function inner$writeImprovSpec$byName$$after_loop(atlas) {
    const RETS3 = new Set(['String', 'String?', 'int', 'bool', 'double', 'num']);
    const byName = new Map();
    for (const f of atlas.functions) {
        if (!(RETS3.has(f.ret) && f.params.length === 1 && /^String\??$/.test(f.params[0].type.trim()) && f.he.length >= 1))
            continue;
        if (!byName.has(f.name))
            byName.set(f.name, f);
    }
    return byName;
}
export function inner$writeImprovSpec$d2$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    let started = false;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch)) {
            d2++;
            started = true;
        }
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return d2;
}
export function inner$writeImprovSpec$j2$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    let started = false;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch)) {
            d2++;
            started = true;
        }
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return j2;
}
export function inner$writeImprovSpec$q2$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    let started = false;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch)) {
            d2++;
            started = true;
        }
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return q2;
}
export function inner$writeImprovSpec$started$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    const st2 = cm.index + cm[0].length;
    let d2 = 0;
    let j2 = st2;
    let q2 = null;
    let started = false;
    for (; j2 < tt.length; j2++) {
        const ch = tt[j2];
        if (q2) {
            if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q2 = ch;
            continue;
        }
        if ('([{'.includes(ch)) {
            d2++;
            started = true;
        }
        else if (')]}'.includes(ch))
            d2--;
        else if (ch === ';' && d2 === 0)
            break;
    }
    return started;
}
export function inner$writeGoalSpecs$rooms$$after_loop(units) {
    const rooms = [];
    for (let i = 0; i < units.length; i += 2)
        rooms.push(units.slice(i, i + 2));
    return rooms;
}

export const SIGS = {
  inner$parsePart$ci: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$parsePart$em: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parsePart$emoji: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parsePart$emoji$$step: [{"name":"em","d":{"t":"any"},"opt":false}],
  inner$parsePart$pi: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parsePart$firstWord: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parsePart$values: [{"name":"NAV_WORD","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false},{"name":"numRe","d":{"t":"any"},"opt":false}],
  inner$parsePart$values$$step: [{"name":"NAV_WORD","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false},{"name":"firstWord","d":{"t":"any"},"opt":false},{"name":"numRe","d":{"t":"any"},"opt":false}],
  inner$parsePart$words: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$pickAtom$score: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"any"},"opt":false}],
  inner$pickAtom$t: [{"name":"a","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]},"opt":false},{"name":"rq","d":{"t":"any"},"opt":false}],
  inner$pickAtom$scalars: [{"name":"a","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]},"opt":false}],
  inner$generate$rawLines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$generate$lines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$generate$lines$$step: [{"name":"rawLines","d":{"t":"any"},"opt":false}],
  inner$generate$oneLine: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$generate$oneLine$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$generate$rawTitle: [{"name":"specText","d":{"t":"any"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false}],
  inner$generate$rawTitle$$step: [{"name":"first","d":{"t":"any"},"opt":false},{"name":"oneLine","d":{"t":"bool"},"opt":false}],
  inner$generate$title: [{"name":"HERO_WORD","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false}],
  inner$generate$title$$step: [{"name":"HERO_WORD","d":{"t":"any"},"opt":false},{"name":"rawTitle","d":{"t":"any"},"opt":false}],
  inner$generate$indented: [{"name":"specText","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generate$indented$$step: [{"name":"rawLines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generate$parts: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$bindArgs$nums: [{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$bindArgs$strs: [{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$bindArgs$t: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$generate$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$generate$constFor$n: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"purpose","d":{"t":"any"},"opt":false}],
  inner$generate$imports: [{"name":"PURE","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$generate$pinM: [{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$pf: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$pf$$step: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false},{"name":"pinM","d":{"t":"any"},"opt":false}],
  inner$generate$rule: [{"name":"LOGIC_RULES","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false},{"name":"fnHit","d":{"t":"any"},"opt":false}],
  inner$generate$words: [{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$overlap: [{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]},"opt":false}],
  inner$generate$overlap$$step: [{"name":"words","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]},"opt":false}],
  inner$generate$fillProp$t: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$da: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$optWidget: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$texts: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$texts$$step: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"optWidget","d":{"t":"bool"},"opt":false}],
  inner$generate$fillProp$pick: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$pick$$step: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"texts","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$inner: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$inner$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$lit: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$fillProp$lit$$step: [{"name":"rest","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rm2: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rm2$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$fields2: [{"name":"recT","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rmT: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rmT$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$fts: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$fts$$step: [{"name":"rmT","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rmR: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rmR$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$fields3: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$fields3$$step: [{"name":"rmR","d":{"t":"any"},"opt":false}],
  inner$generate$chosen: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false}],
  inner$generate$chosen$$step: [{"name":"parts","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]}},"opt":false},{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false}],
  inner$generate$buildCall$req: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$generate$buildCall$t: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$generate$atom: [{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false},{"name":"node","d":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["children",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$generate$kids: [{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false},{"name":"node","d":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["children",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$generate$body: [{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$usedDecls: [{"name":"stateDecls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$usedDecls$$step: [{"name":"stateDecls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"body","d":{"t":"str"},"opt":false}],
  inner$generate$filter$m: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$generate$code: [{"name":"HERO_WORD","d":{"t":"any"},"opt":false},{"name":"TOK","d":{"t":"lit","v":["BsTokens","BsPure"]},"opt":false},{"name":"slug","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false},{"name":"look","d":{"t":"any"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false},{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"stateDecls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false},{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"titleConst","d":{"t":"str"},"opt":false}],
  inner$generate$code$$step: [{"name":"TOK","d":{"t":"lit","v":["BsTokens","BsPure"]},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"look","d":{"t":"any"},"opt":false},{"name":"title","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"chosen","d":{"t":"arr","of":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["atom",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]},false]]}},"opt":false},{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"titleConst","d":{"t":"str"},"opt":false},{"name":"usedDecls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$writeShowcaseSpec$pct: [{"name":"orders","d":{"t":"num"},"opt":false},{"name":"proven","d":{"t":"num"},"opt":false}],
  inner$writeSelfEntry$swapRoles: [{"name":"LEXICON","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false}],
  inner$writeSelfEntry$swapRoles$$step: [{"name":"roleWord","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$writeSelfEntry$swapTerms: [{"name":"LEXICON","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false}],
  inner$writeSelfEntry$swapTerms$$step: [{"name":"roleWord","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"swapRoles","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$writeSelfEntry$shapeWords: [{"name":"LEXICON","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false}],
  inner$writeSelfEntry$shapeWords$$step: [{"name":"roleWord","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$writeSelfEntry$map$slug: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$writeSelfEntry$fn$rich: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false}],
  inner$writeSelfEntry$fn$pick2: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false}],
  inner$writeSelfEntry$fn$pick2$$step: [{"name":"rich","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},"opt":false}],
  inner$writeImprovSpec$rnd$t: [{"name":"seed","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$pool: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false}],
  inner$writeImprovSpec$pool$$step: [{"name":"byName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$writeImprovSpec$domain: [{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$wm: [{"name":"f","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$cm: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$st2: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$st2$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$testable: [{"name":"starts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"twins","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$writeImprovSpec$dataRich: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false}],
  inner$writeImprovSpec$cands2: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false},{"name":"twins","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$writeImprovSpec$cands2$$step: [{"name":"pool","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"twins","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$writeImprovSpec$topic: [{"name":"dataPick","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}]},"opt":false},{"name":"start","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$inputLine: [{"name":"SM","d":{"t":"any"},"opt":false},{"name":"dataPick","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}]},"opt":false},{"name":"start","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$lines: [{"name":"ins","d":{"t":"any"},"opt":false},{"name":"SM","d":{"t":"any"},"opt":false},{"name":"dataPick","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}]},"opt":false},{"name":"start","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$writeImprovSpec$lines$$step: [{"name":"ins","d":{"t":"any"},"opt":false},{"name":"SM","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"inputLine","d":{"t":"str"},"opt":false}],
  inner$writeGoalSpecs$gname: [{"name":"gf","d":{"t":"any"},"opt":false}],
  inner$writeGoalSpecs$rnd$t: [{"name":"seed","d":{"t":"num"},"opt":false}],
  inner$writeGoalSpecs$gwords: [{"name":"goal","d":{"t":"any"},"opt":false}],
  inner$writeGoalSpecs$domain: [{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$writeGoalSpecs$usedSwap: [{"name":"swaps","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$writeGoalSpecs$shortGoal: [{"name":"goal","d":{"t":"any"},"opt":false}],
  inner$writeGoalSpecs$forEach$slug: [{"name":"gname","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$writeGoalSpecs$forEach$lines: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"goal","d":{"t":"any"},"opt":false},{"name":"shortGoal","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$writeGoalSpecs$forEach$labels: [{"name":"u","d":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["d",{"t":"any"},false],["chain",{"t":"undef"},true],["swaps",{"t":"undef"},true],["g",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["chain",{"t":"arr","of":{"t":"any"}},false],["d",{"t":"undef"},true],["swaps",{"t":"undef"},true],["g",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["swaps",{"t":"arr","of":{"t":"any"}},false],["d",{"t":"undef"},true],["chain",{"t":"undef"},true],["g",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["g",{"t":"any"},false],["d",{"t":"undef"},true],["chain",{"t":"undef"},true],["swaps",{"t":"undef"},true]]}]},"opt":false}],
  inner$writeGoalSpecs$forEach$next: [{"name":"gname","d":{"t":"any"},"opt":false},{"name":"rooms","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generate$parentOf$$after_loop: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$best$$after_loop: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$bestScore$$after_loop: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$prev$$after_loop: [{"name":"n","d":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["children",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$writeSelfEntry$roleWord$$after_loop: [{"name":"LEXICON","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false}],
  inner$writeImprovSpec$byName$$after_loop: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["he",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"str"},false]]}},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["shelf",{"t":"any"},false]]}},false]]},"opt":false}],
  inner$writeImprovSpec$d2$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$j2$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$q2$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$writeImprovSpec$started$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$writeGoalSpecs$rooms$$after_loop: [{"name":"units","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
