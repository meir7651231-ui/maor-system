// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/app-ds.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ENTITY_RE = /^\s*(צור\s+)?(ישות|טופס|טבלת)(\s|$)/;
const ROLE_RE = /^\s*(תפקיד|הרשאת)\s+/;
const clean = (s) => [...String(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]).join(' ').slice(0, 40);
function parseRole(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const name = (ci >= 0 ? body.slice(0, ci) : body).trim();
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    // סעיפי-'|' (RLS · read-side): '... | היקף: תלמיד.מורה | שדות: תלמיד.ציון=הסתר'.
    const segs = afterName.split('|');
    const entPart = segs[0];
    const all = entPart.includes('הכל'); // ‏\b הוא ASCII בלבד — לא נדלק על עברית
    const ents = all ? [] : entPart.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    const scope = [], hide = [], ro = [];
    for (let i = 1; i < segs.length; i++) {
        const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
        if (!hm)
            continue;
        const items = hm[2].split(/[,،]/).map((x) => x.trim()).filter(Boolean);
        if (hm[1] === 'היקף') {
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+)$/);
                if (d)
                    scope.push({ ent: clean(d[1]), field: clean(d[2]) });
            }
        }
        else {
            // שדות: X.Y=הסתר (הסתרה מלאה כרטיס+טופס) · X.Y=נעל/קריאה (נעילת-קלט בטופס בלבד)
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+?)\s*=\s*(.+)$/);
                if (!d)
                    continue;
                const e = { ent: clean(d[1]), field: clean(d[2]) };
                if (/הסתר/.test(d[3]))
                    hide.push(e);
                else if (/נעל|קריאה/.test(d[3]))
                    ro.push(e);
            }
        }
    }
    return { name, all, ents, scope, hide, ro };
}
const hw = (s) => [...String(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]);
const definal = (w) => w.replace(/ך$/, 'כ').replace(/ם$/, 'מ').replace(/ן$/, 'נ').replace(/ף$/, 'פ').replace(/ץ$/, 'צ');
const pluralForms = (en) => { const b = definal(en.replace(/ה$/, '')); const b2 = definal(en); return new Set([`${b}ים`, `${b}ות`, `${b2}ים`, `${b2}ות`]); };
const splitMetrics = (str) => { const out = []; let d = 0, cur = ''; for (const ch of str) {
    if (ch === '(')
        d++;
    else if (ch === ')')
        d = Math.max(0, d - 1);
    if ((ch === ' ' || ch === ',' || ch === '\t') && d === 0) {
        if (cur.trim())
            out.push(cur.trim());
        cur = '';
    }
    else
        cur += ch;
} if (cur.trim())
    out.push(cur.trim()); return out; };
const descRank = (f) => (f.required && !(f.enumVals && f.enumVals.length) && !/^(num|date|bool|multiline)$/.test(f.type || '')) ? -1 : f.type === 'multiline' ? 0 : (f.enumVals && f.enumVals.length) ? 3 : f.type === 'num' ? 4 : f.type === 'date' ? 5 : f.type === 'bool' ? 6 : f.label.split(/\s+/).length > 1 ? 1 : 2;
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--name');
    return i;
}
export function inner$parseRole$body(line) {
    const body = line.replace(ROLE_RE, '');
    return body;
}
export function inner$parseRole$ci(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    return ci;
}
export function inner$parseRole$ci$$step(body) {
    const ci = body.indexOf(':');
    return ci;
}
export function inner$parseRole$name(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const name = (ci >= 0 ? body.slice(0, ci) : body).trim();
    return name;
}
export function inner$parseRole$name$$step(body, ci) {
    const name = (ci >= 0 ? body.slice(0, ci) : body).trim();
    return name;
}
export function inner$parseRole$afterName(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    return afterName;
}
export function inner$parseRole$afterName$$step(body, ci) {
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    return afterName;
}
export function inner$parseRole$segs(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    const segs = afterName.split('|');
    return segs;
}
export function inner$parseRole$segs$$step(afterName) {
    const segs = afterName.split('|');
    return segs;
}
export function inner$parseRole$all(entPart) {
    const all = entPart.includes('הכל');
    return all;
}
export function inner$parseRole$ents(entPart) {
    const all = entPart.includes('הכל');
    const ents = all ? [] : entPart.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    return ents;
}
export function inner$parseRole$ents$$step(entPart, all) {
    const ents = all ? [] : entPart.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    return ents;
}
export function inner$parseRole$hm(line, i) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    const segs = afterName.split('|');
    const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
    return hm;
}
export function inner$parseRole$hm$$step(segs, i) {
    const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
    return hm;
}
export function inner$parseRole$items(line, i) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    const segs = afterName.split('|');
    const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
    const items = hm[2].split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    return items;
}
export function inner$parseRole$items$$step(hm) {
    const items = hm[2].split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    return items;
}
export function inner$parseRole$d(it) {
    const d = it.match(/^(.+?)\.(.+)$/);
    return d;
}
export function inner$parseRole$d_L53(it) {
    const d = it.match(/^(.+?)\.(.+?)\s*=\s*(.+)$/);
    return d;
}
export function inner$parseRole$e(it) {
    const d = it.match(/^(.+?)\.(.+?)\s*=\s*(.+)$/);
    const e = { ent: clean(d[1]), field: clean(d[2]) };
    return e;
}
export function inner$parseRole$e$$step(d) {
    const e = { ent: clean(d[1]), field: clean(d[2]) };
    return e;
}
export function inner$parseLookLine$ws(value) {
    const ws = String(value || '').trim().split(/\s+/).filter(Boolean);
    return ws;
}
export function inner$parseLookLine$key(value, n) {
    const ws = String(value || '').trim().split(/\s+/).filter(Boolean);
    const key = ws.slice(0, n).join(' ');
    return key;
}
export function inner$parseLookLine$key$$step(ws, n) {
    const key = ws.slice(0, n).join(' ');
    return key;
}
export function inner$parseLookLine$themeWord(SL, value) {
    const ws = String(value || '').trim().split(/\s+/).filter(Boolean);
    let look = null;
    let used = 0;
    for (let n = ws.length; n >= 1; n--) {
        const key = ws.slice(0, n).join(' ');
        if (SL.looks[key]) {
            look = SL.looks[key];
            used = n;
            break;
        }
    }
    const themeWord = look ? ws[used] || null : null;
    return themeWord;
}
export function inner$parseLookLine$themeWord$$step(ws, look, used) {
    const themeWord = look ? ws[used] || null : null;
    return themeWord;
}
export function inner$parseLookLine$theme(SL, value) {
    const ws = String(value || '').trim().split(/\s+/).filter(Boolean);
    let look = null;
    let used = 0;
    for (let n = ws.length; n >= 1; n--) {
        const key = ws.slice(0, n).join(' ');
        if (SL.looks[key]) {
            look = SL.looks[key];
            used = n;
            break;
        }
    }
    const themeWord = look ? ws[used] || null : null;
    const theme = themeWord ? (SL.themes || {})[themeWord] || null : null;
    return theme;
}
export function inner$parseLookLine$theme$$step(SL, themeWord) {
    const theme = themeWord ? (SL.themes || {})[themeWord] || null : null;
    return theme;
}
export function inner$buildApp$writePlan(opts) {
    const writePlan = opts.writePlan !== false;
    return writePlan;
}
export function inner$buildApp$roleLines(raw) {
    const roleLines = raw.filter((l) => ROLE_RE.test(l));
    return roleLines;
}
export function inner$buildApp$freeLines(raw) {
    const freeLines = raw.filter((l) => !ROLE_RE.test(l));
    return freeLines;
}
export function inner$buildApp$free(raw) {
    const freeLines = raw.filter((l) => !ROLE_RE.test(l));
    const free = freeLines.join('\n');
    return free;
}
export function inner$buildApp$free$$step(freeLines) {
    const free = freeLines.join('\n');
    return free;
}
export function inner$buildApp$all0(specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    return all0;
}
export function inner$buildApp$APP_RE(SL) {
    const APP_RE = new RegExp('^\\s*' + SL.appWord + '\\s*:\\s*(.+)$');
    return APP_RE;
}
export function inner$buildApp$appLine(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const APP_RE = new RegExp('^\\s*' + SL.appWord + '\\s*:\\s*(.+)$');
    const appLine = all0.map((l) => l.match(APP_RE)).find(Boolean);
    return appLine;
}
export function inner$buildApp$appLine$$step(all0, APP_RE) {
    const appLine = all0.map((l) => l.match(APP_RE)).find(Boolean);
    return appLine;
}
export function inner$buildApp$appName(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const APP_RE = new RegExp('^\\s*' + SL.appWord + '\\s*:\\s*(.+)$');
    const appLine = all0.map((l) => l.match(APP_RE)).find(Boolean);
    const appName = appLine ? appLine[1].trim() : null;
    return appName;
}
export function inner$buildApp$appName$$step(appLine) {
    const appName = appLine ? appLine[1].trim() : null;
    return appName;
}
export function inner$buildApp$LOOK_RE(SL) {
    const LOOK_RE = new RegExp('^\\s*' + SL.lookWord + '\\s*:\\s*(.+)$');
    return LOOK_RE;
}
export function inner$buildApp$lookLine(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const LOOK_RE = new RegExp('^\\s*' + SL.lookWord + '\\s*:\\s*(.+)$');
    const lookLine = all0.map((l) => l.match(LOOK_RE)).find(Boolean);
    return lookLine;
}
export function inner$buildApp$lookLine$$step(all0, LOOK_RE) {
    const lookLine = all0.map((l) => l.match(LOOK_RE)).find(Boolean);
    return lookLine;
}
export function inner$buildApp$Q_RE(SL) {
    const Q_RE = new RegExp('^\\s*' + SL.questionWord + '\\s+(\\S+)\\s*:\\s*(.+)$');
    return Q_RE;
}
export function inner$buildApp$m(SL, l) {
    const Q_RE = new RegExp('^\\s*' + SL.questionWord + '\\s+(\\S+)\\s*:\\s*(.+)$');
    const m = l.match(Q_RE);
    return m;
}
export function inner$buildApp$m$$step(Q_RE, l) {
    const m = l.match(Q_RE);
    return m;
}
export function inner$buildApp$CHAIN_RE(SL) {
    const CHAIN_RE = new RegExp('^\\s*' + SL.chainWord + '\\s*:\\s*(.+)$');
    return CHAIN_RE;
}
export function inner$buildApp$chainLine(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const CHAIN_RE = new RegExp('^\\s*' + SL.chainWord + '\\s*:\\s*(.+)$');
    const chainLine = all0.map((l) => l.match(CHAIN_RE)).find(Boolean);
    return chainLine;
}
export function inner$buildApp$chainLine$$step(all0, CHAIN_RE) {
    const chainLine = all0.map((l) => l.match(CHAIN_RE)).find(Boolean);
    return chainLine;
}
export function inner$buildApp$chain(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const CHAIN_RE = new RegExp('^\\s*' + SL.chainWord + '\\s*:\\s*(.+)$');
    const chainLine = all0.map((l) => l.match(CHAIN_RE)).find(Boolean);
    const chain = chainLine ? chainLine[1].split(/[,،]/).map((x) => x.trim()).filter(Boolean) : [];
    return chain;
}
export function inner$buildApp$chain$$step(chainLine) {
    const chain = chainLine ? chainLine[1].split(/[,،]/).map((x) => x.trim()).filter(Boolean) : [];
    return chain;
}
export function inner$buildApp$LAYER_RE(SL) {
    const LAYER_RE = new RegExp('^\\s*' + SL.layerWord + '\\s*:\\s*(.+)$');
    return LAYER_RE;
}
export function inner$buildApp$layerLine(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const LAYER_RE = new RegExp('^\\s*' + SL.layerWord + '\\s*:\\s*(.+)$');
    const layerLine = all0.map((l) => l.match(LAYER_RE)).find(Boolean);
    return layerLine;
}
export function inner$buildApp$layerLine$$step(all0, LAYER_RE) {
    const layerLine = all0.map((l) => l.match(LAYER_RE)).find(Boolean);
    return layerLine;
}
export function inner$buildApp$layer(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const LAYER_RE = new RegExp('^\\s*' + SL.layerWord + '\\s*:\\s*(.+)$');
    const layerLine = all0.map((l) => l.match(LAYER_RE)).find(Boolean);
    const layer = layerLine ? (SL.layers[layerLine[1].trim()] || null) : null;
    return layer;
}
export function inner$buildApp$layer$$step(SL, layerLine) {
    const layer = layerLine ? (SL.layers[layerLine[1].trim()] || null) : null;
    return layer;
}
export function inner$buildApp$SERVER_RE(SL) {
    const SERVER_RE = new RegExp('^\\s*' + SL.serverWord + '\\s*:\\s*(.+)$');
    return SERVER_RE;
}
export function inner$buildApp$EXAMPLE_RE(SL) {
    const EXAMPLE_RE = SL.exampleWord ? new RegExp('^\\s*' + SL.exampleWord + '\\s+(.+?)\\s*:\\s*(.+)$') : /$^/;
    return EXAMPLE_RE;
}
export function inner$buildApp$m_L115(SL, l) {
    const EXAMPLE_RE = SL.exampleWord ? new RegExp('^\\s*' + SL.exampleWord + '\\s+(.+?)\\s*:\\s*(.+)$') : /$^/;
    const m = l.match(EXAMPLE_RE);
    return m;
}
export function inner$buildApp$m_L115$$step(EXAMPLE_RE, l) {
    const m = l.match(EXAMPLE_RE);
    return m;
}
export function inner$buildApp$map$c(r) {
    const c = r.split(/[,،]/).map((v) => v.trim());
    return c;
}
export function inner$buildApp$roles(all) {
    const roles = all.filter((l) => ROLE_RE.test(l)).map(parseRole);
    return roles;
}
export function inner$buildApp$lines(all) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    return lines;
}
export function inner$buildApp$info(all) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    return info;
}
export function inner$buildApp$info$$step(lines) {
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    return info;
}
export function inner$buildApp$extraScreens(opts) {
    const extraScreens = Array.isArray(opts.extraScreens) ? opts.extraScreens : [];
    return extraScreens;
}
export function inner$buildApp$forEach$col(ex, i) {
    const col = ex.map((row) => row[i]).filter((v) => v != null && String(v).trim());
    return col;
}
export function inner$buildApp$empty(all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const empty = info.filter((li) => li.isEnt && !(entRes[li.i].schema || []).length);
    return empty;
}
export function inner$buildApp$empty$$step(info, entRes) {
    const empty = info.filter((li) => li.isEnt && !(entRes[li.i].schema || []).length);
    return empty;
}
export function inner$buildApp$eslug(P, li) {
    const eslug = `${P}ent${li.i}`;
    return eslug;
}
export function inner$buildApp$entityNames(P, all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const entityNames = entMeta.map((e) => e.name);
    return entityNames;
}
export function inner$buildApp$entityNames$$step(entMeta) {
    const entityNames = entMeta.map((e) => e.name);
    return entityNames;
}
export function inner$buildApp$pluralForms$b(en) {
    const b = definal(en.replace(/ה$/, ''));
    return b;
}
export function inner$buildApp$pluralForms$b2(en) {
    const b2 = definal(en);
    return b2;
}
export function inner$buildApp$relOf$fw(label) {
    const fw = new Set(hw(label));
    return fw;
}
export function inner$buildApp$relOf$ew(en) {
    const ew = hw(en);
    return ew;
}
export function inner$buildApp$relOf$forms(en) {
    const forms = pluralForms(en);
    return forms;
}
export function inner$buildApp$fslug(P, li) {
    const fslug = `${P}ent${li.i}`;
    return fslug;
}
export function inner$buildApp$decl(F, s, hit) {
    const dp = F.delPolicy || [];
    const decl = hit ? dp.find((d) => d.field === s.label) : null;
    return decl;
}
export function inner$buildApp$decl$$step(dp, s, hit) {
    const decl = hit ? dp.find((d) => d.field === s.label) : null;
    return decl;
}
export function inner$buildApp$own(NS, P) {
    const own = NS ? new RegExp(`^gen_${P}(ent|px|rp|scr|bind|rec|over|audit|flags|settings|hub|main|relations|shell|root)\\d*(_content)?\\.dart$`) : /^gen_app_(ent|px|rp|scr|bind|rec|over|audit|flags|settings|hub|main|relations|shell|root)\d*(_content)?\.dart$/;
    return own;
}
export function inner$buildApp$slug(P, li) {
    const slug = `${P}ent${li.i}`;
    return slug;
}
export function inner$buildApp$authz(all, r) {
    const roles = all.filter((l) => ROLE_RE.test(l)).map(parseRole);
    const authz = roles.length ? {
        scope: roles.map((role) => { const sc = (role.scope || []).find((x) => x.ent === r.entity); return sc ? sc.field : ''; }),
        hidden: roles.map((role) => r.schema.map((s, i) => (role.hide || []).some((h) => h.ent === r.entity && h.field === s.label) ? i : -1).filter((i) => i >= 0)),
        readonly: roles.map((role) => r.schema.map((s, i) => (role.ro || []).some((h) => h.ent === r.entity && h.field === s.label) ? i : -1).filter((i) => i >= 0)),
    } : null;
    return authz;
}
export function inner$buildApp$authz$$step(roles, r) {
    const authz = roles.length ? {
        scope: roles.map((role) => { const sc = (role.scope || []).find((x) => x.ent === r.entity); return sc ? sc.field : ''; }),
        hidden: roles.map((role) => r.schema.map((s, i) => (role.hide || []).some((h) => h.ent === r.entity && h.field === s.label) ? i : -1).filter((i) => i >= 0)),
        readonly: roles.map((role) => r.schema.map((s, i) => (role.ro || []).some((h) => h.ent === r.entity && h.field === s.label) ? i : -1).filter((i) => i >= 0)),
    } : null;
    return authz;
}
export function inner$buildApp$map$sc(r, role) {
    const sc = (role.scope || []).find((x) => x.ent === r.entity);
    return sc;
}
export function inner$buildApp$slug_L211(P, li) {
    const slug = `${P}scr${li.i}`;
    return slug;
}
export function inner$buildApp$title(li) {
    const title = (li.line.split(/\s+עם\s+/)[0] || li.line).trim();
    return title;
}
export function inner$buildApp$rawMetrics(li) {
    const rawMetrics = splitMetrics(li.line.split(/\s+עם\s+/)[1] || '');
    return rawMetrics;
}
export function inner$buildApp$FILT_RE(L) {
    const FILT_RE = new RegExp('^' + L.count + '\\(([^:)]+):\\s*([^=)]+)=([^)]+)\\)$');
    return FILT_RE;
}
export function inner$buildApp$mf(t, L) {
    const FILT_RE = new RegExp('^' + L.count + '\\(([^:)]+):\\s*([^=)]+)=([^)]+)\\)$');
    const mf = t.match(FILT_RE);
    return mf;
}
export function inner$buildApp$mf$$step(FILT_RE, t) {
    const mf = t.match(FILT_RE);
    return mf;
}
export function inner$buildApp$en(t, L) {
    const FILT_RE = new RegExp('^' + L.count + '\\(([^:)]+):\\s*([^=)]+)=([^)]+)\\)$');
    const mf = t.match(FILT_RE);
    const en = mf[1].trim();
    return en;
}
export function inner$buildApp$en$$step(mf) {
    const en = mf[1].trim();
    return en;
}
export function inner$buildApp$m_L224(t) {
    const m = t.match(/^(סכום|ממוצע|מונה)\(([^.)]+)(?:\.([^)]+))?\)$/);
    return m;
}
export function inner$buildApp$bindN(P, all, entRes, drawer, SCREEN_REGISTRY) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const bindN = drawer ? Math.min(entMeta.length, SCREEN_REGISTRY.length) : 0;
    return bindN;
}
export function inner$buildApp$bindN$$step(entMeta, drawer, SCREEN_REGISTRY) {
    const bindN = drawer ? Math.min(entMeta.length, SCREEN_REGISTRY.length) : 0;
    return bindN;
}
export function inner$buildApp$spec(bi, SCREEN_REGISTRY) {
    const spec = SCREEN_REGISTRY[bi % SCREEN_REGISTRY.length];
    return spec;
}
export function inner$buildApp$bslug(P, bi) {
    const bslug = `${P}bind${bi + 1}`;
    return bslug;
}
export function inner$buildApp$rels(backRefs, e) {
    const rels = (backRefs[e.name] || []).map((b) => ({ childSlug: b.fslug, childField: b.ffield, childName: b.fname }));
    return rels;
}
export function inner$buildApp$pents(P, all, entRes, screens) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const pents = entMeta.map((e) => { const li = info.find((x) => x.isEnt && `${P}ent${x.i}` === e.slug); const r = li ? entRes[li.i] : null; const sc = screens.find((x) => x.slug === e.slug); return { name: e.name, slug: e.slug, cls: sc ? sc.cls : 'Gen' + e.slug, schema: r ? r.schema : [] }; });
    return pents;
}
export function inner$buildApp$pents$$step(P, info, entRes, entMeta, screens) {
    const pents = entMeta.map((e) => { const li = info.find((x) => x.isEnt && `${P}ent${x.i}` === e.slug); const r = li ? entRes[li.i] : null; const sc = screens.find((x) => x.slug === e.slug); return { name: e.name, slug: e.slug, cls: sc ? sc.cls : 'Gen' + e.slug, schema: r ? r.schema : [] }; });
    return pents;
}
export function inner$buildApp$map$li(P, info, e) {
    const li = info.find((x) => x.isEnt && `${P}ent${x.i}` === e.slug);
    return li;
}
export function inner$buildApp$map$r(P, info, entRes, e) {
    const li = info.find((x) => x.isEnt && `${P}ent${x.i}` === e.slug);
    const r = li ? entRes[li.i] : null;
    return r;
}
export function inner$buildApp$map$r$$step(entRes, li) {
    const r = li ? entRes[li.i] : null;
    return r;
}
export function inner$buildApp$map$sc_L283(screens, e) {
    const sc = screens.find((x) => x.slug === e.slug);
    return sc;
}
export function inner$buildApp$mine(plan, e) {
    const mine = plan.filter((p) => p.entSlug === e.slug);
    return mine;
}
export function inner$buildApp$wEnts(entRes) {
    const wEnts = Object.values(entRes).map((r) => ({ name: r.entity, schema: r.schema, stages: r.stages || [] }));
    return wEnts;
}
export function inner$buildApp$li(all, entRes, ent) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const li = info.find((x) => x.isEnt && entRes[x.i] && entRes[x.i].entity === ent);
    return li;
}
export function inner$buildApp$li$$step(info, entRes, ent) {
    const li = info.find((x) => x.isEnt && entRes[x.i] && entRes[x.i].entity === ent);
    return li;
}
export function inner$buildApp$r(all, entRes, ent) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const li = info.find((x) => x.isEnt && entRes[x.i] && entRes[x.i].entity === ent);
    const r = li ? entRes[li.i] : null;
    return r;
}
export function inner$buildApp$r$$step(entRes, li) {
    const r = li ? entRes[li.i] : null;
    return r;
}
export function inner$buildApp$labels(all, entRes, ent) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const li = info.find((x) => x.isEnt && entRes[x.i] && entRes[x.i].entity === ent);
    const r = li ? entRes[li.i] : null;
    const labels = r.schema.map((f) => f.label);
    return labels;
}
export function inner$buildApp$labels$$step(r) {
    const labels = r.schema.map((f) => f.label);
    return labels;
}
export function inner$buildApp$headDash(screens) {
    const headDash = screens.find((x) => x.kind === 'dashboard') || null;
    return headDash;
}
export function inner$buildApp$rootMeta(P, all, entRes, screens, rootByRefs) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const headDash = screens.find((x) => x.kind === 'dashboard') || null;
    const rootMeta = rootByRefs || (headDash && entMeta.length ? entMeta[0] : null);
    return rootMeta;
}
export function inner$buildApp$rootMeta$$step(entMeta, rootByRefs, headDash) {
    const rootMeta = rootByRefs || (headDash && entMeta.length ? entMeta[0] : null);
    return rootMeta;
}
export function inner$buildApp$home(P, hub) {
    let home = { slug: `${P}hub`, cls: hub.cls };
    return home;
}
export function inner$buildApp$entOf$sc(screens, name) {
    const sc = screens.find((x) => x.kind === 'entity' && x.name === name);
    return sc;
}
export function inner$buildApp$entOf$li(info, entRes, name) {
    const li = info.find((x) => x.isEnt && entRes[x.i] && entRes[x.i].entity === name);
    return li;
}
export function inner$buildApp$entOf$r(info, entRes, name) {
    const li = info.find((x) => x.isEnt && entRes[x.i] && entRes[x.i].entity === name);
    const r = li ? entRes[li.i] : null;
    return r;
}
export function inner$buildApp$entOf$r$$step(entRes, li) {
    const r = li ? entRes[li.i] : null;
    return r;
}
export function inner$buildApp$descOf$t(entMeta, e, skip) {
    const t = e.schema.filter((f) => !f.formula && !(f.members && f.members.length) && !skip.includes(f.label) && !entMeta.some((x) => x.name === f.label)).map((f, i) => [descRank(f), i, f]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return t;
}
export function inner$buildApp$dash(screens) {
    const dash = screens.find((x) => x.kind === 'dashboard') || null;
    return dash;
}
export function inner$buildApp$msgP(P, all, entRes, screens, planAll, rootByRefs) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const headDash = screens.find((x) => x.kind === 'dashboard') || null;
    const rootMeta = rootByRefs || (headDash && entMeta.length ? entMeta[0] : null);
    const msgP = planAll.find((x) => x.ok && x.entity === rootMeta.name && x.shape && x.shape.kind === 'message') || null;
    return msgP;
}
export function inner$buildApp$msgP$$step(planAll, rootMeta) {
    const msgP = planAll.find((x) => x.ok && x.entity === rootMeta.name && x.shape && x.shape.kind === 'message') || null;
    return msgP;
}
export function inner$buildApp$PFX(SL) {
    const PFX = new RegExp('^[' + (SL.prefixLetters || '') + ']');
    return PFX;
}
export function inner$buildApp$SFX(SL) {
    const SFX = new RegExp('(' + (SL.stemSuffixes || []).join('|') + ')$');
    return SFX;
}
export function inner$buildApp$ART1_RE(SL) {
    const ART1_RE = new RegExp(`^(${(SL.articlePrefixes || []).filter((p) => p.length === 1).join('|') || '(?!)'})`);
    return ART1_RE;
}
export function inner$buildApp$AND1_RE(SL) {
    const AND1_RE = new RegExp(`^${SL.andPrefix}.`);
    return AND1_RE;
}
export function inner$buildApp$valueOf$txt(words) {
    const txt = words.join(' ');
    return txt;
}
export function inner$buildApp$valueOf$i(words) {
    let i = words.length - 2;
    return i;
}
export function inner$buildApp$valueOf$rest(words, qw) {
    const txt = words.join(' ');
    let rest = txt.slice(qw.length).trim();
    return rest;
}
export function inner$buildApp$valueOf$rest$$step(txt, qw) {
    let rest = txt.slice(qw.length).trim();
    return rest;
}
export function inner$buildApp$valueOf$parts(SL, words, qw) {
    const txt = words.join(' ');
    let rest = txt.slice(qw.length).trim();
    for (const w of (SL.queueOf || []))
        if (rest.startsWith(w + ' ')) {
            rest = rest.slice(w.length + 1);
            break;
        }
    const parts = rest.split(/\s*,\s*/).filter(Boolean);
    return parts;
}
export function inner$buildApp$valueOf$parts$$step(rest) {
    const parts = rest.split(/\s*,\s*/).filter(Boolean);
    return parts;
}
export function inner$buildApp$valueOf$ws(SL, words, qw) {
    const txt = words.join(' ');
    let rest = txt.slice(qw.length).trim();
    for (const w of (SL.queueOf || []))
        if (rest.startsWith(w + ' ')) {
            rest = rest.slice(w.length + 1);
            break;
        }
    const ws = rest.split(/[\s,]+/).filter(Boolean);
    return ws;
}
export function inner$buildApp$valueOf$ws$$step(rest) {
    const ws = rest.split(/[\s,]+/).filter(Boolean);
    return ws;
}
export function inner$buildApp$valueOf$i2(i1) {
    let i2 = i1 + 1;
    return i2;
}
export function inner$buildApp$valueOf$cm(words, sw) {
    const txt = words.join(' ');
    const cm = txt.startsWith(sw + ' ') && txt.slice(sw.length + 1).match(/^(\d{1,2}):(\d{2})(?:\s+(\S+)\s+(.+))?$/);
    return cm;
}
export function inner$buildApp$valueOf$cm$$step(txt, sw) {
    const cm = txt.startsWith(sw + ' ') && txt.slice(sw.length + 1).match(/^(\d{1,2}):(\d{2})(?:\s+(\S+)\s+(.+))?$/);
    return cm;
}
export function inner$buildApp$valueOf$hm(words, sw) {
    const txt = words.join(' ');
    const cm = txt.startsWith(sw + ' ') && txt.slice(sw.length + 1).match(/^(\d{1,2}):(\d{2})(?:\s+(\S+)\s+(.+))?$/);
    const hm = +cm[1] * 60 + +cm[2];
    return hm;
}
export function inner$buildApp$valueOf$hm$$step(cm) {
    const hm = +cm[1] * 60 + +cm[2];
    return hm;
}
export function inner$buildApp$valueOf$st(words, sw) {
    const txt = words.join(' ');
    const st = txt.slice(sw.length + 1).trim();
    return st;
}
export function inner$buildApp$valueOf$st$$step(txt, sw) {
    const st = txt.slice(sw.length + 1).trim();
    return st;
}
export function inner$buildApp$valueOf$b(backRefs, r, ch) {
    const b = ch && (backRefs[r.entity] || []).find((q) => q.fname === ch.entity);
    return b;
}
export function inner$buildApp$valueOf$val(words, j) {
    const val = words.slice(j).join(' ');
    return val;
}
export function inner$buildApp$valueOf$isHm(SL, f) {
    const isHm = f.type !== 'date' && f.type !== 'num' && String(f.label).split(/[\s_]+/).some((w) => (SL.typeTime || []).includes(w));
    return isHm;
}
export function inner$buildApp$liveOf0$xw0(c) {
    const xw0 = String(c.x).split(/\s+/)[0];
    return xw0;
}
export function inner$buildApp$liveOf0$xs(c) {
    const xs = String(c.x).split(/\s+/).slice(1);
    return xs;
}
export function inner$buildApp$liveOf0$ai(SL, c) {
    const xs = String(c.x).split(/\s+/).slice(1);
    const AW = SL.arithWords || {};
    const ai = xs.findIndex((w, i) => AW[xs.slice(0, i + 1).slice(-2).join(' ')] || AW[w]);
    return ai;
}
export function inner$buildApp$liveOf0$ai$$step(xs, AW) {
    const ai = xs.findIndex((w, i) => AW[xs.slice(0, i + 1).slice(-2).join(' ')] || AW[w]);
    return ai;
}
export function inner$buildApp$liveOf0$w2(SL, c) {
    const xs = String(c.x).split(/\s+/).slice(1);
    const AW = SL.arithWords || {};
    const ai = xs.findIndex((w, i) => AW[xs.slice(0, i + 1).slice(-2).join(' ')] || AW[w]);
    const w2 = AW[xs.slice(Math.max(0, ai - 1), ai + 1).join(' ')] ? xs.slice(Math.max(0, ai - 1), ai + 1).join(' ') : xs[ai];
    return w2;
}
export function inner$buildApp$liveOf0$w2$$step(xs, AW, ai) {
    const w2 = AW[xs.slice(Math.max(0, ai - 1), ai + 1).join(' ')] ? xs.slice(Math.max(0, ai - 1), ai + 1).join(' ') : xs[ai];
    return w2;
}
export function inner$buildApp$liveOf0$rest(SL, c) {
    const xs = String(c.x).split(/\s+/).slice(1);
    const AW = SL.arithWords || {};
    const ai = xs.findIndex((w, i) => AW[xs.slice(0, i + 1).slice(-2).join(' ')] || AW[w]);
    const rest = xs.slice(ai + 1).join(' ');
    return rest;
}
export function inner$buildApp$liveOf0$rest$$step(xs, ai) {
    const rest = xs.slice(ai + 1).join(' ');
    return rest;
}
export function inner$buildApp$liveOf0$P(entRes, d) {
    const P = Object.values(entRes).find((r) => r && r.entity === d.ent);
    return P;
}
export function inner$buildApp$liveOf0$xw(c) {
    const xw = String(c.x).split(/\s+/).filter(Boolean);
    return xw;
}
export function inner$buildApp$liveOf0$rest_L423(c, agg) {
    const xw = String(c.x).split(/\s+/).filter(Boolean);
    const rest = agg ? xw.slice(1) : xw;
    return rest;
}
export function inner$buildApp$liveOf0$rest_L423$$step(xw, agg) {
    const rest = agg ? xw.slice(1) : xw;
    return rest;
}
export function inner$buildApp$liveOf0$ofI(SL, c, agg) {
    const xw = String(c.x).split(/\s+/).filter(Boolean);
    const rest = agg ? xw.slice(1) : xw;
    const ofI = rest.indexOf(String(SL.ofWord).trim());
    return ofI;
}
export function inner$buildApp$liveOf0$ofI$$step(SL, rest) {
    const ofI = rest.indexOf(String(SL.ofWord).trim());
    return ofI;
}
export function inner$buildApp$liveOf0$b(backRefs, child, parent) {
    const b = (backRefs[parent.entity] || []).find((q) => q.fname === child.entity);
    return b;
}
export function inner$buildApp$liveOf0$byI(SL, c, agg) {
    const xw = String(c.x).split(/\s+/).filter(Boolean);
    const rest = agg ? xw.slice(1) : xw;
    const byI = rest.findIndex((w) => (SL.perEach || []).includes(w));
    return byI;
}
export function inner$buildApp$liveOf0$byI$$step(SL, rest) {
    const byI = rest.findIndex((w) => (SL.perEach || []).includes(w));
    return byI;
}
export function inner$buildApp$liveOf0$fw(SL, c, agg) {
    const xw = String(c.x).split(/\s+/).filter(Boolean);
    const rest = agg ? xw.slice(1) : xw;
    const byI = rest.findIndex((w) => (SL.perEach || []).includes(w));
    const fw = rest.slice(0, byI).join(' ');
    return fw;
}
export function inner$buildApp$liveOf0$fw$$step(rest, byI) {
    const fw = rest.slice(0, byI).join(' ');
    return fw;
}
export function inner$buildApp$liveOf0$bw(SL, c, agg) {
    const xw = String(c.x).split(/\s+/).filter(Boolean);
    const rest = agg ? xw.slice(1) : xw;
    const byI = rest.findIndex((w) => (SL.perEach || []).includes(w));
    const bw = rest.slice(byI + 1).join(' ');
    return bw;
}
export function inner$buildApp$liveOf0$bw$$step(rest, byI) {
    const bw = rest.slice(byI + 1).join(' ');
    return bw;
}
export function inner$buildApp$liveOf0$xw2(c) {
    const xw2 = String(c.x).split(/\s+/).filter(Boolean);
    return xw2;
}
export function inner$buildApp$liveOf0$fieldHead(c, entTail) {
    const xw2 = String(c.x).split(/\s+/).filter(Boolean);
    const fieldHead = entTail ? xw2.slice(0, -1).join(' ') : null;
    return fieldHead;
}
export function inner$buildApp$liveOf0$fieldHead$$step(xw2, entTail) {
    const fieldHead = entTail ? xw2.slice(0, -1).join(' ') : null;
    return fieldHead;
}
export function inner$buildApp$liveOf0$ordered(info, entRes, entTail) {
    const ordered = [...(entTail ? [entTail] : []), ...info.filter((li) => li.isEnt && entRes[li.i] && entRes[li.i] !== entTail).map((li) => entRes[li.i])];
    return ordered;
}
export function inner$buildApp$liveOf0$cx(c, entTail, r) {
    const xw2 = String(c.x).split(/\s+/).filter(Boolean);
    const fieldHead = entTail ? xw2.slice(0, -1).join(' ') : null;
    const cx = (r === entTail && fieldHead) ? fieldHead : c.x;
    return cx;
}
export function inner$buildApp$liveOf0$cx$$step(c, entTail, fieldHead, r) {
    const cx = (r === entTail && fieldHead) ? fieldHead : c.x;
    return cx;
}
export function inner$buildApp$map$slugName(nameToSlug) {
    const slugName = Object.fromEntries(Object.entries(nameToSlug).map(([n, sl]) => [sl, n]));
    return slugName;
}
export function inner$buildApp$sslug(P) {
    const sslug = `${P}sync`;
    return sslug;
}
export function inner$buildApp$entsS(all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entsS = info.filter((li) => li.isEnt && entRes[li.i]).map((li) => entRes[li.i]);
    return entsS;
}
export function inner$buildApp$entsS$$step(info, entRes) {
    const entsS = info.filter((li) => li.isEnt && entRes[li.i]).map((li) => entRes[li.i]);
    return entsS;
}
export function inner$buildApp$slugs(P, all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const entsS = info.filter((li) => li.isEnt && entRes[li.i]).map((li) => entRes[li.i]);
    const slugs = entsS.map((r) => `'${nameToSlug[r.entity]}'`).join(', ');
    return slugs;
}
export function inner$buildApp$slugs$$step(nameToSlug, entsS) {
    const slugs = entsS.map((r) => `'${nameToSlug[r.entity]}'`).join(', ');
    return slugs;
}
export function inner$buildApp$feedEnts(P, opts, all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const feedEnts = (opts.feeds || []).map((n) => info.find((li) => li.isEnt && entRes[li.i] && entRes[li.i].entity === n)).filter(Boolean).map((li) => entRes[li.i]).filter((r) => nameToSlug[r.entity]);
    return feedEnts;
}
export function inner$buildApp$feedEnts$$step(opts, info, entRes, nameToSlug) {
    const feedEnts = (opts.feeds || []).map((n) => info.find((li) => li.isEnt && entRes[li.i] && entRes[li.i].entity === n)).filter(Boolean).map((li) => entRes[li.i]).filter((r) => nameToSlug[r.entity]);
    return feedEnts;
}
export function inner$buildApp$fslug_L477(P) {
    const fslug = `${P}feed`;
    return fslug;
}
export function inner$buildApp$rslug(P) {
    const rslug = `${P}rules`;
    return rslug;
}
export function inner$buildApp$re(sc) {
    const re = new RegExp(`(\\n\\s*)(DsNavTile\\([^\\n]*?builder: \\(_\\) => )const ${sc.cls}\\(\\)`, 'g');
    return re;
}
export function inner$replace$cls(src) {
    const cls = (src.match(/^class ([A-Za-z0-9_]+)/m) || [])[1];
    return cls;
}
export function inner$parseRole$scope$$after_loop(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    const segs = afterName.split('|');
    const scope = [];
    const hide = [];
    const ro = [];
    for (let i = 1; i < segs.length; i++) {
        const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
        if (!hm)
            continue;
        const items = hm[2].split(/[,،]/).map((x) => x.trim()).filter(Boolean);
        if (hm[1] === 'היקף') {
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+)$/);
                if (d)
                    scope.push({ ent: clean(d[1]), field: clean(d[2]) });
            }
        }
        else {
            // שדות: X.Y=הסתר (הסתרה מלאה כרטיס+טופס) · X.Y=נעל/קריאה (נעילת-קלט בטופס בלבד)
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+?)\s*=\s*(.+)$/);
                if (!d)
                    continue;
                const e = { ent: clean(d[1]), field: clean(d[2]) };
                if (/הסתר/.test(d[3]))
                    hide.push(e);
                else if (/נעל|קריאה/.test(d[3]))
                    ro.push(e);
            }
        }
    }
    return scope;
}
export function inner$parseRole$hide$$after_loop(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    const segs = afterName.split('|');
    const scope = [];
    const hide = [];
    const ro = [];
    for (let i = 1; i < segs.length; i++) {
        const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
        if (!hm)
            continue;
        const items = hm[2].split(/[,،]/).map((x) => x.trim()).filter(Boolean);
        if (hm[1] === 'היקף') {
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+)$/);
                if (d)
                    scope.push({ ent: clean(d[1]), field: clean(d[2]) });
            }
        }
        else {
            // שדות: X.Y=הסתר (הסתרה מלאה כרטיס+טופס) · X.Y=נעל/קריאה (נעילת-קלט בטופס בלבד)
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+?)\s*=\s*(.+)$/);
                if (!d)
                    continue;
                const e = { ent: clean(d[1]), field: clean(d[2]) };
                if (/הסתר/.test(d[3]))
                    hide.push(e);
                else if (/נעל|קריאה/.test(d[3]))
                    ro.push(e);
            }
        }
    }
    return hide;
}
export function inner$parseRole$ro$$after_loop(line) {
    const body = line.replace(ROLE_RE, '');
    const ci = body.indexOf(':');
    const afterName = ci >= 0 ? body.slice(ci + 1) : '';
    const segs = afterName.split('|');
    const scope = [];
    const hide = [];
    const ro = [];
    for (let i = 1; i < segs.length; i++) {
        const hm = segs[i].match(/^\s*(היקף|שדות)\s*:(.*)$/);
        if (!hm)
            continue;
        const items = hm[2].split(/[,،]/).map((x) => x.trim()).filter(Boolean);
        if (hm[1] === 'היקף') {
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+)$/);
                if (d)
                    scope.push({ ent: clean(d[1]), field: clean(d[2]) });
            }
        }
        else {
            // שדות: X.Y=הסתר (הסתרה מלאה כרטיס+טופס) · X.Y=נעל/קריאה (נעילת-קלט בטופס בלבד)
            for (const it of items) {
                const d = it.match(/^(.+?)\.(.+?)\s*=\s*(.+)$/);
                if (!d)
                    continue;
                const e = { ent: clean(d[1]), field: clean(d[2]) };
                if (/הסתר/.test(d[3]))
                    hide.push(e);
                else if (/נעל|קריאה/.test(d[3]))
                    ro.push(e);
            }
        }
    }
    return ro;
}
export function inner$parseLookLine$look$$after_loop(SL, value) {
    const ws = String(value || '').trim().split(/\s+/).filter(Boolean);
    let look = null;
    let used = 0;
    for (let n = ws.length; n >= 1; n--) {
        const key = ws.slice(0, n).join(' ');
        if (SL.looks[key]) {
            look = SL.looks[key];
            used = n;
            break;
        }
    }
    return look;
}
export function inner$parseLookLine$used$$after_loop(SL, value) {
    const ws = String(value || '').trim().split(/\s+/).filter(Boolean);
    let look = null;
    let used = 0;
    for (let n = ws.length; n >= 1; n--) {
        const key = ws.slice(0, n).join(' ');
        if (SL.looks[key]) {
            look = SL.looks[key];
            used = n;
            break;
        }
    }
    return used;
}
export function inner$buildApp$questions$$after_loop(SL, specText) {
    const all0 = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const Q_RE = new RegExp('^\\s*' + SL.questionWord + '\\s+(\\S+)\\s*:\\s*(.+)$');
    const questions = {};
    for (const l of all0) {
        const m = l.match(Q_RE);
        if (m && SL.questionTargets[m[1]])
            questions[SL.questionTargets[m[1]]] = m[2].trim();
    }
    return questions;
}
export function inner$buildApp$entMeta$$after_loop(P, all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    return entMeta;
}
export function inner$buildApp$nameToSlug$$after_loop(P, all, entRes) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    return nameToSlug;
}
export function inner$buildApp$aggs$$after_loop(P, all, entRes, li, L) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const rawMetrics = splitMetrics(li.line.split(/\s+עם\s+/)[1] || '');
    const aggs = [];
    const countWords = [];
    const FILT_RE = new RegExp('^' + L.count + '\\(([^:)]+):\\s*([^=)]+)=([^)]+)\\)$');
    for (const t of rawMetrics) {
        const mf = t.match(FILT_RE);
        if (mf) {
            const en = mf[1].trim();
            aggs.push({ kind: L.count, entityName: en, field: mf[2].trim(), value: mf[3].trim(), slug: nameToSlug[en] || '', filtered: true });
            continue;
        }
        const m = t.match(/^(סכום|ממוצע|מונה)\(([^.)]+)(?:\.([^)]+))?\)$/);
        if (m)
            aggs.push({ kind: m[1], entityName: m[2].trim(), field: (m[3] || '').trim(), slug: nameToSlug[m[2].trim()] || '' });
        else
            countWords.push(t);
    }
    return aggs;
}
export function inner$buildApp$countWords$$after_loop(P, all, entRes, li, L) {
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const rawMetrics = splitMetrics(li.line.split(/\s+עם\s+/)[1] || '');
    const aggs = [];
    const countWords = [];
    const FILT_RE = new RegExp('^' + L.count + '\\(([^:)]+):\\s*([^=)]+)=([^)]+)\\)$');
    for (const t of rawMetrics) {
        const mf = t.match(FILT_RE);
        if (mf) {
            const en = mf[1].trim();
            aggs.push({ kind: L.count, entityName: en, field: mf[2].trim(), value: mf[3].trim(), slug: nameToSlug[en] || '', filtered: true });
            continue;
        }
        const m = t.match(/^(סכום|ממוצע|מונה)\(([^.)]+)(?:\.([^)]+))?\)$/);
        if (m)
            aggs.push({ kind: m[1], entityName: m[2].trim(), field: (m[3] || '').trim(), slug: nameToSlug[m[2].trim()] || '' });
        else
            countWords.push(t);
    }
    return countWords;
}
export function inner$buildApp$scopeByEnt$$after_loop(P, all, entRes) {
    const roles = all.filter((l) => ROLE_RE.test(l)).map(parseRole);
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const scopeByEnt = {};
    for (const role of roles)
        for (const sc of (role.scope || [])) {
            const sl = nameToSlug[sc.ent];
            if (sl && !scopeByEnt[sl])
                scopeByEnt[sl] = sc.field;
        }
    return scopeByEnt;
}
export function inner$buildApp$scopeFields$$after_loop(P, all, entRes) {
    const roles = all.filter((l) => ROLE_RE.test(l)).map(parseRole);
    const lines = all.filter((l) => !ROLE_RE.test(l));
    const info = lines.map((line, idx) => ({ line, i: idx + 1, isEnt: ENTITY_RE.test(line) }));
    const entMeta = [];
    const nameToSlug = {};
    for (const li of info)
        if (li.isEnt) {
            const r = entRes[li.i];
            const eslug = `${P}ent${li.i}`;
            entMeta.push({ name: r.entity, slug: eslug, fields: r.schema.length, stages: (r.stages || []).length, stageLabels: r.stages || [], icon: '🗂️', numFields: r.schema.filter((s) => s.type === 'num').map((s) => s.label), labels: r.schema.map((s) => s.label) });
            if (!(r.entity in nameToSlug))
                nameToSlug[r.entity] = eslug; // שם ⇒ slug-היעד לקשרים
        }
    const scopeFields = [];
    for (const role of roles)
        for (const sc of (role.scope || [])) {
            const sl = nameToSlug[sc.ent];
            if (sl && !scopeFields.some((x) => x.slug === sl && x.field === sc.field))
                scopeFields.push({ slug: sl, field: sc.field });
        }
    return scopeFields;
}
export function inner$buildApp$valueOf$rest$$after_loop(SL, words, qw) {
    const txt = words.join(' ');
    let rest = txt.slice(qw.length).trim();
    for (const w of (SL.queueOf || []))
        if (rest.startsWith(w + ' ')) {
            rest = rest.slice(w.length + 1);
            break;
        }
    return rest;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$parseRole$body: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$ci: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$ci$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parseRole$name: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$name$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"num"},"opt":false}],
  inner$parseRole$afterName: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$afterName$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"num"},"opt":false}],
  inner$parseRole$segs: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$segs$$step: [{"name":"afterName","d":{"t":"any"},"opt":false}],
  inner$parseRole$all: [{"name":"entPart","d":{"t":"any"},"opt":false}],
  inner$parseRole$ents: [{"name":"entPart","d":{"t":"any"},"opt":false}],
  inner$parseRole$ents$$step: [{"name":"entPart","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false}],
  inner$parseRole$hm: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parseRole$hm$$step: [{"name":"segs","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parseRole$items: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parseRole$items$$step: [{"name":"hm","d":{"t":"any"},"opt":false}],
  inner$parseRole$d: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$parseRole$d_L53: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$parseRole$e: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$parseRole$e$$step: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$parseLookLine$ws: [{"name":"value","d":{"t":"any"},"opt":false}],
  inner$parseLookLine$key: [{"name":"value","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$parseLookLine$key$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$parseLookLine$themeWord: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"value","d":{"t":"any"},"opt":false}],
  inner$parseLookLine$themeWord$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"look","d":{"t":"any"},"opt":false},{"name":"used","d":{"t":"num"},"opt":false}],
  inner$parseLookLine$theme: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"value","d":{"t":"any"},"opt":false}],
  inner$parseLookLine$theme$$step: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"themeWord","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$writePlan: [{"name":"opts","d":{"t":"obj","p":[]},"opt":false}],
  inner$buildApp$roleLines: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$buildApp$freeLines: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$buildApp$free: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$buildApp$free$$step: [{"name":"freeLines","d":{"t":"any"},"opt":false}],
  inner$buildApp$all0: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$APP_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$appLine: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$appLine$$step: [{"name":"all0","d":{"t":"any"},"opt":false},{"name":"APP_RE","d":{"t":"any"},"opt":false}],
  inner$buildApp$appName: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$appName$$step: [{"name":"appLine","d":{"t":"any"},"opt":false}],
  inner$buildApp$LOOK_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$lookLine: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$lookLine$$step: [{"name":"all0","d":{"t":"any"},"opt":false},{"name":"LOOK_RE","d":{"t":"any"},"opt":false}],
  inner$buildApp$Q_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$m: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$m$$step: [{"name":"Q_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$CHAIN_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$chainLine: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$chainLine$$step: [{"name":"all0","d":{"t":"any"},"opt":false},{"name":"CHAIN_RE","d":{"t":"any"},"opt":false}],
  inner$buildApp$chain: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$chain$$step: [{"name":"chainLine","d":{"t":"any"},"opt":false}],
  inner$buildApp$LAYER_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$layerLine: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$layerLine$$step: [{"name":"all0","d":{"t":"any"},"opt":false},{"name":"LAYER_RE","d":{"t":"any"},"opt":false}],
  inner$buildApp$layer: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$layer$$step: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"layerLine","d":{"t":"any"},"opt":false}],
  inner$buildApp$SERVER_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$EXAMPLE_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$m_L115: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$m_L115$$step: [{"name":"EXAMPLE_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$c: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$buildApp$roles: [{"name":"all","d":{"t":"any"},"opt":false}],
  inner$buildApp$lines: [{"name":"all","d":{"t":"any"},"opt":false}],
  inner$buildApp$info: [{"name":"all","d":{"t":"any"},"opt":false}],
  inner$buildApp$info$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$buildApp$extraScreens: [{"name":"opts","d":{"t":"obj","p":[]},"opt":false}],
  inner$buildApp$forEach$col: [{"name":"ex","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$buildApp$empty: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$empty$$step: [{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$eslug: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$entityNames: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$entityNames$$step: [{"name":"entMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$pluralForms$b: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$buildApp$pluralForms$b2: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$buildApp$relOf$fw: [{"name":"label","d":{"t":"any"},"opt":false}],
  inner$buildApp$relOf$ew: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$buildApp$relOf$forms: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$buildApp$fslug: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$decl: [{"name":"F","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"hit","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["en",{"t":"any"},false],["multi",{"t":"bool"},false]]}]},"opt":false}],
  inner$buildApp$decl$$step: [{"name":"dp","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"hit","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["en",{"t":"any"},false],["multi",{"t":"bool"},false]]}]},"opt":false}],
  inner$buildApp$own: [{"name":"NS","d":{"t":"str"},"opt":false},{"name":"P","d":{"t":"str"},"opt":false}],
  inner$buildApp$slug: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$authz: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$buildApp$authz$$step: [{"name":"roles","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$sc: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"any"},"opt":false}],
  inner$buildApp$slug_L211: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$title: [{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$rawMetrics: [{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$FILT_RE: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$buildApp$mf: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$buildApp$mf$$step: [{"name":"FILT_RE","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"str"},"opt":false}],
  inner$buildApp$en: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$buildApp$en$$step: [{"name":"mf","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$buildApp$m_L224: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$buildApp$bindN: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"drawer","d":{"t":"bool"},"opt":false},{"name":"SCREEN_REGISTRY","d":{"t":"any"},"opt":false}],
  inner$buildApp$bindN$$step: [{"name":"entMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"drawer","d":{"t":"bool"},"opt":false},{"name":"SCREEN_REGISTRY","d":{"t":"any"},"opt":false}],
  inner$buildApp$spec: [{"name":"bi","d":{"t":"num"},"opt":false},{"name":"SCREEN_REGISTRY","d":{"t":"any"},"opt":false}],
  inner$buildApp$bslug: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"bi","d":{"t":"num"},"opt":false}],
  inner$buildApp$rels: [{"name":"backRefs","d":{"t":"obj","n":"backRefs","p":[]},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["slug",{"t":"str"},false],["fields",{"t":"any"},false],["stages",{"t":"any"},false],["stageLabels",{"t":"any"},false],["icon",{"t":"str"},false],["numFields",{"t":"any"},false],["labels",{"t":"any"},false]]},"opt":false}],
  inner$buildApp$pents: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$pents$$step: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"entMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$map$li: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"info","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["slug",{"t":"str"},false],["fields",{"t":"any"},false],["stages",{"t":"any"},false],["stageLabels",{"t":"any"},false],["icon",{"t":"str"},false],["numFields",{"t":"any"},false],["labels",{"t":"any"},false]]},"opt":false}],
  inner$buildApp$map$r: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["slug",{"t":"str"},false],["fields",{"t":"any"},false],["stages",{"t":"any"},false],["stageLabels",{"t":"any"},false],["icon",{"t":"str"},false],["numFields",{"t":"any"},false],["labels",{"t":"any"},false]]},"opt":false}],
  inner$buildApp$map$r$$step: [{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$sc_L283: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["slug",{"t":"str"},false],["fields",{"t":"any"},false],["stages",{"t":"any"},false],["stageLabels",{"t":"any"},false],["icon",{"t":"str"},false],["numFields",{"t":"any"},false],["labels",{"t":"any"},false]]},"opt":false}],
  inner$buildApp$mine: [{"name":"plan","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"obj","p":[["name",{"t":"any"},false],["slug",{"t":"str"},false],["cls",{"t":"any"},false],["schema",{"t":"any"},false]]},"opt":false}],
  inner$buildApp$wEnts: [{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$li: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"ent","d":{"t":"str"},"opt":false}],
  inner$buildApp$li$$step: [{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"ent","d":{"t":"str"},"opt":false}],
  inner$buildApp$r: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"ent","d":{"t":"str"},"opt":false}],
  inner$buildApp$r$$step: [{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$labels: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"ent","d":{"t":"str"},"opt":false}],
  inner$buildApp$labels$$step: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$buildApp$headDash: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$rootMeta: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rootByRefs","d":{"t":"any"},"opt":false}],
  inner$buildApp$rootMeta$$step: [{"name":"entMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rootByRefs","d":{"t":"any"},"opt":false},{"name":"headDash","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}]},"opt":false}],
  inner$buildApp$home: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"hub","d":{"t":"obj","p":[["slug",{"t":"any"},false],["cls",{"t":"str"},false]]},"opt":false}],
  inner$buildApp$entOf$sc: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$buildApp$entOf$li: [{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$buildApp$entOf$r: [{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$buildApp$entOf$r$$step: [{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"li","d":{"t":"any"},"opt":false}],
  inner$buildApp$descOf$t: [{"name":"entMeta","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false},{"name":"skip","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$dash: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$msgP: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"planAll","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rootByRefs","d":{"t":"any"},"opt":false}],
  inner$buildApp$msgP$$step: [{"name":"planAll","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rootMeta","d":{"t":"any"},"opt":false}],
  inner$buildApp$PFX: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$SFX: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$ART1_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$AND1_RE: [{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$txt: [{"name":"words","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$i: [{"name":"words","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$rest: [{"name":"words","d":{"t":"any"},"opt":false},{"name":"qw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$rest$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"qw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$parts: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"words","d":{"t":"any"},"opt":false},{"name":"qw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$parts$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$ws: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"words","d":{"t":"any"},"opt":false},{"name":"qw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$ws$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$i2: [{"name":"i1","d":{"t":"num"},"opt":false}],
  inner$buildApp$valueOf$cm: [{"name":"words","d":{"t":"any"},"opt":false},{"name":"sw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$cm$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"sw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$hm: [{"name":"words","d":{"t":"any"},"opt":false},{"name":"sw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$hm$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$st: [{"name":"words","d":{"t":"any"},"opt":false},{"name":"sw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$st$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"sw","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$b: [{"name":"backRefs","d":{"t":"obj","n":"backRefs","p":[]},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$val: [{"name":"words","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$buildApp$valueOf$isHm: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$xw0: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$xs: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$ai: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$ai$$step: [{"name":"xs","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"AW","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$w2: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$w2$$step: [{"name":"xs","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"AW","d":{"t":"any"},"opt":false},{"name":"ai","d":{"t":"num"},"opt":false}],
  inner$buildApp$liveOf0$rest: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$rest$$step: [{"name":"xs","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"ai","d":{"t":"num"},"opt":false}],
  inner$buildApp$liveOf0$P: [{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$xw: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$rest_L423: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$liveOf0$rest_L423$$step: [{"name":"xw","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"agg","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$liveOf0$ofI: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$liveOf0$ofI$$step: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$buildApp$liveOf0$b: [{"name":"backRefs","d":{"t":"obj","n":"backRefs","p":[]},"opt":false},{"name":"child","d":{"t":"any"},"opt":false},{"name":"parent","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$byI: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$liveOf0$byI$$step: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$buildApp$liveOf0$fw: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$liveOf0$fw$$step: [{"name":"rest","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"byI","d":{"t":"num"},"opt":false}],
  inner$buildApp$liveOf0$bw: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$buildApp$liveOf0$bw$$step: [{"name":"rest","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"byI","d":{"t":"num"},"opt":false}],
  inner$buildApp$liveOf0$xw2: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$fieldHead: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"entTail","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$fieldHead$$step: [{"name":"xw2","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"entTail","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$ordered: [{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"entTail","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$cx: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"entTail","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$buildApp$liveOf0$cx$$step: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"entTail","d":{"t":"any"},"opt":false},{"name":"fieldHead","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$slugName: [{"name":"nameToSlug","d":{"t":"obj","n":"nameToSlug","p":[]},"opt":false}],
  inner$buildApp$sslug: [{"name":"P","d":{"t":"str"},"opt":false}],
  inner$buildApp$entsS: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$entsS$$step: [{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$slugs: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$slugs$$step: [{"name":"nameToSlug","d":{"t":"obj","n":"nameToSlug","p":[]},"opt":false},{"name":"entsS","d":{"t":"any"},"opt":false}],
  inner$buildApp$feedEnts: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"opts","d":{"t":"obj","p":[]},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$feedEnts$$step: [{"name":"opts","d":{"t":"obj","p":[]},"opt":false},{"name":"info","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"nameToSlug","d":{"t":"obj","n":"nameToSlug","p":[]},"opt":false}],
  inner$buildApp$fslug_L477: [{"name":"P","d":{"t":"str"},"opt":false}],
  inner$buildApp$rslug: [{"name":"P","d":{"t":"str"},"opt":false}],
  inner$buildApp$re: [{"name":"sc","d":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]},"opt":false}],
  inner$replace$cls: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseRole$scope$$after_loop: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$hide$$after_loop: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseRole$ro$$after_loop: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseLookLine$look$$after_loop: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"value","d":{"t":"any"},"opt":false}],
  inner$parseLookLine$used$$after_loop: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"value","d":{"t":"any"},"opt":false}],
  inner$buildApp$questions$$after_loop: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$entMeta$$after_loop: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$nameToSlug$$after_loop: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$aggs$$after_loop: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"li","d":{"t":"any"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$buildApp$countWords$$after_loop: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false},{"name":"li","d":{"t":"any"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$buildApp$scopeByEnt$$after_loop: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$scopeFields$$after_loop: [{"name":"P","d":{"t":"str"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false},{"name":"entRes","d":{"t":"obj","n":"entRes","p":[]},"opt":false}],
  inner$buildApp$valueOf$rest$$after_loop: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"words","d":{"t":"any"},"opt":false},{"name":"qw","d":{"t":"any"},"opt":false}],
};
