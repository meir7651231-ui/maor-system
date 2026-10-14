// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/decompose/words.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SWAPS = [
    [/מיזוגים/g, 'איחודים'],
    [/מיזוג/g, 'איחוד'],
    [/ממוזג(ת|ים|ות)?/g, 'מאוחד$1'],
    [/ממזג(ת|ים|ות)?/g, 'מאחד$1'],
    [/ניתובים/g, 'שליחות'],
    [/ניתוב/g, 'שליחה'],
    [/הסלמה/g, 'העברה הלאה'],
    [/סלחני(ת|ים|ות)?/g, 'שמוצא גם עם טעות'],
    [/יחסיי?(ת|ים|ות)?/g, 'ביחס'],
    [/אטומים/g, 'חלקים'],
    [/אטום/g, 'חלק'],
    [/ברצף/g, '\uE000'],
    [/רצפים/g, 'שורות'],
    [/רצף/g, 'שורה'],
    [/\uE000/g, 'ברצף'],
    [/טווחים/g, 'תקופות'],
    [/טווח/g, 'תקופה'],
];
function cleanDoc(doc) {
    return String(doc ?? '')
        .replace(/\{@link\s+([^}]+)\}/g, '$1')
        .replace(/`[^`]*`/g, '')
        .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
        .replace(/\s*\(\s*\)/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^[\s·•*\-–—:,]+/, '')
        .trim();
}
export function inner$hasForbidden$t(s) {
    const t = String(s ?? '').replace(/ברצף/g, '');
    return t;
}
export function inner$plainWords$t(s) {
    let t = String(s ?? '');
    return t;
}
export function inner$shortName$first(doc) {
    const first = cleanDoc(doc).split(/\s+—\s+|\s+-\s+|\.\s|\.$|:\s|;\s|\s⇒\s|\s\(|\s←\s|\s→\s/)[0] ?? '';
    return first;
}
export function inner$shortName$words(doc) {
    const first = cleanDoc(doc).split(/\s+—\s+|\s+-\s+|\.\s|\.$|:\s|;\s|\s⇒\s|\s\(|\s←\s|\s→\s/)[0] ?? '';
    const words = first.split(/\s+/).filter(Boolean);
    return words;
}
export function inner$shortName$words$$step(first) {
    const words = first.split(/\s+/).filter(Boolean);
    return words;
}
export function inner$shortName$out(doc) {
    const first = cleanDoc(doc).split(/\s+—\s+|\s+-\s+|\.\s|\.$|:\s|;\s|\s⇒\s|\s\(|\s←\s|\s→\s/)[0] ?? '';
    const words = first.split(/\s+/).filter(Boolean);
    const out = (words.length > 9 ? words.slice(0, 9).join(' ') + '…' : words.join(' ')).trim();
    return out;
}
export function inner$shortName$out$$step(words) {
    const out = (words.length > 9 ? words.slice(0, 9).join(' ') + '…' : words.join(' ')).trim();
    return out;
}
export function inner$oneSentence$s(doc) {
    const s = cleanDoc(doc);
    return s;
}
export function inner$oneSentence$m(doc) {
    const s = cleanDoc(doc);
    const m = /^(.+?[.!?])(\s|$)/.exec(s);
    return m;
}
export function inner$oneSentence$m$$step(s) {
    const m = /^(.+?[.!?])(\s|$)/.exec(s);
    return m;
}
export function inner$oneSentence$out(doc) {
    const s = cleanDoc(doc);
    const m = /^(.+?[.!?])(\s|$)/.exec(s);
    let out = (m ? m[1] : s).trim();
    return out;
}
export function inner$oneSentence$out$$step(s, m) {
    let out = (m ? m[1] : s).trim();
    return out;
}
export function inner$plainWords$t$$after_loop(s) {
    let t = String(s ?? '');
    for (const [re, to] of SWAPS)
        t = t.replace(re, to);
    return t;
}

export const SIGS = {
  inner$hasForbidden$t: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$plainWords$t: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$shortName$first: [{"name":"doc","d":{"t":"str"},"opt":false}],
  inner$shortName$words: [{"name":"doc","d":{"t":"str"},"opt":false}],
  inner$shortName$words$$step: [{"name":"first","d":{"t":"str"},"opt":false}],
  inner$shortName$out: [{"name":"doc","d":{"t":"str"},"opt":false}],
  inner$shortName$out$$step: [{"name":"words","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$oneSentence$s: [{"name":"doc","d":{"t":"str"},"opt":false}],
  inner$oneSentence$m: [{"name":"doc","d":{"t":"str"},"opt":false}],
  inner$oneSentence$m$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$oneSentence$out: [{"name":"doc","d":{"t":"str"},"opt":false}],
  inner$oneSentence$out$$step: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$plainWords$t$$after_loop: [{"name":"s","d":{"t":"str"},"opt":false}],
};
