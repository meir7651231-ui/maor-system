// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/pure/pure-forge.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const VAR = {
    canvas: 'skin.canvas', sunken: 'skin.sunken', surface: 'skin.surface', raised: 'skin.raised', 'raised2': 'skin.raised2',
    ink: 'skin.ink', mut: 'skin.mut', faint: 'skin.faint', hair: 'skin.hair', 'hair2': 'skin.hair2',
    ok: 'skin.ok', warn: 'skin.warn', err: 'skin.err', gold: 'skin.gold',
    a: 'theme.a', 'a-hi': 'theme.aHi', 'a-800': 'theme.a800', 'c2': 'theme.c2', 'c3': 'theme.c3', gl: 'theme.gl',
    he: 'fonts.he', grotesk: 'fonts.grotesk', serif: 'fonts.serif', serifHe: 'fonts.serifHe',
};
const cssVar = (v) => { const m = String(v).match(/var\(--([a-z0-9-]+)\)/); return m && VAR[m[1]] ? VAR[m[1]] : null; };
function parseCss(html) {
    const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
    const map = {};
    for (const m of style.matchAll(/\.([a-z][a-z0-9_-]*)\s*\{([^}]*)\}/g)) {
        const props = {};
        for (const d of m[2].split(';')) {
            const [k, ...r] = d.split(':');
            if (k && r.length)
                props[k.trim()] = r.join(':').trim();
        }
        map[m[1]] = { ...(map[m[1]] || {}), ...props };
    }
    return map;
}
const padOf = (p) => { const m = (p['padding'] || '').match(/([\d.]+)px(?:\s+([\d.]+)px)?/); if (!m)
    return null; return m[2] ? `const EdgeInsets.symmetric(vertical: ${m[1]}, horizontal: ${m[2]})` : `const EdgeInsets.all(${m[1]})`; };
const VOID = new Set(['br', 'hr', 'img', 'input', 'path', 'meta', 'link', 'use', 'circle', 'rect', 'line', 'polyline', 'polygon']);
function parseTree(html) {
    const root = { tag: '#root', cls: [], text: '', children: [] };
    const stack = [root];
    const re = /<(\/?)([\w-]+)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>|([^<]+)/g;
    let m, guard = 0;
    while ((m = re.exec(html)) && guard++ < 20000) {
        const [, close, tag, attrs = '', selfClose, text] = m;
        if (text != null) {
            const t = text.replace(/\s+/g, ' ').trim();
            if (t)
                stack[stack.length - 1].text += (stack[stack.length - 1].text ? ' ' : '') + t;
            continue;
        }
        if (close) {
            for (let i = stack.length - 1; i > 0; i--) {
                if (stack[i].tag === tag) {
                    stack.length = i;
                    break;
                }
            }
            continue;
        }
        const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
        const node = { tag, cls: cls.split(/\s+/).filter(Boolean), text: '', children: [] };
        stack[stack.length - 1].children.push(node);
        if (!selfClose && !VOID.has(tag))
            stack.push(node);
    }
    return root;
}
const CHROME = new Set(['bar', 'seg', 'toolbar', 'mk', 'ind', 'tick', 'wrap', 'page', 'body']);
function isSurface(node, css) {
    if (CHROME.has(node.cls[0] || ''))
        return false;
    const p = node.cls.map((c) => css[c] || {}).reduce((a, b) => ({ ...a, ...b }), {});
    const styled = /var\(--/.test((p['border'] || '') + (p['background'] || '') + (p['background-color'] || '')) && /radius/.test(p['border-radius'] || 'radius');
    return styled && node.children.length >= 1;
}
function findCanon(node, css) {
    if (/^(row|list|card|surface|tile|panel|item)$/.test(node.cls[0] || '') && node.children.length)
        return node;
    for (const c of node.children) {
        const f = findCanon(c, css);
        if (f)
            return f;
    }
    if (isSurface(node, css))
        return node;
    for (const c of node.children) {
        if (isSurface(c, css))
            return c;
    }
    return null;
}
export function inner$cssVar$m(v) {
    const m = String(v).match(/var\(--([a-z0-9-]+)\)/);
    return m;
}
export function inner$asColor$d(v) {
    const d = cssVar(v);
    return d;
}
export function inner$asColor$h(v) {
    const h = String(v).match(/#([0-9a-fA-F]{6})/);
    return h;
}
export function inner$asFont$d(v) {
    const d = cssVar(v);
    return d;
}
export function inner$parseCss$style(html) {
    const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
    return style;
}
export function inner$parseCss$k(d) {
    const [k, ...r] = d.split(':');
    return k;
}
export function inner$parseCss$r(d) {
    const [k, ...r] = d.split(':');
    return r;
}
export function inner$textStyle$sz(p) {
    const sz = p['font-size'] && p['font-size'].match(/([\d.]+)px/);
    return sz;
}
export function inner$textStyle$ls(p) {
    const ls = p['letter-spacing'] && p['letter-spacing'].match(/(-?[\d.]+)/);
    return ls;
}
export function inner$textStyle$style(parts) {
    const style = parts.length ? `TextStyle(${parts.join(', ')})` : null;
    return style;
}
export function inner$boxDeco$bgVar(p) {
    const bgVar = (p['background'] || p['background-color'] || '').match(/var\(--([a-z0-9-]+)\)/);
    return bgVar;
}
export function inner$boxDeco$rad(p) {
    const rad = (p['border-radius'] || '').match(/([\d.]+)px/);
    return rad;
}
export function inner$boxDeco$bord(p) {
    const bord = (p['border'] || '').match(/var\(--([a-z0-9-]+)\)/);
    return bord;
}
export function inner$padOf$m(p) {
    const m = (p['padding'] || '').match(/([\d.]+)px(?:\s+([\d.]+)px)?/);
    return m;
}
export function inner$parseTree$t(text) {
    const t = text.replace(/\s+/g, ' ').trim();
    return t;
}
export function inner$parseTree$i(stack) {
    let i = stack.length - 1;
    return i;
}
export function inner$parseTree$cls(attrs) {
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    return cls;
}
export function inner$parseTree$node(tag, attrs) {
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    const node = { tag, cls: cls.split(/\s+/).filter(Boolean), text: '', children: [] };
    return node;
}
export function inner$parseTree$node$$step(tag, cls) {
    const node = { tag, cls: cls.split(/\s+/).filter(Boolean), text: '', children: [] };
    return node;
}
export function inner$nodeToDart$p(node, css) {
    const p = node.cls.map((c) => css[c] || {}).reduce((a, b) => ({ ...a, ...b }), {});
    return p;
}
export function inner$nodeToDart$isFlex(node, css) {
    const p = node.cls.map((c) => css[c] || {}).reduce((a, b) => ({ ...a, ...b }), {});
    const isFlex = /flex/.test(p['display'] || '') || node.cls.includes('row') || node.cls.includes('main');
    return isFlex;
}
export function inner$nodeToDart$isFlex$$step(node, p) {
    const isFlex = /flex/.test(p['display'] || '') || node.cls.includes('row') || node.cls.includes('main');
    return isFlex;
}
export function inner$nodeToDart$svg(node) {
    const svg = node.tag === 'svg' || node.children.some((c) => c.tag === 'path');
    return svg;
}
export function inner$nodeToDart$pad(node, css) {
    const p = node.cls.map((c) => css[c] || {}).reduce((a, b) => ({ ...a, ...b }), {});
    const pad = padOf(p);
    return pad;
}
export function inner$nodeToDart$pad$$step(p) {
    const pad = padOf(p);
    return pad;
}
export function inner$isSurface$p(node, css) {
    const p = node.cls.map((c) => css[c] || {}).reduce((a, b) => ({ ...a, ...b }), {});
    return p;
}
export function inner$isSurface$styled(node, css) {
    const p = node.cls.map((c) => css[c] || {}).reduce((a, b) => ({ ...a, ...b }), {});
    const styled = /var\(--/.test((p['border'] || '') + (p['background'] || '') + (p['background-color'] || '')) && /radius/.test(p['border-radius'] || 'radius');
    return styled;
}
export function inner$isSurface$styled$$step(p) {
    const styled = /var\(--/.test((p['border'] || '') + (p['background'] || '') + (p['background-color'] || '')) && /radius/.test(p['border-radius'] || 'radius');
    return styled;
}
export function inner$findCanon$f(css, c) {
    const f = findCanon(c, css);
    return f;
}
export function inner$forgeFamily$css(html) {
    const css = parseCss(html);
    return css;
}
export function inner$forgeFamily$body(html) {
    const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [])[1] || html;
    return body;
}
export function inner$forgeFamily$canon(html) {
    const css = parseCss(html);
    const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [])[1] || html;
    const canon = findCanon(parseTree(body), css);
    return canon;
}
export function inner$forgeFamily$canon$$step(css, body) {
    const canon = findCanon(parseTree(body), css);
    return canon;
}
export function inner$forgeFamily$cls(family) {
    const cls = 'Forged' + family.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase());
    return cls;
}
export function inner$forgeFamily$reads(usedSeam) {
    const reads = [...usedSeam].sort().map((ch) => ch === 'skin' ? '    final skin = DsSeam.skinOf(context);' : ch === 'theme' ? '    final theme = DsSeam.of(context);' : '    final fonts = DsSeam.fontsOf(context);').join('\n');
    return reads;
}
export function inner$forgeFamily$code(usedSeam, family, tree) {
    const cls = 'Forged' + family.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase());
    const reads = [...usedSeam].sort().map((ch) => ch === 'skin' ? '    final skin = DsSeam.skinOf(context);' : ch === 'theme' ? '    final theme = DsSeam.of(context);' : '    final fonts = DsSeam.fontsOf(context);').join('\n');
    const code = `// 🏭 חושל ע"י pure-forge ממקור-האמת machtzev/pure/${family}-family.html — seam-aware, אל תערוך ידנית.
  import 'package:flutter/material.dart';
  import '../ds/ds_seam.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
    @override
    Widget build(BuildContext context) {
  ${reads || '    // אין תלות-חריץ'}
      return ${tree};
    }
  }
  `;
    return code;
}
export function inner$forgeFamily$code$$step(family, tree, cls, reads) {
    const code = `// 🏭 חושל ע"י pure-forge ממקור-האמת machtzev/pure/${family}-family.html — seam-aware, אל תערוך ידנית.
  import 'package:flutter/material.dart';
  import '../ds/ds_seam.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
    @override
    Widget build(BuildContext context) {
  ${reads || '    // אין תלות-חריץ'}
      return ${tree};
    }
  }
  `;
    return code;
}
export function inner$parseCss$map$$after_loop(html) {
    const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
    const map = {};
    for (const m of style.matchAll(/\.([a-z][a-z0-9_-]*)\s*\{([^}]*)\}/g)) {
        const props = {};
        for (const d of m[2].split(';')) {
            const [k, ...r] = d.split(':');
            if (k && r.length)
                props[k.trim()] = r.join(':').trim();
        }
        map[m[1]] = { ...(map[m[1]] || {}), ...props };
    }
    return map;
}
export function inner$parseCss$props$$after_loop(m) {
    const props = {};
    for (const d of m[2].split(';')) {
        const [k, ...r] = d.split(':');
        if (k && r.length)
            props[k.trim()] = r.join(':').trim();
    }
    return props;
}

export const SIGS = {
  inner$cssVar$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$asColor$d: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$asColor$h: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$asFont$d: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseCss$style: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$parseCss$k: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$parseCss$r: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$textStyle$sz: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$textStyle$ls: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$textStyle$style: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$boxDeco$bgVar: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$boxDeco$rad: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$boxDeco$bord: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$padOf$m: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$parseTree$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseTree$i: [{"name":"stack","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["cls",{"t":"arr","of":{"t":"undef"}},false],["text",{"t":"str"},false],["children",{"t":"arr","of":{"t":"undef"}},false]]}},"opt":false}],
  inner$parseTree$cls: [{"name":"attrs","d":{"t":"str"},"opt":false}],
  inner$parseTree$node: [{"name":"tag","d":{"t":"str"},"opt":false},{"name":"attrs","d":{"t":"str"},"opt":false}],
  inner$parseTree$node$$step: [{"name":"tag","d":{"t":"str"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false}],
  inner$nodeToDart$p: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"css","d":{"t":"any"},"opt":false}],
  inner$nodeToDart$isFlex: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"css","d":{"t":"any"},"opt":false}],
  inner$nodeToDart$isFlex$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$nodeToDart$svg: [{"name":"node","d":{"t":"any"},"opt":false}],
  inner$nodeToDart$pad: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"css","d":{"t":"any"},"opt":false}],
  inner$nodeToDart$pad$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$isSurface$p: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"css","d":{"t":"any"},"opt":false}],
  inner$isSurface$styled: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"css","d":{"t":"any"},"opt":false}],
  inner$isSurface$styled$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$findCanon$f: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$css: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$body: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$canon: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$canon$$step: [{"name":"css","d":{"t":"obj","n":"map","p":[]},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$cls: [{"name":"family","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$reads: [{"name":"usedSeam","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$forgeFamily$code: [{"name":"usedSeam","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"family","d":{"t":"any"},"opt":false},{"name":"tree","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$code$$step: [{"name":"family","d":{"t":"any"},"opt":false},{"name":"tree","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"reads","d":{"t":"str"},"opt":false}],
  inner$parseCss$map$$after_loop: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$parseCss$props$$after_loop: [{"name":"m","d":{"t":"any"},"opt":false}],
};
