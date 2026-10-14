// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/people/btn2.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$PICK$filter$m(cs) {
    const m = cs.backgroundColor.match(/[\d.]+/g);
    return m;
}
export function inner$PICK$filter$a(cs) {
    const m = cs.backgroundColor.match(/[\d.]+/g);
    const a = m[3] === undefined ? 1 : +m[3];
    return a;
}
export function inner$PICK$filter$a$$step(m) {
    const a = m[3] === undefined ? 1 : +m[3];
    return a;
}
export function inner$PICK$filter$t(el) {
    const t = (el.innerText || '').trim();
    return t;
}
export function inner$show$k(d) {
    const k = Object.keys(d);
    return k;
}
export function inner$diff$d$$after_loop(a, b) {
    const d = {};
    for (const k of Object.keys(a))
        if (a[k] !== b[k])
            d[k] = a[k] + ' → ' + b[k];
    return d;
}

export const SIGS = {
  inner$PICK$filter$m: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$PICK$filter$a: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$PICK$filter$a$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$PICK$filter$t: [{"name":"el","d":{"t":"any"},"opt":false}],
  inner$show$k: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$diff$d$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
};
