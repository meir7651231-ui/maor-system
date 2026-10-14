// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/ds-forge.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SKIN = { canvas: 'canvas', sunken: 'sunken', surface: 'surface', raised: 'raised', raised2: 'raised2',
    ink: 'ink', mut: 'mut', faint: 'faint', hair: 'hair', hair2: 'hair2', ok: 'ok', warn: 'warn', err: 'err', gold: 'gold', 'on-a': 'onA', hi: 'hi', shade: 'shade' };
const LIT_TOKEN = { '0b0b0d': 'onA', 'ffffff': 'hi', '000000': 'shade', '0c0c0e': 'canvas', '0a0a0c': 'sunken', '151517': 'surface', '1b1b1e': 'raised', '212126': 'raised2',
    'ece9e2': 'ink', '9b968c': 'mut', '6e6a62': 'faint', '43d08c': 'ok', 'e6b84f': 'warn', 'e0574e': 'err', 'e6c766': 'gold' };
const RGB_TOKEN = { '11,11,13': 'onA', '255,255,255': 'hi', '0,0,0': 'shade', '12,12,14': 'canvas', '10,10,12': 'sunken', '236,233,226': 'ink' };
function tokenLit(v) {
    v = v.trim().toLowerCase();
    const inner = v.match(/(#[0-9a-f]{3,6}\b|rgba?\([^)]*\))/);
    if (inner && inner[1] !== v)
        v = inner[1]; // "1px solid rgba(…)" ⇒ הצבע עצמו (כמו litColor הלא-מעוגן)
    let m = v.match(/^#([0-9a-f]{6})$/);
    if (m && LIT_TOKEN[m[1]])
        return `skin.${LIT_TOKEN[m[1]]}`;
    m = v.match(/^#([0-9a-f]{3})$/);
    if (m) {
        const c = m[1];
        const h = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        if (LIT_TOKEN[h])
            return `skin.${LIT_TOKEN[h]}`;
    }
    m = v.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
        const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
        const key = `${+r},${+g},${+b}`;
        const tk = RGB_TOKEN[key];
        if (!tk)
            return null;
        const al = parseFloat(a);
        if (tk === 'ink' && al === 0.09)
            return 'skin.hair';
        if (tk === 'ink' && al === 0.05)
            return 'skin.hair2'; // hair/hair2 = ink-alpha ⇒ הטוקן עצמו
        return al >= 1 ? `skin.${tk}` : `skin.${tk}.withValues(alpha: ${al})`;
    }
    return null;
}
const THEME = { 'a-hi': 'aHi', 'a': 'a', 'a-800': 'a800', 'gl': 'gl', 'c2': 'c2', 'c3': 'c3' };
const FONT = { serif: 'serif', serifHe: 'serifHe', grotesk: 'grotesk', he: 'he' };
const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
function litColor(v) {
    v = v.trim();
    const tk = tokenLit(v);
    if (tk)
        return tk; // G28 · ליטרל שהוא טוקן-בתחפושת ⇒ הטוקן (העור מחליף לבד)
    if (/^#([0-9a-f]{6})$/i.test(v))
        return `const Color(0xFF${v.slice(1).toUpperCase()})`;
    if (/^#([0-9a-f]{3})$/i.test(v)) {
        const c = v.slice(1);
        return `const Color(0xFF${(c[0] + c[0] + c[1] + c[1] + c[2] + c[2]).toUpperCase()})`;
    }
    const m = v.match(/rgba?\(([^)]+)\)/);
    if (m) {
        const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
        return `const Color(0x${hx(parseFloat(a) * 255)}${hx(+r)}${hx(+g)}${hx(+b)})`;
    }
    return null;
}
function resolveVars(val, vars) {
    if (!val || typeof val !== 'string' || !val.includes('var(') || !vars)
        return val;
    let out = val, prev, guard = 0;
    do {
        prev = out;
        out = out.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,[^()]*)?\)/gi, (m, name) => (vars[name] != null ? vars[name] : m));
    } while (out !== prev && ++guard < 12);
    return out;
}
function colorExpr(val) {
    if (!val)
        return null;
    if (/^\s*transparent\s*$/i.test(val))
        return 'const Color(0x00000000)'; // עצירת-transparent בגרדיאנט (scrim/fade) — בלי זה gradientExpr נכשל ונצבע צבע-אחיד-כהה
    // color-mix(in …, A N%, B): A במשקל N% + B ב-(100-N)%. B=transparent ⇒ A.withValues(alpha:N/100) (שקיפות);
    // B=צבע-אטום (למשל var(--raised2)) ⇒ Color.lerp(B, A, N/100) — מיזוג-אמת. בלי זה נצבע A שקוף במקום המיזוג-הכהה.
    const cm = val.match(/color-mix\(\s*in\s+[^,]+,\s*([^,]+?)\s*(\d+(?:\.\d+)?)%\s*,\s*(var\(--[a-z0-9-]+\)|[^,)]+)\s*\)/i);
    if (cm) {
        const cA = colorExpr(cm[1].trim()), p = (+cm[2] / 100).toFixed(3), second = cm[3].trim();
        if (cA) {
            if (/^transparent$/i.test(second))
                return `${cA}.withValues(alpha: ${p})`;
            const cB = colorExpr(second);
            if (cB)
                return `Color.lerp(${cB}, ${cA}, ${p})!`;
        }
    }
    const vm = val.match(/var\(--([a-z0-9-]+)\)/i);
    if (vm) {
        const k = vm[1];
        if (SKIN[k])
            return `skin.${SKIN[k]}`;
        if (THEME[k])
            return `theme.${THEME[k]}`;
    }
    const lit = litColor(val);
    if (lit)
        return lit;
    return null; // גרדיאנט/לא-מזוהה ⇒ null (הקורא מדלג)
}
function splitTop(s) {
    const out = [];
    let d = 0, cur = '';
    for (const ch of s) {
        if (ch === '(')
            d++;
        else if (ch === ')')
            d--;
        if (ch === ',' && d === 0) {
            out.push(cur.trim());
            cur = '';
        }
        else
            cur += ch;
    }
    if (cur.trim())
        out.push(cur.trim());
    return out;
}
function gradientExpr(val) {
    const m = val && val.match(/linear-gradient\((.*)\)\s*$/i);
    if (!m)
        return null;
    const parts = splitTop(m[1]);
    let begin = 'Alignment.topCenter', end = 'Alignment.bottomCenter';
    if (/deg/.test(parts[0]) || /^to\s/.test(parts[0])) {
        const a = parts.shift();
        const deg = /(-?\d+)deg/.test(a) ? +RegExp.$1 : (/to right/.test(a) ? 90 : /to left/.test(a) ? 270 : 180);
        const map = { 0: ['bottomCenter', 'topCenter'], 90: ['centerLeft', 'centerRight'], 180: ['topCenter', 'bottomCenter'],
            270: ['centerRight', 'centerLeft'], 135: ['topLeft', 'bottomRight'], 45: ['bottomLeft', 'topRight'], 225: ['topRight', 'bottomLeft'] };
        const mm = map[(deg % 360 + 360) % 360] || ['topCenter', 'bottomCenter'];
        begin = `Alignment.${mm[0]}`;
        end = `Alignment.${mm[1]}`;
    }
    const cols = [];
    for (const p of parts) {
        const c = colorExpr(p.replace(/\s+\d+%\s*$/, ''));
        if (!c)
            return null;
        cols.push(c);
    }
    if (cols.length < 2)
        return null;
    return `LinearGradient(colors: [${cols.join(', ')}], begin: ${begin}, end: ${end})`;
}
function radialExpr(val, baseColor) {
    const m = val && val.match(/radial-gradient\((.*)\)/i);
    if (!m)
        return null;
    const inner = splitTop(m[1]);
    let center = 'Alignment.center', radius = '0.8';
    if (inner.length && /\bat\b|%/.test(inner[0]) && !colorExpr(inner[0].replace(/\s+[\d.]+%.*$/, '').trim())) {
        const seg = inner.shift();
        const at = seg.match(/at\s+(-?[\d.]+)%\s+(-?[\d.]+)%/); // ‏-? = מיקום שלילי (at 85% -20%) — בלעדיו הזוהר נפל למרכז
        if (at)
            center = `Alignment(${(+at[1] / 50 - 1).toFixed(2)}, ${(+at[2] / 50 - 1).toFixed(2)})`;
        const sz = seg.match(/([\d.]+)%/);
        if (sz)
            radius = (+sz[1] / 100).toFixed(2);
    }
    const cols = [], stops = [];
    for (const seg of inner) {
        const sm = seg.trim().match(/^(.*?)(?:\s+([\d.]+)%)?$/);
        const cexpr = /transparent/.test(sm[1]) ? baseColor : colorExpr(sm[1].trim());
        if (!cexpr)
            return null;
        cols.push(cexpr);
        stops.push(sm[2] != null ? (+sm[2] / 100).toFixed(2) : (stops.length ? '1.0' : '0.0'));
    }
    if (cols.length < 2)
        return null;
    return `RadialGradient(center: ${center}, radius: ${radius}, colors: [${cols.join(', ')}], stops: [${stops.join(', ')}])`;
}
function conicExpr(val) {
    const m = val && val.match(/conic-gradient\((.*)\)/is);
    if (!m)
        return null;
    const parts = splitTop(m[1]);
    let from = 0;
    if (parts.length && /^\s*from\s/i.test(parts[0])) {
        const fm = parts.shift().match(/from\s+(-?[\d.]+)deg/i);
        if (fm)
            from = +fm[1];
    }
    const cols = [];
    for (const seg of parts) {
        const c = colorExpr(seg.trim().replace(/\s+-?[\d.]+(?:deg|%)\s*$/i, '').trim());
        if (!c)
            return null;
        cols.push(c);
    }
    if (cols.length < 2)
        return null;
    const rot = (((from - 90) % 360) * Math.PI / 180).toFixed(4);
    return `SweepGradient(colors: [${cols.join(', ')}], transform: const GradientRotation(${rot}))`;
}
function fontExpr(val) {
    const m = val && val.match(/var\(--(serif|serifHe|grotesk|he)\)/);
    return m ? `fonts.${FONT[m[1]]}` : null;
}
const evalCalc = v => {
    if (typeof v !== 'string' || !/calc\(/i.test(v))
        return null;
    const m = /calc\(\s*(-?[\d.]+)(?:px)?\s*([*/+-])\s*(-?[\d.]+)(?:px)?\s*\)/i.exec(v);
    if (!m)
        return null;
    const a = parseFloat(m[1]), b = parseFloat(m[3]), op = m[2];
    const r = op === '*' ? a * b : op === '/' ? a / b : op === '+' ? a + b : a - b;
    return isFinite(r) ? r : null;
};
const VW_PX = 560;
const VH_PX = 1400;
const vwPx = v => {
    const m = typeof v === 'string' && /^\s*(-?[\d.]+)(vw|vh|vmin|vmax)\s*$/i.exec(v);
    if (!m)
        return null;
    const n = parseFloat(m[1]), u = m[2].toLowerCase();
    const base = u === 'vw' ? VW_PX : u === 'vh' ? VH_PX : u === 'vmin' ? Math.min(VW_PX, VH_PX) : Math.max(VW_PX, VH_PX);
    return n / 100 * base;
};
const evalClamp = v => {
    if (typeof v !== 'string' || !/clamp\(/i.test(v))
        return null;
    const m = /clamp\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,)]+?)\s*\)/i.exec(v);
    if (!m)
        return null;
    const toN = x => { const p = px(x); if (p != null)
        return +p; const w = vwPx(x); return w != null ? w : null; };
    const lo = toN(m[1]), pref = toN(m[2]), hi = toN(m[3]);
    if (lo == null || pref == null || hi == null)
        return null;
    return Math.min(Math.max(pref, lo), hi);
};
const toN = x => { const p = px(x); if (p != null)
    return +p; const w = vwPx(x); return w != null ? w : null; };
const px = v => { const cl = evalClamp(v); if (cl != null)
    return (+cl.toFixed(3)).toString(); const c = evalCalc(v); if (c != null)
    return (+c.toFixed(3)).toString(); const w = vwPx(v); if (w != null)
    return (+w.toFixed(3)).toString(); const m = v && String(v).match(/(?<![\d.])(-?(?:\d+(?:\.\d+)?|\.\d+))px/); return m ? m[1].replace(/^(-?)\./, '$10.') : null; };
const pct = v => { const m = v && String(v).match(/^\s*(\d+(?:\.\d+)?)%\s*$/); return m ? (+m[1] / 100).toFixed(3) : null; };
const num = v => { const m = v && String(v).match(/-?(?:\d+\.?\d*|\.\d+)/); if (!m)
    return null; return m[0].replace(/^-\./, '-0.').replace(/^\./, '0.'); };
const simple = tok => {
    if (/^(\.[a-z0-9-]+)+$/i.test(tok))
        return { cls: tok.split('.').filter(Boolean) };
    if (/^[a-z][a-z0-9]*$/i.test(tok))
        return { tag: tok.toLowerCase() };
    const tc = /^([a-z][a-z0-9]*)((?:\.[a-z0-9-]+)+)$/i.exec(tok); // תג+מחלקה: "i.ink"
    if (tc)
        return { tag: tc[1].toLowerCase(), cls: tc[2].split('.').filter(Boolean) };
    return null;
};
function pseudoKids(node, map, ancestors, sibIdx = 0) {
    if (!map.pseudo || !map.pseudo.length)
        return { before: [], after: [] };
    const classes = node.classes || [];
    const out = { before: [], after: [] };
    for (const r of map.pseudo) {
        const target = r.chain[r.chain.length - 1];
        const hit = (target.tag ? node.tag === target.tag : true) && (target.cls ? target.cls.every(c => classes.includes(c)) : true);
        if (!hit || !chainMatches(r.chain.slice(0, -1), ancestors))
            continue;
        const cm = /content\s*:\s*(?:"([^"]*)"|'([^']*)'|([^;]+))/.exec(Object.entries(r.decl).map(([k, v]) => `${k}:${v}`).join(';'));
        let text = '';
        if (cm) {
            const raw = cm[1] != null ? cm[1] : cm[2] != null ? cm[2] : (cm[3] || '').trim();
            if (/counter\(/.test(raw))
                text = String(sibIdx + 1); // content:counter(n) ⇒ מספר-הסידור (1-מבוסס)
            else if (!/attr\(|url\(/.test(raw))
                text = raw;
        }
        const style = Object.entries(r.decl).filter(([k]) => k !== 'content').map(([k, v]) => `${k}:${v}`).join(';');
        const kid = { tag: 'span', classes: [], attrs: { style }, children: text ? [{ text }] : [] };
        out[r.pos].push(kid);
    }
    return out;
}
function chainMatches(chain, ancestors) {
    let i = 0;
    for (const part of chain) {
        const cls = part.cls || []; // אבות נושאים מחלקות בלבד. חלק-תג-אב (‏.rate button svg — 'button')
        if (!cls.length)
            continue; // אין מעקב-תגי-אב ⇒ חלק-תג מדולג (‏.rate button svg ≈ .rate svg) — עדיף על אי-התאמה+קריסה.
        let found = false;
        while (i < ancestors.length) {
            if (cls.every(c => ancestors[i].includes(c))) {
                found = true;
                i++;
                break;
            }
            i++;
        }
        if (!found)
            return false;
    }
    return true;
}
const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'use', 'source']);
function parseDOM(html) {
    const root = { tag: '#root', classes: [], attrs: {}, children: [] };
    const stack = [root];
    const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;
    let m;
    while ((m = re.exec(html))) {
        if (m[0].startsWith('<!--'))
            continue;
        if (m[5] != null) { // טקסט
            const t = m[5].replace(/\s+/g, ' ');
            if (t.trim())
                stack[stack.length - 1].children.push({ text: decode(t) });
            continue;
        }
        const closing = m[1] === '/', tag = m[2].toLowerCase(), rawAttr = m[3] || '', selfClose = m[4] === '/';
        if (closing) {
            if (stack.length > 1 && stack[stack.length - 1].tag === tag)
                stack.pop();
            continue;
        }
        const attrs = {};
        let am;
        const are = /([\w-]+)(?:=("[^"]*"|'[^']*'|[^\s]+))?/g;
        while ((am = are.exec(rawAttr)))
            attrs[am[1].toLowerCase()] = am[2] ? am[2].replace(/^['"]|['"]$/g, '') : '';
        const node = { tag, classes: (attrs.class || '').split(/\s+/).filter(Boolean), attrs, children: [] };
        stack[stack.length - 1].children.push(node);
        if (!selfClose && !VOID.has(tag))
            stack.push(node);
    }
    return root;
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&times;/g, '×').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const dq = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$') + '"';
function siblingRuns(els) {
    const runs = [];
    let a = 0;
    while (a < els.length) {
        let b = a + 1;
        while (b < els.length && els[b].tag === els[a].tag)
            b++;
        // בתוך רצף-tag: מפרקים לרצפים שבהם החיתוך-המשותף ≥ (|classes|-1) לכל חבר
        let x = a;
        while (x < b) {
            let y = x + 1;
            let shared = new Set((els[x].classes || []).filter(c => !ITEM_MARK_CLS.test(c)));
            while (y < b) {
                const cy = (els[y].classes || []).filter(c => !ITEM_MARK_CLS.test(c));
                const sh = new Set([...shared].filter(c => cy.includes(c)));
                const okY = cy.length - sh.size <= 1 && [...shared].every(c => cy.includes(c) || (els.slice(x, y).every(m => (m.classes || []).filter(k => !ITEM_MARK_CLS.test(k)).length - sh.size <= 1)));
                if (!okY || (sh.size === 0 && (cy.length || shared.size)))
                    break;
                shared = sh;
                y++;
            }
            if (y - x >= 2) {
                const members = els.slice(x, y);
                const variantOf = (m) => (m.classes || []).filter(c => !ITEM_MARK_CLS.test(c) && !shared.has(c))[0] || '';
                const variants = [...new Set(members.map(variantOf))];
                runs.push({ start: x, members, variants, variantOf, leafy: members.every(m => !elemChildren(m).length && textOf(m)) });
            }
            x = y;
        }
        a = b;
    }
    return runs;
}
const ITEM_MARK_CLS = /^(?:sel|on|active|cur|current|checked|open|is-[a-z-]+)$/;
const isSelectable = (c) => { const a = c.attrs || {}; return c.tag === 'button' || c.tag === 'a' || 'aria-pressed' in a || 'aria-selected' in a || 'aria-checked' in a || 'role' in a || 'tabindex' in a; };
function textOf(node) { return node.children.filter(c => c.text != null).map(c => c.text).join('').trim(); }
function elemChildren(node) { return node.children.filter(c => c.tag && c.tag !== 'br'); }
function hasVAutoChild(node) { return elemChildren(node).some(c => /margin\s*:\s*auto(?:[\s;"]|$)/.test((c.attrs && c.attrs.style) || '')); }
function decoration(st) {
    const parts = [];
    const bgRaw = st['background'] || st['background-color'];
    const grad = gradientExpr(bgRaw) || conicExpr(bgRaw); // linear או conic (SweepGradient)
    if (grad)
        parts.push(`gradient: ${grad}`); // גרדיאנט גובר על מילוי-אחיד
    else if (bgRaw) { // רקע רב-שכבתי: שכבת-בסיס-אחיד + זוהר-radial (עומק)
        let bg = null, radSeg = null;
        for (const seg of splitTop(bgRaw)) { // בידוד שכבות (לא-חמדני — כל שכבה בנפרד)
            if (/radial-gradient/i.test(seg))
                radSeg = seg;
            else if (!/gradient\(/i.test(seg) && !bg) {
                const c = colorExpr(seg.trim());
                if (c)
                    bg = c;
            }
        }
        const rad = radSeg ? radialExpr(radSeg, bg || 'skin.sunken') : null;
        if (rad)
            parts.push(`gradient: ${rad}`); // RadialGradient עם צבע-הבסיס כעצירה-אחרונה (זוהר מתמזג)
        else if (bg)
            parts.push(`color: ${bg}`);
        else {
            const c = colorExpr(bgRaw);
            if (c)
                parts.push(`color: ${c}`);
        }
    }
    const br = st['border'], bcRaw = st['border-color']; // צבע-גבול יכול לבוא ב-property נפרד (border-color)
    if (br || bcRaw) {
        const bc = (br && colorExpr(br)) || (bcRaw && colorExpr(bcRaw)) || null;
        const wm = /(\d+(?:\.\d+)?)px/.exec(br || '');
        const bw = wm ? wm[1] : '1';
        if (bc)
            parts.push(`border: Border.all(color: ${bc}${+bw !== 1 ? `, width: ${bw}` : ''})`);
    }
    else {
        // גבולות-כיווניים (border-inline-start/end · border-left/right/top/bottom) — RTL: start=right, end=left.
        const sideMap = { 'border-top': 'top', 'border-bottom': 'bottom', 'border-left': 'left', 'border-right': 'right', 'border-inline-start': 'right', 'border-inline-end': 'left', 'border-block-start': 'top', 'border-block-end': 'bottom' };
        const sides = [];
        for (const prop in sideMap) {
            const v = st[prop];
            if (!v)
                continue;
            const c = colorExpr(v);
            if (!c)
                continue;
            const wm = /(\d+(?:\.\d+)?)px/.exec(v);
            sides.push(`${sideMap[prop]}: BorderSide(color: ${c}, width: ${wm ? wm[1] : '1'})`);
        }
        if (sides.length)
            parts.push(`border: Border(${sides.join(', ')})`);
    }
    const rad = st['border-radius'];
    // border-radius:50% = עגול-מלא ביחס-לגודל · Flutter circular(פיקסלים) — לא אחוז; המנוע לא יודע את הגודל
    // בזמן-חילול ⇒ ערך-גדול (999) שנחתך לעיגול/גלולה בכל מידה. circular(50) פיקסלים היה נכשל על קופסה >100px.
    if (rad) {
        const r = /%|999/.test(rad) ? '999' : (px(rad) || num(rad));
        if (r)
            parts.push(`borderRadius: BorderRadius.circular(${r})`);
    }
    const sh = shadowExpr(st['box-shadow']);
    if (sh)
        parts.push(`boxShadow: [${sh}]`);
    return parts.length ? `BoxDecoration(${parts.join(', ')})` : null;
}
function bgOverlayGlow(st) {
    const bgRaw = st['background'] || st['background-color'];
    if (!bgRaw || !gradientExpr(bgRaw))
        return null;
    const radSeg = splitTop(bgRaw).find(s => /radial-gradient/i.test(s));
    if (!radSeg)
        return null;
    const rad = radialExpr(radSeg, 'const Color(0x00000000)'); // עצירת-transparent = שקוף-אמיתי (הבסיס נחשף)
    if (!rad)
        return null;
    const rv = st['border-radius'], r = rv ? (/%|999/.test(rv) ? '999' : (px(rv) || num(rv))) : null;
    return `BoxDecoration(gradient: ${rad}${r ? `, borderRadius: BorderRadius.circular(${r})` : ''})`;
}
function edge(st, prop, noV) {
    const sh = st[prop];
    const per = { top: px(st[`${prop}-top`]), right: px(st[`${prop}-right`]), bottom: px(st[`${prop}-bottom`]), left: px(st[`${prop}-left`]) };
    // תכונות-לוגיות (RTL): inline-start⇒right · inline-end⇒left · block-start⇒top · block-end⇒bottom.
    // בלי זה padding-inline-start (הזחת-מרקר-רשימה) לא חל ⇒ מספר/נקודה חופפים לטקסט.
    const iis = px(st[`${prop}-inline-start`]), iie = px(st[`${prop}-inline-end`]), ibs = px(st[`${prop}-block-start`]), ibe = px(st[`${prop}-block-end`]);
    if (iis != null)
        per.right = iis;
    if (iie != null)
        per.left = iie;
    if (ibs != null)
        per.top = ibs;
    if (ibe != null)
        per.bottom = ibe;
    const hasPer = Object.values(per).some(v => v != null);
    if (!sh && !hasPer)
        return null;
    let t = 0, r = 0, b = 0, l = 0;
    if (sh) {
        const ns = sh.trim().split(/\s+/).map(x => (px(x) != null ? px(x) : (num(x) || '0')));
        if (ns.length === 1)
            [t, r, b, l] = [ns[0], ns[0], ns[0], ns[0]];
        else if (ns.length === 2)
            [t, r, b, l] = [ns[0], ns[1], ns[0], ns[1]];
        else if (ns.length === 3)
            [t, r, b, l] = [ns[0], ns[1], ns[2], ns[1]];
        else
            [t, r, b, l] = [ns[0], ns[1], ns[2], ns[3]];
    }
    if (per.top != null)
        t = per.top;
    if (per.right != null)
        r = per.right;
    if (per.bottom != null)
        b = per.bottom;
    if (per.left != null)
        l = per.left;
    if (noV) {
        t = 0;
        b = 0;
        if (!r && !l)
            return null;
    }
    // Flutter לא תומך במרווח/ריפוד שלילי (‏Container.margin.isNonNegative). שלילי (חפיפת-אווטארים ‏.av{margin-inline-start:-14})
    // נחסם ל-0 כאן — החפיפה משוחזרת כ-Stack ברמת-המיכל (ראה ענף overlap ב-emit). מונע קריסה.
    const cl = x => { const n = parseFloat(x); return isFinite(n) && n < 0 ? '0' : x; };
    t = cl(t);
    r = cl(r);
    b = cl(b);
    l = cl(l);
    return `const EdgeInsets.fromLTRB(${l}, ${t}, ${r}, ${b})`;
}
function shadowExpr(val) {
    if (!val || val === 'none')
        return null;
    const out = [];
    for (const s of splitTop(val)) {
        if (/^\s*inset/.test(s))
            continue;
        const cm = s.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/i);
        const col = cm ? (colorExpr(cm[1]) || litColor(cm[1])) : null;
        if (!col)
            continue;
        const nums = (s.replace(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/ig, '').match(/-?\d+(?:\.\d+)?/g) || []).map(x => parseFloat(x));
        const [ox = 0, oy = 0, blur = 0, spread = 0] = nums;
        // blurRadius = blur של CSS (תרגום נאמן). הערה: flutter test (headless) לא מרנדר gaussian-blur —
        // הצל נראה שם צמוד, אך ב-web/device עם GPU הוא זוהר רך תואם-CSS. אין לכייל לפי תמונת-הבדיקה!
        out.push(`BoxShadow(color: ${col}, offset: const Offset(${ox}, ${oy}), blurRadius: ${blur}, spreadRadius: ${spread})`);
    }
    return out.length ? out.join(', ') : null;
}
const JUST = { 'center': 'center', 'flex-end': 'end', 'end': 'end', 'flex-start': 'start', 'start': 'start', 'space-between': 'spaceBetween', 'space-around': 'spaceAround', 'space-evenly': 'spaceEvenly' };
const ALIGN = { 'center': 'center', 'flex-start': 'start', 'start': 'start', 'flex-end': 'end', 'end': 'end', 'stretch': 'stretch', 'baseline': 'baseline' };
function textStyle(st) {
    const p = [];
    const c = colorExpr(st['color']);
    if (c)
        p.push(`color: ${c}`);
    // פונט-לטיני (Space Grotesk/Fraunces — ללא-גליפי-עברית) עם תוכן מעורב ⇒ tofu (□□□). fontFamilyFallback ל-Heebo/Frank-Ruhl
    // משחזר את fallback-הדפדפן (‏.tag "עברית · Fraunces"). לפונט-עברי-ראשי (he/serifHe) אין צורך.
    const f = fontExpr(st['font-family']);
    if (f) {
        p.push(`fontFamily: ${f}`);
        if (f === 'fonts.grotesk' || f === 'fonts.serif')
            p.push(`fontFamilyFallback: [fonts.${f === 'fonts.serif' ? 'serifHe' : 'he'}]`);
    }
    // font-size: הערך שנפתר (מפורש/יורש) ⇒ אותו. אין font-size כלל ⇒ ברירת-CSS (body ללא font-size = 16px);
    // בלי הזרעה זו Flutter נופל ל-14px משלו ⇒ טקסט-בלי-גודל (reveal_card "Label") קטן-מהמקור ב-16/14.
    // ערך קיים-אך-לא-נפתר (clamp/calc-מורכב) ⇒ לא-מזריקים (לא ניחוש) — נשאר כפי-שהיה.
    const fs = px(st['font-size']);
    if (fs)
        p.push(`fontSize: ${fs}`);
    else if (st['font-size'] == null)
        p.push('fontSize: 16');
    const fw = st['font-weight'];
    if (fw && +fw >= 600)
        p.push(`fontWeight: FontWeight.w${fw >= 700 ? 700 : 600}`);
    const ls = st['letter-spacing'];
    if (ls && ls !== 'normal') {
        let v = px(ls);
        if (v == null) {
            const em = String(ls).match(/(-?\d*\.?\d+)em/);
            const fs2 = px(st['font-size']);
            if (em && fs2)
                v = (parseFloat(em[1]) * +fs2).toFixed(2);
        } // em ⇒ פיקסלים לפי font-size
        if (v == null)
            v = num(ls);
        if (v != null && +v !== 0)
            p.push(`letterSpacing: ${v}`);
    }
    // line-height ⇒ height + leadingDistribution.even: CSS מחלק את הליווי (line-height פחות גובה-הגליף)
    // באופן שווה מעל+מתחת לגליף. Flutter דיפולטית proportional ⇒ הגליף גבוה-מדי בקופסת-השורה, מה שהזיז
    // את המונה ברשימה-ממוספרת מהמרכז. even = התאמה-לדפדפן (הגליף ממורכז-אנכית בקופסת-השורה).
    const lh = st['line-height'];
    if (lh && lh !== 'normal' && !/px|%/.test(lh)) {
        const v = num(lh);
        if (v) {
            p.push(`height: ${v}`);
            p.push('leadingDistribution: TextLeadingDistribution.even');
        }
    }
    if (/tabular/.test(st['font-feature-settings'] || '') || /tabular/.test(st['font-variant-numeric'] || ''))
        p.push('fontFeatures: const [FontFeature.tabularFigures()]');
    return p;
}
const allText = n => n.children.map(c => c.text != null ? c.text : (c.tag ? allText(c) : '')).join('');
const INHERIT_PROPS = ['font-size', 'font-family', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-transform', 'font-feature-settings', 'font-variant-numeric'];
const zOf = s => { const v = s['z-index']; return /^-?\d+$/.test((v || '').trim()) ? +v : 0; };
const tb = c => c === 'baseline' ? ', textBaseline: TextBaseline.alphabetic' : '';
const INLINE_TAGS = new Set(['span', 'a', 'em', 'strong', 'b', 'i', 'small', 'code', 'abbr', 'mark', 'sub', 'sup', 'cite', 'q', 's', 'u', 'time', 'kbd', 'samp', 'var', 'label', 'bdi', 'bdo']);
const snake = s => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/^_+|_+$/g, '').toLowerCase();
const pascal = s => s.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1)).join('');
function divBlocks(html, cls) {
    const out = [], re = new RegExp(`<div class="([^"]*\\b${cls}\\b[^"]*)"[^>]*>`, 'g');
    let m;
    while ((m = re.exec(html))) {
        const start = m.index;
        let i = re.lastIndex, depth = 1;
        const tre = /<(\/?)div\b[^>]*>/g;
        tre.lastIndex = i;
        let t;
        while (depth > 0 && (t = tre.exec(html))) {
            depth += t[1] ? -1 : 1;
            i = tre.lastIndex;
        }
        out.push(html.slice(start, i));
        re.lastIndex = i;
    }
    return out;
}
function theaterStates(body) {
    const th = divBlocks(body, 'theater')[0];
    if (!th)
        return null;
    const sts = divBlocks(th, 'st');
    if (sts.length < 2)
        return null;
    return sts.map(st => {
        const lb = st.match(/<span class="slb">([^<]+)<\/span>/);
        const label = lb ? decode(lb[1]).trim() : 'state';
        const inner = st.replace(/<div class="([^"]*\bst\b[^"]*)"[^>]*>/, '').replace(/<span class="slb">[^<]*<\/span>/, '').replace(/<\/div>\s*$/, '');
        return { label, html: inner };
    });
}
const enumId = (s, i) => { let id = s.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).map((w, k) => k ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase()).join(''); if (!id || /^\d/.test(id))
    id = 's' + i + (id || ''); return id; };
function cells(html) {
    const out = [];
    // איתור כל <div class="...cell..."> ברמת-האיזון, עד ה-</div> התואם
    const re = /<div class="([^"]*\bcell\b[^"]*)"[^>]*>/g;
    let m;
    while ((m = re.exec(html))) {
        const start = m.index;
        let i = re.lastIndex, depth = 1;
        const tre = /<(\/?)div\b[^>]*>/g;
        tre.lastIndex = i;
        let t;
        while (depth > 0 && (t = tre.exec(html))) {
            depth += t[1] ? -1 : 1;
            i = tre.lastIndex;
        }
        const block = html.slice(start, i);
        const nm = block.match(/<span class="nm">([^<]+)<\/span>/);
        if (!nm)
            continue;
        const name = decode(nm[1]).split('·')[0].trim();
        const seamM = block.match(/<span class="seam[^"]*">([^<]+)<\/span>/);
        const seam = seamM ? decode(seamM[1]).toLowerCase().split(/\s/)[0] : 'fields';
        // גוף = תוכן-התא ללא ה-<div class="foot">…
        let body = block.replace(/<div class="([^"]*\bcell\b[^"]*)"[^>]*>/, '');
        body = body.replace(/<div class="foot">[\s\S]*$/, ''); // חתוך מ-foot ועד הסוף
        out.push({ name, seam, body });
    }
    return out;
}
const HEADER = (fam, seamUse, uiUse) => `// 🔨 אטום-Dart מחושל (forge) · משפחת-Pure "${fam}" · מחולל ע"י machtzev/ds-forge.mjs ממקור-האמת
// machtzev/pure/${fam}-family.html (אל תערוך ידנית — regen). לובש עיצוב מהחריץ בלבד (DsSeam.skinOf/of/fontsOf,
// חוק-5/6): אפס צבע-קבוע. תוכן Label/Value/Meta.
${uiUse ? "import 'dart:ui' show ImageFilter;\n" : ''}import 'package:flutter/material.dart';
${seamUse ? "import '../../dart-ui-bs/ds/ds_seam.dart';\n" : ''}`;
const ICON = `
// אייקון-פלייסהולדר ניטרלי (svg ללא path)
Widget _icon(Color c) => Icon(Icons.circle_outlined, size: 15, color: c);
`;
const SVGHELPER = `
// ignore_for_file: unused_element
class _Op {
  final int k;            // 0 rect · 1 circle · 2 line · 3 path · 4 text · 5 arc
  final List<double> a; final Color c; final bool f; final double sw; final String d;
  final List<Color>? g; final List<double>? gs; final List<double>? gv;  // גרדיאנט: צבעים · עצירות · וקטור-שבר
  final int anchor;       // עוגן-טקסט: 0 start · 1 middle · 2 end
  _Op(this.k, this.a, this.c, this.f, this.sw, this.d, {this.g, this.gs, this.gv, this.anchor = 0, this.font = ''});
  static _Op rect(double x, double y, double w, double h, double r, Color c, bool f, double sw, {List<Color>? g, List<double>? gs, List<double>? gv}) => _Op(0, [x, y, w, h, r], c, f, sw, '', g: g, gs: gs, gv: gv);
  static _Op circle(double x, double y, double r, Color c, bool f, double sw) => _Op(1, [x, y, r], c, f, sw, '');
  static _Op line(double x1, double y1, double x2, double y2, Color c, double sw) => _Op(2, [x1, y1, x2, y2], c, false, sw, '');
  static _Op path(String d, Color c, bool f, double sw, {List<Color>? g, List<double>? gs, List<double>? gv}) => _Op(3, const [], c, f, sw, d, g: g, gs: gs, gv: gv);
  final String font;
  static _Op text(String s, double x, double y, double size, Color c, int anchor, String font) => _Op(4, [x, y, size], c, true, 0, s, anchor: anchor, font: font);
  static _Op arc(double cx, double cy, double r, double start, double sweep, Color c, double sw, {List<Color>? g, List<double>? gs, List<double>? gv}) => _Op(5, [cx, cy, r, start, sweep], c, false, sw, '', g: g, gs: gs, gv: gv);
}
class _SvgScene extends CustomPainter {
  final List<_Op> ops; final double vbw, vbh;
  const _SvgScene(this.ops, this.vbw, this.vbh);
  Alignment _al(double fx, double fy) => Alignment(fx * 2 - 1, fy * 2 - 1);
  Path? _safe(String d) { try { return _parse(d); } catch (_) { return null; } }
  void _paintText(Canvas cv, _Op o) {
    final tp = TextPainter(text: TextSpan(text: o.d, style: TextStyle(color: o.c, fontSize: o.a[2], fontFamily: o.font.isEmpty ? null : o.font, fontWeight: FontWeight.w600, fontFeatures: const [FontFeature.tabularFigures()])), textDirection: TextDirection.ltr)..layout();
    double dx = o.a[0]; if (o.anchor == 1) dx -= tp.width / 2; else if (o.anchor == 2) dx -= tp.width;
    tp.paint(cv, Offset(dx, o.a[1] - tp.height * 0.82));
  }
  @override
  void paint(Canvas cv, Size s) {
    if (vbw <= 0 || vbh <= 0) return;
    cv.save(); cv.scale(s.width / vbw, s.height / vbh);
    for (final o in ops) {
      if (o.k == 4) { _paintText(cv, o); continue; }
      final p = Paint()..style = o.f ? PaintingStyle.fill : PaintingStyle.stroke..strokeWidth = o.sw..strokeCap = StrokeCap.round..strokeJoin = StrokeJoin.round;
      Rect b = Rect.zero; Path? pa;
      switch (o.k) {
        case 0: b = Rect.fromLTWH(o.a[0], o.a[1], o.a[2], o.a[3]); break;
        case 5: b = Rect.fromCircle(center: Offset(o.a[0], o.a[1]), radius: o.a[2]); break;
        case 3: pa = _safe(o.d); if (pa != null) b = pa.getBounds(); break;
      }
      if (o.g != null && o.g!.isNotEmpty) { final v = o.gv ?? const [0, 0, 0, 1]; p.shader = LinearGradient(begin: _al(v[0], v[1]), end: _al(v[2], v[3]), colors: o.g!, stops: o.gs).createShader(b.isEmpty ? const Rect.fromLTWH(0, 0, 1, 1) : b); }
      else { p.color = o.c; }
      switch (o.k) {
        case 0: cv.drawRRect(RRect.fromRectAndRadius(b, Radius.circular(o.a[4])), p); break;
        case 1: cv.drawCircle(Offset(o.a[0], o.a[1]), o.a[2], p); break;
        case 2: cv.drawLine(Offset(o.a[0], o.a[1]), Offset(o.a[2], o.a[3]), p); break;
        case 3: if (pa != null) cv.drawPath(pa, p); break;
        case 5: cv.drawArc(Rect.fromCircle(center: Offset(o.a[0], o.a[1]), radius: o.a[2]), o.a[3], o.a[4], false, p); break;
      }
    }
    cv.restore();
  }
  @override
  bool shouldRepaint(_SvgScene o) => true;
}
Path _parse(String d) {
  final path = Path();
  final t = RegExp(r'[a-zA-Z]|-?\\d*\\.?\\d+(?:e-?\\d+)?').allMatches(d).map((x) => x.group(0)!).toList();
  double cx = 0, cy = 0, sx = 0, sy = 0; String cmd = ''; int i = 0;
  double n() => double.parse(t[i++]);
  // דגל-קשת (largeArc/sweep) = ספרה-בודדת 0/1 · ה-SVG מתיר צמידות ("00-3-3") ⇒ הטוקנייזר מיזג ל"00";
  // קולפים תו-אחד ומשאירים את השארית לטוקן הבא (בלי זה קשת-מעוגלת בעיפרון/אייקון נשברת ⇒ אייקון-ריק).
  double fl() { final tok = t[i]; if (tok.length <= 1) { i++; return double.parse(tok); } t[i] = tok.substring(1); return double.parse(tok[0]); }
  while (i < t.length) {
    if (RegExp(r'[a-zA-Z]').hasMatch(t[i])) { cmd = t[i]; i++; }
    if (i > t.length) break;
    final rel = cmd == cmd.toLowerCase(); final C = cmd.toUpperCase();
    switch (C) {
      case 'M': { double x = n(), y = n(); if (rel) { x += cx; y += cy; } path.moveTo(x, y); cx = x; cy = y; sx = x; sy = y; cmd = rel ? 'l' : 'L'; break; }
      case 'L': { double x = n(), y = n(); if (rel) { x += cx; y += cy; } path.lineTo(x, y); cx = x; cy = y; break; }
      case 'H': { double x = n(); if (rel) x += cx; path.lineTo(x, cy); cx = x; break; }
      case 'V': { double y = n(); if (rel) y += cy; path.lineTo(cx, y); cy = y; break; }
      case 'C': { double x1 = n(), y1 = n(), x2 = n(), y2 = n(), x = n(), y = n(); if (rel) { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; } path.cubicTo(x1, y1, x2, y2, x, y); cx = x; cy = y; break; }
      case 'Q': { double x1 = n(), y1 = n(), x = n(), y = n(); if (rel) { x1 += cx; y1 += cy; x += cx; y += cy; } path.quadraticBezierTo(x1, y1, x, y); cx = x; cy = y; break; }
      case 'A': { double rx = n(), ry = n(), rot = n(), laf = fl(), sf = fl(), x = n(), y = n(); if (rel) { x += cx; y += cy; } path.arcToPoint(Offset(x, y), radius: Radius.elliptical(rx, ry), rotation: rot, largeArc: laf != 0, clockwise: sf != 0); cx = x; cy = y; break; }
      case 'Z': path.close(); cx = sx; cy = sy; break;
      default: if (i < t.length) i++;
    }
  }
  return path;
}
`;
const isNumD = (t) => /^[\d,.%₪$+\-–]+$/.test(String(t).trim());
export function inner$tokenLit$inner(v) {
    const inner = v.match(/(#[0-9a-f]{3,6}\b|rgba?\([^)]*\))/);
    return inner;
}
export function inner$tokenLit$m(v) {
    let m = v.match(/^#([0-9a-f]{6})$/);
    return m;
}
export function inner$tokenLit$h(c) {
    const h = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return h;
}
export function inner$tokenLit$r(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return r;
}
export function inner$tokenLit$g(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return g;
}
export function inner$tokenLit$b(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return b;
}
export function inner$tokenLit$a(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return a;
}
export function inner$tokenLit$key(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    const key = `${+r},${+g},${+b}`;
    return key;
}
export function inner$tokenLit$key$$step(r, g, b) {
    const key = `${+r},${+g},${+b}`;
    return key;
}
export function inner$tokenLit$al(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    const al = parseFloat(a);
    return al;
}
export function inner$tokenLit$al$$step(a) {
    const al = parseFloat(a);
    return al;
}
export function inner$litColor$tk(v) {
    const tk = tokenLit(v);
    return tk;
}
export function inner$litColor$c(v) {
    const c = v.slice(1);
    return c;
}
export function inner$litColor$m(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    return m;
}
export function inner$litColor$r(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return r;
}
export function inner$litColor$r$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return r;
}
export function inner$litColor$g(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return g;
}
export function inner$litColor$g$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return g;
}
export function inner$litColor$b(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return b;
}
export function inner$litColor$b$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return b;
}
export function inner$litColor$a(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return a;
}
export function inner$litColor$a$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return a;
}
export function inner$colorExpr$cm(val) {
    const cm = val.match(/color-mix\(\s*in\s+[^,]+,\s*([^,]+?)\s*(\d+(?:\.\d+)?)%\s*,\s*(var\(--[a-z0-9-]+\)|[^,)]+)\s*\)/i);
    return cm;
}
export function inner$colorExpr$cA(val) {
    const cm = val.match(/color-mix\(\s*in\s+[^,]+,\s*([^,]+?)\s*(\d+(?:\.\d+)?)%\s*,\s*(var\(--[a-z0-9-]+\)|[^,)]+)\s*\)/i);
    const cA = colorExpr(cm[1].trim());
    return cA;
}
export function inner$colorExpr$cA$$step(cm) {
    const cA = colorExpr(cm[1].trim());
    return cA;
}
export function inner$colorExpr$p(val) {
    const cm = val.match(/color-mix\(\s*in\s+[^,]+,\s*([^,]+?)\s*(\d+(?:\.\d+)?)%\s*,\s*(var\(--[a-z0-9-]+\)|[^,)]+)\s*\)/i);
    const p = (+cm[2] / 100).toFixed(3);
    return p;
}
export function inner$colorExpr$p$$step(cm) {
    const p = (+cm[2] / 100).toFixed(3);
    return p;
}
export function inner$colorExpr$second(val) {
    const cm = val.match(/color-mix\(\s*in\s+[^,]+,\s*([^,]+?)\s*(\d+(?:\.\d+)?)%\s*,\s*(var\(--[a-z0-9-]+\)|[^,)]+)\s*\)/i);
    const second = cm[3].trim();
    return second;
}
export function inner$colorExpr$second$$step(cm) {
    const second = cm[3].trim();
    return second;
}
export function inner$colorExpr$cB(val) {
    const cm = val.match(/color-mix\(\s*in\s+[^,]+,\s*([^,]+?)\s*(\d+(?:\.\d+)?)%\s*,\s*(var\(--[a-z0-9-]+\)|[^,)]+)\s*\)/i);
    const second = cm[3].trim();
    const cB = colorExpr(second);
    return cB;
}
export function inner$colorExpr$cB$$step(second) {
    const cB = colorExpr(second);
    return cB;
}
export function inner$colorExpr$vm(val) {
    const vm = val.match(/var\(--([a-z0-9-]+)\)/i);
    return vm;
}
export function inner$colorExpr$lit(val) {
    const lit = litColor(val);
    return lit;
}
export function inner$gradientExpr$m(val) {
    const m = val && val.match(/linear-gradient\((.*)\)\s*$/i);
    return m;
}
export function inner$gradientExpr$parts(val) {
    const m = val && val.match(/linear-gradient\((.*)\)\s*$/i);
    const parts = splitTop(m[1]);
    return parts;
}
export function inner$gradientExpr$parts$$step(m) {
    const parts = splitTop(m[1]);
    return parts;
}
export function inner$gradientExpr$deg(a) {
    const deg = /(-?\d+)deg/.test(a) ? +RegExp.$1 : (/to right/.test(a) ? 90 : /to left/.test(a) ? 270 : 180);
    return deg;
}
export function inner$gradientExpr$mm(a) {
    const deg = /(-?\d+)deg/.test(a) ? +RegExp.$1 : (/to right/.test(a) ? 90 : /to left/.test(a) ? 270 : 180);
    const map = { 0: ['bottomCenter', 'topCenter'], 90: ['centerLeft', 'centerRight'], 180: ['topCenter', 'bottomCenter'],
        270: ['centerRight', 'centerLeft'], 135: ['topLeft', 'bottomRight'], 45: ['bottomLeft', 'topRight'], 225: ['topRight', 'bottomLeft'] };
    const mm = map[(deg % 360 + 360) % 360] || ['topCenter', 'bottomCenter'];
    return mm;
}
export function inner$gradientExpr$mm$$step(deg, map) {
    const mm = map[(deg % 360 + 360) % 360] || ['topCenter', 'bottomCenter'];
    return mm;
}
export function inner$gradientExpr$c(p) {
    const c = colorExpr(p.replace(/\s+\d+%\s*$/, ''));
    return c;
}
export function inner$radialExpr$m(val) {
    const m = val && val.match(/radial-gradient\((.*)\)/i);
    return m;
}
export function inner$radialExpr$inner(val) {
    const m = val && val.match(/radial-gradient\((.*)\)/i);
    const inner = splitTop(m[1]);
    return inner;
}
export function inner$radialExpr$inner$$step(m) {
    const inner = splitTop(m[1]);
    return inner;
}
export function inner$radialExpr$at(seg) {
    const at = seg.match(/at\s+(-?[\d.]+)%\s+(-?[\d.]+)%/);
    return at;
}
export function inner$radialExpr$sz(seg) {
    const sz = seg.match(/([\d.]+)%/);
    return sz;
}
export function inner$radialExpr$sm(seg) {
    const sm = seg.trim().match(/^(.*?)(?:\s+([\d.]+)%)?$/);
    return sm;
}
export function inner$radialExpr$cexpr(baseColor, seg) {
    const sm = seg.trim().match(/^(.*?)(?:\s+([\d.]+)%)?$/);
    const cexpr = /transparent/.test(sm[1]) ? baseColor : colorExpr(sm[1].trim());
    return cexpr;
}
export function inner$radialExpr$cexpr$$step(baseColor, sm) {
    const cexpr = /transparent/.test(sm[1]) ? baseColor : colorExpr(sm[1].trim());
    return cexpr;
}
export function inner$conicExpr$m(val) {
    const m = val && val.match(/conic-gradient\((.*)\)/is);
    return m;
}
export function inner$conicExpr$parts(val) {
    const m = val && val.match(/conic-gradient\((.*)\)/is);
    const parts = splitTop(m[1]);
    return parts;
}
export function inner$conicExpr$parts$$step(m) {
    const parts = splitTop(m[1]);
    return parts;
}
export function inner$conicExpr$c(seg) {
    const c = colorExpr(seg.trim().replace(/\s+-?[\d.]+(?:deg|%)\s*$/i, '').trim());
    return c;
}
export function inner$conicExpr$rot(from) {
    const rot = (((from - 90) % 360) * Math.PI / 180).toFixed(4);
    return rot;
}
export function inner$fontExpr$m(val) {
    const m = val && val.match(/var\(--(serif|serifHe|grotesk|he)\)/);
    return m;
}
export function inner$evalCalc$m(v) {
    const m = /calc\(\s*(-?[\d.]+)(?:px)?\s*([*/+-])\s*(-?[\d.]+)(?:px)?\s*\)/i.exec(v);
    return m;
}
export function inner$evalCalc$a(v) {
    const m = /calc\(\s*(-?[\d.]+)(?:px)?\s*([*/+-])\s*(-?[\d.]+)(?:px)?\s*\)/i.exec(v);
    const a = parseFloat(m[1]);
    return a;
}
export function inner$evalCalc$a$$step(m) {
    const a = parseFloat(m[1]);
    return a;
}
export function inner$evalCalc$b(v) {
    const m = /calc\(\s*(-?[\d.]+)(?:px)?\s*([*/+-])\s*(-?[\d.]+)(?:px)?\s*\)/i.exec(v);
    const b = parseFloat(m[3]);
    return b;
}
export function inner$evalCalc$b$$step(m) {
    const b = parseFloat(m[3]);
    return b;
}
export function inner$evalCalc$r(v, op) {
    const m = /calc\(\s*(-?[\d.]+)(?:px)?\s*([*/+-])\s*(-?[\d.]+)(?:px)?\s*\)/i.exec(v);
    const a = parseFloat(m[1]);
    const b = parseFloat(m[3]);
    const r = op === '*' ? a * b : op === '/' ? a / b : op === '+' ? a + b : a - b;
    return r;
}
export function inner$evalCalc$r$$step(a, b, op) {
    const r = op === '*' ? a * b : op === '/' ? a / b : op === '+' ? a + b : a - b;
    return r;
}
export function inner$vwPx$m(v) {
    const m = typeof v === 'string' && /^\s*(-?[\d.]+)(vw|vh|vmin|vmax)\s*$/i.exec(v);
    return m;
}
export function inner$vwPx$n(v) {
    const m = typeof v === 'string' && /^\s*(-?[\d.]+)(vw|vh|vmin|vmax)\s*$/i.exec(v);
    const n = parseFloat(m[1]);
    return n;
}
export function inner$vwPx$n$$step(m) {
    const n = parseFloat(m[1]);
    return n;
}
export function inner$vwPx$u(v) {
    const m = typeof v === 'string' && /^\s*(-?[\d.]+)(vw|vh|vmin|vmax)\s*$/i.exec(v);
    const u = m[2].toLowerCase();
    return u;
}
export function inner$vwPx$u$$step(m) {
    const u = m[2].toLowerCase();
    return u;
}
export function inner$vwPx$base(v) {
    const m = typeof v === 'string' && /^\s*(-?[\d.]+)(vw|vh|vmin|vmax)\s*$/i.exec(v);
    const u = m[2].toLowerCase();
    const base = u === 'vw' ? VW_PX : u === 'vh' ? VH_PX : u === 'vmin' ? Math.min(VW_PX, VH_PX) : Math.max(VW_PX, VH_PX);
    return base;
}
export function inner$vwPx$base$$step(u) {
    const base = u === 'vw' ? VW_PX : u === 'vh' ? VH_PX : u === 'vmin' ? Math.min(VW_PX, VH_PX) : Math.max(VW_PX, VH_PX);
    return base;
}
export function inner$evalClamp$m(v) {
    const m = /clamp\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,)]+?)\s*\)/i.exec(v);
    return m;
}
export function inner$evalClamp$toN$p(x) {
    const p = px(x);
    return p;
}
export function inner$evalClamp$toN$w(x) {
    const w = vwPx(x);
    return w;
}
export function inner$evalClamp$lo(v) {
    const m = /clamp\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,)]+?)\s*\)/i.exec(v);
    const lo = toN(m[1]);
    return lo;
}
export function inner$evalClamp$lo$$step(m) {
    const lo = toN(m[1]);
    return lo;
}
export function inner$evalClamp$pref(v) {
    const m = /clamp\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,)]+?)\s*\)/i.exec(v);
    const pref = toN(m[2]);
    return pref;
}
export function inner$evalClamp$pref$$step(m) {
    const pref = toN(m[2]);
    return pref;
}
export function inner$evalClamp$hi(v) {
    const m = /clamp\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,)]+?)\s*\)/i.exec(v);
    const hi = toN(m[3]);
    return hi;
}
export function inner$evalClamp$hi$$step(m) {
    const hi = toN(m[3]);
    return hi;
}
export function inner$px$cl(v) {
    const cl = evalClamp(v);
    return cl;
}
export function inner$px$c(v) {
    const c = evalCalc(v);
    return c;
}
export function inner$px$w(v) {
    const w = vwPx(v);
    return w;
}
export function inner$px$m(v) {
    const m = v && String(v).match(/(?<![\d.])(-?(?:\d+(?:\.\d+)?|\.\d+))px/);
    return m;
}
export function inner$pct$m(v) {
    const m = v && String(v).match(/^\s*(\d+(?:\.\d+)?)%\s*$/);
    return m;
}
export function inner$num$m(v) {
    const m = v && String(v).match(/-?(?:\d+\.?\d*|\.\d+)/);
    return m;
}
export function inner$parseStyle$simple$tc(tok) {
    const tc = /^([a-z][a-z0-9]*)((?:\.[a-z0-9-]+)+)$/i.exec(tok);
    return tc;
}
export function inner$parseStyle$sels(m) {
    const sels = m[1].split(',').map(s => s.trim());
    return sels;
}
export function inner$parseStyle$i(d) {
    const i = d.indexOf(':');
    return i;
}
export function inner$parseStyle$pm(sel) {
    const pm = /^(.+?)::?(before|after)$/i.exec(sel);
    return pm;
}
export function inner$parseStyle$base(sel) {
    const pm = /^(.+?)::?(before|after)$/i.exec(sel);
    const base = pm[1].trim();
    return base;
}
export function inner$parseStyle$base$$step(pm) {
    const base = pm[1].trim();
    return base;
}
export function inner$parseStyle$pos(sel) {
    const pm = /^(.+?)::?(before|after)$/i.exec(sel);
    const pos = pm[2].toLowerCase();
    return pos;
}
export function inner$parseStyle$pos$$step(pm) {
    const pos = pm[2].toLowerCase();
    return pos;
}
export function inner$parseStyle$parts(sel) {
    const pm = /^(.+?)::?(before|after)$/i.exec(sel);
    const base = pm[1].trim();
    const parts = (base.includes(' ') ? base.split(/\s+/).filter(Boolean) : [base]).map(simple);
    return parts;
}
export function inner$parseStyle$parts$$step(base) {
    const parts = (base.includes(' ') ? base.split(/\s+/).filter(Boolean) : [base]).map(simple);
    return parts;
}
export function inner$parseStyle$c(sel) {
    const c = sel.slice(1);
    return c;
}
export function inner$parseStyle$ps(sel) {
    const ps = sel.split('.');
    return ps;
}
export function inner$parseStyle$asm(sel) {
    const asm = /^(.*?)\s*([a-z][a-z0-9]*|\.[a-z0-9-]+)?\[([a-z-]+)\s*=\s*["']?([^"'\]]+)["']?\]$/i.exec(sel);
    return asm;
}
export function inner$parseStyle$chainStr(sel) {
    const asm = /^(.*?)\s*([a-z][a-z0-9]*|\.[a-z0-9-]+)?\[([a-z-]+)\s*=\s*["']?([^"'\]]+)["']?\]$/i.exec(sel);
    const chainStr = asm[1].trim();
    return chainStr;
}
export function inner$parseStyle$chainStr$$step(asm) {
    const chainStr = asm[1].trim();
    return chainStr;
}
export function inner$parseStyle$chain(sel) {
    const asm = /^(.*?)\s*([a-z][a-z0-9]*|\.[a-z0-9-]+)?\[([a-z-]+)\s*=\s*["']?([^"'\]]+)["']?\]$/i.exec(sel);
    const chainStr = asm[1].trim();
    const chain = chainStr ? chainStr.split(/\s+/).filter(Boolean).map(simple) : [];
    return chain;
}
export function inner$parseStyle$chain$$step(chainStr) {
    const chain = chainStr ? chainStr.split(/\s+/).filter(Boolean).map(simple) : [];
    return chain;
}
export function inner$parseStyle$target(sel) {
    const asm = /^(.*?)\s*([a-z][a-z0-9]*|\.[a-z0-9-]+)?\[([a-z-]+)\s*=\s*["']?([^"'\]]+)["']?\]$/i.exec(sel);
    const target = asm[2] ? simple(asm[2]) : {};
    return target;
}
export function inner$parseStyle$target$$step(asm) {
    const target = asm[2] ? simple(asm[2]) : {};
    return target;
}
export function inner$parseStyle$ls(sel) {
    const [ls, rs] = sel.split('~');
    return ls;
}
export function inner$parseStyle$rs(sel) {
    const [ls, rs] = sel.split('~');
    return rs;
}
export function inner$parseStyle$leftParts(sel) {
    const [ls, rs] = sel.split('~');
    const leftParts = ls.trim().split(/\s+/).filter(Boolean).map(simple);
    return leftParts;
}
export function inner$parseStyle$leftParts$$step(ls) {
    const leftParts = ls.trim().split(/\s+/).filter(Boolean).map(simple);
    return leftParts;
}
export function inner$parseStyle$right(sel) {
    const [ls, rs] = sel.split('~');
    const right = simple((rs || '').trim());
    return right;
}
export function inner$parseStyle$right$$step(rs) {
    const right = simple((rs || '').trim());
    return right;
}
export function inner$parseStyle$parts_L248(sel) {
    const parts = sel.split(/\s+/).filter(Boolean).map(simple);
    return parts;
}
export function inner$pseudoKids$target(r) {
    const target = r.chain[r.chain.length - 1];
    return target;
}
export function inner$pseudoKids$hit(node, r) {
    const classes = node.classes || [];
    const target = r.chain[r.chain.length - 1];
    const hit = (target.tag ? node.tag === target.tag : true) && (target.cls ? target.cls.every(c => classes.includes(c)) : true);
    return hit;
}
export function inner$pseudoKids$hit$$step(node, classes, target) {
    const hit = (target.tag ? node.tag === target.tag : true) && (target.cls ? target.cls.every(c => classes.includes(c)) : true);
    return hit;
}
export function inner$pseudoKids$cm(r) {
    const cm = /content\s*:\s*(?:"([^"]*)"|'([^']*)'|([^;]+))/.exec(Object.entries(r.decl).map(([k, v]) => `${k}:${v}`).join(';'));
    return cm;
}
export function inner$pseudoKids$raw(r) {
    const cm = /content\s*:\s*(?:"([^"]*)"|'([^']*)'|([^;]+))/.exec(Object.entries(r.decl).map(([k, v]) => `${k}:${v}`).join(';'));
    const raw = cm[1] != null ? cm[1] : cm[2] != null ? cm[2] : (cm[3] || '').trim();
    return raw;
}
export function inner$pseudoKids$raw$$step(cm) {
    const raw = cm[1] != null ? cm[1] : cm[2] != null ? cm[2] : (cm[3] || '').trim();
    return raw;
}
export function inner$pseudoKids$style(r) {
    const style = Object.entries(r.decl).filter(([k]) => k !== 'content').map(([k, v]) => `${k}:${v}`).join(';');
    return style;
}
export function inner$pseudoKids$kid(r, text) {
    const style = Object.entries(r.decl).filter(([k]) => k !== 'content').map(([k, v]) => `${k}:${v}`).join(';');
    const kid = { tag: 'span', classes: [], attrs: { style }, children: text ? [{ text }] : [] };
    return kid;
}
export function inner$pseudoKids$kid$$step(text, style) {
    const kid = { tag: 'span', classes: [], attrs: { style }, children: text ? [{ text }] : [] };
    return kid;
}
export function inner$parseInline$i(p) {
    const i = p.indexOf(':');
    return i;
}
export function inner$styleOf$target(r) {
    const target = r.chain[r.chain.length - 1];
    return target;
}
export function inner$styleOf$hit(node, r) {
    const classes = node.classes || [];
    const target = r.chain[r.chain.length - 1];
    const hit = (target.tag ? node.tag === target.tag : true) && (target.cls ? target.cls.every(c => classes.includes(c)) : true);
    return hit;
}
export function inner$styleOf$hit$$step(node, classes, target) {
    const hit = (target.tag ? node.tag === target.tag : true) && (target.cls ? target.cls.every(c => classes.includes(c)) : true);
    return hit;
}
export function inner$styleOf$hit_L306(node, r) {
    const classes = node.classes || [];
    const t = r.target || {};
    const hit = (t.tag ? node.tag === t.tag : true) && (t.cls ? t.cls.every(c => classes.includes(c)) : true) && ((node.attrs && node.attrs[r.attr]) === r.val);
    return hit;
}
export function inner$styleOf$hit_L306$$step(node, classes, r, t) {
    const hit = (t.tag ? node.tag === t.tag : true) && (t.cls ? t.cls.every(c => classes.includes(c)) : true) && ((node.attrs && node.attrs[r.attr]) === r.val);
    return hit;
}
export function inner$parseDOM$t(m) {
    const t = m[5].replace(/\s+/g, ' ');
    return t;
}
export function inner$parseDOM$closing(m) {
    const closing = m[1] === '/';
    return closing;
}
export function inner$parseDOM$tag(m) {
    const tag = m[2].toLowerCase();
    return tag;
}
export function inner$parseDOM$selfClose(m) {
    const selfClose = m[4] === '/';
    return selfClose;
}
export function inner$parseDOM$node(m, attrs) {
    const tag = m[2].toLowerCase();
    const node = { tag, classes: (attrs.class || '').split(/\s+/).filter(Boolean), attrs, children: [] };
    return node;
}
export function inner$parseDOM$node$$step(tag, attrs) {
    const node = { tag, classes: (attrs.class || '').split(/\s+/).filter(Boolean), attrs, children: [] };
    return node;
}
export function inner$siblingRuns$b(a) {
    let b = a + 1;
    return b;
}
export function inner$siblingRuns$y(x) {
    let y = x + 1;
    return y;
}
export function inner$siblingRuns$shared(els, x) {
    let shared = new Set((els[x].classes || []).filter(c => !ITEM_MARK_CLS.test(c)));
    return shared;
}
export function inner$siblingRuns$cy(els, y) {
    const cy = (els[y].classes || []).filter(c => !ITEM_MARK_CLS.test(c));
    return cy;
}
export function inner$siblingRuns$sh(els, y, shared) {
    const cy = (els[y].classes || []).filter(c => !ITEM_MARK_CLS.test(c));
    const sh = new Set([...shared].filter(c => cy.includes(c)));
    return sh;
}
export function inner$siblingRuns$sh$$step(shared, cy) {
    const sh = new Set([...shared].filter(c => cy.includes(c)));
    return sh;
}
export function inner$siblingRuns$okY(els, x, y, shared) {
    const cy = (els[y].classes || []).filter(c => !ITEM_MARK_CLS.test(c));
    const sh = new Set([...shared].filter(c => cy.includes(c)));
    const okY = cy.length - sh.size <= 1 && [...shared].every(c => cy.includes(c) || (els.slice(x, y).every(m => (m.classes || []).filter(k => !ITEM_MARK_CLS.test(k)).length - sh.size <= 1)));
    return okY;
}
export function inner$siblingRuns$okY$$step(els, x, y, shared, cy, sh) {
    const okY = cy.length - sh.size <= 1 && [...shared].every(c => cy.includes(c) || (els.slice(x, y).every(m => (m.classes || []).filter(k => !ITEM_MARK_CLS.test(k)).length - sh.size <= 1)));
    return okY;
}
export function inner$siblingRuns$members(els, x, y) {
    const members = els.slice(x, y);
    return members;
}
export function inner$primaryGroup$walk$els(n) {
    const els = elemChildren(n);
    return els;
}
export function inner$primaryGroup$walk$score(r) {
    const score = r.members.length * 2 + (r.leafy ? 0 : 1);
    return score;
}
export function inner$frameNode$kids(n) {
    const kids = elemChildren(n);
    return kids;
}
export function inner$coreNode$first(dom) {
    const first = elemChildren(dom)[0];
    return first;
}
export function inner$coreNode$kids(dom) {
    const first = elemChildren(dom)[0];
    const kids = elemChildren(first);
    return kids;
}
export function inner$coreNode$kids$$step(first) {
    const kids = elemChildren(first);
    return kids;
}
export function inner$decoration$grad(st) {
    const bgRaw = st['background'] || st['background-color'];
    const grad = gradientExpr(bgRaw) || conicExpr(bgRaw);
    return grad;
}
export function inner$decoration$grad$$step(bgRaw) {
    const grad = gradientExpr(bgRaw) || conicExpr(bgRaw);
    return grad;
}
export function inner$decoration$c(seg) {
    const c = colorExpr(seg.trim());
    return c;
}
export function inner$decoration$rad(st) {
    const bgRaw = st['background'] || st['background-color'];
    let bg = null;
    let radSeg = null;
    for (const seg of splitTop(bgRaw)) { // בידוד שכבות (לא-חמדני — כל שכבה בנפרד)
        if (/radial-gradient/i.test(seg))
            radSeg = seg;
        else if (!/gradient\(/i.test(seg) && !bg) {
            const c = colorExpr(seg.trim());
            if (c)
                bg = c;
        }
    }
    const rad = radSeg ? radialExpr(radSeg, bg || 'skin.sunken') : null;
    return rad;
}
export function inner$decoration$rad$$step(bg, radSeg) {
    const rad = radSeg ? radialExpr(radSeg, bg || 'skin.sunken') : null;
    return rad;
}
export function inner$decoration$c_L434(st) {
    const bgRaw = st['background'] || st['background-color'];
    const c = colorExpr(bgRaw);
    return c;
}
export function inner$decoration$c_L434$$step(bgRaw) {
    const c = colorExpr(bgRaw);
    return c;
}
export function inner$decoration$bc(br, bcRaw) {
    const bc = (br && colorExpr(br)) || (bcRaw && colorExpr(bcRaw)) || null;
    return bc;
}
export function inner$decoration$wm(br) {
    const wm = /(\d+(?:\.\d+)?)px/.exec(br || '');
    return wm;
}
export function inner$decoration$bw(br) {
    const wm = /(\d+(?:\.\d+)?)px/.exec(br || '');
    const bw = wm ? wm[1] : '1';
    return bw;
}
export function inner$decoration$bw$$step(wm) {
    const bw = wm ? wm[1] : '1';
    return bw;
}
export function inner$decoration$c_L446(v) {
    const c = colorExpr(v);
    return c;
}
export function inner$decoration$wm_L446(v) {
    const wm = /(\d+(?:\.\d+)?)px/.exec(v);
    return wm;
}
export function inner$decoration$r(rad) {
    const r = /%|999/.test(rad) ? '999' : (px(rad) || num(rad));
    return r;
}
export function inner$decoration$sh(st) {
    const sh = shadowExpr(st['box-shadow']);
    return sh;
}
export function inner$bgOverlayGlow$radSeg(st) {
    const bgRaw = st['background'] || st['background-color'];
    const radSeg = splitTop(bgRaw).find(s => /radial-gradient/i.test(s));
    return radSeg;
}
export function inner$bgOverlayGlow$radSeg$$step(bgRaw) {
    const radSeg = splitTop(bgRaw).find(s => /radial-gradient/i.test(s));
    return radSeg;
}
export function inner$bgOverlayGlow$rad(st) {
    const bgRaw = st['background'] || st['background-color'];
    const radSeg = splitTop(bgRaw).find(s => /radial-gradient/i.test(s));
    const rad = radialExpr(radSeg, 'const Color(0x00000000)');
    return rad;
}
export function inner$bgOverlayGlow$rad$$step(radSeg) {
    const rad = radialExpr(radSeg, 'const Color(0x00000000)');
    return rad;
}
export function inner$bgOverlayGlow$r(rv) {
    const r = rv ? (/%|999/.test(rv) ? '999' : (px(rv) || num(rv))) : null;
    return r;
}
export function inner$edge$per(st, prop) {
    const per = { top: px(st[`${prop}-top`]), right: px(st[`${prop}-right`]), bottom: px(st[`${prop}-bottom`]), left: px(st[`${prop}-left`]) };
    return per;
}
export function inner$edge$iis(st, prop) {
    const iis = px(st[`${prop}-inline-start`]);
    return iis;
}
export function inner$edge$iie(st, prop) {
    const iie = px(st[`${prop}-inline-end`]);
    return iie;
}
export function inner$edge$ibs(st, prop) {
    const ibs = px(st[`${prop}-block-start`]);
    return ibs;
}
export function inner$edge$ibe(st, prop) {
    const ibe = px(st[`${prop}-block-end`]);
    return ibe;
}
export function inner$edge$hasPer(per) {
    const hasPer = Object.values(per).some(v => v != null);
    return hasPer;
}
export function inner$edge$ns(sh) {
    const ns = sh.trim().split(/\s+/).map(x => (px(x) != null ? px(x) : (num(x) || '0')));
    return ns;
}
export function inner$edge$cl$n(x) {
    const n = parseFloat(x);
    return n;
}
export function inner$vMarginOf$v$p(x) {
    const p = px(x);
    return p;
}
export function inner$vMarginOf$ns(sh) {
    const ns = sh.trim().split(/\s+/);
    return ns;
}
export function inner$vMarginOf$ns_L504(mbk) {
    const ns = mbk.trim().split(/\s+/);
    return ns;
}
export function inner$shadowExpr$cm(s) {
    const cm = s.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/i);
    return cm;
}
export function inner$shadowExpr$col(s) {
    const cm = s.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/i);
    const col = cm ? (colorExpr(cm[1]) || litColor(cm[1])) : null;
    return col;
}
export function inner$shadowExpr$col$$step(cm) {
    const col = cm ? (colorExpr(cm[1]) || litColor(cm[1])) : null;
    return col;
}
export function inner$shadowExpr$nums(s) {
    const nums = (s.replace(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/ig, '').match(/-?\d+(?:\.\d+)?/g) || []).map(x => parseFloat(x));
    return nums;
}
export function inner$textStyle$c(st) {
    const c = colorExpr(st['color']);
    return c;
}
export function inner$textStyle$f(st) {
    const f = fontExpr(st['font-family']);
    return f;
}
export function inner$textStyle$fs(st) {
    const fs = px(st['font-size']);
    return fs;
}
export function inner$textStyle$v(ls) {
    let v = px(ls);
    return v;
}
export function inner$textStyle$em(ls) {
    const em = String(ls).match(/(-?\d*\.?\d+)em/);
    return em;
}
export function inner$textStyle$fs2(st) {
    const fs2 = px(st['font-size']);
    return fs2;
}
export function inner$textStyle$v_L551(lh) {
    const v = num(lh);
    return v;
}
export function inner$svgScene$vb(node) {
    const vb = (node.attrs.viewbox || '0 0 24 24').split(/\s+/).map(Number);
    return vb;
}
export function inner$svgScene$urlId$m(v) {
    const m = v && v.match(/url\(#([\w-]+)\)/);
    return m;
}
export function inner$svgScene$key(a) {
    const key = `${+a.width || 0}|${(+a.y || 0) + (+a.height || 0)}`;
    return key;
}
export function inner$svgScene$hmax(g) {
    const hmax = Math.max(...g.map(r => +r.attrs.height || 0));
    return hmax;
}
export function inner$svgScene$walk$filled(SVG_INH, pattr, ch, est) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const fillRaw = a.fill || est['fill'];
    const filled = !!(fillRaw && fillRaw !== 'none');
    return filled;
}
export function inner$svgScene$walk$filled$$step(fillRaw) {
    const filled = !!(fillRaw && fillRaw !== 'none');
    return filled;
}
export function inner$svgScene$walk$col(inherit, SVG_INH, pattr, ch, est) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const fillRaw = a.fill || est['fill'];
    const strokeRaw = a.stroke || est['stroke'] || est['color'];
    const filled = !!(fillRaw && fillRaw !== 'none');
    let col = filled ? (colorExpr(fillRaw) || inherit) : (colorExpr(strokeRaw) || inherit);
    return col;
}
export function inner$svgScene$walk$col$$step(inherit, fillRaw, strokeRaw, filled) {
    let col = filled ? (colorExpr(fillRaw) || inherit) : (colorExpr(strokeRaw) || inherit);
    return col;
}
export function inner$svgScene$walk$so(SVG_INH, pattr, ch, est) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const so = parseFloat(a['opacity'] ?? est['opacity'] ?? '1');
    return so;
}
export function inner$svgScene$walk$so$$step(est, a) {
    const so = parseFloat(a['opacity'] ?? est['opacity'] ?? '1');
    return so;
}
export function inner$svgScene$walk$fso(SVG_INH, pattr, ch, est) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const fillRaw = a.fill || est['fill'];
    const filled = !!(fillRaw && fillRaw !== 'none');
    const fso = parseFloat((filled ? a['fill-opacity'] : a['stroke-opacity']) ?? '1');
    return fso;
}
export function inner$svgScene$walk$fso$$step(a, filled) {
    const fso = parseFloat((filled ? a['fill-opacity'] : a['stroke-opacity']) ?? '1');
    return fso;
}
export function inner$svgScene$walk$al(SVG_INH, pattr, ch, est) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const fillRaw = a.fill || est['fill'];
    const filled = !!(fillRaw && fillRaw !== 'none');
    const so = parseFloat(a['opacity'] ?? est['opacity'] ?? '1');
    const fso = parseFloat((filled ? a['fill-opacity'] : a['stroke-opacity']) ?? '1');
    const al = (isNaN(so) ? 1 : so) * (isNaN(fso) ? 1 : fso);
    return al;
}
export function inner$svgScene$walk$al$$step(so, fso) {
    const al = (isNaN(so) ? 1 : so) * (isNaN(fso) ? 1 : fso);
    return al;
}
export function inner$svgScene$walk$sw(SVG_INH, pattr, ch, est) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const sw = num(a['stroke-width'] || est['stroke-width'] || '1.8') || '1.8';
    return sw;
}
export function inner$svgScene$walk$sw$$step(est, a) {
    const sw = num(a['stroke-width'] || est['stroke-width'] || '1.8') || '1.8';
    return sw;
}
export function inner$svgScene$walk$sr(rectSeries, ch) {
    const sr = rectSeries.get(ch);
    return sr;
}
export function inner$svgScene$walk$circ(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const r = +a.r || 0;
    const circ = 2 * Math.PI * r;
    return circ;
}
export function inner$svgScene$walk$circ$$step(r) {
    const circ = 2 * Math.PI * r;
    return circ;
}
export function inner$svgScene$walk$dash(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const dash = a['stroke-dasharray'].trim().split(/[\s,]+/).map(Number);
    return dash;
}
export function inner$svgScene$walk$dash$$step(a) {
    const dash = a['stroke-dasharray'].trim().split(/[\s,]+/).map(Number);
    return dash;
}
export function inner$svgScene$walk$off(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const off = a['stroke-dashoffset'] != null ? +a['stroke-dashoffset'] : 0;
    return off;
}
export function inner$svgScene$walk$off$$step(a) {
    const off = a['stroke-dashoffset'] != null ? +a['stroke-dashoffset'] : 0;
    return off;
}
export function inner$svgScene$walk$start(SVG_INH, pattr, ch, startPos) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const r = +a.r || 0;
    const circ = 2 * Math.PI * r;
    const start = (-Math.PI / 2 + (startPos / circ) * 2 * Math.PI).toFixed(4);
    return start;
}
export function inner$svgScene$walk$start$$step(circ, startPos) {
    const start = (-Math.PI / 2 + (startPos / circ) * 2 * Math.PI).toFixed(4);
    return start;
}
export function inner$svgScene$walk$sweep(SVG_INH, pattr, ch, drawn) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const r = +a.r || 0;
    const circ = 2 * Math.PI * r;
    const sweep = ((drawn / circ) * 2 * Math.PI).toFixed(4);
    return sweep;
}
export function inner$svgScene$walk$sweep$$step(circ, drawn) {
    const sweep = ((drawn / circ) * 2 * Math.PI).toFixed(4);
    return sweep;
}
export function inner$svgScene$walk$s(ch) {
    const s = allText(ch).replace(/\s+/g, ' ').trim();
    return s;
}
export function inner$svgScene$walk$size(est) {
    const size = px(est['font-size']) || 9;
    return size;
}
export function inner$svgScene$walk$tc(inherit, est) {
    const tc = colorExpr(est['fill'] || est['color']) || inherit;
    return tc;
}
export function inner$svgScene$walk$ff(est) {
    const ff = fontExpr(est['font-family']) || 'fonts.grotesk';
    return ff;
}
export function inner$svgScene$walk$pts(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const pts = a.points.trim().split(/[\s,]+/);
    return pts;
}
export function inner$svgScene$walk$pts$$step(a) {
    const pts = a.points.trim().split(/[\s,]+/);
    return pts;
}
export function inner$svgScene$walk$d(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const pts = a.points.trim().split(/[\s,]+/);
    let d = 'M ' + pts[0] + ' ' + pts[1];
    return d;
}
export function inner$svgScene$walk$d$$step(pts) {
    let d = 'M ' + pts[0] + ' ' + pts[1];
    return d;
}
export function inner$gradStops$col(inherit, s) {
    let col = colorExpr(s.attrs['stop-color']) || inherit;
    return col;
}
export function inner$gradStops$o(s) {
    let o = s.attrs.offset != null ? parseFloat(s.attrs.offset) : 0;
    return o;
}
export function inner$gradStops$v(g) {
    const v = [(+g.x1 || 0).toFixed(2), (+g.y1 || 0).toFixed(2), (+g.x2 || 0).toFixed(2), (g.y2 != null ? +g.y2 : 1).toFixed(2)];
    return v;
}
export function inner$textStyleC$ts(st) {
    const ts = textStyle(st);
    return ts;
}
export function inner$toRichSpan$d(w) {
    const d = /^Directionality\(textDirection: TextDirection\.\w+, child: (Text\(.+\))\)$/s.exec(w);
    return d;
}
export function inner$toRichSpan$m(w) {
    const m = /^Text\((.+), style: (TextStyle\(.*\))\)$/s.exec(w);
    return m;
}
export function inner$emit$svgCol(inherit, inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const svgCol = colorExpr(st0['color']) || inherit;
    return svgCol;
}
export function inner$emit$svgCol$$step(inherit, st0) {
    const svgCol = colorExpr(st0['color']) || inherit;
    return svgCol;
}
export function inner$emit$wpx(node, inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const wpx = px(st0['width']) || num(node.attrs.width);
    return wpx;
}
export function inner$emit$wpx$$step(node, st0) {
    const wpx = px(st0['width']) || num(node.attrs.width);
    return wpx;
}
export function inner$emit$hpx(node, inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const hpx = px(st0['height']) || num(node.attrs.height);
    return hpx;
}
export function inner$emit$hpx$$step(node, st0) {
    const hpx = px(st0['height']) || num(node.attrs.height);
    return hpx;
}
export function inner$emit$_op(inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const _op = st0['opacity'] != null ? parseFloat(st0['opacity']) : null;
    return _op;
}
export function inner$emit$_op$$step(st0) {
    const _op = st0['opacity'] != null ? parseFloat(st0['opacity']) : null;
    return _op;
}
export function inner$emit$_b0(sc) {
    const _b0 = `CustomPaint(painter: _SvgScene([${sc.ops.join(', ')}], ${sc.vbw}, ${sc.vbh}))`;
    return _b0;
}
export function inner$emit$body(inhVars, st0r, sc) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const _op = st0['opacity'] != null ? parseFloat(st0['opacity']) : null;
    const _b0 = `CustomPaint(painter: _SvgScene([${sc.ops.join(', ')}], ${sc.vbw}, ${sc.vbh}))`;
    const body = (_op != null && !isNaN(_op) && _op < 1) ? `Opacity(opacity: ${_op}, child: ${_b0})` : _b0;
    return body;
}
export function inner$emit$body$$step(_op, _b0) {
    const body = (_op != null && !isNaN(_op) && _op < 1) ? `Opacity(opacity: ${_op}, child: ${_b0})` : _b0;
    return body;
}
export function inner$emit$wf(inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const wf = pct(st0['width']);
    return wf;
}
export function inner$emit$wf$$step(st0) {
    const wf = pct(st0['width']);
    return wf;
}
export function inner$emit$hf(inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const hf = pct(st0['height']);
    return hf;
}
export function inner$emit$hf$$step(st0) {
    const hf = pct(st0['height']);
    return hf;
}
export function inner$emit$wfp(inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const wf = pct(st0['width']);
    let wfp = wf && +wf < 1 ? wf : null;
    return wfp;
}
export function inner$emit$wfp$$step(wf) {
    let wfp = wf && +wf < 1 ? wf : null;
    return wfp;
}
export function inner$emit$hfp(inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    const hf = pct(st0['height']);
    let hfp = hf && +hf < 1 ? hf : null;
    return hfp;
}
export function inner$emit$hfp$$step(hf) {
    let hfp = hf && +hf < 1 ? hf : null;
    return hfp;
}
export function inner$emit$ta2(ist) {
    const ta2 = resolveVars(ist['text-align'] || '', {});
    return ta2;
}
export function inner$emit$alignH(ist) {
    const ta2 = resolveVars(ist['text-align'] || '', {});
    const alignH = ta2 === 'center' ? 'center' : ta2 === 'left' ? 'centerLeft' : 'centerRight';
    return alignH;
}
export function inner$emit$alignH$$step(ta2) {
    const alignH = ta2 === 'center' ? 'center' : ta2 === 'left' ? 'centerLeft' : 'centerRight';
    return alignH;
}
export function inner$emit$t(node, ist) {
    const ph = node.attrs.placeholder || node.attrs.value || 'Label';
    const filled = !!node.attrs.value;
    const ta2 = resolveVars(ist['text-align'] || '', {});
    const alignH = ta2 === 'center' ? 'center' : ta2 === 'left' ? 'centerLeft' : 'centerRight';
    const t = `Align(alignment: Alignment.${alignH}, child: Text(${dq(ph)}, style: TextStyle(color: ${filled ? 'skin.ink' : 'skin.faint'}, fontFamily: fonts.he, fontSize: 13)))`;
    return t;
}
export function inner$emit$t$$step(ph, filled, alignH) {
    const t = `Align(alignment: Alignment.${alignH}, child: Text(${dq(ph)}, style: TextStyle(color: ${filled ? 'skin.ink' : 'skin.faint'}, fontFamily: fonts.he, fontSize: 13)))`;
    return t;
}
export function inner$emit$pv(node) {
    const pv = String(node.attrs.placeholder || node.attrs.value || '').trim();
    return pv;
}
export function inner$emit$ipad(ist) {
    const ipad = edge(ist, 'padding');
    return ipad;
}
export function inner$emit$myColor(inherit, st) {
    const myColor = colorExpr(st['color']) || inherit;
    return myColor;
}
export function inner$emit$_backHidden(st) {
    const _tf = st['transform'] || '';
    const _backHidden = /hidden/.test(st['backface-visibility'] || '') && /rotate[xy]\(\s*180/i.test(_tf);
    return _backHidden;
}
export function inner$emit$_backHidden$$step(st, _tf) {
    const _backHidden = /hidden/.test(st['backface-visibility'] || '') && /rotate[xy]\(\s*180/i.test(_tf);
    return _backHidden;
}
export function inner$emit$_slidOut(st) {
    const _tf = st['transform'] || '';
    const _slidOut = /^(?:absolute|fixed)$/.test((st['position'] || '').trim()) && /translate[xy]?\([^)]*(?<!\d)-?100%/i.test(_tf);
    return _slidOut;
}
export function inner$emit$_slidOut$$step(st, _tf) {
    const _slidOut = /^(?:absolute|fixed)$/.test((st['position'] || '').trim()) && /translate[xy]?\([^)]*(?<!\d)-?100%/i.test(_tf);
    return _slidOut;
}
export function inner$emit$kids(node) {
    const kids = elemChildren(node);
    return kids;
}
export function inner$emit$txt(node) {
    const txt = textOf(node);
    return txt;
}
export function inner$emit$taExpr(ta) {
    const taExpr = ta === 'center' ? ', textAlign: TextAlign.center' : ta === 'left' ? ', textAlign: TextAlign.left' : ta === 'right' ? ', textAlign: TextAlign.right' : '';
    return taExpr;
}
export function inner$emit$pk(node, map, ancestors, sibIdx) {
    const pk = pseudoKids(node, map, ancestors, sibIdx);
    return pk;
}
export function inner$emit$shown(node, tt) {
    const txt = textOf(node);
    const shown = tt === 'uppercase' ? txt.toUpperCase() : tt === 'lowercase' ? txt.toLowerCase() : tt === 'capitalize' ? txt.replace(/\b\w/g, c => c.toUpperCase()) : txt;
    return shown;
}
export function inner$emit$shown$$step(txt, tt) {
    const shown = tt === 'uppercase' ? txt.toUpperCase() : tt === 'lowercase' ? txt.toLowerCase() : tt === 'capitalize' ? txt.replace(/\b\w/g, c => c.toUpperCase()) : txt;
    return shown;
}
export function inner$emit$clipText(st) {
    const clipText = /text/.test(st['background-clip'] || st['-webkit-background-clip'] || '');
    return clipText;
}
export function inner$emit$grad(st) {
    const clipText = /text/.test(st['background-clip'] || st['-webkit-background-clip'] || '');
    const grad = clipText ? gradientExpr(st['background'] || '') : null;
    return grad;
}
export function inner$emit$grad$$step(st, clipText) {
    const grad = clipText ? gradientExpr(st['background'] || '') : null;
    return grad;
}
export function inner$emit$masked(st, tw) {
    const clipText = /text/.test(st['background-clip'] || st['-webkit-background-clip'] || '');
    const grad = clipText ? gradientExpr(st['background'] || '') : null;
    const masked = `ShaderMask(shaderCallback: (b) => ${grad}.createShader(b), blendMode: BlendMode.srcIn, child: ${tw})`;
    return masked;
}
export function inner$emit$masked$$step(grad, tw) {
    const masked = `ShaderMask(shaderCallback: (b) => ${grad}.createShader(b), blendMode: BlendMode.srcIn, child: ${tw})`;
    return masked;
}
export function inner$emit$slotsBefore(CUR) {
    const slotsBefore = CUR ? (CUR.slotCount || 0) : 0;
    return slotsBefore;
}
export function inner$emit$childAnc(node, ancestors) {
    const childAnc = ancestors.concat([node.classes || []]);
    return childAnc;
}
export function inner$emit$pFlexRow(st) {
    const pFlexRow = /flex/.test(st['display'] || '') && !/column/.test(st['flex-direction'] || '');
    return pFlexRow;
}
export function inner$emit$selfFlexGrid(st) {
    const selfFlexGrid = /flex|grid/.test(st['display'] || '');
    return selfFlexGrid;
}
export function inner$emit$selfWrap(st) {
    const selfWrap = /flex/.test(st['display'] || '') && !/column/.test(st['flex-direction'] || '') && /wrap/.test(st['flex-wrap'] || '') && !/nowrap/.test(st['flex-wrap'] || '');
    return selfWrap;
}
export function inner$emit$parentBlock(st) {
    const parentBlock = !/flex|grid/.test(st['display'] || '');
    return parentBlock;
}
export function inner$emit$allKids(node, map, ancestors, sibIdx) {
    const pk = pseudoKids(node, map, ancestors, sibIdx);
    const hasPseudo = pk.before.length || pk.after.length;
    const allKids = hasPseudo ? [...pk.before, ...node.children, ...pk.after] : node.children;
    return allKids;
}
export function inner$emit$allKids$$step(node, pk, hasPseudo) {
    const allKids = hasPseudo ? [...pk.before, ...node.children, ...pk.after] : node.children;
    return allKids;
}
export function inner$emit$sibRules(node, map, ancestors) {
    const childAnc = ancestors.concat([node.classes || []]);
    const sibRules = (map.sibling || []).filter(r => chainMatches(r.anc, childAnc));
    return sibRules;
}
export function inner$emit$sibRules$$step(map, childAnc) {
    const sibRules = (map.sibling || []).filter(r => chainMatches(r.anc, childAnc));
    return sibRules;
}
export function inner$emit$pColStretch(st) {
    const pColStretch = /flex/.test(st['display'] || '') && /column/.test(st['flex-direction'] || '') && !ALIGN[st['align-items']];
    return pColStretch;
}
export function inner$emit$selfFx(st) {
    const selfFx = (st['flex'] || '').trim();
    return selfFx;
}
export function inner$emit$selfHasGrow(st) {
    const selfFx = (st['flex'] || '').trim();
    const selfHasGrow = selfFx && selfFx !== 'none' && selfFx !== '0' && !/^0\b/.test(selfFx);
    return selfHasGrow;
}
export function inner$emit$selfHasGrow$$step(selfFx) {
    const selfHasGrow = selfFx && selfFx !== 'none' && selfFx !== '0' && !/^0\b/.test(selfFx);
    return selfHasGrow;
}
export function inner$emit$selfWidthUnbounded(parentFlexRow, st) {
    const selfFx = (st['flex'] || '').trim();
    const selfHasGrow = selfFx && selfFx !== 'none' && selfFx !== '0' && !/^0\b/.test(selfFx);
    const selfWidthUnbounded = parentFlexRow && !selfHasGrow && !px(st['width']) && pct(st['width']) !== '1.000';
    return selfWidthUnbounded;
}
export function inner$emit$selfWidthUnbounded$$step(parentFlexRow, st, selfHasGrow) {
    const selfWidthUnbounded = parentFlexRow && !selfHasGrow && !px(st['width']) && pct(st['width']) !== '1.000';
    return selfWidthUnbounded;
}
export function inner$emit$pColAny(st) {
    const pColAny = /flex/.test(st['display'] || '') && /column/.test(st['flex-direction'] || '');
    return pColAny;
}
export function inner$emit$els(node, map, ancestors, sibIdx) {
    const pk = pseudoKids(node, map, ancestors, sibIdx);
    const hasPseudo = pk.before.length || pk.after.length;
    const allKids = hasPseudo ? [...pk.before, ...node.children, ...pk.after] : node.children;
    const els = allKids.filter(c => c.tag && c.tag !== 'br');
    return els;
}
export function inner$emit$els$$step(allKids) {
    const els = allKids.filter(c => c.tag && c.tag !== 'br');
    return els;
}
export function inner$emit$runs(CUR, node, map, ancestors, sibIdx, grpKind) {
    const pk = pseudoKids(node, map, ancestors, sibIdx);
    const hasPseudo = pk.before.length || pk.after.length;
    const allKids = hasPseudo ? [...pk.before, ...node.children, ...pk.after] : node.children;
    const els = allKids.filter(c => c.tag && c.tag !== 'br');
    const runs = siblingRuns(els).filter(r => grpKind === 'items' ? r.members === (CUR.primary.run.members) || (r.start === CUR.primary.run.start && r.members.length === CUR.primary.run.members.length) : grpKind === 'cells' ? true : r.leafy);
    return runs;
}
export function inner$emit$runs$$step(CUR, grpKind, els) {
    const runs = siblingRuns(els).filter(r => grpKind === 'items' ? r.members === (CUR.primary.run.members) || (r.start === CUR.primary.run.start && r.members.length === CUR.primary.run.members.length) : grpKind === 'cells' ? true : r.leafy);
    return runs;
}
export function inner$emit$nB(CUR) {
    const nB = CUR ? CUR.n : 0;
    return nB;
}
export function inner$emit$raw(c) {
    const raw = c.text.replace(/\s+/g, ' ');
    return raw;
}
export function inner$emit$shown_L806(c, tt) {
    const raw = c.text.replace(/\s+/g, ' ');
    const shown = tt === 'uppercase' ? raw.toUpperCase() : tt === 'lowercase' ? raw.toLowerCase() : tt === 'capitalize' ? raw.replace(/\b\w/g, ch => ch.toUpperCase()) : raw;
    return shown;
}
export function inner$emit$shown_L806$$step(raw, tt) {
    const shown = tt === 'uppercase' ? raw.toUpperCase() : tt === 'lowercase' ? raw.toLowerCase() : tt === 'capitalize' ? raw.replace(/\b\w/g, ch => ch.toUpperCase()) : raw;
    return shown;
}
export function inner$emit$cInline(c, cst) {
    const cInline = cst['display'] ? /^inline/.test(cst['display']) : INLINE_TAGS.has(c.tag);
    return cInline;
}
export function inner$emit$posAbsC(cst) {
    const posAbsC = /^(?:absolute|fixed)$/.test((cst['position'] || '').trim());
    return posAbsC;
}
export function inner$emit$isMember(grp, c) {
    const isMember = !!(grp && grp.set.has(c));
    return isMember;
}
export function inner$emit$cz(cst) {
    const cz = zOf(cst);
    return cz;
}
export function inner$emit$fxc(cst) {
    const fxc = (cst['flex'] || '').trim();
    return fxc;
}
export function inner$emit$cGrow(cst) {
    const fxc = (cst['flex'] || '').trim();
    const cGrow = (fxc && fxc !== 'none' && fxc !== '0' && !/^0\b/.test(fxc)) || pct(cst['width']) === '1.000';
    return cGrow;
}
export function inner$emit$cGrow$$step(cst, fxc) {
    const cGrow = (fxc && fxc !== 'none' && fxc !== '0' && !/^0\b/.test(fxc)) || pct(cst['width']) === '1.000';
    return cGrow;
}
export function inner$emit$fx(cst) {
    const fx = (cst['flex'] || '').trim();
    return fx;
}
export function inner$emit$cpct(cst) {
    const cpct = pct(cst['width']);
    return cpct;
}
export function inner$emit$mv(msRaw) {
    const mv = px(msRaw);
    return mv;
}
export function inner$emit$tapped(grp, tplRaw) {
    const tapped = grp.selectable && grp.kind === 'items' ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: onSelect == null ? null : () => onSelect!(i), child: ${tplRaw})`
        : grp.kind === 'cells' ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: onCell == null ? null : () => onCell!(i, j), onLongPress: onCellLong == null ? null : () => onCellLong!(i, j), child: ${tplRaw})` // G14 · הקשה על תא — בתוך Expanded/Flexible (ParentData)
            : tplRaw;
    return tapped;
}
export function inner$emit$at(e, eRaw) {
    const at = e.indexOf(eRaw);
    return at;
}
export function inner$emit$t_L886(grp, e, eRaw, tplRaw) {
    const tapped = grp.selectable && grp.kind === 'items' ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: onSelect == null ? null : () => onSelect!(i), child: ${tplRaw})`
        : grp.kind === 'cells' ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: onCell == null ? null : () => onCell!(i, j), onLongPress: onCellLong == null ? null : () => onCellLong!(i, j), child: ${tplRaw})` // G14 · הקשה על תא — בתוך Expanded/Flexible (ParentData)
            : tplRaw;
    const at = e.indexOf(eRaw);
    const t = at >= 0 ? e.slice(0, at) + tapped + e.slice(at + eRaw.length) : tapped;
    return t;
}
export function inner$emit$t_L886$$step(e, eRaw, tapped, at) {
    const t = at >= 0 ? e.slice(0, at) + tapped + e.slice(at + eRaw.length) : tapped;
    return t;
}
export function inner$emit$anyTpl(grp) {
    const anyTpl = grp && (grp.tplI || Object.keys(grp.tplV).length);
    return anyTpl;
}
export function inner$emit$rowFlex(st) {
    const rowFlex = /flex/.test(st['display'] || '') && !/column/.test(st['flex-direction'] || '') && !(/wrap/.test(st['flex-wrap'] || '') && !/nowrap/.test(st['flex-wrap'] || ''));
    return rowFlex;
}
export function inner$emit$rawTpl(grp) {
    const rawTpl = grp.tplI || grp.tplA || Object.values(grp.tplV)[0] || '';
    return rawTpl;
}
export function inner$emit$vs(grp) {
    const vs = grp.variants.filter(v => v in grp.tplV);
    return vs;
}
export function inner$emit$tpl(grp) {
    const tpl = grp.tplI || Object.values(grp.tplV)[0];
    return tpl;
}
export function inner$emit$tpl_L910(grp) {
    const tpl = grp.tplI || Object.values(grp.tplV)[0];
    return tpl;
}
export function inner$emit$gap(st) {
    const gap = px(st['gap']);
    return gap;
}
export function inner$emit$listSep(st) {
    const gap = px(st['gap']);
    const listSep = gap ? `, spacing: ${gap}` : '';
    return listSep;
}
export function inner$emit$listSep$$step(gap) {
    const listSep = gap ? `, spacing: ${gap}` : '';
    return listSep;
}
export function inner$emit$isFlex(st) {
    const disp = st['display'] || '';
    const isFlex = /flex/.test(disp);
    return isFlex;
}
export function inner$emit$isFlex$$step(disp) {
    const isFlex = /flex/.test(disp);
    return isFlex;
}
export function inner$emit$col(st) {
    const fd = st['flex-direction'] || '';
    const col = /column/.test(fd);
    return col;
}
export function inner$emit$col$$step(fd) {
    const col = /column/.test(fd);
    return col;
}
export function inner$emit$colVAuto(node, st, maj) {
    const disp = st['display'] || '';
    const fd = st['flex-direction'] || '';
    const isFlex = /flex/.test(disp);
    const col = /column/.test(fd);
    const colVAuto = isFlex && col && !maj && hasVAutoChild(node);
    return colVAuto;
}
export function inner$emit$colVAuto$$step(node, isFlex, col, maj) {
    const colVAuto = isFlex && col && !maj && hasVAutoChild(node);
    return colVAuto;
}
export function inner$emit$majE(maj) {
    const majE = maj ? `, mainAxisAlignment: MainAxisAlignment.${maj}` : '';
    return majE;
}
export function inner$emit$isInlineFlex(st) {
    const disp = st['display'] || '';
    const isInlineFlex = /inline-flex/.test(disp);
    return isInlineFlex;
}
export function inner$emit$isInlineFlex$$step(disp) {
    const isInlineFlex = /inline-flex/.test(disp);
    return isInlineFlex;
}
export function inner$emit$ovfX(st) {
    const ovfX = (st['overflow-x'] || st['overflow'] || '').trim();
    return ovfX;
}
export function inner$emit$hScroll(st) {
    const disp = st['display'] || '';
    const fd = st['flex-direction'] || '';
    const isFlex = /flex/.test(disp);
    const col = /column/.test(fd);
    const ovfX = (st['overflow-x'] || st['overflow'] || '').trim();
    const hScroll = isFlex && !col && /auto|scroll/.test(ovfX);
    return hScroll;
}
export function inner$emit$hScroll$$step(isFlex, col, ovfX) {
    const hScroll = isFlex && !col && /auto|scroll/.test(ovfX);
    return hScroll;
}
export function inner$emit$rowSize(parentWrap, parentFlexRow, st) {
    const selfFx = (st['flex'] || '').trim();
    const selfHasGrow = selfFx && selfFx !== 'none' && selfFx !== '0' && !/^0\b/.test(selfFx);
    const selfWidthUnbounded = parentFlexRow && !selfHasGrow && !px(st['width']) && pct(st['width']) !== '1.000';
    const disp = st['display'] || '';
    const fd = st['flex-direction'] || '';
    const isFlex = /flex/.test(disp);
    const col = /column/.test(fd);
    const isInlineFlex = /inline-flex/.test(disp);
    const ovfX = (st['overflow-x'] || st['overflow'] || '').trim();
    const hScroll = isFlex && !col && /auto|scroll/.test(ovfX);
    const rowSize = (parentWrap || selfWidthUnbounded || hScroll) ? 'MainAxisSize.min' : (((isFlex && !isInlineFlex) || /^space-/.test(st['justify-content'] || '')) ? 'MainAxisSize.max' : 'MainAxisSize.min');
    return rowSize;
}
export function inner$emit$rowSize$$step(parentWrap, st, selfWidthUnbounded, isFlex, isInlineFlex, hScroll) {
    const rowSize = (parentWrap || selfWidthUnbounded || hScroll) ? 'MainAxisSize.min' : (((isFlex && !isInlineFlex) || /^space-/.test(st['justify-content'] || '')) ? 'MainAxisSize.max' : 'MainAxisSize.min');
    return rowSize;
}
export function inner$emit$flexWrap(st) {
    const flexWrap = /wrap/.test(st['flex-wrap'] || '') && !/nowrap/.test(st['flex-wrap'] || '');
    return flexWrap;
}
export function inner$emit$isGrid(st) {
    const disp = st['display'] || '';
    const isGrid = /grid/.test(disp);
    return isGrid;
}
export function inner$emit$isGrid$$step(disp) {
    const isGrid = /grid/.test(disp);
    return isGrid;
}
export function inner$emit$rep(gtc) {
    const rep = /repeat\(\s*(\d+)\s*,\s*([\d.]+)fr/.exec(gtc);
    return rep;
}
export function inner$emit$fr(gtc) {
    const fr = gtc.match(/([\d.]+)fr/g);
    return fr;
}
export function inner$emit$hasVM(flowVM) {
    const hasVM = flowVM.some(Boolean);
    return hasVM;
}
export function inner$emit$chunk(flow, ncol, i) {
    const chunk = flow.slice(i, i + ncol);
    return chunk;
}
export function inner$emit$cells(flow, gridCols, ncol, i) {
    const chunk = flow.slice(i, i + ncol);
    const cells = chunk.map((e, j) => `Expanded(flex: ${Math.max(1, Math.round(gridCols[j] || 1))}, child: ${e})`);
    return cells;
}
export function inner$emit$cells$$step(gridCols, chunk) {
    const cells = chunk.map((e, j) => `Expanded(flex: ${Math.max(1, Math.round(gridCols[j] || 1))}, child: ${e})`);
    return cells;
}
export function inner$emit$isLtrOv(st) {
    const isLtrOv = /ltr/.test(st['direction'] || '');
    return isLtrOv;
}
export function inner$emit$totalW(flow, flowMeta) {
    const pos = [];
    let acc = 0;
    for (let i = 0; i < flow.length; i++) {
        if (i > 0)
            acc += flowMeta[i - 1].w + flowMeta[i].negMS;
        pos.push(acc);
    }
    const totalW = pos[flow.length - 1] + flowMeta[flow.length - 1].w;
    return totalW;
}
export function inner$emit$totalW$$step(flow, flowMeta, pos) {
    const totalW = pos[flow.length - 1] + flowMeta[flow.length - 1].w;
    return totalW;
}
export function inner$emit$maxH(flowMeta) {
    const maxH = Math.max(...flowMeta.map(m => m.h || 0));
    return maxH;
}
export function inner$emit$side(st) {
    const isLtrOv = /ltr/.test(st['direction'] || '');
    const side = isLtrOv ? 'left' : 'right';
    return side;
}
export function inner$emit$side$$step(isLtrOv) {
    const side = isLtrOv ? 'left' : 'right';
    return side;
}
export function inner$emit$items(st, flow, flowMeta) {
    const isLtrOv = /ltr/.test(st['direction'] || '');
    const pos = [];
    let acc = 0;
    for (let i = 0; i < flow.length; i++) {
        if (i > 0)
            acc += flowMeta[i - 1].w + flowMeta[i].negMS;
        pos.push(acc);
    }
    const side = isLtrOv ? 'left' : 'right';
    const items = flow.map((e, i) => `Positioned(${side}: ${(+pos[i].toFixed(2))}, top: 0, bottom: 0, child: Center(widthFactor: 1.0, child: ${e}))`).join(', ');
    return items;
}
export function inner$emit$items$$step(flow, pos, side) {
    const items = flow.map((e, i) => `Positioned(${side}: ${(+pos[i].toFixed(2))}, top: 0, bottom: 0, child: Center(widthFactor: 1.0, child: ${e}))`).join(', ');
    return items;
}
export function inner$emit$emBase(effText) {
    const emBase = +(px(effText['font-size']) || 14);
    return emBase;
}
export function inner$emit$pxe$p(v) {
    const p = px(v);
    return p;
}
export function inner$emit$pxe$em(v) {
    const em = /(-?\d*\.?\d+)em/.exec(v);
    return em;
}
export function inner$emit$map$parts(ib) {
    const parts = ib.trim().split(/\s+/);
    return parts;
}
export function inner$emit$map$isLtr(a) {
    const isLtr = /ltr/.test(a.st['direction'] || '');
    return isLtr;
}
export function inner$emit$map$parts_L1009(ii) {
    const parts = ii.trim().split(/\s+/);
    return parts;
}
export function inner$emit$map$lr(l, r) {
    const lr = [l != null ? `left: ${l}` : '', r != null ? `right: ${r}` : ''].filter(Boolean).join(', ');
    return lr;
}
export function inner$emit$map$pp(st) {
    const pp = String(st['padding'] || '0').trim().split(/\s+/).map(v => +(px(v) || 0));
    return pp;
}
export function inner$emit$map$pt(st) {
    const pp = String(st['padding'] || '0').trim().split(/\s+/).map(v => +(px(v) || 0));
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pt;
}
export function inner$emit$map$pt$$step(pp) {
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pt;
}
export function inner$emit$map$pr(st) {
    const pp = String(st['padding'] || '0').trim().split(/\s+/).map(v => +(px(v) || 0));
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pr;
}
export function inner$emit$map$pr$$step(pp) {
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pr;
}
export function inner$emit$map$pb(st) {
    const pp = String(st['padding'] || '0').trim().split(/\s+/).map(v => +(px(v) || 0));
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pb;
}
export function inner$emit$map$pb$$step(pp) {
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pb;
}
export function inner$emit$map$pl(st) {
    const pp = String(st['padding'] || '0').trim().split(/\s+/).map(v => +(px(v) || 0));
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pl;
}
export function inner$emit$map$pl$$step(pp) {
    const [pt, pr, pb, pl] = pp.length === 1 ? [pp[0], pp[0], pp[0], pp[0]] : pp.length === 2 ? [pp[0], pp[1], pp[0], pp[1]] : pp.length === 3 ? [pp[0], pp[1], pp[2], pp[1]] : pp;
    return pl;
}
export function inner$emit$pad(st) {
    const pad = edge(st, 'padding');
    return pad;
}
export function inner$emit$flowW(st, inner) {
    const pad = edge(st, 'padding');
    const flowW = pad && inner ? `Padding(padding: ${pad}, child: ${inner})` : inner;
    return flowW;
}
export function inner$emit$flowW$$step(inner, pad) {
    const flowW = pad && inner ? `Padding(padding: ${pad}, child: ${inner})` : inner;
    return flowW;
}
export function inner$emit$_plS(st) {
    const _plS = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    return _plS;
}
export function inner$emit$stackCentered(st) {
    const _plS = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    const stackCentered = /center/.test(_plS) || (ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center');
    return stackCentered;
}
export function inner$emit$stackCentered$$step(st, _plS) {
    const stackCentered = /center/.test(_plS) || (ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center');
    return stackCentered;
}
export function inner$emit$stackAlign(st) {
    const _plS = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    const stackCentered = /center/.test(_plS) || (ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center');
    let stackAlign = stackCentered ? 'Alignment.center' : null;
    return stackAlign;
}
export function inner$emit$stackAlign$$step(stackCentered) {
    let stackAlign = stackCentered ? 'Alignment.center' : null;
    return stackAlign;
}
export function inner$emit$zItems(st, abs, flowMaxZ, inner, pos) {
    const pad = edge(st, 'padding');
    const flowW = pad && inner ? `Padding(padding: ${pad}, child: ${inner})` : inner;
    const zItems = (flowW ? [{ w: flowW, z: flowMaxZ }] : []).concat(pos.map((w, i) => ({ w, z: abs[i].z })));
    return zItems;
}
export function inner$emit$zItems$$step(abs, flowMaxZ, pos, flowW) {
    const zItems = (flowW ? [{ w: flowW, z: flowMaxZ }] : []).concat(pos.map((w, i) => ({ w, z: abs[i].z })));
    return zItems;
}
export function inner$wrapBox$dispRaw(st) {
    const dispRaw = (st['display'] || '').trim();
    return dispRaw;
}
export function inner$wrapBox$posAbs(st) {
    const posAbs = /^(absolute|fixed)$/.test((st['position'] || '').trim());
    return posAbs;
}
export function inner$wrapBox$effInline(st, node, parentFlex) {
    const dispRaw = (st['display'] || '').trim();
    const posAbs = /^(absolute|fixed)$/.test((st['position'] || '').trim());
    const effInline = !parentFlex && !posAbs && (dispRaw ? dispRaw === 'inline' : !!(node && INLINE_TAGS.has(node.tag)));
    return effInline;
}
export function inner$wrapBox$effInline$$step(node, parentFlex, dispRaw, posAbs) {
    const effInline = !parentFlex && !posAbs && (dispRaw ? dispRaw === 'inline' : !!(node && INLINE_TAGS.has(node.tag)));
    return effInline;
}
export function inner$wrapBox$deco(st) {
    const deco = decoration(st);
    return deco;
}
export function inner$wrapBox$pad(st, noPad) {
    const pad = noPad ? null : edge(st, 'padding');
    return pad;
}
export function inner$wrapBox$mg(st, noVMargin) {
    const mg = edge(st, 'margin', noVMargin);
    return mg;
}
export function inner$wrapBox$w(st) {
    const w = px(st['width']);
    return w;
}
export function inner$wrapBox$h(st) {
    const h = px(st['height']);
    return h;
}
export function inner$wrapBox$minH(st) {
    const minH = px(st['min-height']);
    return minH;
}
export function inner$wrapBox$minW(st) {
    const minW = px(st['min-width']);
    return minW;
}
export function inner$wrapBox$ovfY(st) {
    const ovfY = (st['overflow-y'] || st['overflow'] || '').trim();
    return ovfY;
}
export function inner$wrapBox$pl(st) {
    const pl = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    return pl;
}
export function inner$wrapBox$bothCenter(st) {
    const bothCenter = ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center';
    return bothCenter;
}
export function inner$wrapBox$centered(st, node) {
    const pl = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    const bothCenter = ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center';
    const centered = /center/.test(pl) || bothCenter || (node && node.tag === 'button');
    return centered;
}
export function inner$wrapBox$centered$$step(node, pl, bothCenter) {
    const centered = /center/.test(pl) || bothCenter || (node && node.tag === 'button');
    return centered;
}
export function inner$wrapBox$isMrowCtr(st, inner, node) {
    const w = px(st['width']);
    const h = px(st['height']);
    const minH = px(st['min-height']);
    const pl = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    const bothCenter = ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center';
    const centered = /center/.test(pl) || bothCenter || (node && node.tag === 'button');
    const isMrowCtr = minH != null && !w && !h && !centered && inner &&
        /\bflex\b/.test(st['display'] || '') && (st['flex-direction'] || 'row') !== 'column' &&
        /wrap/.test(st['flex-wrap'] || '') && !/nowrap/.test(st['flex-wrap'] || '') &&
        (!st['justify-content'] || /^(?:flex-)?start$/.test(st['justify-content'])) &&
        ALIGN[st['align-items']] === 'center';
    return isMrowCtr;
}
export function inner$wrapBox$isMrowCtr$$step(st, inner, w, h, minH, centered) {
    const isMrowCtr = minH != null && !w && !h && !centered && inner &&
        /\bflex\b/.test(st['display'] || '') && (st['flex-direction'] || 'row') !== 'column' &&
        /wrap/.test(st['flex-wrap'] || '') && !/nowrap/.test(st['flex-wrap'] || '') &&
        (!st['justify-content'] || /^(?:flex-)?start$/.test(st['justify-content'])) &&
        ALIGN[st['align-items']] === 'center';
    return isMrowCtr;
}
export function inner$wrapBox$isColVCtr(st, inner, node) {
    const w = px(st['width']);
    const h = px(st['height']);
    const minH = px(st['min-height']);
    const pl = `${st['place-items'] || ''} ${st['place-content'] || ''} ${st['justify-items'] || ''}`;
    const bothCenter = ALIGN[st['align-items']] === 'center' && JUST[st['justify-content']] === 'center';
    const centered = /center/.test(pl) || bothCenter || (node && node.tag === 'button');
    const isColVCtr = minH != null && !w && !h && !centered && inner && node &&
        /\bflex\b/.test(st['display'] || '') && (st['flex-direction'] || '') === 'column' && !st['justify-content'] && hasVAutoChild(node);
    return isColVCtr;
}
export function inner$wrapBox$isColVCtr$$step(st, inner, node, w, h, minH, centered) {
    const isColVCtr = minH != null && !w && !h && !centered && inner && node &&
        /\bflex\b/.test(st['display'] || '') && (st['flex-direction'] || '') === 'column' && !st['justify-content'] && hasVAutoChild(node);
    return isColVCtr;
}
export function inner$wrapBox$glow(st) {
    const glow = bgOverlayGlow(st);
    return glow;
}
export function inner$wrapBox$am(arRaw) {
    const am = arRaw.trim().match(/^([\d.]+)\s*(?:\/\s*([\d.]+))?$/);
    return am;
}
export function inner$wrapBox$ar(arRaw) {
    const am = arRaw.trim().match(/^([\d.]+)\s*(?:\/\s*([\d.]+))?$/);
    const ar = am[2] ? (+am[1] / +am[2]) : +am[1];
    return ar;
}
export function inner$wrapBox$ar$$step(am) {
    const ar = am[2] ? (+am[1] / +am[2]) : +am[1];
    return ar;
}
export function inner$wrapBox$rad(st) {
    const rad = /%|999/.test(st['border-radius'] || '') ? '999' : (px(st['border-radius']) || '0');
    return rad;
}
export function inner$wrapBox$bl(st) {
    const bf = st['backdrop-filter'] || st['-webkit-backdrop-filter'];
    const bl = px(bf) || '12';
    return bl;
}
export function inner$wrapBox$bl$$step(bf) {
    const bl = px(bf) || '12';
    return bl;
}
export function inner$wrapBox$op(st) {
    const op = st['opacity'] != null ? parseFloat(st['opacity']) : null;
    return op;
}
export function inner$wrapBox$wp(st) {
    const wp = pct(st['width']);
    return wp;
}
export function inner$wrapBox$hp(st) {
    const hp = pct(st['height']);
    return hp;
}
export function inner$wrapBox$wpct(st) {
    const wp = pct(st['width']);
    const wpct = wp && +wp < 1 ? wp : null;
    return wpct;
}
export function inner$wrapBox$wpct$$step(wp) {
    const wpct = wp && +wp < 1 ? wp : null;
    return wpct;
}
export function inner$wrapBox$hpct(st) {
    const hp = pct(st['height']);
    const hpct = hp && +hp < 1 ? hp : null;
    return hpct;
}
export function inner$wrapBox$hpct$$step(hp) {
    const hpct = hp && +hp < 1 ? hp : null;
    return hpct;
}
export function inner$divBlocks$re(cls) {
    const re = new RegExp(`<div class="([^"]*\\b${cls}\\b[^"]*)"[^>]*>`, 'g');
    return re;
}
export function inner$theaterStates$th(body) {
    const th = divBlocks(body, 'theater')[0];
    return th;
}
export function inner$theaterStates$sts(body) {
    const th = divBlocks(body, 'theater')[0];
    const sts = divBlocks(th, 'st');
    return sts;
}
export function inner$theaterStates$sts$$step(th) {
    const sts = divBlocks(th, 'st');
    return sts;
}
export function inner$theaterStates$map$lb(st) {
    const lb = st.match(/<span class="slb">([^<]+)<\/span>/);
    return lb;
}
export function inner$theaterStates$map$label(st) {
    const lb = st.match(/<span class="slb">([^<]+)<\/span>/);
    const label = lb ? decode(lb[1]).trim() : 'state';
    return label;
}
export function inner$theaterStates$map$label$$step(lb) {
    const label = lb ? decode(lb[1]).trim() : 'state';
    return label;
}
export function inner$theaterStates$map$inner(st) {
    const inner = st.replace(/<div class="([^"]*\bst\b[^"]*)"[^>]*>/, '').replace(/<span class="slb">[^<]*<\/span>/, '').replace(/<\/div>\s*$/, '');
    return inner;
}
export function inner$enumId$id(s) {
    let id = s.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).map((w, k) => k ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase()).join('');
    return id;
}
export function inner$cells$block(html, start, i) {
    const block = html.slice(start, i);
    return block;
}
export function inner$cells$nm(html, start, i) {
    const block = html.slice(start, i);
    const nm = block.match(/<span class="nm">([^<]+)<\/span>/);
    return nm;
}
export function inner$cells$nm$$step(block) {
    const nm = block.match(/<span class="nm">([^<]+)<\/span>/);
    return nm;
}
export function inner$cells$name(html, start, i) {
    const block = html.slice(start, i);
    const nm = block.match(/<span class="nm">([^<]+)<\/span>/);
    const name = decode(nm[1]).split('·')[0].trim();
    return name;
}
export function inner$cells$name$$step(nm) {
    const name = decode(nm[1]).split('·')[0].trim();
    return name;
}
export function inner$cells$seamM(html, start, i) {
    const block = html.slice(start, i);
    const seamM = block.match(/<span class="seam[^"]*">([^<]+)<\/span>/);
    return seamM;
}
export function inner$cells$seamM$$step(block) {
    const seamM = block.match(/<span class="seam[^"]*">([^<]+)<\/span>/);
    return seamM;
}
export function inner$cells$seam(html, start, i) {
    const block = html.slice(start, i);
    const seamM = block.match(/<span class="seam[^"]*">([^<]+)<\/span>/);
    const seam = seamM ? decode(seamM[1]).toLowerCase().split(/\s/)[0] : 'fields';
    return seam;
}
export function inner$cells$seam$$step(seamM) {
    const seam = seamM ? decode(seamM[1]).toLowerCase().split(/\s/)[0] : 'fields';
    return seam;
}
export function inner$cells$body(html, start, i) {
    const block = html.slice(start, i);
    let body = block.replace(/<div class="([^"]*\bcell\b[^"]*)"[^>]*>/, '');
    return body;
}
export function inner$cells$body$$step(block) {
    let body = block.replace(/<div class="([^"]*\bcell\b[^"]*)"[^>]*>/, '');
    return body;
}
export function inner$collectGlobalGrads$dom(html) {
    const dom = parseDOM(html);
    return dom;
}
export function inner$forgeCell$states(c) {
    const states = theaterStates(c.body);
    return states;
}
export function inner$forgeCell$map$id(s, i) {
    let id = enumId(s.label, i);
    return id;
}
export function inner$forgeCell$map$d(s) {
    const d = parseDOM(s.html);
    return d;
}
export function inner$forgeCell$dom(c) {
    const dom = parseDOM(c.body);
    return dom;
}
export function inner$forgeCell$useSkin(bodyExpr) {
    const useSkin = /\bskin\./.test(bodyExpr);
    return useSkin;
}
export function inner$forgeCell$useTheme(bodyExpr) {
    const useTheme = /\btheme\./.test(bodyExpr);
    return useTheme;
}
export function inner$forgeCell$useFonts(bodyExpr) {
    const useFonts = /\bfonts\./.test(bodyExpr);
    return useFonts;
}
export function inner$forgeCell$useIcon(bodyExpr) {
    const useIcon = /_icon\(/.test(bodyExpr);
    return useIcon;
}
export function inner$forgeCell$useSvg(bodyExpr) {
    const useSvg = /_SvgScene\(/.test(bodyExpr);
    return useSvg;
}
export function inner$forgeCell$useUi(bodyExpr) {
    const useUi = /ImageFilter\./.test(bodyExpr);
    return useUi;
}
export function inner$forgeCell$decls(bodyExpr) {
    const useSkin = /\bskin\./.test(bodyExpr);
    const useTheme = /\btheme\./.test(bodyExpr);
    const useFonts = /\bfonts\./.test(bodyExpr);
    const decls = [
        useSkin && '    final skin = DsSeam.skinOf(context);   // מלוא-העיצוב מהחריץ',
        useTheme && '    final theme = DsSeam.of(context);       // אקצנט (מורף)',
        useFonts && '    final fonts = DsSeam.fontsOf(context);  // פונט',
    ].filter(Boolean).join('\n');
    return decls;
}
export function inner$forgeCell$decls$$step(useSkin, useTheme, useFonts) {
    const decls = [
        useSkin && '    final skin = DsSeam.skinOf(context);   // מלוא-העיצוב מהחריץ',
        useTheme && '    final theme = DsSeam.of(context);       // אקצנט (מורף)',
        useFonts && '    final fonts = DsSeam.fontsOf(context);  // פונט',
    ].filter(Boolean).join('\n');
    return decls;
}
export function inner$forgeCell$slotsN(CUR) {
    const slotsN = CUR ? CUR.n : 0;
    return slotsN;
}
export function inner$forgeCell$slotDemo(CUR) {
    const slotDemo = CUR ? CUR.slots.slice() : [];
    return slotDemo;
}
export function inner$forgeCell$allExpr(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    return allExpr;
}
export function inner$forgeCell$useHide(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useHide = /\b_hide\(/.test(allExpr);
    return useHide;
}
export function inner$forgeCell$useHide$$step(allExpr) {
    const useHide = /\b_hide\(/.test(allExpr);
    return useHide;
}
export function inner$forgeCell$useChild(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useChild = /\bchild\b/.test(allExpr);
    return useChild;
}
export function inner$forgeCell$useChild$$step(allExpr) {
    const useChild = /\bchild\b/.test(allExpr);
    return useChild;
}
export function inner$forgeCell$useWith(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useWith = /\b_withChild\(/.test(allExpr);
    return useWith;
}
export function inner$forgeCell$useWith$$step(allExpr) {
    const useWith = /\b_withChild\(/.test(allExpr);
    return useWith;
}
export function inner$forgeCell$useV(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useV = /\b_v\(/.test(allExpr);
    return useV;
}
export function inner$forgeCell$useV$$step(allExpr) {
    const useV = /\b_v\(/.test(allExpr);
    return useV;
}
export function inner$forgeCell$useAct(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useAct = /\bonAction\b/.test(allExpr);
    return useAct;
}
export function inner$forgeCell$useAct$$step(allExpr) {
    const useAct = /\bonAction\b/.test(allExpr);
    return useAct;
}
export function inner$forgeCell$useCtl(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useCtl = /\bcontrol\b/.test(allExpr);
    return useCtl;
}
export function inner$forgeCell$useCtl$$step(allExpr) {
    const useCtl = /\bcontrol\b/.test(allExpr);
    return useCtl;
}
export function inner$forgeCell$useItems(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useItems = /\bitems!\[i\]|\bitems == null\b/.test(allExpr);
    return useItems;
}
export function inner$forgeCell$useItems$$step(allExpr) {
    const useItems = /\bitems!\[i\]|\bitems == null\b/.test(allExpr);
    return useItems;
}
export function inner$forgeCell$useSel(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useSel = /\bselected\?/.test(allExpr);
    return useSel;
}
export function inner$forgeCell$useSel$$step(allExpr) {
    const useSel = /\bselected\?/.test(allExpr);
    return useSel;
}
export function inner$forgeCell$useOnSel(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useOnSel = /\bonSelect\b/.test(allExpr);
    return useOnSel;
}
export function inner$forgeCell$useOnSel$$step(allExpr) {
    const useOnSel = /\bonSelect\b/.test(allExpr);
    return useOnSel;
}
export function inner$forgeCell$useCols(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useCols = /\bcolumns[!=]/.test(allExpr);
    return useCols;
}
export function inner$forgeCell$useCols$$step(allExpr) {
    const useCols = /\bcolumns[!=]/.test(allExpr);
    return useCols;
}
export function inner$forgeCell$useVar(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useVar = /\bvariants[!=]/.test(allExpr);
    return useVar;
}
export function inner$forgeCell$useVar$$step(allExpr) {
    const useVar = /\bvariants[!=]/.test(allExpr);
    return useVar;
}
export function inner$forgeCell$useCell(bodyExpr, coreBlock) {
    const allExpr = coreBlock + bodyExpr;
    const useCell = /\bonCell\b/.test(allExpr);
    return useCell;
}
export function inner$forgeCell$useCell$$step(allExpr) {
    const useCell = /\bonCell\b/.test(allExpr);
    return useCell;
}
export function inner$forgeCell$it(CUR) {
    const it = CUR && CUR.items ? CUR.items : { slots: 0, demo: 0, selectable: false, active: false, variants: null };
    return it;
}
export function inner$forgeCell$seamsBlock(CUR, bodyExpr, coreBlock, useBare) {
    const allExpr = coreBlock + bodyExpr;
    const useHide = /\b_hide\(/.test(allExpr);
    const useWith = /\b_withChild\(/.test(allExpr);
    const useV = /\b_v\(/.test(allExpr);
    const useAct = /\bonAction\b/.test(allExpr);
    const useCtl = /\bcontrol\b/.test(allExpr);
    const useItems = /\bitems!\[i\]|\bitems == null\b/.test(allExpr);
    const useSel = /\bselected\?/.test(allExpr);
    const useOnSel = /\bonSelect\b/.test(allExpr);
    const useCols = /\bcolumns[!=]/.test(allExpr);
    const useVar = /\bvariants[!=]/.test(allExpr);
    const useCell = /\bonCell\b/.test(allExpr);
    const it = CUR && CUR.items ? CUR.items : { slots: 0, demo: 0, selectable: false, active: false, variants: null };
    const seamsBlock = [
        '  /// G13a · תוכן-נוסף בתוך מסגרת-האטום, אחרי זרימת-העיצוב (מקטע/כרטיס ⇒ תוכן-המודול). null ⇒ האטום לבדו.\n  final Widget? child;',
        useWith && '  // G13a · תוכן-נוסף בתוך המסגרת; null ⇒ ביט-זהה. גובה-חסום (Expanded/SizedBox סביב המסגרת) ⇒ התוכן ממלא (Expanded — רשימות/גלילה חיות, כמו GlassCard(child) של הזהב); גובה-חופשי ⇒ Column מכווץ-לתוכן.\n  static Widget _withChild(Widget w, Widget? c) => c == null ? w : LayoutBuilder(builder: (ctx, cns) => cns.hasBoundedHeight\n      ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [w, Expanded(child: c)])\n      : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [w, c]));',
        useHide && '  static Widget _hide(String s, Widget w) => s.isEmpty ? const SizedBox.shrink() : w;   // G13a · חריץ-ריק ⇒ הקופסה נעלמת',
        useBare && '  /// G13b · bare=true ⇒ ליבת-הבקרה בלי מסגרת-הגלריה של Pure (.ctl/.body/.stage); child נכנס לליבה. false ⇒ ביט-זהה לגלריה.\n  final bool bare;',
        useCtl && '  /// G13a · שדה-חי (TextField וכו׳) במקום ציור-ה-input של הגלריה. null ⇒ הציור.\n  final Widget? control;',
        useAct && `  /// G13a · הקשה על כפתור/קישור k (סדר-הופעה, ${CUR.actions} פעולות).\n  final void Function(int)? onAction;\n  static const int actionSlots = ${CUR.actions};`,
        useCell && '  /// G14 · תא (items[i][j], אחרי חריצי-הכותרת) — הקשה/הקשה-ארוכה על תא j של פריט i.\n  final void Function(int i, int j)? onCell;\n  final void Function(int i, int j)? onCellLong;',
        useCols && `  /// G13d · כותרות-עמודות: columns[j] ⇒ תבנית-הכותרת (${CUR.columns ? CUR.columns.demo : 0} בדמו). null ⇒ כותרות-העיצוב.\n  final List<String>? columns;`,
        useVar && `  /// G13d · וריאנט-פריט (טוקן-עיצוב: ${JSON.stringify(it.variants || [])}) — variants[i] = אינדקס-הוריאנט של פריט i; null ⇒ הראשון.\n  final List<int>? variants;\n  static const List<String> variantIds = <String>[${(it.variants || []).map(dq).join(', ')}];`,
        useItems && `  /// G13a · קבוצת-פריטים: items[i] = חריצי-הטקסט של פריט i (${it.slots} חריצים · ${it.demo} בדמו${it.selectable ? ' · לחיץ: onSelect(i)' : ''}${it.active ? ' · selected = הפריטים-הפעילים' : ''}${CUR.cells ? ` · תאים: items[i].length (${CUR.cells} בדמו)` : ''}). null ⇒ פריטי-העיצוב.\n  final List<List<String>>? items;${useSel ? '\n  final Set<int>? selected;' : ''}${useOnSel ? '\n  final void Function(int)? onSelect;' : ''}\n  static const int itemSlots = ${it.slots};\n  static const int itemDemo = ${it.demo};\n  String _it(List<String> r, int j, String d) => items == null ? d : (j < r.length ? r[j] : '');`,
        useV && `  /// G13a · מילויי-אחוז (0..1) לפי סדר-הופעה/פריט (${CUR.vn} בדמו). null ⇒ ערכי-העיצוב; חסר ⇒ 0 (אין המצאה).\n  final List<double>? values;\n  double _v(int i, double d) => values == null ? d : (i < values!.length ? values![i].clamp(0.0, 1.0) : 0.0);`,
    ].filter(Boolean).join('\n') + '\n';
    return seamsBlock;
}
export function inner$forgeCell$seamsBlock$$step(CUR, useBare, useHide, useWith, useV, useAct, useCtl, useItems, useSel, useOnSel, useCols, useVar, useCell, it) {
    const seamsBlock = [
        '  /// G13a · תוכן-נוסף בתוך מסגרת-האטום, אחרי זרימת-העיצוב (מקטע/כרטיס ⇒ תוכן-המודול). null ⇒ האטום לבדו.\n  final Widget? child;',
        useWith && '  // G13a · תוכן-נוסף בתוך המסגרת; null ⇒ ביט-זהה. גובה-חסום (Expanded/SizedBox סביב המסגרת) ⇒ התוכן ממלא (Expanded — רשימות/גלילה חיות, כמו GlassCard(child) של הזהב); גובה-חופשי ⇒ Column מכווץ-לתוכן.\n  static Widget _withChild(Widget w, Widget? c) => c == null ? w : LayoutBuilder(builder: (ctx, cns) => cns.hasBoundedHeight\n      ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [w, Expanded(child: c)])\n      : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [w, c]));',
        useHide && '  static Widget _hide(String s, Widget w) => s.isEmpty ? const SizedBox.shrink() : w;   // G13a · חריץ-ריק ⇒ הקופסה נעלמת',
        useBare && '  /// G13b · bare=true ⇒ ליבת-הבקרה בלי מסגרת-הגלריה של Pure (.ctl/.body/.stage); child נכנס לליבה. false ⇒ ביט-זהה לגלריה.\n  final bool bare;',
        useCtl && '  /// G13a · שדה-חי (TextField וכו׳) במקום ציור-ה-input של הגלריה. null ⇒ הציור.\n  final Widget? control;',
        useAct && `  /// G13a · הקשה על כפתור/קישור k (סדר-הופעה, ${CUR.actions} פעולות).\n  final void Function(int)? onAction;\n  static const int actionSlots = ${CUR.actions};`,
        useCell && '  /// G14 · תא (items[i][j], אחרי חריצי-הכותרת) — הקשה/הקשה-ארוכה על תא j של פריט i.\n  final void Function(int i, int j)? onCell;\n  final void Function(int i, int j)? onCellLong;',
        useCols && `  /// G13d · כותרות-עמודות: columns[j] ⇒ תבנית-הכותרת (${CUR.columns ? CUR.columns.demo : 0} בדמו). null ⇒ כותרות-העיצוב.\n  final List<String>? columns;`,
        useVar && `  /// G13d · וריאנט-פריט (טוקן-עיצוב: ${JSON.stringify(it.variants || [])}) — variants[i] = אינדקס-הוריאנט של פריט i; null ⇒ הראשון.\n  final List<int>? variants;\n  static const List<String> variantIds = <String>[${(it.variants || []).map(dq).join(', ')}];`,
        useItems && `  /// G13a · קבוצת-פריטים: items[i] = חריצי-הטקסט של פריט i (${it.slots} חריצים · ${it.demo} בדמו${it.selectable ? ' · לחיץ: onSelect(i)' : ''}${it.active ? ' · selected = הפריטים-הפעילים' : ''}${CUR.cells ? ` · תאים: items[i].length (${CUR.cells} בדמו)` : ''}). null ⇒ פריטי-העיצוב.\n  final List<List<String>>? items;${useSel ? '\n  final Set<int>? selected;' : ''}${useOnSel ? '\n  final void Function(int)? onSelect;' : ''}\n  static const int itemSlots = ${it.slots};\n  static const int itemDemo = ${it.demo};\n  String _it(List<String> r, int j, String d) => items == null ? d : (j < r.length ? r[j] : '');`,
        useV && `  /// G13a · מילויי-אחוז (0..1) לפי סדר-הופעה/פריט (${CUR.vn} בדמו). null ⇒ ערכי-העיצוב; חסר ⇒ 0 (אין המצאה).\n  final List<double>? values;\n  double _v(int i, double d) => values == null ? d : (i < values!.length ? values![i].clamp(0.0, 1.0) : 0.0);`,
    ].filter(Boolean).join('\n') + '\n';
    return seamsBlock;
}
export function inner$forgeCell$ctorExtra(bodyExpr, coreBlock, useBare) {
    const allExpr = coreBlock + bodyExpr;
    const useV = /\b_v\(/.test(allExpr);
    const useAct = /\bonAction\b/.test(allExpr);
    const useCtl = /\bcontrol\b/.test(allExpr);
    const useItems = /\bitems!\[i\]|\bitems == null\b/.test(allExpr);
    const useSel = /\bselected\?/.test(allExpr);
    const useOnSel = /\bonSelect\b/.test(allExpr);
    const useCols = /\bcolumns[!=]/.test(allExpr);
    const useVar = /\bvariants[!=]/.test(allExpr);
    const useCell = /\bonCell\b/.test(allExpr);
    const ctorExtra = ', this.child' + (useBare ? ', this.bare = false' : '') + (useCtl ? ', this.control' : '') + (useAct ? ', this.onAction' : '') + (useItems ? ', this.items' + (useSel ? ', this.selected' : '') + (useOnSel ? ', this.onSelect' : '') + (useVar ? ', this.variants' : '') : '') + (useCols ? ', this.columns' : '') + (useCell ? ', this.onCell, this.onCellLong' : '') + (useV ? ', this.values' : '');
    return ctorExtra;
}
export function inner$forgeCell$ctorExtra$$step(useBare, useV, useAct, useCtl, useItems, useSel, useOnSel, useCols, useVar, useCell) {
    const ctorExtra = ', this.child' + (useBare ? ', this.bare = false' : '') + (useCtl ? ', this.control' : '') + (useAct ? ', this.onAction' : '') + (useItems ? ', this.items' + (useSel ? ', this.selected' : '') + (useOnSel ? ', this.onSelect' : '') + (useVar ? ', this.variants' : '') : '') + (useCols ? ', this.columns' : '') + (useCell ? ', this.onCell, this.onCellLong' : '') + (useV ? ', this.values' : '');
    return ctorExtra;
}
export function inner$forgeCell$fieldsBlock(CUR) {
    const slotsN = CUR ? CUR.n : 0;
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const fieldsBlock = slotsN ? `  /// תפר-דאטה (G12a): ${slotsN} חריצי-טקסט. null ⇒ תוכן-העיצוב (כמו ב-Pure); רשימה ⇒ fields[i] או '' — אין תוכן-דמו בייצור (§20-ג)
    final List<String>? fields;
    static const int fieldSlots = ${slotsN};
    static const List<String> fieldDemo = <String>[${slotDemo.map(dq).join(', ')}];   // תוכן-העיצוב פר-חריץ — מלמד את המחולל את צורת-החריץ (מספר/טקסט), לא ערך
    String _f(int i, String d) => fields == null ? d : (i < fields!.length ? fields![i] : '');
  ` : '';
    return fieldsBlock;
}
export function inner$forgeCell$fieldsBlock$$step(slotsN, slotDemo) {
    const fieldsBlock = slotsN ? `  /// תפר-דאטה (G12a): ${slotsN} חריצי-טקסט. null ⇒ תוכן-העיצוב (כמו ב-Pure); רשימה ⇒ fields[i] או '' — אין תוכן-דמו בייצור (§20-ג)
    final List<String>? fields;
    static const int fieldSlots = ${slotsN};
    static const List<String> fieldDemo = <String>[${slotDemo.map(dq).join(', ')}];   // תוכן-העיצוב פר-חריץ — מלמד את המחולל את צורת-החריץ (מספר/טקסט), לא ערך
    String _f(int i, String d) => fields == null ? d : (i < fields!.length ? fields![i] : '');
  ` : '';
    return fieldsBlock;
}
export function inner$forgeCell$src(CUR, c, fam, cls, bodyExpr, enumBlock, stateField, ctorState, coreBlock, useBare) {
    const states = theaterStates(c.body);
    const useSkin = /\bskin\./.test(bodyExpr);
    const useTheme = /\btheme\./.test(bodyExpr);
    const useFonts = /\bfonts\./.test(bodyExpr);
    const useIcon = /_icon\(/.test(bodyExpr);
    const useSvg = /_SvgScene\(/.test(bodyExpr);
    const useUi = /ImageFilter\./.test(bodyExpr);
    const decls = [
        useSkin && '    final skin = DsSeam.skinOf(context);   // מלוא-העיצוב מהחריץ',
        useTheme && '    final theme = DsSeam.of(context);       // אקצנט (מורף)',
        useFonts && '    final fonts = DsSeam.fontsOf(context);  // פונט',
    ].filter(Boolean).join('\n');
    const slotsN = CUR ? CUR.n : 0;
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const allExpr = coreBlock + bodyExpr;
    const useHide = /\b_hide\(/.test(allExpr);
    const useChild = /\bchild\b/.test(allExpr);
    const useWith = /\b_withChild\(/.test(allExpr);
    const useV = /\b_v\(/.test(allExpr);
    const useAct = /\bonAction\b/.test(allExpr);
    const useCtl = /\bcontrol\b/.test(allExpr);
    const useItems = /\bitems!\[i\]|\bitems == null\b/.test(allExpr);
    const useSel = /\bselected\?/.test(allExpr);
    const useOnSel = /\bonSelect\b/.test(allExpr);
    const useCols = /\bcolumns[!=]/.test(allExpr);
    const useVar = /\bvariants[!=]/.test(allExpr);
    const useCell = /\bonCell\b/.test(allExpr);
    const it = CUR && CUR.items ? CUR.items : { slots: 0, demo: 0, selectable: false, active: false, variants: null };
    const seamsBlock = [
        '  /// G13a · תוכן-נוסף בתוך מסגרת-האטום, אחרי זרימת-העיצוב (מקטע/כרטיס ⇒ תוכן-המודול). null ⇒ האטום לבדו.\n  final Widget? child;',
        useWith && '  // G13a · תוכן-נוסף בתוך המסגרת; null ⇒ ביט-זהה. גובה-חסום (Expanded/SizedBox סביב המסגרת) ⇒ התוכן ממלא (Expanded — רשימות/גלילה חיות, כמו GlassCard(child) של הזהב); גובה-חופשי ⇒ Column מכווץ-לתוכן.\n  static Widget _withChild(Widget w, Widget? c) => c == null ? w : LayoutBuilder(builder: (ctx, cns) => cns.hasBoundedHeight\n      ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [w, Expanded(child: c)])\n      : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [w, c]));',
        useHide && '  static Widget _hide(String s, Widget w) => s.isEmpty ? const SizedBox.shrink() : w;   // G13a · חריץ-ריק ⇒ הקופסה נעלמת',
        useBare && '  /// G13b · bare=true ⇒ ליבת-הבקרה בלי מסגרת-הגלריה של Pure (.ctl/.body/.stage); child נכנס לליבה. false ⇒ ביט-זהה לגלריה.\n  final bool bare;',
        useCtl && '  /// G13a · שדה-חי (TextField וכו׳) במקום ציור-ה-input של הגלריה. null ⇒ הציור.\n  final Widget? control;',
        useAct && `  /// G13a · הקשה על כפתור/קישור k (סדר-הופעה, ${CUR.actions} פעולות).\n  final void Function(int)? onAction;\n  static const int actionSlots = ${CUR.actions};`,
        useCell && '  /// G14 · תא (items[i][j], אחרי חריצי-הכותרת) — הקשה/הקשה-ארוכה על תא j של פריט i.\n  final void Function(int i, int j)? onCell;\n  final void Function(int i, int j)? onCellLong;',
        useCols && `  /// G13d · כותרות-עמודות: columns[j] ⇒ תבנית-הכותרת (${CUR.columns ? CUR.columns.demo : 0} בדמו). null ⇒ כותרות-העיצוב.\n  final List<String>? columns;`,
        useVar && `  /// G13d · וריאנט-פריט (טוקן-עיצוב: ${JSON.stringify(it.variants || [])}) — variants[i] = אינדקס-הוריאנט של פריט i; null ⇒ הראשון.\n  final List<int>? variants;\n  static const List<String> variantIds = <String>[${(it.variants || []).map(dq).join(', ')}];`,
        useItems && `  /// G13a · קבוצת-פריטים: items[i] = חריצי-הטקסט של פריט i (${it.slots} חריצים · ${it.demo} בדמו${it.selectable ? ' · לחיץ: onSelect(i)' : ''}${it.active ? ' · selected = הפריטים-הפעילים' : ''}${CUR.cells ? ` · תאים: items[i].length (${CUR.cells} בדמו)` : ''}). null ⇒ פריטי-העיצוב.\n  final List<List<String>>? items;${useSel ? '\n  final Set<int>? selected;' : ''}${useOnSel ? '\n  final void Function(int)? onSelect;' : ''}\n  static const int itemSlots = ${it.slots};\n  static const int itemDemo = ${it.demo};\n  String _it(List<String> r, int j, String d) => items == null ? d : (j < r.length ? r[j] : '');`,
        useV && `  /// G13a · מילויי-אחוז (0..1) לפי סדר-הופעה/פריט (${CUR.vn} בדמו). null ⇒ ערכי-העיצוב; חסר ⇒ 0 (אין המצאה).\n  final List<double>? values;\n  double _v(int i, double d) => values == null ? d : (i < values!.length ? values![i].clamp(0.0, 1.0) : 0.0);`,
    ].filter(Boolean).join('\n') + '\n';
    const ctorExtra = ', this.child' + (useBare ? ', this.bare = false' : '') + (useCtl ? ', this.control' : '') + (useAct ? ', this.onAction' : '') + (useItems ? ', this.items' + (useSel ? ', this.selected' : '') + (useOnSel ? ', this.onSelect' : '') + (useVar ? ', this.variants' : '') : '') + (useCols ? ', this.columns' : '') + (useCell ? ', this.onCell, this.onCellLong' : '') + (useV ? ', this.values' : '');
    const fieldsBlock = slotsN ? `  /// תפר-דאטה (G12a): ${slotsN} חריצי-טקסט. null ⇒ תוכן-העיצוב (כמו ב-Pure); רשימה ⇒ fields[i] או '' — אין תוכן-דמו בייצור (§20-ג)
    final List<String>? fields;
    static const int fieldSlots = ${slotsN};
    static const List<String> fieldDemo = <String>[${slotDemo.map(dq).join(', ')}];   // תוכן-העיצוב פר-חריץ — מלמד את המחולל את צורת-החריץ (מספר/טקסט), לא ערך
    String _f(int i, String d) => fields == null ? d : (i < fields!.length ? fields![i] : '');
  ` : '';
    const src = HEADER(fam, useSkin || useTheme || useFonts || useIcon || useSvg, useUi) + (useIcon ? ICON : '') + (useSvg ? SVGHELPER : '') + `
  /// ${c.name} — seam:${c.seam}${states ? ' · מצבים חיים' : ''}${slotsN ? ` · ${slotsN} חריצים` : ''}
  ${enumBlock}class ${cls} extends StatelessWidget {
  ${stateField}${fieldsBlock}${seamsBlock}  const ${cls}({super.key${ctorState ? ', ' + ctorState : ''}${slotsN ? ', this.fields' : ''}${ctorExtra}});
    @override
    Widget build(BuildContext context) {
  ${decls}${decls ? '\n' : ''}${coreBlock}    final Widget body = ${useBare ? `bare ? _withChild(core, child) : ${bodyExpr}` : bodyExpr};
      return ${useChild ? 'body' : 'child == null ? body : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [body, child!])'};
    }
  }
  `;
    return src;
}
export function inner$forgeCell$src$$step(c, fam, cls, states, bodyExpr, enumBlock, stateField, ctorState, useSkin, useTheme, useFonts, useIcon, useSvg, useUi, decls, slotsN, coreBlock, useBare, useChild, seamsBlock, ctorExtra, fieldsBlock) {
    const src = HEADER(fam, useSkin || useTheme || useFonts || useIcon || useSvg, useUi) + (useIcon ? ICON : '') + (useSvg ? SVGHELPER : '') + `
  /// ${c.name} — seam:${c.seam}${states ? ' · מצבים חיים' : ''}${slotsN ? ` · ${slotsN} חריצים` : ''}
  ${enumBlock}class ${cls} extends StatelessWidget {
  ${stateField}${fieldsBlock}${seamsBlock}  const ${cls}({super.key${ctorState ? ', ' + ctorState : ''}${slotsN ? ', this.fields' : ''}${ctorExtra}});
    @override
    Widget build(BuildContext context) {
  ${decls}${decls ? '\n' : ''}${coreBlock}    final Widget body = ${useBare ? `bare ? _withChild(core, child) : ${bodyExpr}` : bodyExpr};
      return ${useChild ? 'body' : 'child == null ? body : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [body, child!])'};
    }
  }
  `;
    return src;
}
export function inner$forgeCell$numFs(CUR) {
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const numFs = slotDemo.map((t, i) => (isNumD(t) ? (CUR.sig[i] || {}).fs || 16 : 0));
    return numFs;
}
export function inner$forgeCell$numFs$$step(CUR, slotDemo) {
    const numFs = slotDemo.map((t, i) => (isNumD(t) ? (CUR.sig[i] || {}).fs || 16 : 0));
    return numFs;
}
export function inner$forgeCell$txtFs(CUR) {
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const txtFs = slotDemo.map((t, i) => (isNumD(t) ? 0 : (CUR.sig[i] || {}).fs || 16));
    return txtFs;
}
export function inner$forgeCell$txtFs$$step(CUR, slotDemo) {
    const txtFs = slotDemo.map((t, i) => (isNumD(t) ? 0 : (CUR.sig[i] || {}).fs || 16));
    return txtFs;
}
export function inner$forgeCell$numEmph(CUR) {
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const numFs = slotDemo.map((t, i) => (isNumD(t) ? (CUR.sig[i] || {}).fs || 16 : 0));
    const txtFs = slotDemo.map((t, i) => (isNumD(t) ? 0 : (CUR.sig[i] || {}).fs || 16));
    const numEmph = Math.max(0, ...numFs) && Math.max(0, ...txtFs) ? +(Math.max(...numFs) / Math.max(...txtFs)).toFixed(2) : 0;
    return numEmph;
}
export function inner$forgeCell$numEmph$$step(numFs, txtFs) {
    const numEmph = Math.max(0, ...numFs) && Math.max(0, ...txtFs) ? +(Math.max(...numFs) / Math.max(...txtFs)).toFixed(2) : 0;
    return numEmph;
}
export function inner$forgeCell$rootDir(CUR, rootSt) {
    const rootN = CUR && (CUR.coreNode || CUR.rootNode) || null;
    const rootDir = rootN ? (/flex|grid/.test(rootSt['display'] || '') ? (/column/.test(rootSt['flex-direction'] || '') ? 'column' : 'row') : 'block') : null;
    return rootDir;
}
export function inner$forgeCell$rootDir$$step(rootN, rootSt) {
    const rootDir = rootN ? (/flex|grid/.test(rootSt['display'] || '') ? (/column/.test(rootSt['flex-direction'] || '') ? 'column' : 'row') : 'block') : null;
    return rootDir;
}
export function inner$forgeCell$sig(CUR, rootSt) {
    const slotsN = CUR ? CUR.n : 0;
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const rootN = CUR && (CUR.coreNode || CUR.rootNode) || null;
    const numFs = slotDemo.map((t, i) => (isNumD(t) ? (CUR.sig[i] || {}).fs || 16 : 0));
    const txtFs = slotDemo.map((t, i) => (isNumD(t) ? 0 : (CUR.sig[i] || {}).fs || 16));
    const numEmph = Math.max(0, ...numFs) && Math.max(0, ...txtFs) ? +(Math.max(...numFs) / Math.max(...txtFs)).toFixed(2) : 0;
    const rootDir = rootN ? (/flex|grid/.test(rootSt['display'] || '') ? (/column/.test(rootSt['flex-direction'] || '') ? 'column' : 'row') : 'block') : null;
    const sig = { root: { tag: rootN ? rootN.tag : null, decorated: !!(rootN && decoration(rootSt)), interactive: !!(rootN && isSelectable(rootN)), dir: rootDir }, svg: !!(CUR && CUR.svg), input: CUR && CUR.input || null, series: CUR && CUR.series || 0, fills: CUR && CUR.fills || 0, slots: CUR ? CUR.sig.slice(0, slotsN) : [], numEmph };
    return sig;
}
export function inner$forgeCell$sig$$step(CUR, slotsN, rootN, rootSt, numEmph, rootDir) {
    const sig = { root: { tag: rootN ? rootN.tag : null, decorated: !!(rootN && decoration(rootSt)), interactive: !!(rootN && isSelectable(rootN)), dir: rootDir }, svg: !!(CUR && CUR.svg), input: CUR && CUR.input || null, series: CUR && CUR.series || 0, fills: CUR && CUR.fills || 0, slots: CUR ? CUR.sig.slice(0, slotsN) : [], numEmph };
    return sig;
}
export function inner$forgeCell$atom(CUR, c, fam, cls, file, bodyExpr, stateIds, coreBlock, useBare, rootSt) {
    const states = theaterStates(c.body);
    const slotsN = CUR ? CUR.n : 0;
    const slotDemo = CUR ? CUR.slots.slice() : [];
    const allExpr = coreBlock + bodyExpr;
    const useV = /\b_v\(/.test(allExpr);
    const useAct = /\bonAction\b/.test(allExpr);
    const useCtl = /\bcontrol\b/.test(allExpr);
    const useItems = /\bitems!\[i\]|\bitems == null\b/.test(allExpr);
    const useSel = /\bselected\?/.test(allExpr);
    const useOnSel = /\bonSelect\b/.test(allExpr);
    const useCols = /\bcolumns[!=]/.test(allExpr);
    const it = CUR && CUR.items ? CUR.items : { slots: 0, demo: 0, selectable: false, active: false, variants: null };
    const rootN = CUR && (CUR.coreNode || CUR.rootNode) || null;
    const numFs = slotDemo.map((t, i) => (isNumD(t) ? (CUR.sig[i] || {}).fs || 16 : 0));
    const txtFs = slotDemo.map((t, i) => (isNumD(t) ? 0 : (CUR.sig[i] || {}).fs || 16));
    const numEmph = Math.max(0, ...numFs) && Math.max(0, ...txtFs) ? +(Math.max(...numFs) / Math.max(...txtFs)).toFixed(2) : 0;
    const rootDir = rootN ? (/flex|grid/.test(rootSt['display'] || '') ? (/column/.test(rootSt['flex-direction'] || '') ? 'column' : 'row') : 'block') : null;
    const sig = { root: { tag: rootN ? rootN.tag : null, decorated: !!(rootN && decoration(rootSt)), interactive: !!(rootN && isSelectable(rootN)), dir: rootDir }, svg: !!(CUR && CUR.svg), input: CUR && CUR.input || null, series: CUR && CUR.series || 0, fills: CUR && CUR.fills || 0, slots: CUR ? CUR.sig.slice(0, slotsN) : [], numEmph };
    const atom = ({ family: fam, cls, file, seam: c.seam, states: !!states, stateIds, fieldSlots: slotsN, fieldDemo: slotDemo, sig, child: true, bare: useBare, control: !!useCtl, actions: useAct ? CUR.actions : 0, items: useItems ? { slots: it.slots, demo: it.demo, selectable: !!useOnSel, selected: !!useSel, cells: CUR.cells || 0, variants: it.variants || null } : null, columns: useCols ? (CUR.columns ? CUR.columns.demo : 0) : 0, values: useV ? CUR.vn : 0 });
    return atom;
}
export function inner$forgeCell$atom$$step(CUR, c, fam, cls, file, states, stateIds, slotsN, slotDemo, useBare, useV, useAct, useCtl, useItems, useSel, useOnSel, useCols, it, sig) {
    const atom = ({ family: fam, cls, file, seam: c.seam, states: !!states, stateIds, fieldSlots: slotsN, fieldDemo: slotDemo, sig, child: true, bare: useBare, control: !!useCtl, actions: useAct ? CUR.actions : 0, items: useItems ? { slots: it.slots, demo: it.demo, selectable: !!useOnSel, selected: !!useSel, cells: CUR.cells || 0, variants: it.variants || null } : null, columns: useCols ? (CUR.columns ? CUR.columns.demo : 0) : 0, values: useV ? CUR.vn : 0 });
    return atom;
}
export function inner$forgeFamily$styleM(html) {
    const styleM = html.match(/<style>([\s\S]*?)<\/style>/);
    return styleM;
}
export function inner$forgeFamily$list(html) {
    const list = cells(html);
    return list;
}
export function inner$forgeFamily$cls(c) {
    let cls = 'Forge' + pascal(c.name);
    return cls;
}
export function inner$forgeFamily$file(c) {
    let file = snake(c.name) + '.dart';
    return file;
}
export function inner$forgeFamily$fam0(EMITTED, file) {
    const fam0 = EMITTED.get(file);
    return fam0;
}
export function inner$parseStyle$decl$$after_loop(m) {
    const decl = {};
    for (const d of m[2].split(';')) {
        const i = d.indexOf(':');
        if (i < 0)
            continue;
        decl[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim();
    }
    return decl;
}
export function inner$pseudoKids$out$$after_loop(node, map, ancestors, sibIdx) {
    const classes = node.classes || [];
    const out = { before: [], after: [] };
    for (const r of map.pseudo) {
        const target = r.chain[r.chain.length - 1];
        const hit = (target.tag ? node.tag === target.tag : true) && (target.cls ? target.cls.every(c => classes.includes(c)) : true);
        if (!hit || !chainMatches(r.chain.slice(0, -1), ancestors))
            continue;
        const cm = /content\s*:\s*(?:"([^"]*)"|'([^']*)'|([^;]+))/.exec(Object.entries(r.decl).map(([k, v]) => `${k}:${v}`).join(';'));
        let text = '';
        if (cm) {
            const raw = cm[1] != null ? cm[1] : cm[2] != null ? cm[2] : (cm[3] || '').trim();
            if (/counter\(/.test(raw))
                text = String(sibIdx + 1); // content:counter(n) ⇒ מספר-הסידור (1-מבוסס)
            else if (!/attr\(|url\(/.test(raw))
                text = raw;
        }
        const style = Object.entries(r.decl).filter(([k]) => k !== 'content').map(([k, v]) => `${k}:${v}`).join(';');
        const kid = { tag: 'span', classes: [], attrs: { style }, children: text ? [{ text }] : [] };
        out[r.pos].push(kid);
    }
    return out;
}
export function inner$parseInline$d$$after_loop(style) {
    const d = {};
    for (const p of style.split(';')) {
        const i = p.indexOf(':');
        if (i < 0)
            continue;
        d[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim();
    }
    return d;
}
export function inner$frameNode$st$$after_loop(st0) {
    const st = {};
    for (const k in st0)
        st[k] = resolveVars(st0[k], {});
    return st;
}
export function inner$decoration$bg$$after_loop(st) {
    const bgRaw = st['background'] || st['background-color'];
    let bg = null;
    let radSeg = null;
    for (const seg of splitTop(bgRaw)) { // בידוד שכבות (לא-חמדני — כל שכבה בנפרד)
        if (/radial-gradient/i.test(seg))
            radSeg = seg;
        else if (!/gradient\(/i.test(seg) && !bg) {
            const c = colorExpr(seg.trim());
            if (c)
                bg = c;
        }
    }
    return bg;
}
export function inner$decoration$radSeg$$after_loop(st) {
    const bgRaw = st['background'] || st['background-color'];
    let bg = null;
    let radSeg = null;
    for (const seg of splitTop(bgRaw)) { // בידוד שכבות (לא-חמדני — כל שכבה בנפרד)
        if (/radial-gradient/i.test(seg))
            radSeg = seg;
        else if (!/gradient\(/i.test(seg) && !bg) {
            const c = colorExpr(seg.trim());
            if (c)
                bg = c;
        }
    }
    return radSeg;
}
export function inner$decoration$sides$$after_loop(st) {
    const sideMap = { 'border-top': 'top', 'border-bottom': 'bottom', 'border-left': 'left', 'border-right': 'right', 'border-inline-start': 'right', 'border-inline-end': 'left', 'border-block-start': 'top', 'border-block-end': 'bottom' };
    const sides = [];
    for (const prop in sideMap) {
        const v = st[prop];
        if (!v)
            continue;
        const c = colorExpr(v);
        if (!c)
            continue;
        const wm = /(\d+(?:\.\d+)?)px/.exec(v);
        sides.push(`${sideMap[prop]}: BorderSide(color: ${c}, width: ${wm ? wm[1] : '1'})`);
    }
    return sides;
}
export function inner$shadowExpr$out$$after_loop(val) {
    const out = [];
    for (const s of splitTop(val)) {
        if (/^\s*inset/.test(s))
            continue;
        const cm = s.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/i);
        const col = cm ? (colorExpr(cm[1]) || litColor(cm[1])) : null;
        if (!col)
            continue;
        const nums = (s.replace(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))/ig, '').match(/-?\d+(?:\.\d+)?/g) || []).map(x => parseFloat(x));
        const [ox = 0, oy = 0, blur = 0, spread = 0] = nums;
        // blurRadius = blur של CSS (תרגום נאמן). הערה: flutter test (headless) לא מרנדר gaussian-blur —
        // הצל נראה שם צמוד, אך ב-web/device עם GPU הוא זוהר רך תואם-CSS. אין לכייל לפי תמונת-הבדיקה!
        out.push(`BoxShadow(color: ${col}, offset: const Offset(${ox}, ${oy}), blurRadius: ${blur}, spreadRadius: ${spread})`);
    }
    return out;
}
export function inner$svgScene$walk$a$$after_loop(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    return a;
}
export function inner$svgScene$walk$nattr$$after_loop(SVG_INH, pattr, ch) {
    const a = { ...ch.attrs };
    for (const k of SVG_INH)
        if (a[k] == null && pattr[k] != null)
            a[k] = pattr[k];
    const nattr = {};
    for (const k of SVG_INH)
        if (a[k] != null)
            nattr[k] = a[k];
    return nattr;
}
export function inner$gradStops$cols$$after_loop(gnode, inherit) {
    const cols = [];
    const offs = [];
    for (const s of gnode.children) {
        if (s.tag !== 'stop')
            continue;
        let col = colorExpr(s.attrs['stop-color']) || inherit;
        const so = s.attrs['stop-opacity'];
        if (so != null && +so < 1)
            col += `.withValues(alpha: ${(+so).toFixed(2)})`;
        cols.push(col);
        let o = s.attrs.offset != null ? parseFloat(s.attrs.offset) : 0;
        if (o > 1)
            o /= 100;
        offs.push(o.toFixed(2));
    }
    return cols;
}
export function inner$gradStops$offs$$after_loop(gnode, inherit) {
    const cols = [];
    const offs = [];
    for (const s of gnode.children) {
        if (s.tag !== 'stop')
            continue;
        let col = colorExpr(s.attrs['stop-color']) || inherit;
        const so = s.attrs['stop-opacity'];
        if (so != null && +so < 1)
            col += `.withValues(alpha: ${(+so).toFixed(2)})`;
        cols.push(col);
        let o = s.attrs.offset != null ? parseFloat(s.attrs.offset) : 0;
        if (o > 1)
            o /= 100;
        offs.push(o.toFixed(2));
    }
    return offs;
}
export function inner$emit$st0$$after_loop(inhVars, st0r) {
    const st0 = {};
    for (const k in st0r)
        st0[k] = resolveVars(st0r[k], inhVars);
    return st0;
}
export function inner$emit$ownVars$$after_loop(st0) {
    const ownVars = {};
    for (const k in st0)
        if (k[0] === '-' && k[1] === '-')
            ownVars[k] = st0[k];
    return ownVars;
}
export function inner$emit$nextInh$$after_loop(effText) {
    const nextInh = {};
    for (const k of INHERIT_PROPS)
        if (effText[k] != null)
            nextInh[k] = effText[k];
    return nextInh;
}
export function inner$emit$rows$$after_loop(st, flow, min, gridCols, ncol) {
    const gap = px(st['gap']);
    const rowCross = min || 'center';
    const rows = [];
    for (let i = 0; i < flow.length; i += ncol) {
        const chunk = flow.slice(i, i + ncol);
        const cells = chunk.map((e, j) => `Expanded(flex: ${Math.max(1, Math.round(gridCols[j] || 1))}, child: ${e})`);
        for (let j = chunk.length; j < ncol; j++)
            cells.push(`Expanded(flex: ${Math.max(1, Math.round(gridCols[j] || 1))}, child: const SizedBox.shrink())`);
        rows.push(`Row(crossAxisAlignment: CrossAxisAlignment.${rowCross}${tb(rowCross)}${gap ? `, spacing: ${gap}` : ''}, children: [${cells.join(', ')}])`);
    }
    return rows;
}
export function inner$emit$cells$$after_loop(flow, gridCols, ncol, i) {
    const chunk = flow.slice(i, i + ncol);
    const cells = chunk.map((e, j) => `Expanded(flex: ${Math.max(1, Math.round(gridCols[j] || 1))}, child: ${e})`);
    for (let j = chunk.length; j < ncol; j++)
        cells.push(`Expanded(flex: ${Math.max(1, Math.round(gridCols[j] || 1))}, child: const SizedBox.shrink())`);
    return cells;
}
export function inner$emit$pos$$after_loop(flow, flowMeta) {
    const pos = [];
    let acc = 0;
    for (let i = 0; i < flow.length; i++) {
        if (i > 0)
            acc += flowMeta[i - 1].w + flowMeta[i].negMS;
        pos.push(acc);
    }
    return pos;
}
export function inner$emit$acc$$after_loop(flow, flowMeta) {
    const pos = [];
    let acc = 0;
    for (let i = 0; i < flow.length; i++) {
        if (i > 0)
            acc += flowMeta[i - 1].w + flowMeta[i].negMS;
        pos.push(acc);
    }
    return acc;
}
export function inner$forgeCell$fn$st$$after_loop(st0) {
    const st = {};
    for (const k in st0)
        st[k] = resolveVars(st0[k], {});
    return st;
}

export const SIGS = {
  inner$tokenLit$inner: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$tokenLit$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$tokenLit$h: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$tokenLit$r: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$tokenLit$g: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$tokenLit$b: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$tokenLit$a: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$tokenLit$key: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$tokenLit$key$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$tokenLit$al: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$tokenLit$al$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$litColor$tk: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$c: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$r: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$r$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$litColor$g: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$g$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$litColor$b: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$b$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$litColor$a: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$litColor$a$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$colorExpr$cm: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$colorExpr$cA: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$colorExpr$cA$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$colorExpr$p: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$colorExpr$p$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$colorExpr$second: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$colorExpr$second$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$colorExpr$cB: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$colorExpr$cB$$step: [{"name":"second","d":{"t":"any"},"opt":false}],
  inner$colorExpr$vm: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$colorExpr$lit: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$gradientExpr$m: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$gradientExpr$parts: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$gradientExpr$parts$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$gradientExpr$deg: [{"name":"a","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$gradientExpr$mm: [{"name":"a","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$gradientExpr$mm$$step: [{"name":"deg","d":{"t":"num"},"opt":false},{"name":"map","d":{"t":"obj","p":[["0",{"t":"arr","of":{"t":"str"}},false],["90",{"t":"arr","of":{"t":"str"}},false],["180",{"t":"arr","of":{"t":"str"}},false],["270",{"t":"arr","of":{"t":"str"}},false],["135",{"t":"arr","of":{"t":"str"}},false],["45",{"t":"arr","of":{"t":"str"}},false],["225",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$gradientExpr$c: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$radialExpr$m: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$radialExpr$inner: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$radialExpr$inner$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$radialExpr$at: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$radialExpr$sz: [{"name":"seg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$radialExpr$sm: [{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$radialExpr$cexpr: [{"name":"baseColor","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$radialExpr$cexpr$$step: [{"name":"baseColor","d":{"t":"any"},"opt":false},{"name":"sm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$conicExpr$m: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$conicExpr$parts: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$conicExpr$parts$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$conicExpr$c: [{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$conicExpr$rot: [{"name":"from","d":{"t":"num"},"opt":false}],
  inner$fontExpr$m: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$evalCalc$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalCalc$a: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalCalc$a$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$evalCalc$b: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalCalc$b$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$evalCalc$r: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"op","d":{"t":"str"},"opt":false}],
  inner$evalCalc$r$$step: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false},{"name":"op","d":{"t":"str"},"opt":false}],
  inner$vwPx$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$vwPx$n: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$vwPx$n$$step: [{"name":"m","d":{"t":"or","of":[{"t":"lit","v":[false]},{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$vwPx$u: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$vwPx$u$$step: [{"name":"m","d":{"t":"or","of":[{"t":"lit","v":[false]},{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$vwPx$base: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$vwPx$base$$step: [{"name":"u","d":{"t":"str"},"opt":false}],
  inner$evalClamp$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalClamp$toN$p: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$evalClamp$toN$w: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$evalClamp$lo: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalClamp$lo$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$evalClamp$pref: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalClamp$pref$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$evalClamp$hi: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$evalClamp$hi$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$px$cl: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$px$c: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$px$w: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$px$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$pct$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$num$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseStyle$simple$tc: [{"name":"tok","d":{"t":"any"},"opt":false}],
  inner$parseStyle$sels: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseStyle$i: [{"name":"d","d":{"t":"str"},"opt":false}],
  inner$parseStyle$pm: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$base: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$base$$step: [{"name":"pm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$parseStyle$pos: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$pos$$step: [{"name":"pm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$parseStyle$parts: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$parts$$step: [{"name":"base","d":{"t":"str"},"opt":false}],
  inner$parseStyle$c: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$ps: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$asm: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$chainStr: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$chainStr$$step: [{"name":"asm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$parseStyle$chain: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$chain$$step: [{"name":"chainStr","d":{"t":"str"},"opt":false}],
  inner$parseStyle$target: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$target$$step: [{"name":"asm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$parseStyle$ls: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$rs: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$leftParts: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$leftParts$$step: [{"name":"ls","d":{"t":"str"},"opt":false}],
  inner$parseStyle$right: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$parseStyle$right$$step: [{"name":"rs","d":{"t":"str"},"opt":false}],
  inner$parseStyle$parts_L248: [{"name":"sel","d":{"t":"str"},"opt":false}],
  inner$pseudoKids$target: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$hit: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$hit$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"classes","d":{"t":"any"},"opt":false},{"name":"target","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$cm: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$raw: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$raw$$step: [{"name":"cm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$pseudoKids$style: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$kid: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"str"},"opt":false}],
  inner$pseudoKids$kid$$step: [{"name":"text","d":{"t":"str"},"opt":false},{"name":"style","d":{"t":"str"},"opt":false}],
  inner$parseInline$i: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$styleOf$target: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$styleOf$hit: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$styleOf$hit$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"classes","d":{"t":"any"},"opt":false},{"name":"target","d":{"t":"any"},"opt":false}],
  inner$styleOf$hit_L306: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$styleOf$hit_L306$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"classes","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$parseDOM$t: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseDOM$closing: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseDOM$tag: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseDOM$selfClose: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseDOM$node: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"attrs","d":{"t":"obj","n":"attrs","p":[]},"opt":false}],
  inner$parseDOM$node$$step: [{"name":"tag","d":{"t":"str"},"opt":false},{"name":"attrs","d":{"t":"obj","n":"attrs","p":[]},"opt":false}],
  inner$siblingRuns$b: [{"name":"a","d":{"t":"num"},"opt":false}],
  inner$siblingRuns$y: [{"name":"x","d":{"t":"num"},"opt":false}],
  inner$siblingRuns$shared: [{"name":"els","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"num"},"opt":false}],
  inner$siblingRuns$cy: [{"name":"els","d":{"t":"any"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$siblingRuns$sh: [{"name":"els","d":{"t":"any"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false},{"name":"shared","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$siblingRuns$sh$$step: [{"name":"shared","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"cy","d":{"t":"any"},"opt":false}],
  inner$siblingRuns$okY: [{"name":"els","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false},{"name":"shared","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$siblingRuns$okY$$step: [{"name":"els","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false},{"name":"shared","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"cy","d":{"t":"any"},"opt":false},{"name":"sh","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$siblingRuns$members: [{"name":"els","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$primaryGroup$walk$els: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$primaryGroup$walk$score: [{"name":"r","d":{"t":"obj","p":[["start",{"t":"num"},false],["members",{"t":"any"},false],["variants",{"t":"arr","of":{"t":"any"}},false],["variantOf",{"t":"fn"},false],["leafy",{"t":"any"},false]]},"opt":false}],
  inner$frameNode$kids: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$coreNode$first: [{"name":"dom","d":{"t":"any"},"opt":false}],
  inner$coreNode$kids: [{"name":"dom","d":{"t":"any"},"opt":false}],
  inner$coreNode$kids$$step: [{"name":"first","d":{"t":"any"},"opt":false}],
  inner$decoration$grad: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$decoration$grad$$step: [{"name":"bgRaw","d":{"t":"any"},"opt":false}],
  inner$decoration$c: [{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$decoration$rad: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$decoration$rad$$step: [{"name":"bg","d":{"t":"any"},"opt":false},{"name":"radSeg","d":{"t":"any"},"opt":false}],
  inner$decoration$c_L434: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$decoration$c_L434$$step: [{"name":"bgRaw","d":{"t":"any"},"opt":false}],
  inner$decoration$bc: [{"name":"br","d":{"t":"any"},"opt":false},{"name":"bcRaw","d":{"t":"any"},"opt":false}],
  inner$decoration$wm: [{"name":"br","d":{"t":"any"},"opt":false}],
  inner$decoration$bw: [{"name":"br","d":{"t":"any"},"opt":false}],
  inner$decoration$bw$$step: [{"name":"wm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$decoration$c_L446: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$decoration$wm_L446: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$decoration$r: [{"name":"rad","d":{"t":"any"},"opt":false}],
  inner$decoration$sh: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$bgOverlayGlow$radSeg: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$bgOverlayGlow$radSeg$$step: [{"name":"bgRaw","d":{"t":"any"},"opt":false}],
  inner$bgOverlayGlow$rad: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$bgOverlayGlow$rad$$step: [{"name":"radSeg","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$bgOverlayGlow$r: [{"name":"rv","d":{"t":"any"},"opt":false}],
  inner$edge$per: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"prop","d":{"t":"any"},"opt":false}],
  inner$edge$iis: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"prop","d":{"t":"any"},"opt":false}],
  inner$edge$iie: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"prop","d":{"t":"any"},"opt":false}],
  inner$edge$ibs: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"prop","d":{"t":"any"},"opt":false}],
  inner$edge$ibe: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"prop","d":{"t":"any"},"opt":false}],
  inner$edge$hasPer: [{"name":"per","d":{"t":"obj","p":[["top",{"t":"any"},false],["right",{"t":"any"},false],["bottom",{"t":"any"},false],["left",{"t":"any"},false]]},"opt":false}],
  inner$edge$ns: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$edge$cl$n: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$vMarginOf$v$p: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$vMarginOf$ns: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$vMarginOf$ns_L504: [{"name":"mbk","d":{"t":"any"},"opt":false}],
  inner$shadowExpr$cm: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$shadowExpr$col: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$shadowExpr$col$$step: [{"name":"cm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$shadowExpr$nums: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$textStyle$c: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$textStyle$f: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$textStyle$fs: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$textStyle$v: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$textStyle$em: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$textStyle$fs2: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$textStyle$v_L551: [{"name":"lh","d":{"t":"any"},"opt":false}],
  inner$svgScene$vb: [{"name":"node","d":{"t":"any"},"opt":false}],
  inner$svgScene$urlId$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$svgScene$key: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$svgScene$hmax: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$filled: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$filled$$step: [{"name":"fillRaw","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$col: [{"name":"inherit","d":{"t":"any"},"opt":false},{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$col$$step: [{"name":"inherit","d":{"t":"any"},"opt":false},{"name":"fillRaw","d":{"t":"any"},"opt":false},{"name":"strokeRaw","d":{"t":"any"},"opt":false},{"name":"filled","d":{"t":"bool"},"opt":false}],
  inner$svgScene$walk$so: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$so$$step: [{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$fso: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$fso$$step: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"filled","d":{"t":"bool"},"opt":false}],
  inner$svgScene$walk$al: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$al$$step: [{"name":"so","d":{"t":"num"},"opt":false},{"name":"fso","d":{"t":"num"},"opt":false}],
  inner$svgScene$walk$sw: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$sw$$step: [{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$sr: [{"name":"rectSeries","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$circ: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$circ$$step: [{"name":"r","d":{"t":"num"},"opt":false}],
  inner$svgScene$walk$dash: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$dash$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$off: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$off$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$start: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"startPos","d":{"t":"num"},"opt":false}],
  inner$svgScene$walk$start$$step: [{"name":"circ","d":{"t":"num"},"opt":false},{"name":"startPos","d":{"t":"num"},"opt":false}],
  inner$svgScene$walk$sweep: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false},{"name":"drawn","d":{"t":"num"},"opt":false}],
  inner$svgScene$walk$sweep$$step: [{"name":"circ","d":{"t":"num"},"opt":false},{"name":"drawn","d":{"t":"num"},"opt":false}],
  inner$svgScene$walk$s: [{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$size: [{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$tc: [{"name":"inherit","d":{"t":"any"},"opt":false},{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$ff: [{"name":"est","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$svgScene$walk$pts: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$pts$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$d: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$d$$step: [{"name":"pts","d":{"t":"any"},"opt":false}],
  inner$gradStops$col: [{"name":"inherit","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$gradStops$o: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$gradStops$v: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$textStyleC$ts: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$toRichSpan$d: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$toRichSpan$m: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$emit$svgCol: [{"name":"inherit","d":{"t":"str"},"opt":false},{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$svgCol$$step: [{"name":"inherit","d":{"t":"str"},"opt":false},{"name":"st0","d":{"t":"obj","n":"st0","p":[]},"opt":false}],
  inner$emit$wpx: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$wpx$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"st0","d":{"t":"obj","n":"st0","p":[]},"opt":false}],
  inner$emit$hpx: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$hpx$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"st0","d":{"t":"obj","n":"st0","p":[]},"opt":false}],
  inner$emit$_op: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$_op$$step: [{"name":"st0","d":{"t":"obj","n":"st0","p":[]},"opt":false}],
  inner$emit$_b0: [{"name":"sc","d":{"t":"obj","p":[["ops",{"t":"arr","of":{"t":"any"}},false],["vbw",{"t":"any"},false],["vbh",{"t":"any"},false]]},"opt":false}],
  inner$emit$body: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false},{"name":"sc","d":{"t":"obj","p":[["ops",{"t":"arr","of":{"t":"any"}},false],["vbw",{"t":"any"},false],["vbh",{"t":"any"},false]]},"opt":false}],
  inner$emit$body$$step: [{"name":"_op","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"_b0","d":{"t":"str"},"opt":false}],
  inner$emit$wf: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$wf$$step: [{"name":"st0","d":{"t":"obj","n":"st0","p":[]},"opt":false}],
  inner$emit$hf: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$hf$$step: [{"name":"st0","d":{"t":"obj","n":"st0","p":[]},"opt":false}],
  inner$emit$wfp: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$wfp$$step: [{"name":"wf","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$emit$hfp: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$hfp$$step: [{"name":"hf","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$emit$ta2: [{"name":"ist","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$alignH: [{"name":"ist","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$alignH$$step: [{"name":"ta2","d":{"t":"any"},"opt":false}],
  inner$emit$t: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"ist","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$t$$step: [{"name":"ph","d":{"t":"any"},"opt":false},{"name":"filled","d":{"t":"bool"},"opt":false},{"name":"alignH","d":{"t":"lit","v":["center","centerLeft","centerRight"]},"opt":false}],
  inner$emit$pv: [{"name":"node","d":{"t":"any"},"opt":false}],
  inner$emit$ipad: [{"name":"ist","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$myColor: [{"name":"inherit","d":{"t":"str"},"opt":false},{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$_backHidden: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$_backHidden$$step: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"_tf","d":{"t":"any"},"opt":false}],
  inner$emit$_slidOut: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$_slidOut$$step: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"_tf","d":{"t":"any"},"opt":false}],
  inner$emit$kids: [{"name":"node","d":{"t":"any"},"opt":false}],
  inner$emit$txt: [{"name":"node","d":{"t":"any"},"opt":false}],
  inner$emit$taExpr: [{"name":"ta","d":{"t":"any"},"opt":false}],
  inner$emit$pk: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sibIdx","d":{"t":"num"},"opt":false}],
  inner$emit$shown: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"any"},"opt":false}],
  inner$emit$shown$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"any"},"opt":false}],
  inner$emit$clipText: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$grad: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$grad$$step: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"clipText","d":{"t":"bool"},"opt":false}],
  inner$emit$masked: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"tw","d":{"t":"str"},"opt":false}],
  inner$emit$masked$$step: [{"name":"grad","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"tw","d":{"t":"str"},"opt":false}],
  inner$emit$slotsBefore: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$emit$childAnc: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$pFlexRow: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$selfFlexGrid: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$selfWrap: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$parentBlock: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$allKids: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sibIdx","d":{"t":"num"},"opt":false}],
  inner$emit$allKids$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"pk","d":{"t":"obj","p":[["before",{"t":"arr","of":{"t":"undef"}},false],["after",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"hasPseudo","d":{"t":"num"},"opt":false}],
  inner$emit$sibRules: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$sibRules$$step: [{"name":"map","d":{"t":"any"},"opt":false},{"name":"childAnc","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$pColStretch: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$selfFx: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$selfHasGrow: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$selfHasGrow$$step: [{"name":"selfFx","d":{"t":"any"},"opt":false}],
  inner$emit$selfWidthUnbounded: [{"name":"parentFlexRow","d":{"t":"bool"},"opt":false},{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$selfWidthUnbounded$$step: [{"name":"parentFlexRow","d":{"t":"bool"},"opt":false},{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"selfHasGrow","d":{"t":"any"},"opt":false}],
  inner$emit$pColAny: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$els: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sibIdx","d":{"t":"num"},"opt":false}],
  inner$emit$els$$step: [{"name":"allKids","d":{"t":"any"},"opt":false}],
  inner$emit$runs: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sibIdx","d":{"t":"num"},"opt":false},{"name":"grpKind","d":{"t":"any"},"opt":false}],
  inner$emit$runs$$step: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"grpKind","d":{"t":"any"},"opt":false},{"name":"els","d":{"t":"any"},"opt":false}],
  inner$emit$nB: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$emit$raw: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$emit$shown_L806: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"any"},"opt":false}],
  inner$emit$shown_L806$$step: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"any"},"opt":false}],
  inner$emit$cInline: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$posAbsC: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$isMember: [{"name":"grp","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$emit$cz: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$fxc: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$cGrow: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$cGrow$$step: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false},{"name":"fxc","d":{"t":"any"},"opt":false}],
  inner$emit$fx: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$cpct: [{"name":"cst","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$mv: [{"name":"msRaw","d":{"t":"any"},"opt":false}],
  inner$emit$tapped: [{"name":"grp","d":{"t":"any"},"opt":false},{"name":"tplRaw","d":{"t":"any"},"opt":false}],
  inner$emit$at: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"eRaw","d":{"t":"any"},"opt":false}],
  inner$emit$t_L886: [{"name":"grp","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false},{"name":"eRaw","d":{"t":"any"},"opt":false},{"name":"tplRaw","d":{"t":"any"},"opt":false}],
  inner$emit$t_L886$$step: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"eRaw","d":{"t":"any"},"opt":false},{"name":"tapped","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false}],
  inner$emit$anyTpl: [{"name":"grp","d":{"t":"any"},"opt":false}],
  inner$emit$rowFlex: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$rawTpl: [{"name":"grp","d":{"t":"any"},"opt":false}],
  inner$emit$vs: [{"name":"grp","d":{"t":"any"},"opt":false}],
  inner$emit$tpl: [{"name":"grp","d":{"t":"any"},"opt":false}],
  inner$emit$tpl_L910: [{"name":"grp","d":{"t":"any"},"opt":false}],
  inner$emit$gap: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$listSep: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$listSep$$step: [{"name":"gap","d":{"t":"any"},"opt":false}],
  inner$emit$isFlex: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$isFlex$$step: [{"name":"disp","d":{"t":"any"},"opt":false}],
  inner$emit$col: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$col$$step: [{"name":"fd","d":{"t":"any"},"opt":false}],
  inner$emit$colVAuto: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"maj","d":{"t":"any"},"opt":false}],
  inner$emit$colVAuto$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"isFlex","d":{"t":"bool"},"opt":false},{"name":"col","d":{"t":"bool"},"opt":false},{"name":"maj","d":{"t":"any"},"opt":false}],
  inner$emit$majE: [{"name":"maj","d":{"t":"any"},"opt":false}],
  inner$emit$isInlineFlex: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$isInlineFlex$$step: [{"name":"disp","d":{"t":"any"},"opt":false}],
  inner$emit$ovfX: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$hScroll: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$hScroll$$step: [{"name":"isFlex","d":{"t":"bool"},"opt":false},{"name":"col","d":{"t":"bool"},"opt":false},{"name":"ovfX","d":{"t":"any"},"opt":false}],
  inner$emit$rowSize: [{"name":"parentWrap","d":{"t":"bool"},"opt":false},{"name":"parentFlexRow","d":{"t":"bool"},"opt":false},{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$rowSize$$step: [{"name":"parentWrap","d":{"t":"bool"},"opt":false},{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"selfWidthUnbounded","d":{"t":"bool"},"opt":false},{"name":"isFlex","d":{"t":"bool"},"opt":false},{"name":"isInlineFlex","d":{"t":"bool"},"opt":false},{"name":"hScroll","d":{"t":"bool"},"opt":false}],
  inner$emit$flexWrap: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$isGrid: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$isGrid$$step: [{"name":"disp","d":{"t":"any"},"opt":false}],
  inner$emit$rep: [{"name":"gtc","d":{"t":"any"},"opt":false}],
  inner$emit$fr: [{"name":"gtc","d":{"t":"any"},"opt":false}],
  inner$emit$hasVM: [{"name":"flowVM","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$chunk: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ncol","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$emit$cells: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"gridCols","d":{"t":"any"},"opt":false},{"name":"ncol","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$emit$cells$$step: [{"name":"gridCols","d":{"t":"any"},"opt":false},{"name":"chunk","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$isLtrOv: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$totalW: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$totalW$$step: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"pos","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$maxH: [{"name":"flowMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$side: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$side$$step: [{"name":"isLtrOv","d":{"t":"bool"},"opt":false}],
  inner$emit$items: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$items$$step: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"pos","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"side","d":{"t":"lit","v":["left","right"]},"opt":false}],
  inner$emit$emBase: [{"name":"effText","d":{"t":"obj","p":[]},"opt":false}],
  inner$emit$pxe$p: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$emit$pxe$em: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$emit$map$parts: [{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$emit$map$isLtr: [{"name":"a","d":{"t":"obj","p":[["e",{"t":"any"},false],["st",{"t":"obj","n":"s","p":[]},false],["z",{"t":"num"},false]]},"opt":false}],
  inner$emit$map$parts_L1009: [{"name":"ii","d":{"t":"any"},"opt":false}],
  inner$emit$map$lr: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$emit$map$pp: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$map$pt: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$map$pt$$step: [{"name":"pp","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$emit$map$pr: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$map$pr$$step: [{"name":"pp","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$emit$map$pb: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$map$pb$$step: [{"name":"pp","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$emit$map$pl: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$map$pl$$step: [{"name":"pp","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$emit$pad: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$flowW: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$emit$flowW$$step: [{"name":"inner","d":{"t":"any"},"opt":false},{"name":"pad","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$emit$_plS: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$stackCentered: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$stackCentered$$step: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"_plS","d":{"t":"str"},"opt":false}],
  inner$emit$stackAlign: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$emit$stackAlign$$step: [{"name":"stackCentered","d":{"t":"bool"},"opt":false}],
  inner$emit$zItems: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"abs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMaxZ","d":{"t":"num"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false},{"name":"pos","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$emit$zItems$$step: [{"name":"abs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMaxZ","d":{"t":"num"},"opt":false},{"name":"pos","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"flowW","d":{"t":"any"},"opt":false}],
  inner$wrapBox$dispRaw: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$posAbs: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$effInline: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false},{"name":"parentFlex","d":{"t":"bool"},"opt":false}],
  inner$wrapBox$effInline$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"parentFlex","d":{"t":"bool"},"opt":false},{"name":"dispRaw","d":{"t":"any"},"opt":false},{"name":"posAbs","d":{"t":"bool"},"opt":false}],
  inner$wrapBox$deco: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$pad: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"noPad","d":{"t":"any"},"opt":false}],
  inner$wrapBox$mg: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"noVMargin","d":{"t":"bool"},"opt":false}],
  inner$wrapBox$w: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$h: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$minH: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$minW: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$ovfY: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$pl: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$bothCenter: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$centered: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false}],
  inner$wrapBox$centered$$step: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"pl","d":{"t":"str"},"opt":false},{"name":"bothCenter","d":{"t":"bool"},"opt":false}],
  inner$wrapBox$isMrowCtr: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false}],
  inner$wrapBox$isMrowCtr$$step: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"any"},"opt":false},{"name":"minH","d":{"t":"any"},"opt":false},{"name":"centered","d":{"t":"any"},"opt":false}],
  inner$wrapBox$isColVCtr: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false}],
  inner$wrapBox$isColVCtr$$step: [{"name":"st","d":{"t":"any"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false},{"name":"node","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"any"},"opt":false},{"name":"minH","d":{"t":"any"},"opt":false},{"name":"centered","d":{"t":"any"},"opt":false}],
  inner$wrapBox$glow: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$am: [{"name":"arRaw","d":{"t":"any"},"opt":false}],
  inner$wrapBox$ar: [{"name":"arRaw","d":{"t":"any"},"opt":false}],
  inner$wrapBox$ar$$step: [{"name":"am","d":{"t":"any"},"opt":false}],
  inner$wrapBox$rad: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$bl: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$bl$$step: [{"name":"bf","d":{"t":"any"},"opt":false}],
  inner$wrapBox$op: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$wp: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$hp: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$wpct: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$wpct$$step: [{"name":"wp","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$wrapBox$hpct: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$wrapBox$hpct$$step: [{"name":"hp","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$divBlocks$re: [{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$theaterStates$th: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$theaterStates$sts: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$theaterStates$sts$$step: [{"name":"th","d":{"t":"any"},"opt":false}],
  inner$theaterStates$map$lb: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$theaterStates$map$label: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$theaterStates$map$label$$step: [{"name":"lb","d":{"t":"any"},"opt":false}],
  inner$theaterStates$map$inner: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$enumId$id: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$cells$block: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cells$nm: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cells$nm$$step: [{"name":"block","d":{"t":"any"},"opt":false}],
  inner$cells$name: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cells$name$$step: [{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$cells$seamM: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cells$seamM$$step: [{"name":"block","d":{"t":"any"},"opt":false}],
  inner$cells$seam: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cells$seam$$step: [{"name":"seamM","d":{"t":"any"},"opt":false}],
  inner$cells$body: [{"name":"html","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cells$body$$step: [{"name":"block","d":{"t":"any"},"opt":false}],
  inner$collectGlobalGrads$dom: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$forgeCell$states: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$forgeCell$map$id: [{"name":"s","d":{"t":"obj","p":[["label",{"t":"any"},false],["html",{"t":"any"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$forgeCell$map$d: [{"name":"s","d":{"t":"obj","p":[["label",{"t":"any"},false],["html",{"t":"any"},false]]},"opt":false}],
  inner$forgeCell$dom: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$forgeCell$useSkin: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$useTheme: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$useFonts: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$useIcon: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$useSvg: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$useUi: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$decls: [{"name":"bodyExpr","d":{"t":"any"},"opt":false}],
  inner$forgeCell$decls$$step: [{"name":"useSkin","d":{"t":"bool"},"opt":false},{"name":"useTheme","d":{"t":"bool"},"opt":false},{"name":"useFonts","d":{"t":"bool"},"opt":false}],
  inner$forgeCell$slotsN: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$slotDemo: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$allExpr: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useHide: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useHide$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useChild: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useChild$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useWith: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useWith$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useV: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useV$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useAct: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useAct$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useCtl: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useCtl$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useItems: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useItems$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useSel: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useSel$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useOnSel: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useOnSel$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useCols: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useCols$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useVar: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useVar$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useCell: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$useCell$$step: [{"name":"allExpr","d":{"t":"str"},"opt":false}],
  inner$forgeCell$it: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$seamsBlock: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false}],
  inner$forgeCell$seamsBlock$$step: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false},{"name":"useHide","d":{"t":"bool"},"opt":false},{"name":"useWith","d":{"t":"bool"},"opt":false},{"name":"useV","d":{"t":"bool"},"opt":false},{"name":"useAct","d":{"t":"bool"},"opt":false},{"name":"useCtl","d":{"t":"bool"},"opt":false},{"name":"useItems","d":{"t":"bool"},"opt":false},{"name":"useSel","d":{"t":"bool"},"opt":false},{"name":"useOnSel","d":{"t":"bool"},"opt":false},{"name":"useCols","d":{"t":"bool"},"opt":false},{"name":"useVar","d":{"t":"bool"},"opt":false},{"name":"useCell","d":{"t":"bool"},"opt":false},{"name":"it","d":{"t":"obj","p":[["slots",{"t":"num"},false],["demo",{"t":"num"},false],["selectable",{"t":"bool"},false],["active",{"t":"bool"},false],["variants",{"t":"null"},false]]},"opt":false}],
  inner$forgeCell$ctorExtra: [{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false}],
  inner$forgeCell$ctorExtra$$step: [{"name":"useBare","d":{"t":"bool"},"opt":false},{"name":"useV","d":{"t":"bool"},"opt":false},{"name":"useAct","d":{"t":"bool"},"opt":false},{"name":"useCtl","d":{"t":"bool"},"opt":false},{"name":"useItems","d":{"t":"bool"},"opt":false},{"name":"useSel","d":{"t":"bool"},"opt":false},{"name":"useOnSel","d":{"t":"bool"},"opt":false},{"name":"useCols","d":{"t":"bool"},"opt":false},{"name":"useVar","d":{"t":"bool"},"opt":false},{"name":"useCell","d":{"t":"bool"},"opt":false}],
  inner$forgeCell$fieldsBlock: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$fieldsBlock$$step: [{"name":"slotsN","d":{"t":"num"},"opt":false},{"name":"slotDemo","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$forgeCell$src: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"enumBlock","d":{"t":"str"},"opt":false},{"name":"stateField","d":{"t":"str"},"opt":false},{"name":"ctorState","d":{"t":"str"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false}],
  inner$forgeCell$src$$step: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"states","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["label",{"t":"any"},false],["html",{"t":"any"},false]]}}]},"opt":false},{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"enumBlock","d":{"t":"str"},"opt":false},{"name":"stateField","d":{"t":"str"},"opt":false},{"name":"ctorState","d":{"t":"str"},"opt":false},{"name":"useSkin","d":{"t":"bool"},"opt":false},{"name":"useTheme","d":{"t":"bool"},"opt":false},{"name":"useFonts","d":{"t":"bool"},"opt":false},{"name":"useIcon","d":{"t":"bool"},"opt":false},{"name":"useSvg","d":{"t":"bool"},"opt":false},{"name":"useUi","d":{"t":"bool"},"opt":false},{"name":"decls","d":{"t":"str"},"opt":false},{"name":"slotsN","d":{"t":"num"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false},{"name":"useChild","d":{"t":"bool"},"opt":false},{"name":"seamsBlock","d":{"t":"str"},"opt":false},{"name":"ctorExtra","d":{"t":"str"},"opt":false},{"name":"fieldsBlock","d":{"t":"str"},"opt":false}],
  inner$forgeCell$numFs: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$numFs$$step: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"slotDemo","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$forgeCell$txtFs: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$txtFs$$step: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"slotDemo","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$forgeCell$numEmph: [{"name":"CUR","d":{"t":"any"},"opt":false}],
  inner$forgeCell$numEmph$$step: [{"name":"numFs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"txtFs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$forgeCell$rootDir: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"rootSt","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$forgeCell$rootDir$$step: [{"name":"rootN","d":{"t":"any"},"opt":false},{"name":"rootSt","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$forgeCell$sig: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"rootSt","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$forgeCell$sig$$step: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"slotsN","d":{"t":"num"},"opt":false},{"name":"rootN","d":{"t":"any"},"opt":false},{"name":"rootSt","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"numEmph","d":{"t":"num"},"opt":false},{"name":"rootDir","d":{"t":"or","of":[{"t":"lit","v":["row","column","block"]},{"t":"null"}]},"opt":false}],
  inner$forgeCell$atom: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"file","d":{"t":"any"},"opt":false},{"name":"bodyExpr","d":{"t":"any"},"opt":false},{"name":"stateIds","d":{"t":"any"},"opt":false},{"name":"coreBlock","d":{"t":"str"},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false},{"name":"rootSt","d":{"t":"obj","n":"st","p":[]},"opt":false}],
  inner$forgeCell$atom$$step: [{"name":"CUR","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"file","d":{"t":"any"},"opt":false},{"name":"states","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["label",{"t":"any"},false],["html",{"t":"any"},false]]}}]},"opt":false},{"name":"stateIds","d":{"t":"any"},"opt":false},{"name":"slotsN","d":{"t":"num"},"opt":false},{"name":"slotDemo","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"useBare","d":{"t":"bool"},"opt":false},{"name":"useV","d":{"t":"bool"},"opt":false},{"name":"useAct","d":{"t":"bool"},"opt":false},{"name":"useCtl","d":{"t":"bool"},"opt":false},{"name":"useItems","d":{"t":"bool"},"opt":false},{"name":"useSel","d":{"t":"bool"},"opt":false},{"name":"useOnSel","d":{"t":"bool"},"opt":false},{"name":"useCols","d":{"t":"bool"},"opt":false},{"name":"it","d":{"t":"obj","p":[["slots",{"t":"num"},false],["demo",{"t":"num"},false],["selectable",{"t":"bool"},false],["active",{"t":"bool"},false],["variants",{"t":"null"},false]]},"opt":false},{"name":"sig","d":{"t":"obj","p":[["root",{"t":"obj","p":[["tag",{"t":"any"},false],["decorated",{"t":"bool"},false],["interactive",{"t":"bool"},false],["dir",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},false],["svg",{"t":"bool"},false],["input",{"t":"any"},false],["series",{"t":"any"},false],["fills",{"t":"any"},false],["slots",{"t":"arr","of":{"t":"undef"}},false],["numEmph",{"t":"num"},false]]},"opt":false}],
  inner$forgeFamily$styleM: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$list: [{"name":"html","d":{"t":"any"},"opt":false}],
  inner$forgeFamily$cls: [{"name":"c","d":{"t":"obj","p":[["name",{"t":"any"},false],["seam",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$forgeFamily$file: [{"name":"c","d":{"t":"obj","p":[["name",{"t":"any"},false],["seam",{"t":"any"},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$forgeFamily$fam0: [{"name":"EMITTED","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"file","d":{"t":"str"},"opt":false}],
  inner$parseStyle$decl$$after_loop: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$pseudoKids$out$$after_loop: [{"name":"node","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"any"},"opt":false},{"name":"ancestors","d":{"t":"any"},"opt":false},{"name":"sibIdx","d":{"t":"num"},"opt":false}],
  inner$parseInline$d$$after_loop: [{"name":"style","d":{"t":"any"},"opt":false}],
  inner$frameNode$st$$after_loop: [{"name":"st0","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$decoration$bg$$after_loop: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$decoration$radSeg$$after_loop: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$decoration$sides$$after_loop: [{"name":"st","d":{"t":"any"},"opt":false}],
  inner$shadowExpr$out$$after_loop: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$a$$after_loop: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$svgScene$walk$nattr$$after_loop: [{"name":"SVG_INH","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"pattr","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$gradStops$cols$$after_loop: [{"name":"gnode","d":{"t":"any"},"opt":false},{"name":"inherit","d":{"t":"any"},"opt":false}],
  inner$gradStops$offs$$after_loop: [{"name":"gnode","d":{"t":"any"},"opt":false},{"name":"inherit","d":{"t":"any"},"opt":false}],
  inner$emit$st0$$after_loop: [{"name":"inhVars","d":{"t":"obj","p":[]},"opt":false},{"name":"st0r","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$ownVars$$after_loop: [{"name":"st0","d":{"t":"obj","n":"s","p":[]},"opt":false}],
  inner$emit$nextInh$$after_loop: [{"name":"effText","d":{"t":"obj","p":[]},"opt":false}],
  inner$emit$rows$$after_loop: [{"name":"st","d":{"t":"obj","n":"st","p":[]},"opt":false},{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"min","d":{"t":"any"},"opt":false},{"name":"gridCols","d":{"t":"any"},"opt":false},{"name":"ncol","d":{"t":"num"},"opt":false}],
  inner$emit$cells$$after_loop: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"gridCols","d":{"t":"any"},"opt":false},{"name":"ncol","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$emit$pos$$after_loop: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emit$acc$$after_loop: [{"name":"flow","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"flowMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$forgeCell$fn$st$$after_loop: [{"name":"st0","d":{"t":"obj","n":"s","p":[]},"opt":false}],
};
