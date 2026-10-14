// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/gen-recovery-key.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$genRecoveryKey$chars(ALPHABET, bytes) {
    const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
    return chars;
}
export function inner$genRecoveryKey$groups$$after_loop(ALPHABET, bytes) {
    const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
    const groups = [];
    for (let i = 0; i < chars.length; i += 4)
        groups.push(chars.slice(i, i + 4).join(''));
    return groups;
}

export const SIGS = {
  inner$genRecoveryKey$chars: [{"name":"ALPHABET","d":{"t":"any"},"opt":false},{"name":"bytes","d":{"t":"any"},"opt":false}],
  inner$genRecoveryKey$groups$$after_loop: [{"name":"ALPHABET","d":{"t":"any"},"opt":false},{"name":"bytes","d":{"t":"any"},"opt":false}],
};
