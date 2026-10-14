// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/app/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function matchEnd(s, open) {
    let d = 0;
    for (let i = open; i < s.length; i++) {
        if (s[i] === '{')
            d++;
        else if (s[i] === '}') {
            d--;
            if (!d)
                return i;
        }
    }
    return s.length - 1;
}
export function inner$scope$brace(css, i) {
    const brace = css.indexOf('{', i);
    return brace;
}
export function inner$scope$head(css, i) {
    const brace = css.indexOf('{', i);
    let head = css.slice(i, brace);
    return head;
}
export function inner$scope$head$$step(css, i, brace) {
    let head = css.slice(i, brace);
    return head;
}
export function inner$scope$clean(css, i) {
    const brace = css.indexOf('{', i);
    let head = css.slice(i, brace);
    const clean = head.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return clean;
}
export function inner$scope$clean$$step(head) {
    const clean = head.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return clean;
}
export function inner$scope$end(css, i) {
    const brace = css.indexOf('{', i);
    const end = matchEnd(css, brace);
    return end;
}
export function inner$scope$end$$step(css, brace) {
    const end = matchEnd(css, brace);
    return end;
}
export function inner$scope$sel(css, id, i) {
    const brace = css.indexOf('{', i);
    let head = css.slice(i, brace);
    const clean = head.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const sel = clean.split(',').map(s => {
        s = s.trim();
        if (!s)
            return s;
        if (s === 'body' || s === 'html' || s === ':root')
            return `#app[data-v=${id}]`;
        return `#app[data-v=${id}] ${s}`;
    }).join(',');
    return sel;
}
export function inner$scope$sel$$step(id, clean) {
    const sel = clean.split(',').map(s => {
        s = s.trim();
        if (!s)
            return s;
        if (s === 'body' || s === 'html' || s === ':root')
            return `#app[data-v=${id}]`;
        return `#app[data-v=${id}] ${s}`;
    }).join(',');
    return sel;
}
export function inner$scope$end_L49(css, i) {
    const brace = css.indexOf('{', i);
    const end = matchEnd(css, brace);
    return end;
}
export function inner$scope$end_L49$$step(css, brace) {
    const end = matchEnd(css, brace);
    return end;
}

export const SIGS = {
  inner$scope$brace: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$scope$head: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$scope$head$$step: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"brace","d":{"t":"any"},"opt":false}],
  inner$scope$clean: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$scope$clean$$step: [{"name":"head","d":{"t":"any"},"opt":false}],
  inner$scope$end: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$scope$end$$step: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"brace","d":{"t":"any"},"opt":false}],
  inner$scope$sel: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$scope$sel$$step: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"clean","d":{"t":"any"},"opt":false}],
  inner$scope$end_L49: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$scope$end_L49$$step: [{"name":"css","d":{"t":"any"},"opt":false},{"name":"brace","d":{"t":"any"},"opt":false}],
};
