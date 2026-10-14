// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/measure/extract.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const px = (v) => Math.round(parseFloat(v) || 0);
const hex = (c) => {
    const m = c.match(/[\d.]+/g);
    if (!m)
        return null;
    const a = m[3] === undefined ? 1 : +m[3];
    if (a < 0.5)
        return null;
    return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
};
export function inner$EXTRACT$hex$m(c) {
    const m = c.match(/[\d.]+/g);
    return m;
}
export function inner$EXTRACT$hex$a(c) {
    const m = c.match(/[\d.]+/g);
    const a = m[3] === undefined ? 1 : +m[3];
    return a;
}
export function inner$EXTRACT$hex$a$$step(m) {
    const a = m[3] === undefined ? 1 : +m[3];
    return a;
}
export function inner$EXTRACT$forEach$area(r) {
    const area = Math.min(r.width * r.height, 1.2e6) / 1000;
    return area;
}
export function inner$EXTRACT$forEach$bg(cs) {
    const bg = hex(cs.backgroundColor);
    return bg;
}
export function inner$EXTRACT$forEach$txt(el) {
    const txt = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    return txt;
}
export function inner$EXTRACT$forEach$c(cs) {
    const c = hex(cs.color);
    return c;
}
export function inner$EXTRACT$forEach$rad(cs) {
    const rad = px(cs.borderTopLeftRadius);
    return rad;
}
export function inner$EXTRACT$forEach$f(cs) {
    const f = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    return f;
}
export function inner$EXTRACT$forEach$g(cs) {
    const g = px(cs.gap);
    return g;
}
export function inner$EXTRACT$forEach$p(cs) {
    const p = px(cs.paddingTop);
    return p;
}
export function inner$EXTRACT$forEach$sig(cs, r) {
    const sig = JSON.stringify({ bg: hex(cs.backgroundColor), color: hex(cs.color),
        radius: px(cs.borderTopLeftRadius), padX: px(cs.paddingLeft), padY: px(cs.paddingTop),
        h: Math.round(r.height), size: px(cs.fontSize), weight: cs.fontWeight,
        border: cs.borderTopWidth === '0px' ? null : cs.borderTopWidth + ' ' + hex(cs.borderTopColor),
        shadow: cs.boxShadow === 'none' ? null : cs.boxShadow.slice(0, 60),
        transform: cs.textTransform === 'none' ? null : cs.textTransform });
    return sig;
}
export function inner$EXTRACT$forEach$rad_L74(cs) {
    const rad = px(cs.borderTopLeftRadius);
    return rad;
}
export function inner$EXTRACT$forEach$bg_L75(cs) {
    const bg = hex(cs.backgroundColor);
    return bg;
}

export const SIGS = {
  inner$EXTRACT$hex$m: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$EXTRACT$hex$a: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$EXTRACT$hex$a$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$EXTRACT$forEach$area: [{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$EXTRACT$forEach$bg: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$txt: [{"name":"el","d":{"t":"any"},"opt":false}],
  inner$EXTRACT$forEach$c: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$rad: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$f: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$g: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$p: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$sig: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$EXTRACT$forEach$rad_L74: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$EXTRACT$forEach$bg_L75: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
};
