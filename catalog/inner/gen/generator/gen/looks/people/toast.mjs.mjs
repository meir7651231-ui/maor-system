// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/people/toast.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const px = v => Math.round(parseFloat(v) || 0);
const hex = c => {
    const m = c.match(/[\d.]+/g);
    if (!m)
        return null;
    const a = m[3] === undefined ? 1 : +m[3];
    if (a < .5)
        return null;
    return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
};
export function inner$MEASURE$hex$m(c) {
    const m = c.match(/[\d.]+/g);
    return m;
}
export function inner$MEASURE$hex$a(c) {
    const m = c.match(/[\d.]+/g);
    const a = m[3] === undefined ? 1 : +m[3];
    return a;
}
export function inner$MEASURE$hex$a$$step(m) {
    const a = m[3] === undefined ? 1 : +m[3];
    return a;
}
export function inner$MEASURE$lum$c(h) {
    const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
        .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c;
}
export function inner$MEASURE$forEach$bg(cs) {
    const bg = hex(cs.backgroundColor);
    return bg;
}
export function inner$MEASURE$forEach$txt(el) {
    const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
    return txt;
}
export function inner$MEASURE$forEach$rad(cs) {
    const rad = px(cs.borderTopLeftRadius);
    return rad;
}
export function inner$MEASURE$secs(t) {
    const secs = [...new Set((t.match(/\b\d+(\.\d+)?\s*(seconds?|sec|ms|milliseconds?)\b/gi) || []).map(x => x.trim()))].slice(0, 6);
    return secs;
}
export function inner$MEASURE$pos(t) {
    const pos = ['bottom left', 'bottom center', 'bottom-left', 'bottom of the screen', 'top right', 'bottom right', 'centered', 'bottom start']
        .filter(w => t.toLowerCase().includes(w));
    return pos;
}

export const SIGS = {
  inner$MEASURE$hex$m: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$MEASURE$hex$a: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$MEASURE$hex$a$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$MEASURE$lum$c: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$MEASURE$forEach$bg: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$MEASURE$forEach$txt: [{"name":"el","d":{"t":"any"},"opt":false}],
  inner$MEASURE$forEach$rad: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$MEASURE$secs: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$MEASURE$pos: [{"name":"t","d":{"t":"str"},"opt":false}],
};
