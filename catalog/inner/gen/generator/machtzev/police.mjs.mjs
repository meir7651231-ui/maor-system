// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/police.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$runGate$argv(TOOLS, GATE_TIMEOUT_S, hasTimeout, script, args) {
    const argv = hasTimeout ? ['-s', 'TERM', '-k', '10', `${GATE_TIMEOUT_S}s`, 'node', TOOLS + script, ...args] : [TOOLS + script, ...args];
    return argv;
}
export function inner$runGate$timedOut(GATE_TIMEOUT_S, hasTimeout, r, ms) {
    const timedOut = r.error?.code === 'ETIMEDOUT' || (hasTimeout && (r.status === 124 || r.status === 137) && ms >= GATE_TIMEOUT_S * 950);
    return timedOut;
}
export function inner$runGate$tool(r) {
    const tool = (String(r.stderr || '').match(/tool=([A-Za-z0-9_.-]+)/) || [])[1];
    return tool;
}

export const SIGS = {
  inner$runGate$argv: [{"name":"TOOLS","d":{"t":"str"},"opt":false},{"name":"GATE_TIMEOUT_S","d":{"t":"num"},"opt":false},{"name":"hasTimeout","d":{"t":"bool"},"opt":false},{"name":"script","d":{"t":"any"},"opt":false},{"name":"args","d":{"t":"any"},"opt":false}],
  inner$runGate$timedOut: [{"name":"GATE_TIMEOUT_S","d":{"t":"num"},"opt":false},{"name":"hasTimeout","d":{"t":"bool"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$runGate$tool: [{"name":"r","d":{"t":"any"},"opt":false}],
};
