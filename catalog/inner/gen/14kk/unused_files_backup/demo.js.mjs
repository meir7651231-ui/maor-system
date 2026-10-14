// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:unused_files_backup/demo.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$simulateBridge$exec$output(stdout, stderr) {
    const output = stdout + (stderr ? '\nSTDERR: ' + stderr : '');
    return output;
}
export function inner$simulateBridge$exec$result(stdout, stderr) {
    const output = stdout + (stderr ? '\nSTDERR: ' + stderr : '');
    const result = {
        status: 'ready',
        output: output + '\n--- AI Response ---\nCommand executed: !dir'
    };
    return result;
}
export function inner$simulateBridge$exec$result$$step(output) {
    const result = {
        status: 'ready',
        output: output + '\n--- AI Response ---\nCommand executed: !dir'
    };
    return result;
}

export const SIGS = {
  inner$simulateBridge$exec$output: [{"name":"stdout","d":{"t":"any"},"opt":false},{"name":"stderr","d":{"t":"any"},"opt":false}],
  inner$simulateBridge$exec$result: [{"name":"stdout","d":{"t":"any"},"opt":false},{"name":"stderr","d":{"t":"any"},"opt":false}],
  inner$simulateBridge$exec$result$$step: [{"name":"output","d":{"t":"str"},"opt":false}],
};
