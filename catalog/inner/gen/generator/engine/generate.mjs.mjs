// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:engine/generate.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const FILLABLE = /^(String|bool|int|double|Color|IconData|TextEditingController|VoidCallback|void Function\(\)|ValueChanged<(bool|int|String)>|void Function\((bool|int|String)\)|List<String>)/;
const norm = (w) => w.replace(/^ה(?=..)/, '').replace(/[^֐-׿\w]/g, '');
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
export function inner$generate$title(specText, first) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    const oneLine = lines.length === 1;
    const title = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
    return title;
}
export function inner$generate$title$$step(first, oneLine) {
    const title = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
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
export function inner$generate$imports(FW, slug) {
    const imports = new Set([...FW.imports, FW.tokenImport, `${FW.contentImportPrefix}${slug}${FW.contentImportSuffix}`].filter(Boolean));
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
export function inner$generate$code(FW, slug, specText, first, nodes, stateDecls, imports, atomOf, calls, titleConst) {
    const rawLines = specText.split('\n').filter(l => l.trim());
    const lines = rawLines.map(s => s.trim().replace(/,$/, ''));
    const oneLine = lines.length === 1;
    const title = (oneLine ? (first.includes(':') ? first.slice(0, first.indexOf(':')) : '') : first.replace(/:$/, '')).trim();
    const parts = [...nodes.map(n => n.part), ...nodes.flatMap(n => n.children)];
    const cls = 'Gen' + slug.replace(/(^|[_-])([a-z])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
    const chosen = parts.map(part => ({ part, atom: atomOf.get(part) })).filter(c => c.atom);
    const code = `// 🧬 חולל ע"י המחולל (genesis-gen, הכרעות 17+18) — בקשה ⇒ בחירת-אטומים ⇒ חיווט ⇒ מסך. אל תערוך ידנית.
  // 🧬 שם: ${title}
  // 🧬 בקשה: ${lines.join(' · ')}
  // 🧬 אטומים שנבחרו: ${chosen.map(c => c.atom.cls).join(' · ')}
  ${[...imports].sort().join('\n')}
  
  class ${cls} extends StatefulWidget {
    const ${cls}({super.key});
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    ${stateDecls.join('\n  ')}
  
    void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
        );
  
    @override
    Widget build(BuildContext context) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: ${FW.scaffoldBg},
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
export function inner$generate$code$$step(FW, lines, title, cls, stateDecls, imports, chosen, calls, titleConst) {
    const code = `// 🧬 חולל ע"י המחולל (genesis-gen, הכרעות 17+18) — בקשה ⇒ בחירת-אטומים ⇒ חיווט ⇒ מסך. אל תערוך ידנית.
  // 🧬 שם: ${title}
  // 🧬 בקשה: ${lines.join(' · ')}
  // 🧬 אטומים שנבחרו: ${chosen.map(c => c.atom.cls).join(' · ')}
  ${[...imports].sort().join('\n')}
  
  class ${cls} extends StatefulWidget {
    const ${cls}({super.key});
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    ${stateDecls.join('\n  ')}
  
    void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
        );
  
    @override
    Widget build(BuildContext context) {
      return Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: ${FW.scaffoldBg},
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
export function inner$pickAtom$fillable$$after_loop(part, a) {
    let fillable = true;
    let widgetFills = 0;
    for (const rq of [...a.required, ...a.positional]) {
        const t = (a.types.get(rq) || '').replace(/\?$/, '');
        if (/^Widget\b/.test(t) || /^List<Widget>/.test(t)) {
            widgetFills++;
            continue;
        }
        if (/^List<\(\{/.test(t)) {
            if (!part.options?.length) {
                fillable = false;
                break;
            }
            continue;
        }
        if (!FILLABLE.test(t)) {
            fillable = false;
            break;
        }
    }
    return fillable;
}
export function inner$pickAtom$widgetFills$$after_loop(part, a) {
    let fillable = true;
    let widgetFills = 0;
    for (const rq of [...a.required, ...a.positional]) {
        const t = (a.types.get(rq) || '').replace(/\?$/, '');
        if (/^Widget\b/.test(t) || /^List<Widget>/.test(t)) {
            widgetFills++;
            continue;
        }
        if (/^List<\(\{/.test(t)) {
            if (!part.options?.length) {
                fillable = false;
                break;
            }
            continue;
        }
        if (!FILLABLE.test(t)) {
            fillable = false;
            break;
        }
    }
    return widgetFills;
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
  inner$pickAtom$t: [{"name":"a","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]},"opt":false},{"name":"rq","d":{"t":"any"},"opt":false}],
  inner$generate$rawLines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$generate$lines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$generate$lines$$step: [{"name":"rawLines","d":{"t":"any"},"opt":false}],
  inner$generate$oneLine: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$generate$oneLine$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$generate$title: [{"name":"specText","d":{"t":"any"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false}],
  inner$generate$title$$step: [{"name":"first","d":{"t":"any"},"opt":false},{"name":"oneLine","d":{"t":"bool"},"opt":false}],
  inner$generate$indented: [{"name":"specText","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generate$indented$$step: [{"name":"rawLines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generate$parts: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$bindArgs$nums: [{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$bindArgs$strs: [{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$bindArgs$t: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$generate$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$generate$constFor$n: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"purpose","d":{"t":"any"},"opt":false}],
  inner$generate$imports: [{"name":"FW","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$generate$pinM: [{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$pf: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$pf$$step: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false]]},"opt":false},{"name":"pinM","d":{"t":"any"},"opt":false}],
  inner$generate$rule: [{"name":"LOGIC_RULES","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false},{"name":"fnHit","d":{"t":"any"},"opt":false}],
  inner$generate$words: [{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$overlap: [{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]},"opt":false}],
  inner$generate$overlap$$step: [{"name":"words","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]},"opt":false}],
  inner$generate$fillProp$t: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$da: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$optWidget: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$texts: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$texts$$step: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"optWidget","d":{"t":"bool"},"opt":false}],
  inner$generate$fillProp$pick: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$pick$$step: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"texts","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rm2: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$rm2$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generate$fillProp$fields2: [{"name":"recT","d":{"t":"any"},"opt":false}],
  inner$generate$chosen: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false}],
  inner$generate$chosen$$step: [{"name":"parts","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]}},"opt":false},{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false}],
  inner$generate$buildCall$req: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$generate$buildCall$t: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$generate$atom: [{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false},{"name":"node","d":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["children",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$generate$kids: [{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false},{"name":"node","d":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["children",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$generate$code: [{"name":"FW","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false},{"name":"first","d":{"t":"any"},"opt":false},{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"stateDecls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"atomOf","d":{"t":"map","k":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"v":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]}},"opt":false},{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"titleConst","d":{"t":"str"},"opt":false}],
  inner$generate$code$$step: [{"name":"FW","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false},{"name":"title","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"stateDecls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"chosen","d":{"t":"arr","of":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["atom",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}]},false]]}},"opt":false},{"name":"calls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"titleConst","d":{"t":"str"},"opt":false}],
  inner$pickAtom$fillable$$after_loop: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]},"opt":false}],
  inner$pickAtom$widgetFills$$after_loop: [{"name":"part","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]},"opt":false}],
  inner$generate$parentOf$$after_loop: [{"name":"nodes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generate$best$$after_loop: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$bestScore$$after_loop: [{"name":"atlas","d":{"t":"obj","p":[["widgets",{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["types",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["positional",{"t":"arr","of":{"t":"any"}},false],["required",{"t":"set","of":{"t":"any"}},false],["named",{"t":"set","of":{"t":"any"}},false],["flexRoot",{"t":"bool"},false],["dirty",{"t":"bool"},false]]}},false],["functions",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["sig",{"t":"any"},false],["ret",{"t":"any"},false],["params",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false],["data",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["type",{"t":"any"},false],["he",{"t":"arr","of":{"t":"any"}},false],["file",{"t":"any"},false],["dir",{"t":"any"},false]]}},false]]},"opt":false},{"name":"part","d":{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},"opt":false}],
  inner$generate$prev$$after_loop: [{"name":"n","d":{"t":"obj","p":[["part",{"t":"or","of":[{"t":"obj","p":[["pin",{"t":"any"},false],["role",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["dataPin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["dataPin",{"t":"any"},false],["role",{"t":"str"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["hero",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"str"},false],["hero",{"t":"bool"},false],["navSlug",{"t":"any"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true]]},{"t":"obj","p":[["role",{"t":"any"},false],["hero",{"t":"bool"},false],["label",{"t":"any"},false],["txt",{"t":"any"},false],["options",{"t":"any"},false],["emoji",{"t":"any"},false],["sub",{"t":"any"},false],["value",{"t":"any"},false],["values",{"t":"arr","of":{"t":"any"}},false],["pin",{"t":"undef"},true],["dataPin",{"t":"undef"},true],["navSlug",{"t":"undef"},true]]}]},false],["children",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
};
