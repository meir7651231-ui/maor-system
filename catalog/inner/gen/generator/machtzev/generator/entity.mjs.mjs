// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/entity.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const alt = (arr) => '(' + arr.join('|') + ')';
const heWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]);
const nameWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿״׳]*|[A-Za-z][A-Za-z0-9_]*/g)].map((m) => m[0]);
const splitFields = (str) => { const out = []; let d = 0, cur = ''; for (const ch of str) {
    if ('({[<'.includes(ch))
        d++;
    else if (')}]>'.includes(ch))
        d = Math.max(0, d - 1);
    if ((ch === ',' || ch === '\n') && d === 0) {
        out.push(cur);
        cur = '';
    }
    else
        cur += ch;
} if (cur.trim())
    out.push(cur); return out; };
export function inner$interpret$markers(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    return markers;
}
export function inner$interpret$main(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    return main;
}
export function inner$interpret$main$$step(text, markers) {
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    return main;
}
export function inner$interpret$forEach$start(m) {
    const start = m.index + m[0].length;
    return start;
}
export function inner$interpret$forEach$end(text, markers, mi) {
    const end = mi + 1 < markers.length ? markers[mi + 1].index : text.length;
    return end;
}
export function inner$interpret$forEach$content(text, markers, m, mi) {
    const start = m.index + m[0].length;
    const end = mi + 1 < markers.length ? markers[mi + 1].index : text.length;
    const content = text.slice(start, end).replace(/^[:\s]+/, '');
    return content;
}
export function inner$interpret$forEach$content$$step(text, start, end) {
    const content = text.slice(start, end).replace(/^[:\s]+/, '');
    return content;
}
export function inner$interpret$body(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    const body = main.replace(new RegExp('^\\s*' + alt(G.createVerbs) + '?\\s*' + alt(G.entityNouns) + '\\s+'), '');
    return body;
}
export function inner$interpret$body$$step(G, main) {
    const body = main.replace(new RegExp('^\\s*' + alt(G.createVerbs) + '?\\s*' + alt(G.entityNouns) + '\\s+'), '');
    return body;
}
export function inner$interpret$nameSplit(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    const body = main.replace(new RegExp('^\\s*' + alt(G.createVerbs) + '?\\s*' + alt(G.entityNouns) + '\\s+'), '');
    const nameSplit = body.match(new RegExp('\\s+' + G.withWord + '\\s+|\\s+' + G.fieldsWord + '[:\\s]+|\\s*:\\s*'));
    return nameSplit;
}
export function inner$interpret$nameSplit$$step(G, body) {
    const nameSplit = body.match(new RegExp('\\s+' + G.withWord + '\\s+|\\s+' + G.fieldsWord + '[:\\s]+|\\s*:\\s*'));
    return nameSplit;
}
export function inner$interpret$namePart(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    const body = main.replace(new RegExp('^\\s*' + alt(G.createVerbs) + '?\\s*' + alt(G.entityNouns) + '\\s+'), '');
    const nameSplit = body.match(new RegExp('\\s+' + G.withWord + '\\s+|\\s+' + G.fieldsWord + '[:\\s]+|\\s*:\\s*'));
    const namePart = nameSplit ? body.slice(0, nameSplit.index) : body;
    return namePart;
}
export function inner$interpret$namePart$$step(body, nameSplit) {
    const namePart = nameSplit ? body.slice(0, nameSplit.index) : body;
    return namePart;
}
export function inner$interpret$fieldsPart(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    const body = main.replace(new RegExp('^\\s*' + alt(G.createVerbs) + '?\\s*' + alt(G.entityNouns) + '\\s+'), '');
    const nameSplit = body.match(new RegExp('\\s+' + G.withWord + '\\s+|\\s+' + G.fieldsWord + '[:\\s]+|\\s*:\\s*'));
    const fieldsPart = nameSplit ? body.slice(nameSplit.index + nameSplit[0].length) : '';
    return fieldsPart;
}
export function inner$interpret$fieldsPart$$step(body, nameSplit) {
    const fieldsPart = nameSplit ? body.slice(nameSplit.index + nameSplit[0].length) : '';
    return fieldsPart;
}
export function inner$interpret$rawFields(G, text) {
    const markers = [...text.matchAll(new RegExp('\\|\\s*' + alt(G.sectionMarkers), 'g'))];
    const main = markers.length ? text.slice(0, markers[0].index) : text;
    const body = main.replace(new RegExp('^\\s*' + alt(G.createVerbs) + '?\\s*' + alt(G.entityNouns) + '\\s+'), '');
    const nameSplit = body.match(new RegExp('\\s+' + G.withWord + '\\s+|\\s+' + G.fieldsWord + '[:\\s]+|\\s*:\\s*'));
    const fieldsPart = nameSplit ? body.slice(nameSplit.index + nameSplit[0].length) : '';
    const rawFields = splitFields(fieldsPart).map((s) => s.trim()).filter(Boolean).slice(0, 200);
    return rawFields;
}
export function inner$interpret$rawFields$$step(fieldsPart) {
    const rawFields = splitFields(fieldsPart).map((s) => s.trim()).filter(Boolean).slice(0, 200);
    return rawFields;
}
export function inner$interpret$tp(f) {
    const tp = f.match(/~\/(.*)\//);
    return tp;
}
export function inner$interpret$eq(f) {
    const eq = f.indexOf('=');
    return eq;
}
export function inner$interpret$dm(f) {
    const dm = f.match(/\[([^\]]*)\]/);
    return dm;
}
export function inner$interpret$rp(f) {
    const rp = f.match(/\(\s*(-?\d+(?:\.\d+)?)?\s*(?:\.\.|-)\s*(-?\d+(?:\.\d+)?)?\s*\)/);
    return rp;
}
export function inner$interpret$pm(f) {
    const pm = f.match(/\(([^)]*)\)/);
    return pm;
}
export function inner$interpret$em(f) {
    const em = f.match(/\{([^}]*)\}/);
    return em;
}
export function inner$interpret$fields(annots) {
    const fields = annots.map((a) => a.label);
    return fields;
}
export function inner$interpret$stages(G, stagesPart) {
    const stages = stagesPart
        ? stagesPart.replace(new RegExp('^\\s*' + alt(G.stagePrefixes) + '[:\\s]*'), '').split(/[,\n]|\s*→\s*/).map((s) => nameWords(s).join(' ').trim()).filter((s) => s.length > 1).slice(0, 30)
        : [];
    return stages;
}
export function inner$interpret$lines(entity) {
    const lines = [`הירו 🗂️ ${entity} | ישות מורכבת — טופס + טבלה`];
    return lines;
}
export function inner$interpret$vrules(rulesPart) {
    const vrules = rulesPart ? rulesPart.split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 2) : [];
    return vrules;
}
export function inner$interpret$map$m(e) {
    const m = e.match(/^(.+?)\s*=\s*(.+)$/);
    return m;
}
export function inner$interpret$map$pk(e) {
    const m = e.match(/^(.+?)\s*=\s*(.+)$/);
    const pk = m[2].trim();
    return pk;
}
export function inner$interpret$map$pk$$step(m) {
    const pk = m[2].trim();
    return pk;
}
export function inner$interpret$guards(guardsPart) {
    const guards = guardsPart
        ? guardsPart.split(/[,\n]/).map((e) => { const m = e.match(/^(.+?)\s*:\s*(.+)$/); return m ? { stage: heWords(m[1]).join(' ').trim(), cond: m[2].trim() } : null; }).filter((g) => g && g.stage.length > 1 && g.cond.length > 1)
        : [];
    return guards;
}
export function inner$interpret$map$m_L158(e) {
    const m = e.match(/^(.+?)\s*:\s*(.+)$/);
    return m;
}

export const SIGS = {
  inner$interpret$markers: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$main: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$main$$step: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"markers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$interpret$forEach$start: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$interpret$forEach$end: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"markers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"mi","d":{"t":"num"},"opt":false}],
  inner$interpret$forEach$content: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"markers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"mi","d":{"t":"num"},"opt":false}],
  inner$interpret$forEach$content$$step: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"any"},"opt":false}],
  inner$interpret$body: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$body$$step: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"main","d":{"t":"any"},"opt":false}],
  inner$interpret$nameSplit: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$nameSplit$$step: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$interpret$namePart: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$namePart$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"nameSplit","d":{"t":"any"},"opt":false}],
  inner$interpret$fieldsPart: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$fieldsPart$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"nameSplit","d":{"t":"any"},"opt":false}],
  inner$interpret$rawFields: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$rawFields$$step: [{"name":"fieldsPart","d":{"t":"any"},"opt":false}],
  inner$interpret$tp: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$interpret$eq: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$interpret$dm: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$interpret$rp: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$interpret$pm: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$interpret$em: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$interpret$fields: [{"name":"annots","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$interpret$stages: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"stagesPart","d":{"t":"str"},"opt":false}],
  inner$interpret$lines: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$interpret$vrules: [{"name":"rulesPart","d":{"t":"str"},"opt":false}],
  inner$interpret$map$m: [{"name":"e","d":{"t":"str"},"opt":false}],
  inner$interpret$map$pk: [{"name":"e","d":{"t":"str"},"opt":false}],
  inner$interpret$map$pk$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$interpret$guards: [{"name":"guardsPart","d":{"t":"str"},"opt":false}],
  inner$interpret$map$m_L158: [{"name":"e","d":{"t":"str"},"opt":false}],
};
