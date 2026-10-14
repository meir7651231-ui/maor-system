// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/people/compare.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$PICK$filter$m(cs) {
    const m = cs.backgroundColor.match(/[\d.]+/g);
    return m;
}
export function inner$PICK$filter$t(el) {
    const t = (el.innerText || '').trim();
    return t;
}

export const SIGS = {
  inner$PICK$filter$m: [{"name":"cs","d":{"t":"obj","n":"CSSStyleDeclaration","p":[["accentColor",{"t":"str"},false],["alignContent",{"t":"str"},false],["alignItems",{"t":"str"},false],["alignSelf",{"t":"str"},false],["alignmentBaseline",{"t":"str"},false],["all",{"t":"str"},false],["anchorName",{"t":"str"},false],["anchorScope",{"t":"str"},false],["animation",{"t":"str"},false],["animationComposition",{"t":"str"},false],["animationDelay",{"t":"str"},false],["animationDirection",{"t":"str"},false],["animationDuration",{"t":"str"},false],["animationFillMode",{"t":"str"},false],["animationIterationCount",{"t":"str"},false],["animationName",{"t":"str"},false],["animationPlayState",{"t":"str"},false],["animationRange",{"t":"str"},false],["animationRangeEnd",{"t":"str"},false],["animationRangeStart",{"t":"str"},false],["animationTimeline",{"t":"str"},false],["animationTimingFunction",{"t":"str"},false],["appearance",{"t":"str"},false],["aspectRatio",{"t":"str"},false],["backdropFilter",{"t":"str"},false],["backfaceVisibility",{"t":"str"},false],["background",{"t":"str"},false],["backgroundAttachment",{"t":"str"},false],["backgroundBlendMode",{"t":"str"},false],["backgroundClip",{"t":"str"},false],["backgroundColor",{"t":"str"},false],["backgroundImage",{"t":"str"},false],["backgroundOrigin",{"t":"str"},false],["backgroundPosition",{"t":"str"},false],["backgroundPositionX",{"t":"str"},false],["backgroundPositionY",{"t":"str"},false],["backgroundRepeat",{"t":"str"},false],["backgroundSize",{"t":"str"},false],["baselineShift",{"t":"str"},false]]},"opt":false}],
  inner$PICK$filter$t: [{"name":"el","d":{"t":"any"},"opt":false}],
};
