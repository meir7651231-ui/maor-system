// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/tokens.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$m(line) {
    const m = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/);
    return m;
}
export function inner$forEach$a(census, byName, f, line, i) {
    const m = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/);
    const a = byName.get(m[1]) || { id: `L0:${census.repo}:${m[1]}`, level: 'L0-token', name: m[1],
        kind: /color|#|rgb|hsl|oklch/.test(m[2]) || /-(bg|ink|line|accent|paper|surface)/.test(m[1]) ? 'color'
            : /font/.test(m[1] + m[2]) ? 'font' : /radius|round/.test(m[1]) ? 'shape'
                : /space|gap|pad|size|width|height/.test(m[1]) ? 'space' : /motion|dur|ease|transition/.test(m[1]) ? 'motion' : 'other',
        values: [], source: `${census.repo}/${f.path}:${i + 1}` };
    return a;
}
export function inner$forEach$a$$step(census, byName, f, i, m) {
    const a = byName.get(m[1]) || { id: `L0:${census.repo}:${m[1]}`, level: 'L0-token', name: m[1],
        kind: /color|#|rgb|hsl|oklch/.test(m[2]) || /-(bg|ink|line|accent|paper|surface)/.test(m[1]) ? 'color'
            : /font/.test(m[1] + m[2]) ? 'font' : /radius|round/.test(m[1]) ? 'shape'
                : /space|gap|pad|size|width|height/.test(m[1]) ? 'space' : /motion|dur|ease|transition/.test(m[1]) ? 'motion' : 'other',
        values: [], source: `${census.repo}/${f.path}:${i + 1}` };
    return a;
}

export const SIGS = {
  inner$forEach$m: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$forEach$a: [{"name":"census","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$forEach$a$$step: [{"name":"census","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
