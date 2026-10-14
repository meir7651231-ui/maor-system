// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/spec.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const FIELD_RE = /^(.*?)(\*)?(?:\((-?\d+)\.\.(-?\d+)\))?(?:\{([^}]*)\})?(?:\[([^\]]+)\])?(\*)?$/;
function parseField(raw) {
    let s = raw.trim();
    // שדה=נוסחה (חשבון על שדות אחרים באותה רשומה)
    const eq = s.indexOf('=');
    if (eq > 0) {
        const name = s.slice(0, eq).trim();
        const formula = s.slice(eq + 1).replace(/\*$/, '').trim();
        return { name, required: false, shape: 'formula', formula };
    }
    const m = FIELD_RE.exec(s);
    const f = { name: (m[1] || s).trim(), required: Boolean(m[2] || m[7]), shape: 'text' };
    if (m[3] !== undefined) {
        f.shape = 'number';
        f.min = Number(m[3]);
        f.max = Number(m[4]);
    }
    else if (m[5] !== undefined) {
        f.shape = 'enum';
        f.values = m[5].split('|').map((v) => v.trim()).filter(Boolean);
    }
    else if (m[6] === 'תאריך')
        f.shape = 'date';
    else if (m[6] === 'טלפון')
        f.shape = 'phone';
    else if (m[6] === 'מזהה')
        f.shape = 'id';
    else if (m[6] === 'כמות') {
        f.shape = 'count';
    }
    else if (m[6])
        throw new Error(`סמן-צורה לא מוכר: [${m[6]}] בשדה «${f.name}»`);
    return f;
}
export function inner$parseField$s(raw) {
    let s = raw.trim();
    return s;
}
export function inner$parseField$eq(raw) {
    let s = raw.trim();
    const eq = s.indexOf('=');
    return eq;
}
export function inner$parseField$eq$$step(s) {
    const eq = s.indexOf('=');
    return eq;
}
export function inner$parseField$name(raw) {
    let s = raw.trim();
    const eq = s.indexOf('=');
    const name = s.slice(0, eq).trim();
    return name;
}
export function inner$parseField$name$$step(s, eq) {
    const name = s.slice(0, eq).trim();
    return name;
}
export function inner$parseField$formula(raw) {
    let s = raw.trim();
    const eq = s.indexOf('=');
    const formula = s.slice(eq + 1).replace(/\*$/, '').trim();
    return formula;
}
export function inner$parseField$formula$$step(s, eq) {
    const formula = s.slice(eq + 1).replace(/\*$/, '').trim();
    return formula;
}
export function inner$parseField$m(raw) {
    let s = raw.trim();
    const m = FIELD_RE.exec(s);
    return m;
}
export function inner$parseField$m$$step(s) {
    const m = FIELD_RE.exec(s);
    return m;
}
export function inner$parseField$f(raw) {
    let s = raw.trim();
    const m = FIELD_RE.exec(s);
    const f = { name: (m[1] || s).trim(), required: Boolean(m[2] || m[7]), shape: 'text' };
    return f;
}
export function inner$parseField$f$$step(s, m) {
    const f = { name: (m[1] || s).trim(), required: Boolean(m[2] || m[7]), shape: 'text' };
    return f;
}
export function inner$parseSpec$line(raw) {
    const line = raw.trim();
    return line;
}
export function inner$parseSpec$fieldsPart(parts) {
    const [fieldsPart, ...sections] = parts.map((x) => x.trim());
    return fieldsPart;
}
export function inner$parseSpec$sections(parts) {
    const [fieldsPart, ...sections] = parts.map((x) => x.trim());
    return sections;
}
export function inner$parseSpec$ent(m, parts) {
    const [fieldsPart, ...sections] = parts.map((x) => x.trim());
    const ent = { name: m[1].trim(), fields: fieldsPart.split(',').map(parseField), stages: [], guards: [], forbidden: [], moment: '', screens: [], fix: null };
    return ent;
}
export function inner$parseSpec$ent$$step(m, fieldsPart) {
    const ent = { name: m[1].trim(), fields: fieldsPart.split(',').map(parseField), stages: [], guards: [], forbidden: [], moment: '', screens: [], fix: null };
    return ent;
}
export function inner$parseSpec$sm(sec) {
    const sm = /^שלבים\s*:?\s*(.+)$/.exec(sec);
    return sm;
}
export function inner$parseSpec$gm(sec) {
    const gm = /^מעברים\s*:?\s*(.+)$/.exec(sec);
    return gm;
}
export function inner$parseSpec$fm(sec) {
    const fm = /^אסור\s*:?\s*(.+)$/.exec(sec);
    return fm;
}
export function inner$parseSpec$mm(sec) {
    const mm = /^הרגע\s*:?\s*(.+)$/.exec(sec);
    return mm;
}
export function inner$parseSpec$scm(sec) {
    const scm = /^מסך\s*:?\s*(.+)$/.exec(sec);
    return scm;
}
export function inner$parseSpec$fx(sec) {
    const fx = /^תיקון\s*:?\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(sec);
    return fx;
}
export function inner$parseSpec$map$k(x) {
    const k = /^(.+?)\s*:\s*(.+)$/.exec(x.trim());
    return k;
}
export function inner$parseSpec$w(part) {
    const w = /^\s*(\S+?)\((.+?)\.(.+?)\)\s*$/.exec(part);
    return w;
}
export function inner$parseSpec$t(text, e, f) {
    const spec = { app: '', entities: [], dashboard: [], roles: [], lines: [] };
    for (const raw of text.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#'))
            continue;
        spec.lines.push(line);
        let m;
        if ((m = /^אפליקציה:\s*(.+)$/.exec(line)))
            spec.app = m[1].trim();
        else if ((m = /^תפקיד\s+(.+?)\s*:\s*(.+)$/.exec(line)))
            spec.roles.push({ name: m[1].trim(), all: /הכל/.test(m[2]), ents: m[2].split(/[,،]/).map((x) => x.trim()).filter((x) => x && x !== 'הכל') });
        else if ((m = /^ישות\s+(.+?)\s+עם\s+(.+)$/.exec(line))) {
            // «|» מפריד קטעים רק מחוץ לסוגריים-מסולסלים (בתוך {א|ב} הוא מפריד-ערכים)
            const parts = [];
            let d = 0, cur = '';
            for (const ch of m[2]) {
                if (ch === '{')
                    d++;
                else if (ch === '}')
                    d = Math.max(0, d - 1);
                if (ch === '|' && d === 0) {
                    parts.push(cur);
                    cur = '';
                }
                else
                    cur += ch;
            }
            parts.push(cur);
            const [fieldsPart, ...sections] = parts.map((x) => x.trim());
            const ent = { name: m[1].trim(), fields: fieldsPart.split(',').map(parseField), stages: [], guards: [], forbidden: [], moment: '', screens: [], fix: null };
            for (const sec of sections) {
                const sm = /^שלבים\s*:?\s*(.+)$/.exec(sec);
                const gm = /^מעברים\s*:?\s*(.+)$/.exec(sec);
                const fm = /^אסור\s*:?\s*(.+)$/.exec(sec), mm = /^הרגע\s*:?\s*(.+)$/.exec(sec), scm = /^מסך\s*:?\s*(.+)$/.exec(sec);
                const fx = /^תיקון\s*:?\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(sec);
                if (fx) {
                    ent.fix = { who: fx[1].trim(), days: fx[2] ? Number(fx[2]) : null };
                    continue;
                }
                if (sm)
                    ent.stages = sm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (fm)
                    ent.forbidden = fm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (mm)
                    ent.moment = mm[1].trim();
                else if (scm)
                    ent.screens = scm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (gm)
                    ent.guards = gm[1].split(',').map((x) => { const k = /^(.+?)\s*:\s*(.+)$/.exec(x.trim()); return k ? { stage: k[1].trim(), cond: k[2].trim() } : null; }).filter(Boolean);
                else
                    throw new Error(`קטע לא מוכר אחרי «|» בישות «${ent.name}»: «${sec}» — כאן מובן: שלבים · מעברים · אסור · הרגע · מסך · תיקון`);
            }
            spec.entities.push(ent);
        }
        else if ((m = /^לוח בקרה עם\s+(.+)$/.exec(line))) {
            for (const part of m[1].split(',')) {
                const w = /^\s*(\S+?)\((.+?)\.(.+?)\)\s*$/.exec(part);
                if (!w)
                    throw new Error(`פריט לוח-בקרה לא מובן: «${part.trim()}» — הצורה: פעולה(ישות.שדה)`);
                spec.dashboard.push({ op: w[1], entity: w[2].trim(), field: w[3].trim() });
            }
        }
        else
            throw new Error(`שורת-ספק לא מובנת: «${line}»`);
    }
    const t = spec.entities.find((x) => x !== e && x.name === f.name);
    return t;
}
export function inner$parseSpec$t$$step(spec, e, f) {
    const t = spec.entities.find((x) => x !== e && x.name === f.name);
    return t;
}
export function inner$parseSpec$e(text, d) {
    const spec = { app: '', entities: [], dashboard: [], roles: [], lines: [] };
    for (const raw of text.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#'))
            continue;
        spec.lines.push(line);
        let m;
        if ((m = /^אפליקציה:\s*(.+)$/.exec(line)))
            spec.app = m[1].trim();
        else if ((m = /^תפקיד\s+(.+?)\s*:\s*(.+)$/.exec(line)))
            spec.roles.push({ name: m[1].trim(), all: /הכל/.test(m[2]), ents: m[2].split(/[,،]/).map((x) => x.trim()).filter((x) => x && x !== 'הכל') });
        else if ((m = /^ישות\s+(.+?)\s+עם\s+(.+)$/.exec(line))) {
            // «|» מפריד קטעים רק מחוץ לסוגריים-מסולסלים (בתוך {א|ב} הוא מפריד-ערכים)
            const parts = [];
            let d = 0, cur = '';
            for (const ch of m[2]) {
                if (ch === '{')
                    d++;
                else if (ch === '}')
                    d = Math.max(0, d - 1);
                if (ch === '|' && d === 0) {
                    parts.push(cur);
                    cur = '';
                }
                else
                    cur += ch;
            }
            parts.push(cur);
            const [fieldsPart, ...sections] = parts.map((x) => x.trim());
            const ent = { name: m[1].trim(), fields: fieldsPart.split(',').map(parseField), stages: [], guards: [], forbidden: [], moment: '', screens: [], fix: null };
            for (const sec of sections) {
                const sm = /^שלבים\s*:?\s*(.+)$/.exec(sec);
                const gm = /^מעברים\s*:?\s*(.+)$/.exec(sec);
                const fm = /^אסור\s*:?\s*(.+)$/.exec(sec), mm = /^הרגע\s*:?\s*(.+)$/.exec(sec), scm = /^מסך\s*:?\s*(.+)$/.exec(sec);
                const fx = /^תיקון\s*:?\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(sec);
                if (fx) {
                    ent.fix = { who: fx[1].trim(), days: fx[2] ? Number(fx[2]) : null };
                    continue;
                }
                if (sm)
                    ent.stages = sm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (fm)
                    ent.forbidden = fm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (mm)
                    ent.moment = mm[1].trim();
                else if (scm)
                    ent.screens = scm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (gm)
                    ent.guards = gm[1].split(',').map((x) => { const k = /^(.+?)\s*:\s*(.+)$/.exec(x.trim()); return k ? { stage: k[1].trim(), cond: k[2].trim() } : null; }).filter(Boolean);
                else
                    throw new Error(`קטע לא מוכר אחרי «|» בישות «${ent.name}»: «${sec}» — כאן מובן: שלבים · מעברים · אסור · הרגע · מסך · תיקון`);
            }
            spec.entities.push(ent);
        }
        else if ((m = /^לוח בקרה עם\s+(.+)$/.exec(line))) {
            for (const part of m[1].split(',')) {
                const w = /^\s*(\S+?)\((.+?)\.(.+?)\)\s*$/.exec(part);
                if (!w)
                    throw new Error(`פריט לוח-בקרה לא מובן: «${part.trim()}» — הצורה: פעולה(ישות.שדה)`);
                spec.dashboard.push({ op: w[1], entity: w[2].trim(), field: w[3].trim() });
            }
        }
        else
            throw new Error(`שורת-ספק לא מובנת: «${line}»`);
    }
    const e = spec.entities.find((x) => x.name === d.entity);
    return e;
}
export function inner$parseSpec$e$$step(spec, d) {
    const e = spec.entities.find((x) => x.name === d.entity);
    return e;
}
export function inner$parseSpec$spec$$after_loop(text) {
    const spec = { app: '', entities: [], dashboard: [], roles: [], lines: [] };
    for (const raw of text.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#'))
            continue;
        spec.lines.push(line);
        let m;
        if ((m = /^אפליקציה:\s*(.+)$/.exec(line)))
            spec.app = m[1].trim();
        else if ((m = /^תפקיד\s+(.+?)\s*:\s*(.+)$/.exec(line)))
            spec.roles.push({ name: m[1].trim(), all: /הכל/.test(m[2]), ents: m[2].split(/[,،]/).map((x) => x.trim()).filter((x) => x && x !== 'הכל') });
        else if ((m = /^ישות\s+(.+?)\s+עם\s+(.+)$/.exec(line))) {
            // «|» מפריד קטעים רק מחוץ לסוגריים-מסולסלים (בתוך {א|ב} הוא מפריד-ערכים)
            const parts = [];
            let d = 0, cur = '';
            for (const ch of m[2]) {
                if (ch === '{')
                    d++;
                else if (ch === '}')
                    d = Math.max(0, d - 1);
                if (ch === '|' && d === 0) {
                    parts.push(cur);
                    cur = '';
                }
                else
                    cur += ch;
            }
            parts.push(cur);
            const [fieldsPart, ...sections] = parts.map((x) => x.trim());
            const ent = { name: m[1].trim(), fields: fieldsPart.split(',').map(parseField), stages: [], guards: [], forbidden: [], moment: '', screens: [], fix: null };
            for (const sec of sections) {
                const sm = /^שלבים\s*:?\s*(.+)$/.exec(sec);
                const gm = /^מעברים\s*:?\s*(.+)$/.exec(sec);
                const fm = /^אסור\s*:?\s*(.+)$/.exec(sec), mm = /^הרגע\s*:?\s*(.+)$/.exec(sec), scm = /^מסך\s*:?\s*(.+)$/.exec(sec);
                const fx = /^תיקון\s*:?\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(sec);
                if (fx) {
                    ent.fix = { who: fx[1].trim(), days: fx[2] ? Number(fx[2]) : null };
                    continue;
                }
                if (sm)
                    ent.stages = sm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (fm)
                    ent.forbidden = fm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (mm)
                    ent.moment = mm[1].trim();
                else if (scm)
                    ent.screens = scm[1].split(',').map((x) => x.trim()).filter(Boolean);
                else if (gm)
                    ent.guards = gm[1].split(',').map((x) => { const k = /^(.+?)\s*:\s*(.+)$/.exec(x.trim()); return k ? { stage: k[1].trim(), cond: k[2].trim() } : null; }).filter(Boolean);
                else
                    throw new Error(`קטע לא מוכר אחרי «|» בישות «${ent.name}»: «${sec}» — כאן מובן: שלבים · מעברים · אסור · הרגע · מסך · תיקון`);
            }
            spec.entities.push(ent);
        }
        else if ((m = /^לוח בקרה עם\s+(.+)$/.exec(line))) {
            for (const part of m[1].split(',')) {
                const w = /^\s*(\S+?)\((.+?)\.(.+?)\)\s*$/.exec(part);
                if (!w)
                    throw new Error(`פריט לוח-בקרה לא מובן: «${part.trim()}» — הצורה: פעולה(ישות.שדה)`);
                spec.dashboard.push({ op: w[1], entity: w[2].trim(), field: w[3].trim() });
            }
        }
        else
            throw new Error(`שורת-ספק לא מובנת: «${line}»`);
    }
    return spec;
}
export function inner$parseSpec$ent$$after_loop(m, parts) {
    const [fieldsPart, ...sections] = parts.map((x) => x.trim());
    const ent = { name: m[1].trim(), fields: fieldsPart.split(',').map(parseField), stages: [], guards: [], forbidden: [], moment: '', screens: [], fix: null };
    for (const sec of sections) {
        const sm = /^שלבים\s*:?\s*(.+)$/.exec(sec);
        const gm = /^מעברים\s*:?\s*(.+)$/.exec(sec);
        const fm = /^אסור\s*:?\s*(.+)$/.exec(sec), mm = /^הרגע\s*:?\s*(.+)$/.exec(sec), scm = /^מסך\s*:?\s*(.+)$/.exec(sec);
        const fx = /^תיקון\s*:?\s*(.+?)(?:\s+עד\s+(\d+)\s*ימים?)?$/.exec(sec);
        if (fx) {
            ent.fix = { who: fx[1].trim(), days: fx[2] ? Number(fx[2]) : null };
            continue;
        }
        if (sm)
            ent.stages = sm[1].split(',').map((x) => x.trim()).filter(Boolean);
        else if (fm)
            ent.forbidden = fm[1].split(',').map((x) => x.trim()).filter(Boolean);
        else if (mm)
            ent.moment = mm[1].trim();
        else if (scm)
            ent.screens = scm[1].split(',').map((x) => x.trim()).filter(Boolean);
        else if (gm)
            ent.guards = gm[1].split(',').map((x) => { const k = /^(.+?)\s*:\s*(.+)$/.exec(x.trim()); return k ? { stage: k[1].trim(), cond: k[2].trim() } : null; }).filter(Boolean);
        else
            throw new Error(`קטע לא מוכר אחרי «|» בישות «${ent.name}»: «${sec}» — כאן מובן: שלבים · מעברים · אסור · הרגע · מסך · תיקון`);
    }
    return ent;
}

export const SIGS = {
  inner$parseField$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseField$eq: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseField$eq$$step: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$parseField$name: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseField$name$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"eq","d":{"t":"any"},"opt":false}],
  inner$parseField$formula: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseField$formula$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"eq","d":{"t":"num"},"opt":false}],
  inner$parseField$m: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseField$m$$step: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$parseField$f: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseField$f$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$parseSpec$line: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseSpec$fieldsPart: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$parseSpec$sections: [{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$parseSpec$ent: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$parseSpec$ent$$step: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"fieldsPart","d":{"t":"str"},"opt":false}],
  inner$parseSpec$sm: [{"name":"sec","d":{"t":"str"},"opt":false}],
  inner$parseSpec$gm: [{"name":"sec","d":{"t":"str"},"opt":false}],
  inner$parseSpec$fm: [{"name":"sec","d":{"t":"str"},"opt":false}],
  inner$parseSpec$mm: [{"name":"sec","d":{"t":"str"},"opt":false}],
  inner$parseSpec$scm: [{"name":"sec","d":{"t":"str"},"opt":false}],
  inner$parseSpec$fx: [{"name":"sec","d":{"t":"str"},"opt":false}],
  inner$parseSpec$map$k: [{"name":"x","d":{"t":"str"},"opt":false}],
  inner$parseSpec$w: [{"name":"part","d":{"t":"str"},"opt":false}],
  inner$parseSpec$t: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"undef"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$parseSpec$t$$step: [{"name":"spec","d":{"t":"obj","p":[["app",{"t":"str"},false],["entities",{"t":"arr","of":{"t":"undef"}},false],["dashboard",{"t":"arr","of":{"t":"undef"}},false],["roles",{"t":"arr","of":{"t":"undef"}},false],["lines",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"e","d":{"t":"undef"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$parseSpec$e: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"undef"},"opt":false}],
  inner$parseSpec$e$$step: [{"name":"spec","d":{"t":"obj","p":[["app",{"t":"str"},false],["entities",{"t":"arr","of":{"t":"undef"}},false],["dashboard",{"t":"arr","of":{"t":"undef"}},false],["roles",{"t":"arr","of":{"t":"undef"}},false],["lines",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"d","d":{"t":"undef"},"opt":false}],
  inner$parseSpec$spec$$after_loop: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseSpec$ent$$after_loop: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"parts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
