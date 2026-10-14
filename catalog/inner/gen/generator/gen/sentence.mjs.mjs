// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/sentence.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HE = '֐-׿';
const words = (s) => [...String(s || '').matchAll(new RegExp(`[${HE}][${HE}'"׳״\\-]*`, 'g'))].map((m) => m[0]);
const tokens = (s) => [...String(s || '').matchAll(new RegExp(`[${HE}A-Za-z0-9][${HE}A-Za-z0-9'"׳״\\-]*`, 'g'))].map((m) => m[0]);
export function inner$sentenceToSpec$PLURAL(LANG) {
    const PLURAL = new RegExp('(' + (LANG.pluralSuffixes || []).join('|') + ')$');
    return PLURAL;
}
export function inner$sentenceToSpec$MARK_RE(LANG) {
    const MARKS = LANG.fieldMarks || [];
    const MARK_RE = new RegExp(`\\s+(?:${MARKS.join('|')})\\s+`);
    return MARK_RE;
}
export function inner$sentenceToSpec$MARK_RE$$step(MARKS) {
    const MARK_RE = new RegExp(`\\s+(?:${MARKS.join('|')})\\s+`);
    return MARK_RE;
}
export function inner$sentenceToSpec$ITEM_RE(LANG) {
    const CONJ = LANG.listConj || [];
    const ITEM_RE = new RegExp(`\\s*[,،]\\s*|\\s+(?:${CONJ.join('|')})(?=[${HE}])|\\s+(?:${CONJ.join('|')})-`);
    return ITEM_RE;
}
export function inner$sentenceToSpec$ITEM_RE$$step(CONJ) {
    const ITEM_RE = new RegExp(`\\s*[,،]\\s*|\\s+(?:${CONJ.join('|')})(?=[${HE}])|\\s+(?:${CONJ.join('|')})-`);
    return ITEM_RE;
}
export function inner$sentenceToSpec$IMPLIED(LANG) {
    const MARKS = LANG.fieldMarks || [];
    const IMPLIED = [...new Set([LANG.impliedMark, ...MARKS].filter(Boolean))];
    return IMPLIED;
}
export function inner$sentenceToSpec$IMPLIED$$step(LANG, MARKS) {
    const IMPLIED = [...new Set([LANG.impliedMark, ...MARKS].filter(Boolean))];
    return IMPLIED;
}
export function inner$sentenceToSpec$EACH_RE(LANG) {
    const MARKS = LANG.fieldMarks || [];
    const EACH = [...(LANG.eachWords || []), ...((LANG.extra && LANG.extra.eachWords) || [])];
    const IMPLIED = [...new Set([LANG.impliedMark, ...MARKS].filter(Boolean))];
    const EACH_RE = EACH.length ? new RegExp(`^(?:${EACH.join('|')})\\s+([${HE}][${HE}"׳״\\-]*(?:\\s+[${HE}][${HE}"׳״\\-]*){0,3}?)\\s+(?:${IMPLIED.join('|')})\\s+`) : null;
    return EACH_RE;
}
export function inner$sentenceToSpec$EACH_RE$$step(EACH, IMPLIED) {
    const EACH_RE = EACH.length ? new RegExp(`^(?:${EACH.join('|')})\\s+([${HE}][${HE}"׳״\\-]*(?:\\s+[${HE}][${HE}"׳״\\-]*){0,3}?)\\s+(?:${IMPLIED.join('|')})\\s+`) : null;
    return EACH_RE;
}
export function inner$sentenceToSpec$toField$s(raw) {
    let s = raw.trim();
    return s;
}
export function inner$sentenceToSpec$toField$em(ENUM_RE, s) {
    const em = ENUM_RE.exec(s);
    return em;
}
export function inner$sentenceToSpec$toField$head(s) {
    const [head, ...rest] = s.split(/\s*[:\-]\s*/);
    return head;
}
export function inner$sentenceToSpec$toField$rest(s) {
    const [head, ...rest] = s.split(/\s*[:\-]\s*/);
    return rest;
}
export function inner$sentenceToSpec$toField$eqi(s) {
    const eqi = s.indexOf('=');
    return eqi;
}
export function inner$sentenceToSpec$toField$rhs(s) {
    const eqi = s.indexOf('=');
    let rhs = s.slice(eqi + 1).trim();
    return rhs;
}
export function inner$sentenceToSpec$toField$rhs$$step(s, eqi) {
    let rhs = s.slice(eqi + 1).trim();
    return rhs;
}
export function inner$sentenceToSpec$toField$name(LEAD, MARKS, s) {
    const name = tokens(s).filter((w) => (w.length > 1 && !LEAD.has(w) && !MARKS.includes(w)) || /^\d+$/.test(w)).join(' ') || s;
    return name;
}
export function inner$sentenceToSpec$addEnt$existing(ents, name) {
    const existing = ents.find((e) => e.name === name);
    return existing;
}
export function inner$sentenceToSpec$addEnt$key(f) {
    const key = f.replace(/[\[({*].*$/, '');
    return key;
}
export function inner$sentenceToSpec$STAGE_WORDS(LANG) {
    const STAGE_WORDS = [...new Set([...(LANG.stagePrefixes || []), ...(LANG.sectionMarkers || []).slice(0, 1)])].filter(Boolean);
    return STAGE_WORDS;
}
export function inner$sentenceToSpec$STAGE_RE(LANG) {
    const STAGE_WORDS = [...new Set([...(LANG.stagePrefixes || []), ...(LANG.sectionMarkers || []).slice(0, 1)])].filter(Boolean);
    const STAGE_RE = STAGE_WORDS.length ? new RegExp(`(?:^|[\\s,;(])(?:${STAGE_WORDS.join('|')})\\s*[:\\-]?\\s*([^;.)]+)`) : null;
    return STAGE_RE;
}
export function inner$sentenceToSpec$STAGE_RE$$step(STAGE_WORDS) {
    const STAGE_RE = STAGE_WORDS.length ? new RegExp(`(?:^|[\\s,;(])(?:${STAGE_WORDS.join('|')})\\s*[:\\-]?\\s*([^;.)]+)`) : null;
    return STAGE_RE;
}
export function inner$sentenceToSpec$clauses(text) {
    const clauses = String(text || '').split(/[.;\n]+/).map((c) => c.trim()).filter((c) => words(c).length);
    return clauses;
}
export function inner$sentenceToSpec$forEach$gm(GP, GO, clause) {
    const gm = GP.length && GO.length ? new RegExp(`^(?:${GP.join('|')})-?\\s*([^,]+?)\\s+(?:${GO.join('|')})\\s+(.+)$`).exec(clause) : null;
    return gm;
}
export function inner$sentenceToSpec$forEach$e(ents) {
    const e = ents[ents.length - 1];
    return e;
}
export function inner$sentenceToSpec$forEach$fb(LANG, clause) {
    const FV = (LANG.extra && LANG.extra.forbidVerbs) || {};
    const fb = /^(?:ב-?)?(.+?)\s+אסור\s*:\s*(.+)$/.exec(clause) || (Object.keys(FV).length ? new RegExp(`^אסור\\s+(${Object.keys(FV).join('|')})\\s+(.+?)(?:\\s+ב-?(.+))?$`).exec(clause) : null);
    return fb;
}
export function inner$sentenceToSpec$forEach$fb$$step(clause, FV) {
    const fb = /^(?:ב-?)?(.+?)\s+אסור\s*:\s*(.+)$/.exec(clause) || (Object.keys(FV).length ? new RegExp(`^אסור\\s+(${Object.keys(FV).join('|')})\\s+(.+?)(?:\\s+ב-?(.+))?$`).exec(clause) : null);
    return fb;
}
export function inner$sentenceToSpec$forEach$e_L89(ents, entName) {
    const e = entName ? ents.find((x) => x.name === entName) : ents[ents.length - 1];
    return e;
}
export function inner$sentenceToSpec$forEach$fxm(clause) {
    const fxm = /^תיקון\s+ב-?(.+?)\s*:\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(clause) || /^ב-?(.+?)\s+מתקנ(?:ת|ים)?\s+(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(clause);
    return fxm;
}
export function inner$sentenceToSpec$forEach$e_L95(ents, clause) {
    const fxm = /^תיקון\s+ב-?(.+?)\s*:\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(clause) || /^ב-?(.+?)\s+מתקנ(?:ת|ים)?\s+(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(clause);
    const e = ents.find((x) => x.name === fxm[1].trim());
    return e;
}
export function inner$sentenceToSpec$forEach$e_L95$$step(ents, fxm) {
    const e = ents.find((x) => x.name === fxm[1].trim());
    return e;
}
export function inner$sentenceToSpec$forEach$mo(clause) {
    const mo = /^הרגע\s+של\s+(.+?)\s*:\s*(.+)$/.exec(clause);
    return mo;
}
export function inner$sentenceToSpec$forEach$e_L98(ents, clause) {
    const mo = /^הרגע\s+של\s+(.+?)\s*:\s*(.+)$/.exec(clause);
    const e = ents.find((x) => x.name === mo[1].trim());
    return e;
}
export function inner$sentenceToSpec$forEach$e_L98$$step(ents, mo) {
    const e = ents.find((x) => x.name === mo[1].trim());
    return e;
}
export function inner$sentenceToSpec$forEach$sc(clause) {
    const sc = /^(.+?)\s+במסך\s+של\s+(.+)$/.exec(clause);
    return sc;
}
export function inner$sentenceToSpec$forEach$e_L100(ents, clause) {
    const sc = /^(.+?)\s+במסך\s+של\s+(.+)$/.exec(clause);
    const e = ents.find((x) => x.name === sc[1].trim());
    return e;
}
export function inner$sentenceToSpec$forEach$e_L100$$step(ents, sc) {
    const e = ents.find((x) => x.name === sc[1].trim());
    return e;
}
export function inner$sentenceToSpec$forEach$rm(RS, clause) {
    const rm = RS.length ? new RegExp(`^רק\\s+(.+?)\\s+(?:${RS.join('|')})\\s+(.+)$`).exec(clause) : null;
    return rm;
}
export function inner$sentenceToSpec$forEach$rm2(clause) {
    const rm2 = /^תפקיד\s+(.+?)\s*:\s*(.+)$/.exec(clause);
    return rm2;
}
export function inner$sentenceToSpec$forEach$sm(STAGE_RE, clause) {
    const sm = STAGE_RE ? STAGE_RE.exec(clause) : null;
    return sm;
}
export function inner$sentenceToSpec$forEach$before(STAGE_RE, clause) {
    const sm = STAGE_RE ? STAGE_RE.exec(clause) : null;
    const before = clause.slice(0, sm.index).trim();
    return before;
}
export function inner$sentenceToSpec$forEach$before$$step(clause, sm) {
    const before = clause.slice(0, sm.index).trim();
    return before;
}
export function inner$sentenceToSpec$parseClause$ci0(INTRO, clause) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    return ci0;
}
export function inner$sentenceToSpec$parseClause$introOk(MARKS, INTRO, MARK_RE, clause) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    return introOk;
}
export function inner$sentenceToSpec$parseClause$introOk$$step(MARKS, MARK_RE, clause, ci0) {
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    return introOk;
}
export function inner$sentenceToSpec$parseClause$ip(MARKS, INTRO, MARK_RE, clause) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    return ip;
}
export function inner$sentenceToSpec$parseClause$ip$$step(clause, ci0, introOk) {
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    return ip;
}
export function inner$sentenceToSpec$parseClause$isHead(MARKS, INTRO, MARK_RE, clause, ci) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    const isHead = ci === 0 && ip.length === 1;
    return isHead;
}
export function inner$sentenceToSpec$parseClause$isHead$$step(ci, ip) {
    const isHead = ci === 0 && ip.length === 1;
    return isHead;
}
export function inner$sentenceToSpec$parseClause$headStr(MARKS, INTRO, MARK_RE, clause) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    const headStr = ip.length > 1 ? ip[0] : clause.split(MARK_RE)[0];
    return headStr;
}
export function inner$sentenceToSpec$parseClause$headStr$$step(MARK_RE, clause, ip) {
    const headStr = ip.length > 1 ? ip[0] : clause.split(MARK_RE)[0];
    return headStr;
}
export function inner$sentenceToSpec$parseClause$hw(MARKS, INTRO, MARK_RE, clause) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    const headStr = ip.length > 1 ? ip[0] : clause.split(MARK_RE)[0];
    const hw = tokens(headStr);
    return hw;
}
export function inner$sentenceToSpec$parseClause$hw$$step(headStr) {
    const hw = tokens(headStr);
    return hw;
}
export function inner$sentenceToSpec$parseClause$em(EACH_RE, work) {
    const em = EACH_RE ? EACH_RE.exec(work) : null;
    return em;
}
export function inner$sentenceToSpec$parseClause$rest(EACH_RE, work) {
    const em = EACH_RE ? EACH_RE.exec(work) : null;
    const rest = work.slice(em[0].length);
    return rest;
}
export function inner$sentenceToSpec$parseClause$rest$$step(work, em) {
    const rest = work.slice(em[0].length);
    return rest;
}
export function inner$sentenceToSpec$parseClause$seg(MARK_RE, work) {
    const seg = work.split(MARK_RE);
    return seg;
}
export function inner$sentenceToSpec$parseClause$tail(MARK_RE, work) {
    const seg = work.split(MARK_RE);
    let tail = seg.slice(1).join(' ');
    return tail;
}
export function inner$sentenceToSpec$parseClause$tail$$step(seg) {
    let tail = seg.slice(1).join(' ');
    return tail;
}
export function inner$sentenceToSpec$parseClause$headName(MARKS, INTRO, MARK_RE, app, clause, ci, work, head, headItems) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    const isHead = ci === 0 && ip.length === 1;
    const seg = work.split(MARK_RE);
    const headName = isHead && seg.length === 2 ? (headItems.length > 1 ? headItems[headItems.length - 1] : app) : head;
    return headName;
}
export function inner$sentenceToSpec$parseClause$headName$$step(app, isHead, seg, head, headItems) {
    const headName = isHead && seg.length === 2 ? (headItems.length > 1 ? headItems[headItems.length - 1] : app) : head;
    return headName;
}
export function inner$sentenceToSpec$name(f) {
    const name = f.replace(/[\[({=].*$/, '').replace(/\*$/, '');
    return name;
}
export function inner$sentenceToSpec$lines(ents, app, roles) {
    const lines = [`אפליקציה: ${app}`, ...ents.map((e) => `ישות ${e.name} עם ${e.fields.join(', ')}${e.stages && e.stages.length ? ` | שלבים: ${e.stages.join(', ')}` : ''}${e.guards && e.guards.length ? ` | מעברים: ${e.guards.map((g) => g.stage + ': ' + g.cond).join(', ')}` : ''}${e.forbidden && e.forbidden.length ? ` | אסור: ${e.forbidden.join(', ')}` : ''}${e.moment ? ` | הרגע: ${e.moment}` : ''}${e.screens && e.screens.length ? ` | מסך: ${e.screens.join(', ')}` : ''}${e.fix ? ` | תיקון: ${e.fix.who}${e.fix.days ? ' עד ' + e.fix.days + ' ימים' : ''}` : ''}`), ...roles.map((r) => `תפקיד ${r.name}: ${r.ents.join(', ')}`)];
    return lines;
}
export function inner$sentenceToSpec$toField$rhs$$after_loop(LANG, s) {
    const FW = (LANG.extra && LANG.extra.formulaWords) || {};
    const eqi = s.indexOf('=');
    let rhs = s.slice(eqi + 1).trim();
    for (const [w, op] of Object.entries(FW))
        rhs = rhs.replace(new RegExp(`\\s${w}\\s`, 'g'), op);
    return rhs;
}
export function inner$sentenceToSpec$parseClause$out$$after_loop(LEAD, MARKS, INTRO, MARK_RE, DATIVE, clause) {
    const ci0 = clause.search(new RegExp(`[${INTRO.join('')}]`));
    const introOk = ci0 > 0 && !MARK_RE.test(clause.slice(0, ci0) + ' ') && !/[,،]/.test(clause.slice(0, ci0)) && !new RegExp(`\\s(?:${MARKS.join('|')})$`).test(clause.slice(0, ci0));
    const ip = introOk ? [clause.slice(0, ci0), clause.slice(ci0 + 1)] : [clause];
    const headStr = ip.length > 1 ? ip[0] : clause.split(MARK_RE)[0];
    const hw = tokens(headStr);
    const out = [];
    for (let i = 0; i < hw.length; i++) {
        const w = hw[i];
        if (LEAD.has(w))
            continue;
        // «אפליקציה לחנות» ⇒ «חנות»: קידומת-ל נופלת רק אחרי מילת-פיגום שלוקחת ל- (דאטה: dativeAfter)
        if (w.length >= 4 && w[0] === 'ל' && i > 0 && DATIVE.has(hw[i - 1]))
            out.push(w.slice(1));
        else
            out.push(w);
    }
    return out;
}
export function inner$sentenceToSpec$dash$$after_loop(ents) {
    const dash = [];
    for (const e of ents)
        for (const f of e.fields) {
            const name = f.replace(/[\[({=].*$/, '').replace(/\*$/, '');
            if (/\(\d+\.\.\d+\)/.test(f) || /=/.test(f))
                dash.push(`סכום(${e.name}.${name})`);
            if (/\{.*\}/.test(f))
                dash.push(`מונה(${e.name}.${name})`);
        }
    return dash;
}

export const SIGS = {
  inner$sentenceToSpec$PLURAL: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$MARK_RE: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$MARK_RE$$step: [{"name":"MARKS","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$ITEM_RE: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$ITEM_RE$$step: [{"name":"CONJ","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$IMPLIED: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$IMPLIED$$step: [{"name":"LANG","d":{"t":"any"},"opt":false},{"name":"MARKS","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$EACH_RE: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$EACH_RE$$step: [{"name":"EACH","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"IMPLIED","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sentenceToSpec$toField$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$toField$em: [{"name":"ENUM_RE","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$toField$head: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$toField$rest: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$toField$eqi: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$toField$rhs: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$toField$rhs$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"eqi","d":{"t":"num"},"opt":false}],
  inner$sentenceToSpec$toField$name: [{"name":"LEAD","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$addEnt$existing: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$addEnt$key: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$STAGE_WORDS: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$STAGE_RE: [{"name":"LANG","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$STAGE_RE$$step: [{"name":"STAGE_WORDS","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sentenceToSpec$clauses: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$forEach$gm: [{"name":"GP","d":{"t":"any"},"opt":false},{"name":"GO","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sentenceToSpec$forEach$fb: [{"name":"LANG","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$fb$$step: [{"name":"clause","d":{"t":"str"},"opt":false},{"name":"FV","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L89: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"entName","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$forEach$fxm: [{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L95: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L95$$step: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fxm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$sentenceToSpec$forEach$mo: [{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L98: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L98$$step: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"mo","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$sentenceToSpec$forEach$sc: [{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L100: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$e_L100$$step: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sc","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$sentenceToSpec$forEach$rm: [{"name":"RS","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$rm2: [{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$sm: [{"name":"STAGE_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$before: [{"name":"STAGE_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$sentenceToSpec$forEach$before$$step: [{"name":"clause","d":{"t":"str"},"opt":false},{"name":"sm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$sentenceToSpec$parseClause$ci0: [{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$introOk: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$introOk$$step: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false},{"name":"ci0","d":{"t":"num"},"opt":false}],
  inner$sentenceToSpec$parseClause$ip: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$ip$$step: [{"name":"clause","d":{"t":"any"},"opt":false},{"name":"ci0","d":{"t":"num"},"opt":false},{"name":"introOk","d":{"t":"bool"},"opt":false}],
  inner$sentenceToSpec$parseClause$isHead: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$isHead$$step: [{"name":"ci","d":{"t":"any"},"opt":false},{"name":"ip","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sentenceToSpec$parseClause$headStr: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$headStr$$step: [{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false},{"name":"ip","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sentenceToSpec$parseClause$hw: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$hw$$step: [{"name":"headStr","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$em: [{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"work","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$rest: [{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"work","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$rest$$step: [{"name":"work","d":{"t":"any"},"opt":false},{"name":"em","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$sentenceToSpec$parseClause$seg: [{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"work","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$tail: [{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"work","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$tail$$step: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$headName: [{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"app","d":{"t":"str"},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"any"},"opt":false},{"name":"work","d":{"t":"any"},"opt":false},{"name":"head","d":{"t":"any"},"opt":false},{"name":"headItems","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$headName$$step: [{"name":"app","d":{"t":"str"},"opt":false},{"name":"isHead","d":{"t":"bool"},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false},{"name":"head","d":{"t":"any"},"opt":false},{"name":"headItems","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$name: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$lines: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"app","d":{"t":"str"},"opt":false},{"name":"roles","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sentenceToSpec$toField$rhs$$after_loop: [{"name":"LANG","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$parseClause$out$$after_loop: [{"name":"LEAD","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"MARKS","d":{"t":"any"},"opt":false},{"name":"INTRO","d":{"t":"any"},"opt":false},{"name":"MARK_RE","d":{"t":"any"},"opt":false},{"name":"DATIVE","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"clause","d":{"t":"any"},"opt":false}],
  inner$sentenceToSpec$dash$$after_loop: [{"name":"ents","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
