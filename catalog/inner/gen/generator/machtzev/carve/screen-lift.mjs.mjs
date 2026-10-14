// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/carve/screen-lift.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$bodyOf$i(startIdx, s) {
    let i = s.indexOf('{', startIdx);
    return i;
}
export function inner$bodyOf$d$$after_loop(startIdx, s) {
    let i = s.indexOf('{', startIdx);
    let d = 0;
    let j = i;
    for (; j < s.length; j++) {
        if (s[j] === '{')
            d++;
        else if (s[j] === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$bodyOf$j$$after_loop(startIdx, s) {
    let i = s.indexOf('{', startIdx);
    let d = 0;
    let j = i;
    for (; j < s.length; j++) {
        if (s[j] === '{')
            d++;
        else if (s[j] === '}') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}

export const SIGS = {
  inner$bodyOf$i: [{"name":"startIdx","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$bodyOf$d$$after_loop: [{"name":"startIdx","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$bodyOf$j$$after_loop: [{"name":"startIdx","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
};
