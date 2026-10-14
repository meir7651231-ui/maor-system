// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/gen-data-dart.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function camel(name) {
    return name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function dartStr(s) {
    let out = "'";
    for (const ch of s) {
        const c = ch.codePointAt(0);
        if (ch === '\\')
            out += '\\\\';
        else if (ch === "'")
            out += "\\'";
        else if (ch === '$')
            out += '\\$';
        else if (c === 0x0a)
            out += '\\n';
        else if (c === 0x0d)
            out += '\\r';
        else if (c === 0x09)
            out += '\\t';
        else if (c < 0x20)
            out += '\\u{' + c.toString(16) + '}';
        else
            out += ch; // עברית/יוניקוד — UTF-8 גולמי, כמו במקור
    }
    return out + "'";
}
function dartLit(v, indent) {
    const pad = '  '.repeat(indent);
    const pad1 = '  '.repeat(indent + 1);
    if (v === null)
        return 'null';
    const t = typeof v;
    if (t === 'string')
        return dartStr(v);
    if (t === 'boolean')
        return v ? 'true' : 'false';
    if (t === 'number') {
        if (!Number.isFinite(v))
            throw new Error('לא-סריאליזבל: ' + v);
        // ‏String(v) = shortest-round-trip של JS; Dart מפרסר לאותו double.
        // שלם ⇒ ליטרל-int; אחרת ⇒ ליטרל-double כלשונו.
        return Number.isInteger(v) ? String(v) : String(v);
    }
    if (t === 'bigint' || t === 'symbol' || t === 'undefined' || t === 'function') {
        throw new Error('לא-סריאליזבל: ' + t);
    }
    if (Array.isArray(v)) {
        if (v.length === 0)
            return 'const []';
        const items = v.map((x) => pad1 + dartLit(x, indent + 1)).join(',\n');
        return 'const [\n' + items + ',\n' + pad + ']';
    }
    // אובייקט-רגיל ⇒ Map בסדר-הכנסה (LinkedHashMap ≡ סדר-מפתחות-JS)
    const keys = Object.keys(v);
    if (keys.length === 0)
        return 'const <String, dynamic>{}';
    const entries = keys.map((k) => pad1 + dartStr(k) + ': ' + dartLit(v[k], indent + 1)).join(',\n');
    return 'const {\n' + entries + ',\n' + pad + '}';
}
export function inner$dartStr$c(ch) {
    const c = ch.codePointAt(0);
    return c;
}
export function inner$dartLit$pad(indent) {
    const pad = '  '.repeat(indent);
    return pad;
}
export function inner$dartLit$pad1(indent) {
    const pad1 = '  '.repeat(indent + 1);
    return pad1;
}
export function inner$dartLit$items(v, indent) {
    const pad1 = '  '.repeat(indent + 1);
    const items = v.map((x) => pad1 + dartLit(x, indent + 1)).join(',\n');
    return items;
}
export function inner$dartLit$items$$step(v, indent, pad1) {
    const items = v.map((x) => pad1 + dartLit(x, indent + 1)).join(',\n');
    return items;
}
export function inner$dartLit$keys(v) {
    const keys = Object.keys(v);
    return keys;
}
export function inner$dartLit$entries(v, indent) {
    const pad1 = '  '.repeat(indent + 1);
    const keys = Object.keys(v);
    const entries = keys.map((k) => pad1 + dartStr(k) + ': ' + dartLit(v[k], indent + 1)).join(',\n');
    return entries;
}
export function inner$dartLit$entries$$step(v, indent, pad1, keys) {
    const entries = keys.map((k) => pad1 + dartStr(k) + ': ' + dartLit(v[k], indent + 1)).join(',\n');
    return entries;
}
export function inner$dartType$el(v) {
    const el = v.every((x) => typeof x === 'string') ? 'String'
        : v.every((x) => typeof x === 'number' && Number.isInteger(x)) ? 'int'
            : v.every((x) => Array.isArray(x)) ? 'List<dynamic>'
                : 'dynamic';
    return el;
}
export function inner$dartType$vals(v) {
    const vals = Object.values(v);
    return vals;
}
export function inner$dartType$vt(v) {
    const vals = Object.values(v);
    const vt = vals.every((x) => typeof x === 'string') ? 'String' : 'dynamic';
    return vt;
}
export function inner$dartType$vt$$step(vals) {
    const vt = vals.every((x) => typeof x === 'string') ? 'String' : 'dynamic';
    return vt;
}
export function inner$convert$src(REPO, name) {
    const src = REPO + 'new/atoms/' + name + '.mjs';
    return src;
}
export function inner$convert$exps(mod) {
    const exps = Object.entries(mod).filter(([k]) => k !== 'default');
    return exps;
}
export function inner$convert$g(k) {
    const g = camel(k.toLowerCase() === k ? k : k.toLowerCase());
    return g;
}
export function inner$convert$gname(k) {
    const gname = camel(k.replace(/_/g, '-').toLowerCase());
    return gname;
}
export function inner$convert$dartDoc(name, getters) {
    const dartDoc = '// ⚛️ אטום-Dart-דאטה (דרגת-חוזה) · ' + name + ' — קודם מכנית ע"י gen-data-dart.mjs.\n' +
        '// מקור: new/atoms/' + name + '.mjs (אטום-קבוע, צילום-ערך). טוהר: getter top-level,\n' +
        '// אפס import (רק dart:core). חוק-4 — ערך זהה-ביט למקור-ה-JS.\n' +
        '// ההמרה: ‏JS-const ⇒ ‏Dart-const (ליטרל שומר-סדר, LinkedHashMap≡סדר-מפתחות-JS).\n\n' +
        getters.join('\n\n') + '\n';
    return dartDoc;
}
export function inner$convert$importLine(name, testAsserts) {
    const importLine = testAsserts.length ? "import 'dart:convert';\nimport '" + name + ".dart';\n" : '';
    return importLine;
}
export function inner$convert$body(testAsserts) {
    const body = testAsserts.map((a, i) => "  // ‏" + (i + 1) + ") צילום-ערך: jsonEncode ≡ JSON.stringify של המקור (זהה-ביט).\n" +
        '  if (jsonEncode(' + a.gname + ') != ' + dartStr(a.json) + ') {\n' +
        "    throw StateError('FAIL " + a.gname + ": צילום-הערך סטה');\n" +
        '  }').join('\n');
    return body;
}
export function inner$convert$dartTest(name, testAsserts) {
    const importLine = testAsserts.length ? "import 'dart:convert';\nimport '" + name + ".dart';\n" : '';
    const body = testAsserts.map((a, i) => "  // ‏" + (i + 1) + ") צילום-ערך: jsonEncode ≡ JSON.stringify של המקור (זהה-ביט).\n" +
        '  if (jsonEncode(' + a.gname + ') != ' + dartStr(a.json) + ') {\n' +
        "    throw StateError('FAIL " + a.gname + ": צילום-הערך סטה');\n" +
        '  }').join('\n');
    const dartTest = '// בדיקת-חוזה (רתמת-זהב) · ' + name + ' — צילום-ערך jsonEncode≡JSON.stringify.\n' +
        '// חוללה מכנית (gen-data-dart). הרצה: dart run --enable-asserts ⇒ OK\n' +
        importLine + '\nvoid main() {\n' + body + '\n  print(' +
        dartStr('OK ' + name + ': ' + testAsserts.length + ' data-snapshot(s) passed') + ');\n}\n';
    return dartTest;
}
export function inner$convert$dartTest$$step(name, testAsserts, importLine, body) {
    const dartTest = '// בדיקת-חוזה (רתמת-זהב) · ' + name + ' — צילום-ערך jsonEncode≡JSON.stringify.\n' +
        '// חוללה מכנית (gen-data-dart). הרצה: dart run --enable-asserts ⇒ OK\n' +
        importLine + '\nvoid main() {\n' + body + '\n  print(' +
        dartStr('OK ' + name + ': ' + testAsserts.length + ' data-snapshot(s) passed') + ');\n}\n';
    return dartTest;
}
export function inner$dartStr$out$$after_loop(s) {
    let out = "'";
    for (const ch of s) {
        const c = ch.codePointAt(0);
        if (ch === '\\')
            out += '\\\\';
        else if (ch === "'")
            out += "\\'";
        else if (ch === '$')
            out += '\\$';
        else if (c === 0x0a)
            out += '\\n';
        else if (c === 0x0d)
            out += '\\r';
        else if (c === 0x09)
            out += '\\t';
        else if (c < 0x20)
            out += '\\u{' + c.toString(16) + '}';
        else
            out += ch; // עברית/יוניקוד — UTF-8 גולמי, כמו במקור
    }
    return out;
}

export const SIGS = {
  inner$dartStr$c: [{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$dartLit$pad: [{"name":"indent","d":{"t":"any"},"opt":false}],
  inner$dartLit$pad1: [{"name":"indent","d":{"t":"num"},"opt":false}],
  inner$dartLit$items: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"indent","d":{"t":"num"},"opt":false}],
  inner$dartLit$items$$step: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"indent","d":{"t":"num"},"opt":false},{"name":"pad1","d":{"t":"str"},"opt":false}],
  inner$dartLit$keys: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartLit$entries: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"indent","d":{"t":"num"},"opt":false}],
  inner$dartLit$entries$$step: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"indent","d":{"t":"num"},"opt":false},{"name":"pad1","d":{"t":"str"},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$dartType$el: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$vals: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$vt: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$vt$$step: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$convert$src: [{"name":"REPO","d":{"t":"str"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$convert$exps: [{"name":"mod","d":{"t":"any"},"opt":false}],
  inner$convert$g: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$convert$gname: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$convert$dartDoc: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"getters","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$convert$importLine: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"testAsserts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$convert$body: [{"name":"testAsserts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$convert$dartTest: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"testAsserts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$convert$dartTest$$step: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"testAsserts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"importLine","d":{"t":"str"},"opt":false},{"name":"body","d":{"t":"str"},"opt":false}],
  inner$dartStr$out$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false}],
};
