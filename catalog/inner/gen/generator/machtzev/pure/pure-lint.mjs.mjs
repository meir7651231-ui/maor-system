// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/pure/pure-lint.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CURRENCY = /[₪€]/;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{FE0F}]/u;
const GLYPH_ICONS = /[⌄‹›★☆▲▼◂▸«»➤➜●○◆■]/;
const stripToContent = h => h
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
const styleCss = h => [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const scriptJs = h => [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');
const leafRules = css => [...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
const pxOf = (body, prop) => { const m = body.match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*(\\d+(?:\\.\\d+)?)px', 'i')); return m ? parseFloat(m[1]) : null; };
function lum(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3)
        c = c.split('').map(x => x + x).join('');
    const ch = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a, b) => { const x = lum(a), y = lum(b); const hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
const tokMap = body => { const m = {}; for (const x of body.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/gi))
    m[x[1]] = x[2]; return m; };
const classesOf = s => (s.match(/\.[A-Za-z][\w-]*/g) || []);
const subjectClass = sel => {
    const last = sel.split(/[\s>+~]+/).pop() || '';
    if (!last.startsWith('.'))
        return null; // tag subject (button/a/…): native, skip
    return (last.match(/^\.([\w-]+)/) || [])[1] || null;
};
export function inner$pxOf$m(body, prop) {
    const m = body.match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*(\\d+(?:\\.\\d+)?)px', 'i'));
    return m;
}
export function inner$lum$c(hex) {
    let c = hex.replace('#', '');
    return c;
}
export function inner$lum$ch(c) {
    const ch = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return ch;
}
export function inner$contrast$x(a) {
    const x = lum(a);
    return x;
}
export function inner$contrast$y(b) {
    const y = lum(b);
    return y;
}
export function inner$contrast$hi(a, b) {
    const x = lum(a);
    const y = lum(b);
    const hi = Math.max(x, y);
    return hi;
}
export function inner$contrast$hi$$step(x, y) {
    const hi = Math.max(x, y);
    return hi;
}
export function inner$contrast$lo(a, b) {
    const x = lum(a);
    const y = lum(b);
    const lo = Math.min(x, y);
    return lo;
}
export function inner$contrast$lo$$step(x, y) {
    const lo = Math.min(x, y);
    return lo;
}
export function inner$lintHtml$css(html) {
    const css = styleCss(html);
    return css;
}
export function inner$lintHtml$js(html) {
    const js = scriptJs(html);
    return js;
}
export function inner$lintHtml$content(html) {
    const content = stripToContent(html);
    return content;
}
export function inner$lintHtml$rules(html) {
    const css = styleCss(html);
    const rules = leafRules(css);
    return rules;
}
export function inner$lintHtml$rules$$step(css) {
    const rules = leafRules(css);
    return rules;
}
export function inner$lintHtml$rm(html) {
    const css = styleCss(html);
    const rm = css.match(/@media[^{]*prefers-reduced-motion[^{]*\{([\s\S]*?\})\s*\}/i);
    return rm;
}
export function inner$lintHtml$rm$$step(css) {
    const rm = css.match(/@media[^{]*prefers-reduced-motion[^{]*\{([\s\S]*?\})\s*\}/i);
    return rm;
}
export function inner$lintHtml$themeRules(html) {
    const css = styleCss(html);
    const rules = leafRules(css);
    const themeRules = rules.filter(r => /\.t-[a-z]/i.test(r.sel));
    return themeRules;
}
export function inner$lintHtml$themeRules$$step(rules) {
    const themeRules = rules.filter(r => /\.t-[a-z]/i.test(r.sel));
    return themeRules;
}
export function inner$lintHtml$bgName() {
    const root = {};
    const bgName = root['--surface'] ? '--surface' : '--canvas';
    return bgName;
}
export function inner$lintHtml$bgName$$step(root) {
    const bgName = root['--surface'] ? '--surface' : '--canvas';
    return bgName;
}
export function inner$lintHtml$cr(tok) {
    const root = {};
    const bg = root['--surface'] || root['--canvas'];
    const cr = contrast(root[tok], bg);
    return cr;
}
export function inner$lintHtml$cr$$step(root, bg, tok) {
    const cr = contrast(root[tok], bg);
    return cr;
}
export function inner$lintHtml$tm(r) {
    const tm = tokMap(r.body);
    return tm;
}
export function inner$lintHtml$cr_L106(ah) {
    const root = {};
    const bg = root['--surface'] || root['--canvas'];
    const cr = contrast(ah, bg);
    return cr;
}
export function inner$lintHtml$cr_L106$$step(bg, ah) {
    const cr = contrast(ah, bg);
    return cr;
}
export function inner$lintHtml$cm(html) {
    const content = stripToContent(html);
    const cm = CURRENCY.exec(content);
    return cm;
}
export function inner$lintHtml$cm$$step(content) {
    const cm = CURRENCY.exec(content);
    return cm;
}
export function inner$lintHtml$em(html) {
    const content = stripToContent(html);
    const em = EMOJI.exec(content);
    return em;
}
export function inner$lintHtml$em$$step(content) {
    const em = EMOJI.exec(content);
    return em;
}
export function inner$lintHtml$gm(html) {
    const content = stripToContent(html);
    const gm = GLYPH_ICONS.exec(content);
    return gm;
}
export function inner$lintHtml$gm$$step(content) {
    const gm = GLYPH_ICONS.exec(content);
    return gm;
}
export function inner$lintHtml$h(r) {
    const h = pxOf(r.body, 'min-height') ?? pxOf(r.body, 'height');
    return h;
}
export function inner$lintHtml$w(r) {
    const w = pxOf(r.body, 'width');
    return w;
}
export function inner$lintHtml$square(r) {
    const h = pxOf(r.body, 'min-height') ?? pxOf(r.body, 'height');
    const w = pxOf(r.body, 'width');
    const square = w != null && w === h;
    return square;
}
export function inner$lintHtml$square$$step(h, w) {
    const square = w != null && w === h;
    return square;
}
export function inner$lintHtml$floor(r) {
    const h = pxOf(r.body, 'min-height') ?? pxOf(r.body, 'height');
    const w = pxOf(r.body, 'width');
    const square = w != null && w === h;
    const floor = square ? 40 : 44;
    return floor;
}
export function inner$lintHtml$floor$$step(square) {
    const floor = square ? 40 : 44;
    return floor;
}
export function inner$lintHtml$esc(r) {
    const esc = r.sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return esc;
}
export function inner$lintHtml$ext(html, r) {
    const css = styleCss(html);
    const rules = leafRules(css);
    const esc = r.sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ext = rules.find(rr => new RegExp('^' + esc + '::(before|after)$').test(rr.sel.trim())
        && /position\s*:\s*absolute/i.test(rr.body) && /(inset|top|bottom)\s*:\s*-\d/.test(rr.body));
    return ext;
}
export function inner$lintHtml$ext$$step(rules, esc) {
    const ext = rules.find(rr => new RegExp('^' + esc + '::(before|after)$').test(rr.sel.trim())
        && /position\s*:\s*absolute/i.test(rr.body) && /(inset|top|bottom)\s*:\s*-\d/.test(rr.body));
    return ext;
}
export function inner$lintHtml$neg(html, r) {
    const css = styleCss(html);
    const rules = leafRules(css);
    const esc = r.sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ext = rules.find(rr => new RegExp('^' + esc + '::(before|after)$').test(rr.sel.trim())
        && /position\s*:\s*absolute/i.test(rr.body) && /(inset|top|bottom)\s*:\s*-\d/.test(rr.body));
    const neg = Math.max(0, ...[...ext.body.matchAll(/(?:inset|top|bottom)\s*:\s*-(\d+(?:\.\d+)?)px/g)].map(m => parseFloat(m[1])));
    return neg;
}
export function inner$lintHtml$neg$$step(ext) {
    const neg = Math.max(0, ...[...ext.body.matchAll(/(?:inset|top|bottom)\s*:\s*-(\d+(?:\.\d+)?)px/g)].map(m => parseFloat(m[1])));
    return neg;
}
export function inner$lintHtml$focusRules(html) {
    const css = styleCss(html);
    const rules = leafRules(css);
    const focusRules = rules.filter(r => /:focus-visible/i.test(r.sel)).map(r => r.sel);
    return focusRules;
}
export function inner$lintHtml$focusRules$$step(rules) {
    const focusRules = rules.filter(r => /:focus-visible/i.test(r.sel)).map(r => r.sel);
    return focusRules;
}
export function inner$lintHtml$cls(sel) {
    const cls = classesOf(sel);
    return cls;
}
export function inner$lintHtml$covered(html, sel) {
    const css = styleCss(html);
    const rules = leafRules(css);
    const focusRules = rules.filter(r => /:focus-visible/i.test(r.sel)).map(r => r.sel);
    const cls = classesOf(sel);
    const covered = focusRules.some(f => classesOf(f).some(c => cls.includes(c)));
    return covered;
}
export function inner$lintHtml$covered$$step(focusRules, cls) {
    const covered = focusRules.some(f => classesOf(f).some(c => cls.includes(c)));
    return covered;
}
export function inner$lintHtml$subjectClass$last(sel) {
    const last = sel.split(/[\s>+~]+/).pop() || '';
    return last;
}
export function inner$lintHtml$clickClasses(interactive) {
    const clickClasses = new Set(interactive.map(subjectClass).filter(Boolean));
    return clickClasses;
}
export function inner$lintHtml$clsM(attrs) {
    const clsM = attrs.match(/class=["']([^"']+)["']/);
    return clsM;
}
export function inner$lintHtml$hit(interactive, attrs) {
    const clickClasses = new Set(interactive.map(subjectClass).filter(Boolean));
    const clsM = attrs.match(/class=["']([^"']+)["']/);
    const hit = clsM[1].split(/\s+/).find(c => clickClasses.has(c));
    return hit;
}
export function inner$lintHtml$hit$$step(clickClasses, clsM) {
    const hit = clsM[1].split(/\s+/).find(c => clickClasses.has(c));
    return hit;
}
export function inner$tokMap$m$$after_loop(body) {
    const m = {};
    for (const x of body.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/gi))
        m[x[1]] = x[2];
    return m;
}
export function inner$lintHtml$kbCount$$after_loop(html, interactive) {
    const clickClasses = new Set(interactive.map(subjectClass).filter(Boolean));
    const kbCount = {};
    for (const mt of html.matchAll(/<(div|li)\b([^>]*)>/gi)) {
        const attrs = mt[2];
        const clsM = attrs.match(/class=["']([^"']+)["']/);
        if (!clsM)
            continue;
        if (/\brole=/.test(attrs) || /\btabindex=/.test(attrs))
            continue;
        const hit = clsM[1].split(/\s+/).find(c => clickClasses.has(c));
        if (!hit)
            continue;
        kbCount[hit] = (kbCount[hit] || 0) + 1;
    }
    return kbCount;
}

export const SIGS = {
  inner$pxOf$m: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"prop","d":{"t":"any"},"opt":false}],
  inner$lum$c: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$lum$ch: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$contrast$x: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$contrast$y: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$contrast$hi: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$contrast$hi$$step: [{"name":"x","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$contrast$lo: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$contrast$lo$$step: [{"name":"x","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$lintHtml$css: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$js: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$content: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$rules: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$rules$$step: [{"name":"css","d":{"t":"str"},"opt":false}],
  inner$lintHtml$rm: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$rm$$step: [{"name":"css","d":{"t":"str"},"opt":false}],
  inner$lintHtml$themeRules: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$themeRules$$step: [{"name":"rules","d":{"t":"arr","of":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]}},"opt":false}],
  inner$lintHtml$bgName: [],
  inner$lintHtml$bgName$$step: [{"name":"root","d":{"t":"obj","n":"root","p":[]},"opt":false}],
  inner$lintHtml$cr: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$lintHtml$cr$$step: [{"name":"root","d":{"t":"obj","n":"root","p":[]},"opt":false},{"name":"bg","d":{"t":"any"},"opt":false},{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$lintHtml$tm: [{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$cr_L106: [{"name":"ah","d":{"t":"any"},"opt":false}],
  inner$lintHtml$cr_L106$$step: [{"name":"bg","d":{"t":"any"},"opt":false},{"name":"ah","d":{"t":"any"},"opt":false}],
  inner$lintHtml$cm: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$cm$$step: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$lintHtml$em: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$em$$step: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$lintHtml$gm: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$gm$$step: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$lintHtml$h: [{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$w: [{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$square: [{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$square$$step: [{"name":"h","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"w","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$lintHtml$floor: [{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$floor$$step: [{"name":"square","d":{"t":"bool"},"opt":false}],
  inner$lintHtml$esc: [{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$ext: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$ext$$step: [{"name":"rules","d":{"t":"arr","of":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]}},"opt":false},{"name":"esc","d":{"t":"any"},"opt":false}],
  inner$lintHtml$neg: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$lintHtml$neg$$step: [{"name":"ext","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]}]},"opt":false}],
  inner$lintHtml$focusRules: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$lintHtml$focusRules$$step: [{"name":"rules","d":{"t":"arr","of":{"t":"obj","p":[["sel",{"t":"any"},false],["body",{"t":"any"},false]]}},"opt":false}],
  inner$lintHtml$cls: [{"name":"sel","d":{"t":"any"},"opt":false}],
  inner$lintHtml$covered: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"sel","d":{"t":"any"},"opt":false}],
  inner$lintHtml$covered$$step: [{"name":"focusRules","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$lintHtml$subjectClass$last: [{"name":"sel","d":{"t":"any"},"opt":false}],
  inner$lintHtml$clickClasses: [{"name":"interactive","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$lintHtml$clsM: [{"name":"attrs","d":{"t":"any"},"opt":false}],
  inner$lintHtml$hit: [{"name":"interactive","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"attrs","d":{"t":"any"},"opt":false}],
  inner$lintHtml$hit$$step: [{"name":"clickClasses","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"clsM","d":{"t":"any"},"opt":false}],
  inner$tokMap$m$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$lintHtml$kbCount$$after_loop: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"interactive","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
