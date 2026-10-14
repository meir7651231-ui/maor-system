// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/carve/screen-decomp.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TYPE_IN = { date: ['DateTime', 'String', 'Object'], num: ['num', 'int', 'double', 'Object', 'dynamic', 'String'], text: ['String', 'Object', 'dynamic'], multiline: ['String', 'Object'] };
export function inner$walk$q(d, e) {
    const q = d + '/' + e.name;
    return q;
}
export function inner$bodyOf$i(src, startIdx) {
    let i = src.indexOf('{', startIdx);
    return i;
}
export function inner$shapeOfDart$bare(dart) {
    const bare = String(dart).replace(/\?$/, '').trim();
    return bare;
}
export function inner$shapeOfDart$specs(dart) {
    const bare = String(dart).replace(/\?$/, '').trim();
    const specs = Object.keys(TYPE_IN).filter((k) => TYPE_IN[k].includes(bare));
    return specs;
}
export function inner$shapeOfDart$specs$$step(bare) {
    const specs = Object.keys(TYPE_IN).filter((k) => TYPE_IN[k].includes(bare));
    return specs;
}
export function inner$bodyOf$d$$after_loop(src, startIdx) {
    let i = src.indexOf('{', startIdx);
    let d = 0;
    let j = i;
    for (; j < src.length; j++) {
        if (src[j] === '{')
            d++;
        else if (src[j] === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$bodyOf$j$$after_loop(src, startIdx) {
    let i = src.indexOf('{', startIdx);
    let d = 0;
    let j = i;
    for (; j < src.length; j++) {
        if (src[j] === '{')
            d++;
        else if (src[j] === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}

export const SIGS = {
  inner$walk$q: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$bodyOf$i: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"startIdx","d":{"t":"any"},"opt":false}],
  inner$shapeOfDart$bare: [{"name":"dart","d":{"t":"any"},"opt":false}],
  inner$shapeOfDart$specs: [{"name":"dart","d":{"t":"any"},"opt":false}],
  inner$shapeOfDart$specs$$step: [{"name":"bare","d":{"t":"str"},"opt":false}],
  inner$bodyOf$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"startIdx","d":{"t":"any"},"opt":false}],
  inner$bodyOf$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"startIdx","d":{"t":"any"},"opt":false}],
};
